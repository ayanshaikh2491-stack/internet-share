package com.example.animeworkout

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import com.example.animeworkout.ui.*

@Composable
fun Navigation() {
    var currentScreen by remember { mutableStateOf(Screen.Home) }

    Scaffold(
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = currentScreen == Screen.Home,
                    onClick = { currentScreen = Screen.Home },
                    icon = { Text("🏠") },
                    label = { Text("Home") }
                )

                NavigationBarItem(
                    selected = currentScreen == Screen.Progress,
                    onClick = { currentScreen = Screen.Progress },
                    icon = { Text("📊") },
                    label = { Text("Progress") }
                )

                NavigationBarItem(
                    selected = currentScreen == Screen.Settings,
                    onClick = { currentScreen = Screen.Settings },
                    icon = { Text("⚙️") },
                    label = { Text("Settings") }
                )
            }
        }
    ) { paddingValues ->
        Box(modifier = Modifier.padding(paddingValues)) {
            when (currentScreen) {
                Screen.Home -> HomeScreen()
                Screen.Progress -> ProgressScreen()
                Screen.Settings -> SettingsScreen()
            }
        }
    }
}

enum class Screen {
    Home, Progress, Settings
}
