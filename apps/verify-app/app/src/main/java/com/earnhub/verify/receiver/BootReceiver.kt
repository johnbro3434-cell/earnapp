package com.earnhub.verify.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.earnhub.verify.service.SmsForwarderService

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED || intent.action == "android.intent.action.QUICKBOOT_POWERON") {
            Log.i("EarnHubBootReceiver", "Device boot detected. Automatically launching SmsForwarderService.")
            SmsForwarderService.start(context)
        }
    }
}
