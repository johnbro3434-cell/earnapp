package com.earnhub.verify.network

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST

data class SyncSmsRequest(
    val deviceId: String,
    val paymentMethod: String,
    val trxId: String,
    val amount: Double,
    val senderNumber: String,
    val balanceAfter: String?,
    val smsTime: String?,
    val rawSms: String
)

data class SyncSmsResponse(
    val success: Boolean,
    val message: String?,
    val duplicate: Boolean? = false
)

data class HeartbeatRequest(
    val deviceId: String,
    val batteryPercent: Int,
    val networkType: String,
    val phoneNumber: String?,
    val appVersion: String
)

data class HeartbeatResponse(
    val success: Boolean,
    val timestamp: String,
    val status: String?
)

interface ApiService {

    @POST("/api/admin/sms/sync")
    suspend fun syncSms(
        @Header("Authorization") authHeader: String,
        @Body request: SyncSmsRequest
    ): Response<SyncSmsResponse>

    @POST("/api/admin/verify-app/heartbeat")
    suspend fun sendHeartbeat(
        @Header("Authorization") authHeader: String,
        @Body request: HeartbeatRequest
    ): Response<HeartbeatResponse>
}
