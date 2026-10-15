# Testing Plan - Anime Workout & Fitness

## Test Strategy
This project uses Test-Driven Development (TDD) with three layers of testing:

1. **Unit Tests** (app/src/test) - Fast, isolated tests for individual functions and classes
2. **Component Tests** (app/src/androidTest) - Tests for Android Components and UI
3. **Integration Tests** (app/src/androidTest) - End-to-end tests for user flows

## Test Coverage Goals
- Unit Tests: 80%+ coverage for business logic
- Component Tests: 70% coverage for UI components
- Integration Tests: Critical user journey coverage

## Test Execution Order
1. `./gradlew test` - Run all unit and component tests
2. `./gradlew connectedAndroidTest` - Run instrumentation tests
3. `./gradlew lint` - Code quality checks

## Testing Dependencies
```gradle
// Unit Tests
testImplementation("junit:junit:4.13.2")
testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.0")
testImplementation("org.mockito:mockito-core:5.8.0")
testImplementation("androidx.arch.core:core-testing:2.2.0")

// Instrumentation Tests
androidTestImplementation("androidx.test.ext:junit:1.1.5")
androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
androidTestImplementation("androidx.test.espresso:espresso-contrib:3.5.1")
```

## Test Maintenance
- Tests are versioned with the code
- Test data is isolated in test-specific files
- Mock dependencies for unit tests
- Real device/emulator for integration tests
