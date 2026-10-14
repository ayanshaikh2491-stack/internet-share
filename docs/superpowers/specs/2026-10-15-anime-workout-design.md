# Design Spec – Anime Workout & Fitness (MVP)

**Date:** 2026-10-15

---

## Overview
The *Anime Workout & Fitness* app is a lightweight Android application that provides a curated list of anime‑styled workout routines, a timer‑based session experience, and basic progress tracking. The design focuses on a clean, modern UI built with Jetpack Compose and uses local storage (Room) to keep data offline and fast.

---

## Core Features (MVP)
1. **Pre‑defined Workout Library** – A static collection of themed exercises (e.g., *Power‑Punch*, *Kamehameha Squats*) each with an anime‑style illustration.
2. **Workout Session** – Start a workout, see a large countdown timer, and enjoy an animated Lottie background. Users can pause or stop the session.
3. **Progress Tracker** – After each session the app records date, duration, and estimated calories. A simple list view and a compact bar‑chart display recent activity.
4. **Settings** – Light/Dark theme toggle using anime‑themed color palettes.

---

## Architecture
- **Pattern:** MVVM (Model‑View‑ViewModel) with Repository.
- **Data Layer:** Room for persistent entities (`Workout`, `Session`) and DataStore for tiny preferences (theme).
- **Async:** Kotlin Coroutines + Flow for reactive UI updates.
- **UI Layer:** Jetpack Compose declarative UI; Lottie‑Compose for animation.

---

## Data Model
```kotlin
@Entity(tableName = "workouts")
 data class Workout(
   @PrimaryKey val id: Int,
   val name: String,
   val description: String,
   val animationUrl: String // Lottie JSON asset
 )

@Entity(tableName = "sessions")
 data class Session(
   @PrimaryKey(autoGenerate = true) val uid: Long = 0,
   val workoutId: Int,
   val timestamp: Long,
   val durationSec: Int,
   val caloriesBurned: Int
 )
```

---

## UI Sketch (textual)
- **HomeScreen** – `LazyColumn` of cards. Each card shows the animation thumbnail, workout name, and a **Start** button.
- **SessionScreen** – Full‑screen timer (`Text` + `AnimatedVisibility`), Lottie background, **Pause/Stop** icons.
- **ProgressScreen** – `LazyColumn` of past sessions + a small horizontal bar chart built with Compose `Canvas`.
- **SettingsScreen** – Switch for Light/Dark theme.

---

## Tech Stack
| Layer | Library / Tool | Reason |
|-------|----------------|--------|
| Language | Kotlin | Official Android language |
| UI | Jetpack Compose | Declarative, modern styling, easy animation |
| Data | Room + DataStore | Type‑safe offline persistence |
| Async | Coroutines + Flow | Simple concurrency, UI streams |
| Animation | Lottie‑Compose | Lightweight, anime‑style JSON animations |
| Build | Gradle (Android Gradle Plugin) | Standard Android build system |
| Testing | JUnit5, Espresso, Compose UI Tests | Automated verification |

---

## Project Setup Steps (high‑level)
1. Install **Android Studio Flamingo** (or newer).
2. Create a new project: **File → New → Project → Empty Compose Activity** → name `AnimeWorkout`.
3. Add the dependencies listed in the design (Compose, Room, Lottie, Coroutines).
4. Implement the data entities, DAO, and Repository.
5. Create `WorkoutViewModel` and `SessionViewModel` exposing `StateFlow`s.
6. Build the Compose screens (`HomeScreen`, `SessionScreen`, `ProgressScreen`, `SettingsScreen`).
7. Implement timer logic using `LaunchedEffect` and `delay`.
8. Persist sessions via the Repository; observe updates with `collectAsState`.
9. Run on an emulator or device and verify core flows.

---

## Future Extensions (post‑MVP)
- Badge/Reward system unlocking anime characters.
- Music player with themed playlists.
- Social sharing integration (TikTok/Instagram).
- Cloud sync (Firebase) for cross‑device progress.

---

*Spec prepared for review.*
