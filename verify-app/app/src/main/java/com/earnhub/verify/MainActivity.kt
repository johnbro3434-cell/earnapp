package com.earnhub.verify

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.earnhub.verify.data.AppDatabase
import com.earnhub.verify.data.QueuedSms
import com.earnhub.verify.service.SmsForwarderService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : ComponentActivity() {

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val smsGranted = permissions[Manifest.permission.RECEIVE_SMS] == true
        if (smsGranted) {
            SmsForwarderService.start(this)
            Toast.makeText(this, "SMS Gateway Permissions Granted", Toast.LENGTH_SHORT).show()
        } else {
            Toast.makeText(this, "SMS Permission is mandatory for auto-verification", Toast.LENGTH_LONG).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        checkAndRequestPermissions()

        setContent {
            MaterialTheme(
                colorScheme = darkColorScheme(
                    primary = Color(0xFF10B981),
                    background = Color(0xFF0F172A),
                    surface = Color(0xFF1E293B)
                )
            ) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    VerifyAppScreen()
                }
            }
        }
    }

    private fun checkAndRequestPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.RECEIVE_SMS,
            Manifest.permission.READ_SMS
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }

        val allGranted = permissions.all {
            ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
        }

        if (allGranted) {
            SmsForwarderService.start(this)
        } else {
            permissionLauncher.launch(permissions.toTypedArray())
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VerifyAppScreen() {
    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences("earnhub_prefs", Context.MODE_PRIVATE) }

    var serverUrl by remember { mutableStateOf(prefs.getString("server_url", "https://your-domain.com") ?: "https://your-domain.com") }
    var secretToken by remember { mutableStateOf(prefs.getString("secret_token", "ehbd_sec_verify_token_2026") ?: "ehbd_sec_verify_token_2026") }
    var deviceId by remember { mutableStateOf(prefs.getString("device_id", "android_gateway_01") ?: "android_gateway_01") }
    var simPhone by remember { mutableStateOf(prefs.getString("sim_phone", "01712345678") ?: "01712345678") }

    val coroutineScope = rememberCoroutineScope()
    var recentSmsList by remember { mutableStateOf<List<QueuedSms>>(emptyList()) }

    fun refreshLogs() {
        coroutineScope.launch {
            val db = AppDatabase.getDatabase(context)
            val logs = withContext(Dispatchers.IO) {
                db.smsQueueDao().getRecentLogs()
            }
            recentSmsList = logs
        }
    }

    LaunchedEffect(Unit) {
        refreshLogs()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("EarnHub BD SMS Gateway", fontWeight = FontWeight.Black, fontSize = 18.sp)
                        Text("Auto-Verification Daemon v2.0.4", fontSize = 11.sp, color = Color(0xFF10B981))
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF1E293B),
                    titleContentColor = Color.White
                ),
                actions = {
                    IconButton(onClick = { refreshLogs() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = Color.White)
                    }
                }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Service Status Card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B))
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Gateway Status", fontWeight = FontWeight.Bold, color = Color.White)
                            Surface(
                                shape = RoundedCornerShape(50),
                                color = Color(0xFF10B981).copy(alpha = 0.2f),
                                contentColor = Color(0xFF10B981)
                            ) {
                                Text(
                                    "ACTIVE (RUNNING)",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }

                        Text(
                            "Listening for bKash (16247) and Nagad (16167) transactional SMS. Heartbeat is reported every 30 seconds to the master server.",
                            fontSize = 12.sp,
                            color = Color(0xFF94A3B8)
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = {
                                    SmsForwarderService.start(context)
                                    Toast.makeText(context, "Foreground Service Started", Toast.LENGTH_SHORT).show()
                                },
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("Restart Service", fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
                            }

                            OutlinedButton(
                                onClick = {
                                    val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
                                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                                        if (!powerManager.isIgnoringBatteryOptimizations(context.packageName)) {
                                            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                                                data = Uri.parse("package:${context.packageName}")
                                            }
                                            context.startActivity(intent)
                                        } else {
                                            Toast.makeText(context, "Battery Optimization Whitelist is ALREADY Active", Toast.LENGTH_SHORT).show()
                                        }
                                    }
                                },
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("Whitelist Battery", fontSize = 11.sp, color = Color.White)
                            }
                        }
                    }
                }
            }

            // Server & Token Config
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B))
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("Node.js Gateway Configuration", fontWeight = FontWeight.Bold, color = Color.White)

                        OutlinedTextField(
                            value = serverUrl,
                            onValueChange = { serverUrl = it },
                            label = { Text("Server API URL") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        OutlinedTextField(
                            value = secretToken,
                            onValueChange = { secretToken = it },
                            label = { Text("Device Secret Token") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(
                                value = deviceId,
                                onValueChange = { deviceId = it },
                                label = { Text("Device ID") },
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )
                            OutlinedTextField(
                                value = simPhone,
                                onValueChange = { simPhone = it },
                                label = { Text("SIM Phone") },
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )
                        }

                        Button(
                            onClick = {
                                prefs.edit()
                                    .putString("server_url", serverUrl)
                                    .putString("secret_token", secretToken)
                                    .putString("device_id", deviceId)
                                    .putString("sim_phone", simPhone)
                                    .apply()
                                SmsForwarderService.start(context)
                                Toast.makeText(context, "Configuration Saved & Service Reconnected", Toast.LENGTH_SHORT).show()
                            },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
                        ) {
                            Text("Save Configuration", fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
                        }
                    }
                }
            }

            // Recent SMS Logs
            item {
                Text(
                    "Forwarded SMS Logs (${recentSmsList.size})",
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    fontSize = 16.sp
                )
            }

            if (recentSmsList.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("No SMS forwarded yet. Keep the app running in the background.", color = Color(0xFF64748B), fontSize = 12.sp)
                    }
                }
            } else {
                items(recentSmsList) { sms ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A))
                    ) {
                        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    "${sms.method} ৳${sms.amount}",
                                    fontWeight = FontWeight.Bold,
                                    color = if (sms.method == "bKash") Color(0xFFEC4899) else Color(0xFFF97316)
                                )
                                Text(
                                    if (sms.isSynced) "SYNCED" else "PENDING",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (sms.isSynced) Color(0xFF10B981) else Color(0xFFF59E0B)
                                )
                            }
                            Text("TrxID: ${sms.trxId} • Sender: ${sms.senderNumber}", fontSize = 11.sp, color = Color(0xFF94A3B8), fontFamily = FontFamily.Monospace)
                            Text(sms.rawSms, fontSize = 10.sp, color = Color(0xFF64748B), maxLines = 2)
                        }
                    }
                }
            }
        }
    }
}
