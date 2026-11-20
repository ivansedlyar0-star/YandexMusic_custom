#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "\033[1;36m============================================\033[0m"
echo -e "\033[1;36m    Yandex Music Enhancer - Linux/macOS     \033[0m"
echo -e "\033[1;36m============================================\033[0m"

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo -e "\033[1;31m✖ Node.js is not installed!\033[0m Please install Node.js (v18+) to proceed."
    exit 1
fi

# Optional check for cava
if ! command -v cava &> /dev/null; then
    echo -e "\033[1;33mℹ CAVA visualizer not found in PATH.\033[0m"
    echo -e "  For real-time audio spectrum visualization, install cava: \033[1m(sudo pacman -S cava / sudo apt install cava)\033[0m"
    echo -e "  (Don't worry, a procedural ambient spectrum will be used automatically as fallback!)\n"
fi

node "$DIR/scripts/patcher.js" install "$@"
