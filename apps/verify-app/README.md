# EarnHub BD V20 — Android Verify App (`/verify-app`)

Official native Android foreground daemon for automatic bKash & Nagad SMS gateway verification.

## Features
- **Foreground Service with WakeLock:** Stays active 24/7 in memory without getting killed by Android Doze mode.
- **SMS Interception (`BroadcastReceiver`):** Intercepts incoming messages from bKash (`16247`) and Nagad (`16167`).
- **High-Precision Regex Parser (`SmsParser.kt`):** Extracts Transaction ID (`TrxID`), Amount, Sender Number, and Balance After.
- **Local Room Database Queue:** Persists all incoming SMS on-device. If network connectivity drops, messages queue locally and auto-flush upon reconnection.
- **Real-Time Node.js API Sync:** Pushes structured transactions immediately to `POST /api/admin/sms/sync` with Bearer Device Authorization Token.
- **30-Second Heartbeat Worker:** Reports device telemetry (Battery %, WiFi/4G connection, SIM Phone) to `POST /api/admin/verify-app/heartbeat`.
- **Boot Auto-Restart:** Listens for `BOOT_COMPLETED` to resume service automatically when device restarts.
- **Battery Optimization Whitelist:** One-tap action inside the app to exclude the app from Android battery throttling.

---

## Folder Structure
```
/verify-app
  ├── build.gradle.kts
  ├── settings.gradle.kts
  └── app/
      ├── build.gradle.kts
      └── src/main/
          ├── AndroidManifest.xml
          └── java/com/earnhub/verify/
              ├── MainActivity.kt
              ├── data/
              │   └── AppDatabase.kt
              ├── network/
              │   └── ApiService.kt
              ├── parser/
              │   └── SmsParser.kt
              ├── receiver/
              │   ├── BootReceiver.kt
              │   └── SmsReceiver.kt
              └── service/
                  └── SmsForwarderService.kt
```

---

## Build & Run Instructions
1. Open Android Studio (Ladybug / Hedgehog or newer).
2. Open the `/verify-app` directory.
3. Allow Gradle to sync dependencies.
4. Run `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`.
5. Install the APK onto your Android phone holding the bKash & Nagad merchant or personal SIM cards.
6. Open the app, grant `RECEIVE_SMS` and `POST_NOTIFICATIONS` permissions.
7. Enter your website URL (e.g., `https://your-domain.com`) and the **Device Secret Token** found in Admin Panel > **MFS Auto Verification**.
8. Tap **Save Configuration**. The service starts immediately.
