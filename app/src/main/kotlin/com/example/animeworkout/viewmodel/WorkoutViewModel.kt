package com.example.animeworkout.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.animeworkout.data.Workout
import com.example.animeworkout.repository.WorkoutRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class WorkoutViewModel(
    private val repository: WorkoutRepository
) : ViewModel() {

    val workouts: StateFlow<List<Workout>> = repository.getWorkouts()
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    fun loadWorkouts() {
        viewModelScope.launch {
            // Data loading handled by repository flow
        }
    }
}