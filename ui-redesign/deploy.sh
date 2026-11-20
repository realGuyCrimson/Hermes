#!/usr/bin/env bash
# Serve the redesigned UI from the real dashboard (systemd user unit hermes-dashboard).
# Reversible: ./rollback.sh removes the drop-in and restarts, which restores the stock UI.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
DROPIN_DIR="$HOME/.config/systemd/user/hermes-dashboard.service.d"
node "$HERE/build.mjs"
test -f "$HERE/dist/index.html"
mkdir -p "$DROPIN_DIR"
cat > "$DROPIN_DIR/studio.conf" <<CONF
[Service]
Environment=HERMES_WEB_DIST=$HERE/dist
CONF
systemctl --user daemon-reload
systemctl --user restart hermes-dashboard.service
sleep 4
systemctl --user is-active hermes-dashboard.service
curl -s -o /dev/null -w "dashboard / -> %{http_code} (302 = login gate, expected)\n" http://127.0.0.1:9119/
echo "Deployed. Roll back with: $HERE/rollback.sh"
