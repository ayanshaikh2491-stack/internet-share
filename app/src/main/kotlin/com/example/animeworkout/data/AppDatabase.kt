package com.example.animeworkout.data

import androidx.room.Database
import androidx.room.RoomDatabase

@Database(entities = [Workout::class, Session::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun workoutDao(): WorkoutDao
    abstract fun sessionDao(): SessionDao
}
