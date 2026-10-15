package com.example.animeworkout.repository

import com.example.animeworkout.data.Workout
import com.example.animeworkout.data.WorkoutDao
import kotlinx.coroutines.flow.Flow

class WorkoutRepository(
    private val workoutDao: WorkoutDao
) {
    suspend fun insertWorkout(workout: Workout) {
        workoutDao.insertWorkout(workout)
    }

    fun getWorkouts(): Flow<List<Workout>> {
        return workoutDao.getWorkouts()
    }

    fun getWorkoutById(workoutId: Int): Flow<Workout?> {
        return workoutDao.getWorkoutById(workoutId)
    }
}
