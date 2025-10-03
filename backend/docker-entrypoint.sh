#!/bin/sh
set -e

# Ensure data directory exists and is writable
node src/ensure-data-dir.js

# Start the application
exec "$@"
