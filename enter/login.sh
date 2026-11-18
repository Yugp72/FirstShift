#!/bin/zsh
# Log in to enter.pro without the API key showing on screen or in shell history.
# Run in your own terminal:  ./enter/login.sh
CLI="$HOME/.local/bin/enter-cli"
echo "Paste your enter.pro API key (from Workspace Settings), then press Return."
echo "The key will not be shown as you paste."
read -rs "KEY?API key: "
echo
if [[ -z "$KEY" ]]; then echo "No key entered."; exit 1; fi
"$CLI" login --api-key "$KEY" && "$CLI" whoami
unset KEY
