#!/bin/bash
cd "$(dirname "$0")"
export OPENCLAW_GATEWAY_TOKEN="$(cat ~/.openclaw/service-env/OPENCLAW_GATEWAY_TOKEN 2>/dev/null)"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

if [ ! -d "dist" ] && [ -d "../dist" ]; then
  ln -sf "$(realpath ../dist)" dist
fi

exec /Users/petermettler/Library/Python/3.9/bin/uvicorn server:app \
  --host 127.0.0.1 --port 8898 --log-level info
