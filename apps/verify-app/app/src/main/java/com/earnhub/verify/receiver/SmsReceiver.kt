package com.earnhub.verify.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.telephony.SmsMessage
import android.util.Log
import com.earnhub.verify.data.AppDatabase
import com.earnhub.verify.data.QueuedSms
import com.earnhub.verify.network.ApiService
import com.earnhub.verify.network.SyncSmsRequest
import com.earnhub.verify.parser.SmsParser
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

class SmsReceiver : BroadcastReceiver() {

    private val TAG = "EarnHubSmsReceiver"

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != "android.provider.Telephony.SMS_RECEIVED") return

        val bundle = intent.extras ?: return
        val pdus = bundle.get("pdus") as? Array<*> ?: return
        val format = bundle.getString("format")

        val fullBodyBuilder = StringBuilder()
        var senderAddress = ""

        for (pdu in pdus) {
            val pduBytes = pdu as? ByteArray ?: continue
            val smsMessage = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                SmsMessage.createFromPdu(pduBytes, format)
            } else {
                @Suppress("DEPRECATION")
                SmsMessage.createFromPdu(pduBytes)
            }
            if (senderAddress.isEmpty()) {
                senderAddress = smsMessage.originatingAddress ?: ""
            }
            fullBodyBuilder.append(smsMessage.messageBody)
        }

        val fullBody = fullBodyBuilder.toString()
        Log.d(TAG, "Incoming SMS from: $senderAddress. Body: $fullBody")

        // Parse SMS
        val parsed = SmsParser.parse(senderAddress, fullBody)
        if (!parsed.isValid) {
            Log.d(TAG, "Ignored SMS: ${parsed.error}")
            return
        }

        Log.i(TAG, "Valid MFS Transaction Detected: ${parsed.method} ৳${parsed.amount} TrxID: ${parsed.trxId}")

        // Save to Room DB & Sync
        val pendingResult = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val db = AppDatabase.getDatabase(context)
                val smsEntity = QueuedSms(
                    method = parsed.method,
                    trxId = parsed.trxId,
                    amount = parsed.amount,
                    senderNumber = parsed.senderNumber,
                    balanceAfter = parsed.balanceAfter,
                    rawSms = parsed.rawSms,
                    isSynced = false
                )
                val rowId = db.smsQueueDao().insert(smsEntity)

                // Try syncing immediately
                val prefs = context.getSharedPreferences("earnhub_prefs", Context.MODE_PRIVATE)
                val serverUrl = prefs.getString("server_url", "https://your-domain.com") ?: "https://your-domain.com"
                val token = prefs.getString("secret_token", "ehbd_sec_verify_token_2026") ?: "ehbd_sec_verify_token_2026"
                val deviceId = prefs.getString("device_id", "android_gateway_01") ?: "android_gateway_01"

                val client = OkHttpClient.Builder()
                    .connectTimeout(5, TimeUnit.SECONDS)
                    .build()

                val retrofit = Retrofit.Builder()
                    .baseUrl(if (serverUrl.endsWith("/")) serverUrl else "$serverUrl/")
                    .client(client)
                    .addConverterFactory(GsonConverterFactory.create())
                    .build()

                val api = retrofit.create(ApiService::class.java)
                val req = SyncSmsRequest(
                    deviceId = deviceId,
                    paymentMethod = parsed.method,
                    trxId = parsed.trxId,
                    amount = parsed.amount,
                    senderNumber = parsed.senderNumber,
                    balanceAfter = parsed.balanceAfter,
                    smsTime = null,
                    rawSms = parsed.rawSms
                )

                val resp = api.syncSms("Bearer $token", req)
                if (resp.isSuccessful) {
                    db.smsQueueDao().markSynced(rowId)
                    Log.i(TAG, "Successfully synced TrxID ${parsed.trxId} to EarnHub BD API!")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error posting SMS to API, saved in offline queue for auto-retry", e)
            } finally {
                pendingResult.finish()
            }
        }
    }
}
