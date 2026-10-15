package com.example.animeworkout.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "workouts")
data class Workout(
    @PrimaryKey val id: Int,
    val name: String,
    val description: String,
    val animationUrl: String
)
