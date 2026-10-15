package com.example.animeworkout.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface SessionDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSession(session: Session)

    @Query("SELECT * FROM sessions ORDER BY timestamp DESC")
    fun getSessions(): Flow<List<Session>>

    @Query("SELECT * FROM sessions WHERE workoutId = :workoutId ORDER BY timestamp DESC")
    fun getSessionsByWorkoutId(workoutId: Int): Flow<List<Session>>

    @Query("DELETE FROM sessions WHERE uid = :sessionId")
    suspend fun deleteSession(sessionId: Long)
}
