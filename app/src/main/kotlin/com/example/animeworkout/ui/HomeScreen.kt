package com.example.animeworkout.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.animeworkout.viewmodel.WorkoutViewModel

@Composable
fun HomeScreen(
    viewModel: WorkoutViewModel = hiltViewModel()
) {
    val workouts by viewModel.workouts.collectAsState()

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp)
    ) {
        items(workouts.size) { index ->
            val workout = workouts[index]

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(text = workout.name)
                Button(onClick = { /* Navigate to SessionScreen */ }) {
                    Text("Start")
                }
            }
        }
    }
}
