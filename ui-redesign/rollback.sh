#!/usr/bin/env bash
# Restore the stock Hermes dashboard UI.
set -euo pipefail
# restore the stock login page if the Studio hook was installed
LP="$HOME/.hermes/hermes-agent/hermes_cli/dashboard_auth/login_page.py"
ORIG="$(dirname "$0")/login/login_page.py.orig"
if grep -q "hermes-studio login restyle" "$LP" 2>/dev/null; then
  python3 - "$LP" <<'PYEOF'
import re, sys
p = sys.argv[1]; s = open(p).read()
s = re.sub(r"\n# >>> hermes-studio login restyle.*?# <<< hermes-studio login restyle\n", "\n", s, flags=re.S)
open(p, "w").write(s)
PYEOF
fi
rm -f "$HOME/.config/systemd/user/hermes-dashboard.service.d/studio.conf"
rmdir "$HOME/.config/systemd/user/hermes-dashboard.service.d" 2>/dev/null || true
systemctl --user daemon-reload
systemctl --user restart hermes-dashboard.service
sleep 4
systemctl --user is-active hermes-dashboard.service
echo "Rolled back: the dashboard serves its built-in UI again."
