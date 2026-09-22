package com.earnhub.verify.service

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.BatteryManager
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import com.earnhub.verify.MainActivity
import com.earnhub.verify.data.AppDatabase
import com.earnhub.verify.network.ApiService
import com.earnhub.verify.network.HeartbeatRequest
import com.earnhub.verify.network.SyncSmsRequest
import kotlinx.coroutines.*
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

class SmsForwarderService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var wakeLock: PowerManager.WakeLock? = null
    private var apiService: ApiService? = null

    companion object {
        const val CHANNEL_ID = "EarnHubVerifyServiceChannel"
        const val NOTIFICATION_ID = 1001

        fun start(context: Context) {
            val intent = Intent(context, SmsForwarderService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()

        val notification = createNotification("EarnHub BD SMS Gateway Active — Real-time Verification Listening")
        startForeground(NOTIFICATION_ID, notification)

        // Acquire WakeLock to prevent sleep during critical MFS verification
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "EarnHubVerify::SmsGatewayWakeLock").apply {
            acquire(24 * 60 * 60 * 1000L) // 24 hours
        }

        setupNetwork()
        startHeartbeatLoop()
        startQueueFlusherLoop()
    }

    private fun setupNetwork() {
        val prefs = getSharedPreferences("earnhub_prefs", Context.MODE_PRIVATE)
        val serverUrl = prefs.getString("server_url", "https://your-domain.com") ?: "https://your-domain.com"

        val logging = HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BODY }
        val client = OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(10, TimeUnit.SECONDS)
            .addInterceptor(logging)
            .build()

        val retrofit = Retrofit.Builder()
            .baseUrl(if (serverUrl.endsWith("/")) serverUrl else "$serverUrl/")
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        apiService = retrofit.create(ApiService::class.java)
    }

    private fun startHeartbeatLoop() {
        serviceScope.launch {
            while (isActive) {
                try {
                    sendHeartbeat()
                } catch (e: Exception) {
                    e.printStackTrace()
                }
                delay(30_000) // 30-second interval as mandated
            }
        }
    }

    private suspend fun sendHeartbeat() {
        val prefs = getSharedPreferences("earnhub_prefs", Context.MODE_PRIVATE)
        val deviceId = prefs.getString("device_id", "android_gateway_01") ?: "android_gateway_01"
        val token = prefs.getString("secret_token", "ehbd_sec_verify_token_2026") ?: "ehbd_sec_verify_token_2026"
        val phone = prefs.getString("sim_phone", "01712345678")

        val batteryManager = getSystemService(Context.BATTERY_SERVICE) as BatteryManager
        val batteryLevel = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)

        val request = HeartbeatRequest(
            deviceId = deviceId,
            batteryPercent = batteryLevel,
            networkType = "WiFi + 4G LTE",
            phoneNumber = phone,
            appVersion = "2.0.4"
        )

        apiService?.sendHeartbeat("Bearer $token", request)
    }

    private fun startQueueFlusherLoop() {
        serviceScope.launch {
            while (isActive) {
                try {
                    flushOfflineQueue()
                } catch (e: Exception) {
                    e.printStackTrace()
                }
                delay(15_000) // 15-second queue flush
            }
        }
    }

    private suspend fun flushOfflineQueue() {
        val prefs = getSharedPreferences("earnhub_prefs", Context.MODE_PRIVATE)
        val deviceId = prefs.getString("device_id", "android_gateway_01") ?: "android_gateway_01"
        val token = prefs.getString("secret_token", "ehbd_sec_verify_token_2026") ?: "ehbd_sec_verify_token_2026"

        val db = AppDatabase.getDatabase(this)
        val pending = db.smsQueueDao().getPendingSms()

        for (sms in pending) {
            try {
                val req = SyncSmsRequest(
                    deviceId = deviceId,
                    paymentMethod = sms.method,
                    trxId = sms.trxId,
                    amount = sms.amount,
                    senderNumber = sms.senderNumber,
                    balanceAfter = sms.balanceAfter,
                    smsTime = null,
                    rawSms = sms.rawSms
                )
                val response = apiService?.syncSms("Bearer $token", req)
                if (response?.isSuccessful == true) {
                    db.smsQueueDao().markSynced(sms.id)
                }
            } catch (e: Exception) {
                // If network fails, leave in queue to retry
                break
            }
        }
    }

    private fun createNotification(content: String): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("EarnHub BD SMS Gateway Active")
            .setContentText(content)
            .setSmallIcon(android.R.drawable.stat_notify_sync)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "EarnHub BD Verification Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps the SMS forwarder background service alive 24/7"
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Redeliver intent and restart service if terminated by Android system
        return START_STICKY
    }

    override fun onDestroy() {
        wakeLock?.let { if (it.isHeld) it.release() }
        serviceScope.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
