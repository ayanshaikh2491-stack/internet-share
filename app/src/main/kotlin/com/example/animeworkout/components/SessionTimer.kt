package com.example.animeworkout.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import java.time.Instant

@Composable
fun SessionTimer(
    initialDurationSec: Int = 300,
    onSessionComplete: () -> Unit = {}
) {
    val currentTime = remember { mutableStateOf(Instant.now()) }
    val elapsedSec = rememberSaveable { mutableStateOf(0) }
    val isRunning = rememberSaveable { mutableStateOf(false) }
    val remainingSec = initialDurationSec - elapsedSec.value

    LaunchedEffect(isRunning.value) {
        if (isRunning.value) {
            while (isRunning.value && remainingSec > 0) {
                kotlinx.coroutines.delay(1000L)
                elapsedSec.value++
                currentTime.value = Instant.now()
            }
            if (remainingSec <= 0) {
                onSessionComplete()
            }
        }
    }

    Column(
        modifier = Modifier.fillMaxWidth().padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = formatTime(remainingSec),
            style = MaterialTheme.typography.headlineLarge
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            Button(onClick = { isRunning.value = !isRunning.value }) {
                Text(if (isRunning.value) "Pause" else "Start")
            }

            Button(onClick = {
                elapsedSec.value = 0
                isRunning.value = false
            }) {
                Text("Reset")
            }
        }
    }
}

@Composable
private fun formatTime(seconds: Int): String {
    val minutes = seconds / 60
    val secs = seconds % 60
    return String.format("%02d:%02d", minutes, secs)
}
