package com.example.animeworkout.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.animeworkout.data.Session
import com.example.animeworkout.repository.SessionRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class SessionViewModel(
    private val repository: SessionRepository
) : ViewModel() {

    val sessions: StateFlow<List<Session>> = repository.getSessions()
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    fun loadSessions() {
        viewModelScope.launch {
            // Data loading handled by repository flow
        }
    }

    fun recordSession(workoutId: Int, durationSec: Int, caloriesBurned: Int) {
        viewModelScope.launch {
            val session = Session(
                uid = 0,
                workoutId = workoutId,
                timestamp = System.currentTimeMillis(),
                durationSec = durationSec,
                caloriesBurned = caloriesBurned
            )
            repository.insertSession(session)
        }
    }
}