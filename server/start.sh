#!/bin/bash
cd "$(dirname "$0")"
PYTHON="/Library/Developer/CommandLineTools/usr/bin/python3"
UVICORN="/Users/petermettler/Library/Python/3.9/bin/uvicorn"

if [ ! -d "dist" ] && [ -d "../dist" ]; then
  ln -sf "$(pwd)/../dist" dist
fi

exec "$UVICORN" server:app --host 127.0.0.1 --port 8898 --log-level info
