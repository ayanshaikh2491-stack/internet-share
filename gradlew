#!/bin/sh
# Wrapper script for Gradle

# Determine the directory containing this script
dir=$(cd "$(dirname "$0")" && pwd)

# Set default Gradle wrapper location
gradlewrapper="$dir/gradle/wrapper/gradle-wrapper.jar"
if [ ! -f "$gradlewrapper" ]; then
    echo "Gradle wrapper not found. Please run './gradlew wrapper' first."
    exit 1
fi

# Set Java options
: ${JAVA_OPTS:="-Xmx512m"}

# Run Gradle
exec java $JAVA_OPTS -jar "$gradlewrapper" "$@"