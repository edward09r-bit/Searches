#!/usr/bin/env bash
# macOS double-click entry point — Finder runs .command files in Terminal.
cd "$(dirname "$0")"
exec ./start.sh
