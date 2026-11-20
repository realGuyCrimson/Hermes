#!/usr/bin/env bash
# Install the Studio /login restyle: appends a small, guarded hook to Hermes' login_page.py (idempotent).
# Re-run this after `hermes update` (an update restores the stock login_page.py). Undo: ./rollback.sh
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
TARGET="$HOME/.hermes/hermes-agent/hermes_cli/dashboard_auth/login_page.py"
MARK="# >>> hermes-studio login restyle"
[ -f "$HERE/login_page.py.orig" ] || cp "$TARGET" "$HERE/login_page.py.orig"
if grep -q "$MARK" "$TARGET"; then echo "hook already installed"; else
cat >> "$TARGET" <<PYEOF

$MARK (see ui-redesign/login/install-login.sh; removed by ui-redesign/rollback.sh)
try:
    import importlib.util as _studio_u, os as _studio_os
    _studio_p = "$HERE/studio_login.py"
    if _studio_os.path.exists(_studio_p):
        _studio_s = _studio_u.spec_from_file_location("studio_login", _studio_p)
        _studio_m = _studio_u.module_from_spec(_studio_s)
        _studio_s.loader.exec_module(_studio_m)
        _studio_login, _studio_native = render_login_html, render_native_provider_choice_html
        def render_login_html(*a, **k):
            return _studio_m.restyle(_studio_login(*a, **k))
        def render_native_provider_choice_html(*a, **k):
            return _studio_m.restyle(_studio_native(*a, **k))
except Exception:
    pass
# <<< hermes-studio login restyle
PYEOF
fi
"$HOME/.hermes/tools/"python-3.14.9*/bin/python3 -I -c "import ast,sys; ast.parse(open('$TARGET').read()); print('login_page.py parses')"
systemctl --user restart hermes-dashboard.service
sleep 5
systemctl --user is-active hermes-dashboard.service
echo "Studio login installed."
