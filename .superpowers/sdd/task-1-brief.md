# Task 1 Brief: Create Project Structure and Gradle Configuration

## Context
This is the first task in building the Anime Workout & Fitness Android app. You're creating the foundational project structure that all other tasks will build upon.

## Requirements (from plan)

### Files to Create:
1. `app/build.gradle.kts` - Main Gradle build file with:
   - Kotlin and Android plugins
   - compileSdk 34, minSdk 21, targetSdk 34
   - Compose enabled
   - All dependencies from Global Constraints

2. `app/src/main/AndroidManifest.xml` - Basic manifest

3. `gradle.properties` - Gradle JVM settings

4. `settings.gradle.kts` - Project settings

### Exact Code for app/build.gradle.kts:
```gradle
plugins {
    id("com.android.application")
    kotlin("android")
    kotlin("kapt")
}

android {
    compileSdk = 34
    defaultConfig {
        applicationId = "com.example.animeworkout"
        minSdk = 21
        targetSdk = 34
        versionCode = 1
        versionName = "0.1"
    }
    buildFeatures { compose = true }
    composeOptions { kotlinCompilerExtensionVersion = "1.5.10" }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.0")
    implementation("androidx.activity:activity-compose:1.9.0")
    implementation("androidx.compose.ui:ui:1.6.6")
    implementation("androidx.compose.material3:material3:1.2.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.0")
    implementation("androidx.room:room-runtime:2.5.2")
    kapt("androidx.room:room-compiler:2.5.2")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.0")
    implementation("com.airbnb.android:lottie-compose:6.2.0")
}
```

## Git Setup
- User: Ayan Shaikh
- Email: ayan.shaikh@example.com
- Already configured in repo

## Commit Message
```
feat: setup gradle configuration and project structure
```

## Output
- Report file: `.superpowers/sdd/task-1-report.md`
- Mark all steps as complete in the report
- Include test verification (./gradlew test -p app)
