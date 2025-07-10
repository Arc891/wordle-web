#!/bin/bash
set -e

EXTRA_FLAGS=""
for arg in "$@"; do
    EXTRA_FLAGS+=" $arg"
done

$HOME/.scripts/docker-build-push.sh \
  --image wordle-web \
  --port 41124 \
  --version-file "package.json" \
  $EXTRA_FLAGS \
