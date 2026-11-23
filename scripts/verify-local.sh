#!/usr/bin/env bash
# Local verification launcher for Hyper Splat Engine
set -euo pipefail

echo "=========================================================="
echo " Running Local Verification for Hyper Splat Engine"
echo "=========================================================="

if [ -f "tools/verify.mjs" ]; then
  node tools/verify.mjs
elif [ -d "tests" ]; then
  node --test tests/*.test.mjs
fi

echo "All tests verified successfully!"
