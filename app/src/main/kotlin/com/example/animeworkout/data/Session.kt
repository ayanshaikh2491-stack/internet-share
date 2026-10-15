package com.example.animeworkout.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "sessions")
data class Session(
    @PrimaryKey(autoGenerate = true) val uid: Long = 0,
    val workoutId: Int,
    val timestamp: Long,
    val durationSec: Int,
    val caloriesBurned: Int
)
