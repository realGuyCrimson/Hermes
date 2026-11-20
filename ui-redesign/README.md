# ui-redesign

New UI / UX for Hermes: a chat-first workspace in place of the terminal-like dashboard.

| File | What |
|---|---|
| `SPEC.md` | The design: diagnosis, references, principles, information architecture, thread anatomy, capability matrix, implementation path |
| `inventory.md` | Source-derived inventory of dashboard pages, REST endpoints, JSON-RPC methods and events (what must be preserved) |
| `prototype/` | Interactive prototype, static files, sample data, no backend. Open `prototype/index.html` (any static server, or straight from disk) |
| `WORKER-CONTRACT.md` | The conventions each view module follows (also the extension guide for adding a view) |

Prototype map: `js/shell.js` rail, router, ⌘K · `js/chat.js` thread, composer, live simulation · `js/inspector.js` inspector and Terminal view · `js/views/*.js` Inbox, Routines, Library, Channels, Insights, Settings, History · `css/base.css` tokens and shared components.

Design v2: one goal per screen. Each space is a colour field with a giant ghost title, a pixel mosaic and one action; the dense capability opens in a right-hand drawer (the workbench). The rail is a 72px icon strip that expands (`[`).

Try: send a message in "Redesign the web UI" (a command approval appears), press ⌘K, switch Chat | Terminal, toggle the inspector tabs, open any space from the rail, switch theme in the rail header.

The prototype is sample data only. Nothing here touches `~/.hermes` or the live dashboard.
