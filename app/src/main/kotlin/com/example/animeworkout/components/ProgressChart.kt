package com.example.animeworkout.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.example.animeworkout.data.Session

@Composable
fun ProgressChart(
    sessions: List<Session>,
    modifier: Modifier = Modifier.fillMaxWidth().height(200.dp)
) {
    Column(
        modifier = modifier.padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(text = "Workout History", style = MaterialTheme.typography.titleMedium)

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            sessions.forEach { session ->
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .width(40.dp)
                            .height((session.durationSec / 60 * 4).dp)
                            .background(Color.Blue)
                    )

                    Text(text = "${session.durationSec}s", style = MaterialTheme.typography.bodySmall)
                }
            }
        }
    }
}
