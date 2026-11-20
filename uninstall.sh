#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "\033[1;33m============================================\033[0m"
echo -e "\033[1;33m   Yandex Music Enhancer - Uninstaller      \033[0m"
echo -e "\033[1;33m============================================\033[0m"

if ! command -v node &> /dev/null; then
    echo -e "\033[1;31m✖ Node.js is not installed!\033[0m"
    exit 1
fi

node "$DIR/scripts/patcher.js" restore "$@"
