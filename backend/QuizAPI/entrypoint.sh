#!/bin/sh
set -e

echo "Waiting for database to be ready..."
# The healthcheck on the postgres service already ensures this,
# but a small sleep guards against edge-case timing on slow hardware.
sleep 2

echo "Starting API..."
exec dotnet QuizAPI.dll
