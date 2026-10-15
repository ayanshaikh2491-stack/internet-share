package com.example.animeworkout.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.animeworkout.data.DataStoreManager
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class SettingsViewModel(
    private val dataStoreManager: DataStoreManager
) : ViewModel() {

    val isDarkTheme: StateFlow<Boolean> = dataStoreManager.themeSetting
        .stateIn(viewModelScope, SharingStarted.Lazily, false)

    fun toggleTheme() {
        viewModelScope.launch {
            val currentTheme = isDarkTheme.value
            dataStoreManager.setThemeSetting(!currentTheme)
        }
    }
}