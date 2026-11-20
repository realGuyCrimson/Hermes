#!/usr/bin/env bash
# Restore the stock Hermes dashboard UI.
set -euo pipefail
rm -f "$HOME/.config/systemd/user/hermes-dashboard.service.d/studio.conf"
rmdir "$HOME/.config/systemd/user/hermes-dashboard.service.d" 2>/dev/null || true
systemctl --user daemon-reload
systemctl --user restart hermes-dashboard.service
sleep 4
systemctl --user is-active hermes-dashboard.service
echo "Rolled back: the dashboard serves its built-in UI again."
