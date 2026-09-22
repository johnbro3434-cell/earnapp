package com.earnhub.verify.data

import android.content.Context
import androidx.room.*

@Entity(tableName = "sms_queue")
data class QueuedSms(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val method: String,
    val trxId: String,
    val amount: Double,
    val senderNumber: String,
    val balanceAfter: String?,
    val rawSms: String,
    val timestamp: Long = System.currentTimeMillis(),
    val isSynced: Boolean = false
)

@Dao
interface SmsQueueDao {
    @Query("SELECT * FROM sms_queue WHERE isSynced = 0 ORDER BY timestamp ASC")
    suspend fun getPendingSms(): List<QueuedSms>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(sms: QueuedSms): Long

    @Query("UPDATE sms_queue SET isSynced = 1 WHERE id = :id")
    suspend fun markSynced(id: Long)

    @Query("SELECT * FROM sms_queue ORDER BY timestamp DESC LIMIT 50")
    suspend fun getRecentLogs(): List<QueuedSms>
}

@Database(entities = [QueuedSms::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun smsQueueDao(): SmsQueueDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "earnhub_verify.db"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
