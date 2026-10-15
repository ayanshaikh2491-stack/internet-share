package com.example.animeworkout.repository

import com.example.animeworkout.data.Session
import com.example.animeworkout.data.SessionDao
import kotlinx.coroutines.flow.Flow

class SessionRepository(
    private val sessionDao: SessionDao
) {
    suspend fun insertSession(session: Session) {
        sessionDao.insertSession(session)
    }

    fun getSessions(): Flow<List<Session>> {
        return sessionDao.getSessions()
    }

    fun getSessionsByWorkoutId(workoutId: Int): Flow<List<Session>> {
        return sessionDao.getSessionsByWorkoutId(workoutId)
    }

    suspend fun deleteSession(sessionId: Long) {
        sessionDao.deleteSession(sessionId)
    }
}
