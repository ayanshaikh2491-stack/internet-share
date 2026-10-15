package com.example.animeworkout.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.animeworkout.components.ProgressChart
import com.example.animeworkout.viewmodel.SessionViewModel
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun ProgressScreen(
    viewModel: SessionViewModel = hiltViewModel()
) {
    val sessions by viewModel.sessions.collectAsState()

    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp)
    ) {
        Text(
            text = "Progress",
            style = MaterialTheme.typography.headlineMedium,
            modifier = Modifier.padding(bottom = 16.dp)
        )

        ProgressChart(
            sessions = sessions,
            modifier = Modifier.fillMaxWidth().height(200.dp)
        )

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "Recent Sessions",
            style = MaterialTheme.typography.titleMedium,
            modifier = Modifier.padding(bottom = 8.dp)
        )

        LazyColumn {
            items(sessions.size) { index ->
                val session = sessions[index]
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(text = formatTimestamp(session.timestamp))
                        Text(text = "${session.durationSec}s | ${session.caloriesBurned} cal")
                    }
                }
            }
        }
    }
}

@Composable
private fun formatTimestamp(timestamp: Long): String {
    val date = Date(timestamp)
    val formatter = SimpleDateFormat("MMM dd, hh:mm a", Locale.getDefault())
    return formatter.format(date)
}
