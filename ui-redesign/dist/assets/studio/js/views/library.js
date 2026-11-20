/* Library · skills, memory, tools, files. Owned by the library view author. */
(function(){
const H = window.H, h = H.h;
const LIVE = H.live;
const TABS = [
  {id:'skills', label:'Skills', icon:'sparkle'},
  {id:'memory', label:'Memory', icon:'brain'},
  {id:'tools',  label:'Tools',  icon:'plug'},
  {id:'files',  label:'Files',  icon:'folder'},
];

/* ---------------------------------------------------------------- data */
function S(name, desc, source, uses, steps, cmd, extra){
  extra = extra || {};
  return {id:name, name, desc, source, uses, steps, cmd,
    version: extra.v || '1.0.0', updated: extra.u || 'Nov 12',
    pinned: !!extra.pin, enabled: extra.enabled !== false,
    when: extra.when || '', notes: extra.notes || ''};
}
const SKILLS = [
  S('web-research','Search the web and read pages, with citations.','Built-in',12,
    ['Turn the request into two or three concrete queries.','Open at most six sources; primary docs beat blog summaries.','Record URL, title and date for every claim you keep.','Answer in your own words, then list the sources.'],
    'hermes web search "python 3.14 free-threading" --json | jq .results[0]',
    {pin:true,v:'1.4.0',u:'Nov 12',when:'Use for anything that may have changed since training, or when a claim needs a date and a source.',
     notes:'Caps at six sources and never cites a page it did not open. Roughly 1.8k tokens before the answer starts.'}),
  S('backup-verify','Check last night’s backup without touching live state.','Hub',8,
    ['Copy state.db, -wal and -shm together into a scratch directory.','Run hermes sessions verify against the copy.','Compare file counts and size with the manifest.','Report pass, or the first failing check · do not repair.'],
    'hermes backup verify ~/.hermes/backups/2026-11-18.zip',
    {v:'2.3.0',u:'Nov 18',when:'After the 02:30 backup, or whenever someone asks whether last night’s archive is safe to rely on.',
     notes:'Read-only against the live database. A failed verify blocks the retention job but deletes nothing.'}),
  S('gateway-debugging','Trace heartbeat gaps, then restart the gateway safely.','Mine',6,
    ['Read the last 200 lines of logs/gateway.log.','Check holder PIDs with hermes doctor before restarting.','Stop the dashboard, then the gateway; wait for zero holders.','Start one owner and confirm a heartbeat for 60 s.'],
    'hermes doctor --json | jq \'.holders\'',
    {v:'1.1.2',u:'Nov 19',when:'The rail shows a stale heartbeat, a turn is lost after a restart, or sessions stop answering.',
     notes:'A restart drops in-flight turns. The thread shows “Turn lost during restart” and can resume. Needs your approval.'}),
  S('inbox-triage','Sort atomicmail into replies, archive and needs-you.','Hub',14,
    ['Fetch unread since the last run, capped at 40 messages.','Group by sender and thread; never answer one thread twice.','Draft replies in the user’s voice with no greeting.','Escalate anything about money, contracts or legal dates.'],
    'hermes skills run inbox-triage --account support@ --limit 40',
    {v:'1.8.0',u:'Nov 17',when:'The morning triage turn runs, or you ask what is waiting in the inbox.',
     notes:'Drafts only. Sending needs approval unless the thread is marked auto-send; archive is always allowed.'}),
  S('shell-safety','Block destructive commands before they run.','Built-in',31,
    ['Read the command and its working directory.','Refuse rm -rf, dd to a device, and writes outside the project.','Offer a dry run with --dry-run where the tool supports it.','Log the refusal with the thread id.'],
    'hermes hooks test tool.pre --cmd "rm -rf ~/hermes-maintenance"',
    {u:'Oct 30',notes:'Fires on every tool call that starts a shell. A refusal costs one turn, not a filesystem.'}),
  S('pdf-reader','Extract text and tables from PDFs up to 200 pages.','Built-in',4,
    ['Check the page count before reading; refuse above 200 pages.','Extract text per page and keep table structure.','Quote the page number with each extracted figure.'],
    'hermes pdf text ~/Downloads/invoice-1182.pdf --pages 1-3',{u:'Nov 02'}),
  S('cron-authoring','Write and validate Hermes routines.','Built-in',9,
    ['Start from an existing routine in ~/.hermes/cron.','Keep the schedule in UTC and the delivery target explicit.','Validate before saving; a bad cron line fails silently otherwise.'],
    'hermes cron validate ~/.hermes/cron/cost-report.yaml',{u:'Nov 09'}),
  S('drive-upload','Upload large files to the OCI Drive folder.','Mine',5,
    ['Confirm the file is inside the OCI-owned workspace.','Upload with the user’s OAuth token, never the service account.','Print the Drive id and the local size after upload.'],
    'gdrive-upload.py build/hermes-2026-11-18.zip --parent 19c3PDevfxqyIe_5WSeCuWeYDw0Jg-8e-',{u:'Nov 06'}),
  S('writing-voice','Match the user’s tone: plain, terse, no preamble.','Mine',9,
    ['Lead with the answer in one sentence.','Cut greetings, restatements and closing offers.','Use sentence case and digits for numbers.','Read the draft back once for filler.'],
    'hermes skills test writing-voice --input draft.md',{pin:true,u:'Nov 14'}),
  S('mcp-setup','Add and test MCP servers without breaking running threads.','Built-in',3,
    ['Prefer stdio for local servers and http only for hosted ones.','Store tokens in auth.json, never in config.yaml.','Run hermes mcp test before telling anyone it works.'],
    'hermes mcp test github --verbose',{u:'Oct 30'}),
  S('python-env','Use hermes pm’s Python 3.14, never system pip.','Built-in',18,
    ['Call hermes pm run instead of python directly.','Install packages with hermes pm add, not pip.','Check hermes pm doctor when the interpreter misbehaves.'],
    'hermes pm run python -c "import sys; print(sys.version)"',{u:'Nov 11'}),
  S('release-notes','Turn a diff into release notes a person will read.','Hub',2,
    ['Collect commits since the last tag.','Group by what changed for a user, not by file.','Name the fix, the version and anything that needs a migration.'],
    'hermes skills run release-notes --range v0.8..HEAD',{u:'Nov 05'}),
  S('postgres-explain','Read a query plan and say what to index.','Hub',7,
    ['Run EXPLAIN (ANALYZE, BUFFERS) on a read-only connection.','Find the heaviest node, not the first seq scan.','Propose one index with the trade-off stated.'],
    'hermes mcp call postgres explain --sql "select * from sessions where updated_at > now() - interval \'1 day\'"',{u:'Nov 08'}),
  S('doc-outline','Outline a doc before writing it.','Mine',4,
    ['Write the reader’s question as the title.','List sections as claims, not nouns.','Stop at five sections; split the doc if it needs more.'],
    'hermes skills run doc-outline --topic "gateway restart"',{u:'Nov 07'}),
  S('arxiv-digest','Summarise new papers in a category since last week.','Hub',1,
    ['Fetch the category listing for the window.','Pick five papers by relevance, not by citation count.','Give one sentence of method and one of why it matters.'],
    'hermes skills run arxiv-digest --cat cs.DC --since 7d',{u:'Nov 03'}),
  S('screenshot-diff','Compare two UI screenshots and name the regressions.','Hub',0,
    ['Align both shots to the same viewport and theme.','Diff the pixels, then read the changed regions.','Report layout first, colour second, copy third.'],
    'hermes skills run screenshot-diff before.png after.png',{u:'Oct 29',enabled:false}),
  S('kanban-grooming','Keep the task board honest: merge, close, reorder.','Built-in',6,
    ['Close cards with no activity for 14 days.','Merge duplicates and keep the older id.','Move blocked cards to the top of their column.'],
    'hermes board list --stale 14d',{u:'Nov 10'}),
  S('telegram-format','Format replies for Telegram: short lines, no tables.','Built-in',22,
    ['Keep paragraphs under four lines.','Replace tables with labelled lines.','Use bold only for the first line of a list.'],
    'hermes skills run telegram-format --file reply.md',{u:'Nov 01'}),
  S('worktree-review','Review a worktree diff before it lands.','Built-in',11,
    ['Read the diff in file order, then the tests.','Check for scope creep before style.','Name one blocking issue at most.'],
    'hermes review --worktree ~/hermes-maintenance/.worktrees/ui-redesign',{u:'Nov 16'}),
  S('secret-hygiene','Keep secrets out of notes, logs and commits.','Mine',3,
    ['Scan the diff for key-shaped strings before committing.','Reference env keys by name only.','Redact caught values in the transcript.'],
    'hermes doctor secrets --path .',{u:'Nov 13'}),
  S('session-recovery','Salvage a session after a crash or bad restore.','Built-in',2,
    ['Stop every state.db holder before touching files.','Copy db, -wal and -shm together.','Run hermes sessions recover against the copy, never the original.'],
    'hermes sessions recover --dry-run',{u:'Oct 28'}),
  S('sqlite-inspect','Read state.db safely with the WAL attached.','Built-in',5,
    ['Open in read-only mode with the sidecars present.','Never copy state.db alone.','Explain the schema before writing a query.'],
    'sqlite3 "file:$HOME/.hermes/state.db?mode=ro" ".tables"',{u:'Nov 15'}),
  S('typescript-migrate','Move a JS file to strict TypeScript in small steps.','Built-in',1,
    ['Rename the file, then fix imports.','Type the exported surface first.','Turn on strict per file; keep the build green after each step.'],
    'npx tsc --noEmit --strict src/imap.ts',{u:'Oct 27'}),
  S('accessibility-audit','Check a page against WCAG AA with a real browser.','Built-in',0,
    ['Open the page in the Docker Chromium.','Check names, contrast, focus order and 200% zoom.','Report by user impact, not by rule id.'],
    'hermes browser a11y http://127.0.0.1:9119 --level AA',{u:'Nov 04'}),
  S('test-triage','Read a failing test run and name the first real cause.','Mine',7,
    ['Read the first failure, not the loudest.','Reproduce it alone before reading more code.','Fix the cause; only then re-run the suite.'],
    'hermes pm run pytest -x -q',{u:'Nov 18'}),
  S('log-digest','Turn a log window into five lines and one cause.','Built-in',8,
    ['Filter to the incident window first.','Group repeated lines and count them.','Name one likely cause and one check that would confirm it.'],
    'journalctl -u hermes-gateway --since "2 hours ago" | hermes log digest',{u:'Nov 09'}),
  S('browser-traces','Capture a Playwright trace and read the failing step.','Built-in',3,
    ['Record with screenshots and network on.','Find the first step whose screenshot differs.','Quote the selector and the response status.'],
    'hermes browser trace --url http://127.0.0.1:9222',{u:'Oct 31'}),
  S('api-contract','Compare an OpenAPI diff and flag breaking changes.','Mine',2,
    ['Diff paths, parameters and response shapes.','Mark removed fields and narrowed types as breaking.','Suggest a version bump only when a client breaks.'],
    'hermes skills run api-contract --old openapi-v1.json --new openapi-v2.json',{u:'Nov 06'}),
  S('voice-notes','Turn a voice memo into decisions and tasks.','Mine',1,
    ['Transcribe with timestamps.','Separate decisions from discussion.','Create tasks only for things with an owner.'],
    'hermes transcribe ~/voice/2026-11-18.m4a',{u:'Oct 26'}),
  S('link-archiver','Save a page with a snapshot and a date.','Built-in',0,
    ['Fetch the page and store the readable text.','Keep the original URL, fetch date and content hash.','Say when a page was already archived.'],
    'hermes web archive https://docs.python.org/3.14/whatsnew/3.14.html',{u:'Oct 25'}),
  S('pricing-page-review','Read a pricing page and list what changed.','Mine',2,
    ['Snapshot the page and diff against the last copy.','Extract plan names, prices and limits.','Flag anything that would change an invoice.'],
    'hermes browser snapshot https://stripe.com/pricing',{u:'Nov 02'}),
  S('model-routing','Pick the cheapest model that can finish the task.','Built-in',12,
    ['Estimate context and output size first.','Use flash for reads, sonnet for edits, opus for design.','Fall back only on provider errors, never on cost.'],
    'hermes models route --task "summarise 40 emails"',{u:'Nov 12'}),
  S('oauth-debug','Fix an expired MCP OAuth token without a restart.','Mine',2,
    ['Read the failing server’s last test result.','Re-auth with hermes mcp auth, then test again.','Only restart the gateway if the token file is held open.'],
    'hermes mcp auth linear --reauth',{u:'Nov 19'}),
  S('rss-brief','Build a five-item brief from subscribed feeds.','Mine',0,
    ['Fetch the last 24 hours across feeds.','Pick five items by relevance to open threads.','Give each item one line and a link.'],
    'hermes rss brief --since 24h',{u:'Oct 24'}),
];
/* Sample categories, named after the hub's real category slugs. */
const SKILL_CAT = {
  'web-research':'research', 'backup-verify':'software-development', 'gateway-debugging':'software-development',
  'inbox-triage':'email', 'shell-safety':'software-development', 'pdf-reader':'productivity',
  'cron-authoring':'autonomous-ai-agents', 'drive-upload':'productivity', 'writing-voice':'creative',
  'mcp-setup':'software-development', 'python-env':'software-development', 'release-notes':'software-development',
  'postgres-explain':'software-development', 'doc-outline':'note-taking', 'arxiv-digest':'research',
  'screenshot-diff':'software-development', 'kanban-grooming':'productivity', 'telegram-format':'social-media',
  'worktree-review':'software-development', 'secret-hygiene':'software-development', 'session-recovery':'software-development',
  'sqlite-inspect':'software-development', 'typescript-migrate':'software-development', 'accessibility-audit':'software-development',
  'test-triage':'software-development', 'log-digest':'software-development', 'browser-traces':'software-development',
  'api-contract':'software-development', 'voice-notes':'note-taking', 'link-archiver':'research',
  'pricing-page-review':'research', 'model-routing':'autonomous-ai-agents', 'oauth-debug':'software-development',
  'rss-brief':'research',
};
SKILLS.forEach(s => { s.cat = SKILL_CAT[s.id] || ''; });

const HUB = [
  {name:'pdf-forms', desc:'Fill, flatten and sign PDF forms without a GUI.', meta:'2.1k installs · hub team · v1.3', cat:'Documents'},
  {name:'stripe-billing', desc:'Read invoices, dunning and MRR the way finance does.', meta:'1.4k installs · billing guild · v2.0', cat:'Finance'},
  {name:'k8s-triage', desc:'The first ten minutes of a sick cluster.', meta:'890 installs · ops guild · v0.9', cat:'Ops'},
  {name:'playwright-traces', desc:'Record a browser run and read the failing step.', meta:'1.2k installs · hub team · v1.1', cat:'Browser'},
  {name:'sqlite-repair', desc:'Recover a state.db copy with its WAL attached.', meta:'640 installs · data guild · v1.0', cat:'Data'},
  {name:'semantic-scholar', desc:'Find papers by claim, not just by title.', meta:'510 installs · research guild · v0.7', cat:'Research'},
  {name:'terraform-plan', desc:'Explain a plan before anyone types apply.', meta:'780 installs · ops guild · v1.4', cat:'Ops'},
  {name:'figma-to-css', desc:'Turn a frame into tokens, spacing and layout.', meta:'960 installs · design guild · v0.6', cat:'Design'},
  {name:'webhook-debug', desc:'Replay and inspect webhook deliveries.', meta:'420 installs · hub team · v1.0', cat:'Ops'},
  {name:'cost-audit', desc:'Find the expensive calls in a trace.', meta:'530 installs · finance guild · v1.2', cat:'Finance'},
];
const BUNDLES = [
  {name:'Web research', desc:'Search, read and archive sources with citations.', members:['web-research','pdf-reader','arxiv-digest','rss-brief','link-archiver'], fit:'Best for Scout'},
  {name:'Backend review', desc:'Read the diff, the plan and the failing test before it lands.', members:['postgres-explain','api-contract','test-triage','shell-safety','worktree-review'], fit:'Best for Hermes'},
  {name:'Writing', desc:'Keep prose plain, short and in the user’s voice.', members:['writing-voice','release-notes','doc-outline','telegram-format'], fit:'All profiles'},
];

const MEMORIES = [
  {id:'m1', text:'Prefers terse replies with no preamble · answer first, reasoning after.', thread:'t-ui', date:'Nov 14'},
  {id:'m2', text:'This machine is an OCI Ampere arm64 VM with 24 GB RAM and no GPU.', thread:'t-gw', date:'Oct 12'},
  {id:'m3', text:'The gateway dashboard is loopback-only on :9119; the API is on :8642.', thread:'t-gw', date:'Nov 16'},
  {id:'m4', text:'Backups are only valid when state.db, -wal and -shm are restored together.', thread:'t-bk', date:'Nov 18'},
  {id:'m5', text:'The OCI Drive folder holds files over 100 MB and is shared with the service account.', thread:'t-ml', date:'Oct 28'},
  {id:'m6', text:'Address the user as “you” in summaries; never use their name.', thread:'t-ui', date:'Nov 05'},
  {id:'m7', text:'Atomicmail triage runs at 07:30 on weekdays against the support account.', thread:'t-tri', date:'Nov 11'},
  {id:'m8', text:'No host Chromium: browser work runs in the chromium-cdp container on :9222.', thread:'t-mcp', date:'Oct 30'},
  {id:'m9', text:'The weekly cost report is due Mondays at 09:00 and delivered to Telegram.', thread:'t-ci', date:'Nov 09'},
  {id:'m10', text:'Ledger owns billing and cron; Hermes owns maintenance and UI work.', thread:'t-ci', date:'Oct 22'},
  {id:'m11', text:'Commit messages are sentence case, with no conventional-commit prefixes.', thread:'t-ui', date:'Nov 14'},
  {id:'m12', text:'Python work uses 3.14 from hermes pm; system pip and apt packages are off-limits.', thread:'t-pr', date:'Nov 02'},
];

const JOURNEY = [
  {day:'Today · Nov 19', items:[
    {kind:'skill', title:'Created skill gateway-debugging', meta:'Learned from “Gateway heartbeat gaps after restart”. 6 uses since.'},
    {kind:'memory', title:'Remembered the gateway is loopback-only', meta:'From “Gateway heartbeat gaps after restart”. Replaces a vaguer note.'},
    {kind:'correction', title:'Stopped proposing system pip for Python work', meta:'Correction from you · now uses hermes pm for every interpreter call.'},
  ]},
  {day:'Yesterday · Nov 18', items:[
    {kind:'skill', title:'Updated backup-verify to 2.3.0', meta:'Added the manifest check after a restore drill caught 3 missing files.'},
    {kind:'memory', title:'Remembered that db, -wal and -shm travel together', meta:'From “Verify last night’s backup zip”.'},
  ]},
  {day:'Nov 17', items:[
    {kind:'skill', title:'Created skill inbox-triage', meta:'Drafted from 40 sorted messages; you edited 12 drafts before it settled.'},
  ]},
  {day:'Nov 14', items:[
    {kind:'correction', title:'Commit messages: sentence case, no prefixes', meta:'Correction from you after a “feat:” commit.'},
    {kind:'memory', title:'Remembered the terse-reply preference', meta:'From “Redesign the web UI”. Reinforced twice.'},
    {kind:'skill', title:'Pinned writing-voice', meta:'Curator pinned it after 9 uses in one week.'},
  ]},
  {day:'Nov 12', items:[
    {kind:'memory', title:'Remembered the OCI Drive folder policy', meta:'From “Compare three SMTP providers”.'},
    {kind:'skill', title:'Created skill drive-upload', meta:'Built after two manual uploads in one day.'},
  ]},
  {day:'Nov 09', items:[
    {kind:'memory', title:'Remembered the weekly cost report schedule', meta:'From “Cron: weekly cost report”.'},
    {kind:'correction', title:'Ledger, not Hermes, owns billing', meta:'Correction from you after a misrouted invoice question.'},
  ]},
  {day:'Nov 04', items:[
    {kind:'skill', title:'Updated web-research to 1.4.0', meta:'Now caps sources at six and requires a URL per claim.'},
    {kind:'memory', title:'Remembered the Docker-only browser rule', meta:'From “Test the three MCP servers”.'},
  ]},
  {day:'Oct 30', items:[
    {kind:'skill', title:'Created skill mcp-setup', meta:'First version after wiring github and postgres.'},
    {kind:'memory', title:'Remembered Python 3.14 lives in hermes pm', meta:'From “What changed in Python 3.14.2?”.'},
  ]},
];

const TOOLSETS = [
  {id:'web', name:'Web', desc:'Search the web and read pages, with citations.', tools:6},
  {id:'terminal', name:'Terminal', desc:'Run shell commands on this machine.', tools:4, risky:true},
  {id:'file', name:'Files', desc:'Read, write and organize files in the project root.', tools:7},
  {id:'browser', name:'Browser', desc:'Drive the Docker Chromium over CDP, logged in as you.', tools:9},
  {id:'code', name:'Code execution', desc:'Run Python and Node snippets in a sandbox.', tools:3, risky:true},
  {id:'vision', name:'Vision', desc:'Read screenshots, diagrams and scanned pages.', tools:2},
  {id:'image', name:'Image generation', desc:'Generate and edit images from a prompt.', tools:2, cost:'≈ $0.04 per image'},
  {id:'delegation', name:'Delegation', desc:'Hand work to another agent or a cheaper model.', tools:3},
  {id:'memory', name:'Memory', desc:'Read and write MEMORY.md, USER.md and SOUL.md.', tools:5},
  {id:'cron', name:'Cron', desc:'Create and edit routines, schedules and triggers.', tools:4},
  {id:'mcp', name:'MCP', desc:'Call tools exposed by connected MCP servers.', tools:0},
  {id:'board', name:'Task board', desc:'Create and move cards on the kanban board.', tools:3},
];
const SCOPE_DEFAULTS = {
  hermes:['web','terminal','file','browser','code','memory','cron','mcp','board'],
  scout:['web','browser','file','vision','memory','mcp'],
  ledger:['file','terminal','cron','memory','mcp','board'],
  thread:['web','file'],
};
const scopeLabel = {hermes:'Hermes', scout:'Scout', ledger:'Ledger', thread:'this thread'};

function T(name, desc, on){ return {name, desc, on:on !== false}; }
const MCP_SEED = [
  {id:'github', name:'github', desc:'Issues, pull requests and code search for this repo.', transport:'stdio',
   cmd:'npx -y @modelcontextprotocol/server-github', status:'connected', lastTest:'2m ago', oauth:false,
   tools:[T('search_repositories','Search repos by name, topic or owner'),T('get_file_contents','Read a file at a ref'),T('create_pull_request','Open a pull request from a branch'),T('list_issues','List issues with labels'),T('add_issue_comment','Comment on an issue'),T('get_pull_request_diff','Fetch a PR diff'),T('list_workflow_runs','List recent Actions runs'),T('merge_pull_request','Merge a PR when checks pass',false)]},
  {id:'postgres', name:'postgres', desc:'Read-only SQL against the local hermes database.', transport:'stdio',
   cmd:'npx -y @modelcontextprotocol/server-postgres ~/.hermes', status:'connected', lastTest:'1h ago', oauth:false,
   tools:[T('query','Run a read-only SQL query'),T('list_tables','List tables and views'),T('describe_table','Show columns and indexes'),T('explain','Explain a query plan'),T('list_schemas','List schemas'),T('list_extensions','List installed extensions')]},
  {id:'linear', name:'linear', desc:'Issues and projects for the ops team.', transport:'http',
   url:'https://mcp.linear.app/sse', status:'failed', lastTest:'12m ago', oauth:true,
   error:'401 Unauthorized · the OAuth token expired 3 days ago.',
   tools:[T('list_issues','List issues by team and state'),T('create_issue','Create an issue in a team'),T('update_issue','Change state, assignee or title'),T('add_comment','Comment on an issue'),T('list_projects','List projects and cycles')]},
  {id:'notion', name:'notion', desc:'Project notes and the OCI runbook.', transport:'http',
   url:'https://mcp.notion.com/mcp', status:'connected', lastTest:'26m ago', oauth:true,
   tools:[T('search','Search pages and databases'),T('fetch_page','Read a page as markdown'),T('create_page','Create a page under a parent',false),T('update_page','Append to or edit a page'),T('list_databases','List shared databases')]},
];
const PLUGIN_SEED = [
  {id:'browser-use', name:'browser-use', kind:'browser', version:'2.4.1', latest:'2.5.0', desc:'Browser harness and CDP tools.', on:true},
  {id:'taste-skill', name:'taste-skill', kind:'web', version:'2.0.0', latest:null, desc:'Frontend art direction and review.', on:true},
  {id:'web-research', name:'web-research', kind:'web', version:'1.9.3', latest:'2.0.0', desc:'Search, scraping and citation helpers.', on:true},
  {id:'google-workspace', name:'google-workspace', kind:'platforms', version:'0.8.2', latest:null, desc:'Drive, Docs, Sheets and Calendar.', on:true},
  {id:'honcho-memory', name:'honcho-memory', kind:'memory', version:'0.3.1', latest:'0.4.0', desc:'External memory provider adapter.', on:false},
];
const HOOK_SEED = [
  {id:'session.start', event:'session.start', script:'~/.hermes/hooks/load-context.sh', on:true},
  {id:'tool.pre', event:'tool.pre', script:'~/.hermes/hooks/guard-destructive.sh', on:true},
  {id:'turn.end', event:'turn.end', script:'~/.hermes/hooks/cost-log.py', on:true},
  {id:'approval.request', event:'approval.request', script:'~/.hermes/hooks/notify-telegram.sh', on:true},
];

/* -------------------------------------------------------------- files */
const SOUL_TEXT = [
  '# SOUL.md · who Hermes is','',
  'You are Hermes: a persistent engineer for this machine, not a chatbot.',
  'You work in threads, keep state across turns, and say what you did.','',
  '## Voice','- Plain, terse, factual. Answer first, reasoning second.',
  '- No preamble, no “Great question”, no closing offers.','- Sentence case in prose and in commit messages.',
  '- Numbers as digits; use an en dash for a missing value.','',
  '## Boundaries','- Ask before anything that spends money, sends mail, or deletes data.',
  '- Never print secrets; reference .env keys by name only.','- Prefer one owner process for state.db at a time.',
  '- Read before writing; verify after writing.','',
  '## Defaults','- Model: claude-sonnet-5-5. Fall back to deepseek-flash for bulk reads.',
  '- Profile: default. Ledger owns cron and billing; Scout owns research.',
  '- Browser work runs in the Docker CDP container, never on the host.','',
  '## What “done” means','A change is done when the check passed, the diff is small, and the next',
  'person can see why. Otherwise say what is still open.',
].join('\n');

const CONFIG_TEXT = [
  'profile: default','model: claude-sonnet-5-5','fallback: deepseek-flash','reasoning: medium','',
  'gateway:','  dashboard_port: 9119','  api_port: 8642','  bind: 127.0.0.1','  autostart: true','',
  'memory:','  provider: built-in','  soul: ~/.hermes/SOUL.md','  max_facts: 400','',
  'curator:','  enabled: true','  interval: 6h','  merge_threshold: 0.82','  pin_after_uses: 8','',
  'tools:','  terminal:','    approval: ask','    timeout_s: 120','  browser:','    cdp_url: http://127.0.0.1:9222','',
  'skills:','  dirs:','    - ~/.hermes/skills','  hub: https://skills.hermes.dev',
].join('\n');

const MEMORY_MD = [
  '# MEMORY.md','<!-- long-term facts; appended by the agent, pruned by the curator -->',
  '- Machine: OCI Ampere arm64, 24 GB RAM, no GPU, 200 GB boot volume.',
  '- Gateway dashboard is loopback-only on :9119; API on :8642.',
  '- state.db, -wal and -shm are one image; back them up together.',
  '- Backup archives live in ~/.hermes/backups, kept for 14 days.',
  '- Python work uses 3.14 from hermes pm; system pip is off-limits.',
  '- No host Chromium: browser work runs in the chromium-cdp container.',
  '- The OCI Drive folder holds files over 100 MB.',
  '- Ledger owns billing and cron; Hermes owns maintenance.',
  '- Weekly cost report: Mondays 09:00, delivered to Telegram.',
  '- Commit messages are sentence case, no conventional-commit prefixes.',
].join('\n');

const USER_MD = [
  '# USER.md','- Address the user as “you”; no name in replies.',
  '- Prefers terse answers: no preamble, no restating the question.',
  '- Works from Ubuntu 24.04 on arm64, terminal-first, browser for reading.',
  '- Timezone UTC; working hours 08:00–19:00, quieter on Fridays.',
  '- Wants sources for factual claims and dates on anything time-sensitive.',
  '- Approves: restarts, backups, dependency upgrades. Asks first: money, mail, deletes.',
].join('\n');

const FACTS_JSONL = [
  '{"fact":"Machine is OCI Ampere arm64, 24 GB, no GPU","source":"thread/t-gw","learned":"2026-10-12"}',
  '{"fact":"Dashboard is loopback-only on :9119","source":"thread/t-gw","learned":"2026-11-16"}',
  '{"fact":"Backups include db, -wal and -shm","source":"thread/t-bk","learned":"2026-11-18"}',
  '{"fact":"No host Chromium; use the CDP container","source":"thread/t-mcp","learned":"2026-10-30"}',
  '{"fact":"Ledger owns billing and cron","source":"thread/t-ci","learned":"2026-10-22"}',
  '{"fact":"Python 3.14 via hermes pm only","source":"thread/t-pr","learned":"2026-11-02"}',
].join('\n');

const SKILL_WEB_MD = [
  '---','name: web-research','description: Search the web, read pages, and cite what you used.',
  'allowed-tools: web, browser, file','version: 1.4.0','---','',
  '# web-research','','Use for anything that may have changed since training, or when the user',
  'asks for sources.','','## Steps','1. Turn the request into two or three concrete queries.',
  '2. Open at most six sources; primary docs beat blog summaries.',
  '3. Record URL, title and date for every claim you keep.',
  '4. Answer in your own words, then list the sources.','','## Rules',
  '- Never invent a URL to fill a gap; say the source is missing.',
  '- Paywalled pages: quote the visible abstract only.',
  '- Prefer versions pinned in the project over “latest”.','',
  '## Verify','```bash','hermes web fetch https://docs.python.org/3.14/whatsnew/3.14.html | head -40','```',
].join('\n');

const SKILL_GATEWAY_MD = [
  '---','name: gateway-debugging','description: Trace heartbeat gaps and restart the gateway safely.',
  'allowed-tools: terminal, file','version: 1.1.2','---','','# gateway-debugging','',
  '## Steps','1. Read the last 200 lines of logs/gateway.log.',
  '2. Run hermes doctor and list every holder of state.db.',
  '3. Stop the dashboard, then the gateway. Wait for zero holders.',
  '4. Start one owner; confirm a heartbeat for 60 s.','',
  '## Guardrail','Restarting drops in-flight turns. Ask first.','',
  '```bash','hermes doctor --json | jq \'.holders\'','```',
].join('\n');

const SKILL_INBOX_MD = [
  '---','name: inbox-triage','description: Sort atomicmail into replies, archive and needs-you.',
  'allowed-tools: web, file, memory','version: 1.8.0','---','','# inbox-triage','',
  '## Steps','1. Fetch unread since the last run, cap 40.',
  '2. Group by sender and thread.','3. Draft replies in the user’s voice, no greeting.',
  '4. Escalate money, contracts and legal dates.','',
  '```bash','hermes skills run inbox-triage --account support@ --limit 40','```',
].join('\n');

const LOG_GATEWAY = [
  '2026-11-19T09:12:04Z INFO  gateway started pid=1020 profile=default',
  '2026-11-19T09:12:04Z INFO  dashboard listening on 127.0.0.1:9119',
  '2026-11-19T09:12:05Z INFO  api listening on 127.0.0.1:8642',
  '2026-11-19T09:12:05Z INFO  state.db opened (wal) holders=1',
  '2026-11-19T09:14:31Z INFO  turn t-ui model=claude-sonnet-5-5 tokens=18420',
  '2026-11-19T09:16:02Z WARN  heartbeat gap 4.2s (last=09:15:57)',
  '2026-11-19T09:16:07Z INFO  heartbeat resumed gap=4.2s',
  '2026-11-19T09:41:55Z INFO  turn t-gw state=waiting approval="gateway restart"',
  '2026-11-19T10:02:10Z INFO  curator run start skills=34 facts=12',
  '2026-11-19T10:02:14Z INFO  curator proposal merge backup-verify verify-backup overlap=0.84',
  '2026-11-19T10:02:14Z INFO  curator pinned writing-voice uses=9',
  '2026-11-19T10:02:15Z INFO  curator run done proposals=1 pinned=1 merged=0',
  '2026-11-19T10:20:44Z INFO  mcp test github tools=8 ok=8 latency=212ms',
  '2026-11-19T10:21:02Z WARN  mcp test linear status=401 token_expired=3d',
  '2026-11-19T10:21:02Z INFO  tools lost=5 server=linear action=needs_you',
].join('\n');

const LOG_CURATOR = [
  '2026-11-18T04:00:02Z run start skills=33 facts=11',
  '2026-11-18T04:00:05Z prune candidate backlog-triage last_used=41d',
  '2026-11-18T04:00:05Z kept backlog-triage reason=pinned_by_user',
  '2026-11-18T04:00:07Z merge proposal backup-verify + verify-backup overlap=0.84',
  '2026-11-18T04:00:08Z pin writing-voice uses_7d=9',
  '2026-11-18T04:00:08Z run done skills=33 facts=11 changes=2',
  '2026-11-19T10:02:10Z run start skills=34 facts=12',
  '2026-11-19T10:02:14Z merge proposal backup-verify + verify-backup overlap=0.84',
  '2026-11-19T10:02:15Z run done skills=34 facts=12 changes=1',
].join('\n');

const CRON_BACKUP = [
  'id: backup-verify','schedule: "30 2 * * *"','timezone: UTC',
  'skill: backup-verify','deliver: telegram','on_failure: notify',
  'command: hermes backup run --keep 14d && hermes backup verify --latest',
].join('\n');
const CRON_COST = [
  'id: cost-report','schedule: "0 9 * * 1"','timezone: UTC','agent: ledger',
  'skill: cost-report','deliver: telegram','on_failure: retry(2)',
  'command: hermes insights cost --range 7d --format brief',
].join('\n');

const PLUGIN_JSON = [
  '{','  "name": "browser-use",','  "version": "2.5.0",','  "entry": "plugin.py",',
  '  "tools": ["browser_navigate", "browser_click", "browser_screenshot"],',
  '  "requires": ["chromium-cdp:131"]','}',
].join('\n');

const ROOTS = [
  {id:'hermes', label:'~/.hermes', defaultSel:'SOUL.md', expanded:['memories','skills','cron','logs'], tree:[
    {name:'SOUL.md', content:SOUL_TEXT},
    {name:'config.yaml', content:CONFIG_TEXT},
    {name:'memories', type:'dir', children:[
      {name:'MEMORY.md', content:MEMORY_MD},
      {name:'USER.md', content:USER_MD},
      {name:'facts.jsonl', content:FACTS_JSONL},
    ]},
    {name:'skills', type:'dir', children:[
      {name:'web-research', type:'dir', children:[{name:'SKILL.md', content:SKILL_WEB_MD}]},
      {name:'gateway-debugging', type:'dir', children:[{name:'SKILL.md', content:SKILL_GATEWAY_MD}]},
      {name:'inbox-triage', type:'dir', children:[{name:'SKILL.md', content:SKILL_INBOX_MD}]},
    ]},
    {name:'cron', type:'dir', children:[
      {name:'backup-verify.yaml', content:CRON_BACKUP},
      {name:'cost-report.yaml', content:CRON_COST},
    ]},
    {name:'logs', type:'dir', children:[
      {name:'gateway.log', content:LOG_GATEWAY},
      {name:'curator.log', content:LOG_CURATOR},
    ]},
    {name:'plugins', type:'dir', children:[
      {name:'browser-use', type:'dir', children:[{name:'plugin.json', content:PLUGIN_JSON}]},
    ]},
    {name:'vault', type:'dir', children:[
      {name:'keys.enc', secret:true, size:'1 KB'},
    ]},
    {name:'.env', secret:true, size:'2 KB'},
    {name:'auth.json', secret:true, size:'4 KB'},
    {name:'state.db', binary:true, size:'84 MB'},
    {name:'kanban.db', binary:true, size:'212 KB'},
  ]},
  {id:'maint', label:'~/hermes-maintenance', defaultSel:'CLAUDE.md', expanded:['docs','prototype','ui-redesign'], tree:[
    {name:'CLAUDE.md', content:'# Hermes maintenance\n\nHermes Agent lives in ~/.hermes. Gateway is the canonical state.db writer.\nBack up before mutating. Quiesce before repair.\n'},
    {name:'README.md', content:'# hermes-maintenance\n\nDiagnosis notes and the UI redesign prototype.\n\n- docs/ · distilled wiki\n- prototype/ · static redesign, no build step\n'},
    {name:'docs', type:'dir', children:[
      {name:'index.md', content:'# Docs index\n\n- skills/enforcing-zero-process-barrier.md\n- skills/triaging-hermes-health.md\n- concepts/operational-invariants.md\n'},
      {name:'log.md', content:'## 2026-11-18\n- Backup drill passed (214 MB, 3,912 files).\n- Gateway restart protocol verified.\n'},
    ]},
    {name:'prototype', type:'dir', children:[
      {name:'index.html', content:'<title>Hermes</title>\n<link rel="stylesheet" href="css/base.css">\n<div id="app"></div>\n<script src="js/shell.js"></script>\n'},
      {name:'js', type:'dir', children:[
        {name:'views', type:'dir', children:[
          {name:'library.js', content:'/* Library view · skills, memory, tools, files. */\n(function(){\n  const H = window.H;\n  H.views.library = { render(root, ctx){ /* ... */ } };\n})();\n'},
        ]},
      ]},
      {name:'css', type:'dir', children:[
        {name:'library.css', content:'/* library view styles · prefix every class with .library- */\n'},
      ]},
    ]},
    {name:'ui-redesign', type:'dir', children:[
      {name:'WORKER-CONTRACT.md', content:'# Worker contract\n\nOwn js/views/<name>.js and css/<name>.css. No other edits.\nReuse base.css components and tokens. Verify with node --check.\n'},
    ]},
    {name:'backups', type:'dir', children:[{name:'2026-11-18.zip', binary:true, size:'214 MB'}]},
  ]},
  {id:'mail', label:'~/atomicmail', defaultSel:'README.md', expanded:['src','migrations'], tree:[
    {name:'README.md', content:'# atomicmail\n\nIMAP triage for the support inbox. Limits: 40 messages per run.\n'},
    {name:'package.json', content:'{\n  "name": "atomicmail",\n  "private": true,\n  "type": "module",\n  "scripts": { "test": "node --test", "dev": "tsx src/server.ts" }\n}\n'},
    {name:'src', type:'dir', children:[
      {name:'imap.ts', content:'import { ImapFlow } from "imapflow";\n\nexport async function connect(user: string, pass: string) {\n  const client = new ImapFlow({ host: "127.0.0.1", port: 993, secure: true, auth: { user, pass } });\n  await client.connect();\n  return client;\n}\n'},
      {name:'triage.ts', content:'export type Bucket = "reply" | "archive" | "needs-you";\n\nexport function sort(message: { subject: string; from: string }): Bucket {\n  if (/invoice|contract|legal/i.test(message.subject)) return "needs-you";\n  return "reply";\n}\n'},
      {name:'server.ts', content:'import { connect } from "./imap.js";\n\nconst client = await connect(process.env.IMAP_USER!, process.env.IMAP_PASS!);\nconsole.log("connected", client.mailbox?.path);\n'},
    ]},
    {name:'migrations', type:'dir', children:[
      {name:'0001_init.sql', content:'create table messages (\n  id text primary key,\n  thread_id text not null,\n  bucket text not null check (bucket in (\'reply\',\'archive\',\'needs-you\')),\n  learned_at timestamptz not null default now()\n);\n'},
    ]},
    {name:'.env', secret:true, size:'1 KB'},
  ]},
];

/* -------------------------------------------------------------- state */
const state = {
  root:null, ctx:null, tab:'skills', q:'', browse:'installed',
  skill:'web-research', attached:new Set(), disabled:new Set(),
  pinned:new Set(SKILLS.filter(s => s.pinned).map(s => s.id)),
  hubInstalled:new Set(), applied:new Set(), proposal:true, curatorRan:false,
  soul:SOUL_TEXT, soulDraft:SOUL_TEXT, preview:false,
  provider:'built-in', memories:MEMORIES.map(m => Object.assign({}, m)),
  journeyFilter:'all', scope:'hermes',
  scopes:{}, mcp:MCP_SEED.map(s => Object.assign({}, s, {tools:s.tools.map(t => Object.assign({}, t))})),
  plugins:PLUGIN_SEED.map(p => Object.assign({}, p)),
  hooks:HOOK_SEED.map(x => Object.assign({}, x)),
  expandedMcp:null, fileRoot:'hermes', fileSel:'SOUL.md',
  expanded:{hermes:new Set(ROOTS[0].expanded)},
};
Object.keys(SCOPE_DEFAULTS).forEach(k => { state.scopes[k] = new Set(SCOPE_DEFAULTS[k]); });
const expandedFor = id => {
  const r = ROOTS.find(x => x.id === id);
  if (!state.expanded[id]) state.expanded[id] = new Set(r ? r.expanded : []);
  return state.expanded[id];
};
let filterActive = () => {};

/* ---------------------------------------------------------- live layer
   Real Hermes data. Every loader keeps the last payload in `live`; every
   mutation calls the endpoint the old dashboard used and rolls the UI back
   on failure. Nothing here runs when H.live === false. */
const live = {
  profile: () => H.api.profile || 'default',
  skills: null, skillsErr: null, curator: null,
  hub: null, hubErr: null, hubBusy: new Set(),
  memories: null, memoriesErr: null, memStatus: null, memStatusErr: null,
  soul: '', soulSaved: '', soulErr: null, soulExists: true,
  journey: null, journeyErr: null,
  toolsets: null, toolsetsErr: null, mcp: null, mcpErr: null, mcpTested: {},
  plugins: null, pluginsErr: null, hooks: null, hooksErr: null,
  files: { path: '~/.hermes', entries: null, err: null, sel: null, doc: null, docErr: null, secret: false },
  pending: {},
};
const MEM_PATH = '~/.hermes/memories/MEMORY.md';

function liveErr(err, retry, what){
  return h('div.library-nores.library-liveerr',
    h('div', 'Couldn’t load ' + (what || 'this tab') + ': ' + ((err && err.message) || 'unknown error')),
    retry ? h('button.btn.sm', {onclick:retry}, 'Retry') : null);
}
function liveEmpty(text){ return h('div.library-nores', text); }
function liveLoad(text){ return h('div.library-nores.library-livepad', text || 'Loading…'); }
function debounce(fn, ms){
  let t = 0;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}
function fmtAgo(iso){
  if (!iso) return 'never';
  const t = typeof iso === 'number' ? iso * 1000 : new Date(iso).getTime();
  if (!isFinite(t)) return 'never';
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 90) return 'just now';
  if (s < 5400) return Math.round(s/60) + 'm ago';
  if (s < 172800) return Math.round(s/3600) + 'h ago';
  return Math.round(s/86400) + 'd ago';
}
function fmtDay(ts){
  const d = new Date((typeof ts === 'number' ? ts : 0) * 1000);
  return d.toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'});
}
function fmtBytes(n){
  if (n == null) return '–';
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n/1024).toFixed(n < 10240 ? 1 : 0) + ' KB';
  return (n/1048576).toFixed(1) + ' MB';
}
function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }
/* Background actions (skills install, curator) report through /api/actions/{name}/status. */
async function pollAction(name, tries){
  if (!name) return null;
  for (let i = 0; i < (tries || 40); i++){
    await sleep(1200);
    let st;
    try { st = await H.api.get('/api/actions/' + encodeURIComponent(name) + '/status'); }
    catch (e){ if (e.status === 404) return null; throw e; }
    if (!st || st.running === false) return st;
  }
  return null;
}
function lastLine(st){
  const lines = st && Array.isArray(st.lines) ? st.lines.filter(Boolean) : [];
  return lines.length ? String(lines[lines.length - 1]) : '';
}
function srcLabel(prov){
  return prov === 'hub' ? 'Hub' : prov === 'bundled' ? 'Built-in' : prov === 'external' ? 'External' : 'Mine';
}
function parseFacts(text){
  return String(text || '').split(/\s*§\s*/).map(x => x.trim()).filter(Boolean);
}
async function writeFacts(entries){
  const content = entries.length ? entries.join('\n§\n') + '\n' : '';
  await H.api.post('/api/fs/write-text', {path: MEM_PATH, content});
}


/* ------------------------------------------------------------ helpers */
const toast = m => { if (state.ctx && state.ctx.toast) state.ctx.toast(m); else H.toast(m); };
function pill(text, tone){ return H.pill(text, tone || ''); }function mcpToolCount(){
  return state.mcp.reduce((n, s) => n + (s.status === 'connected' ? s.tools.filter(t => t.on).length : 0), 0);
}
function toolCount(){
  const set = state.scopes[state.scope];
  return TOOLSETS.reduce((n, t) => n + (set.has(t.id) ? (t.id === 'mcp' ? mcpToolCount() : t.tools) : 0), 0);
}
function scopeSummary(){
  const set = state.scopes[state.scope];
  return set.size + ' of 12 toolsets on · ' + toolCount() + ' tools available to ' + scopeLabel[state.scope];
}
function hiddenAttr(el, yes){ if (yes) el.setAttribute('hidden',''); else el.removeAttribute('hidden'); }
function num(v){ return h('span.num', String(v)); }
function emptyRow(text){ return h('div.library-nores', text); }

/* --------------------------------------- collapsible categories (shared)
   One accordion for the Plugins list, the Skills list and the Hub results.
   The category always comes from the data: a skill's `category`, a plugin's
   install folder, a hub entry's `cat`. Anything without one lands in Other;
   nothing is invented here. Open state lives in localStorage per category,
   search force-opens matching sections, the height animates on --ease-out. */
const CAT_LABELS = {
  browser:'Browser', web:'Web', platforms:'Platforms', image_gen:'Image generation',
  video_gen:'Video generation', dashboard_auth:'Dashboard auth', cron_providers:'Cron providers',
  delegation:'Delegation', memory:'Memory', context_engine:'Context engine',
  config_backends:'Config backends', computer_use:'Computer use', kanban:'Kanban',
  'autonomous-ai-agents':'Autonomous AI agents',
};
function catLabel(key){
  const k = String(key || '');
  if (CAT_LABELS[k]) return CAT_LABELS[k];
  const s = k.replace(/[_-]+/g, ' ').trim();
  if (!s) return 'Other';
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function catStore(key){
  let map = {};
  try { map = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (e){ map = {}; }
  return {
    get(k){ return Object.prototype.hasOwnProperty.call(map, k) ? !!map[k] : null; },
    set(k, v){ map[k] = !!v; try { localStorage.setItem(key, JSON.stringify(map)); } catch (e){} },
  };
}
function reducedMotion(){
  return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}
let groupSeq = 0;
function animateHeight(box, open, animate){
  box.style.overflow = 'hidden';
  const seq = (box._openSeq = (box._openSeq || 0) + 1);
  if (!animate || reducedMotion()){
    box.style.transition = 'none';
    box.style.height = open ? 'auto' : '0px';
    void box.offsetHeight;
    box.style.transition = '';
    return;
  }
  box.style.transition = 'none';
  box.style.height = (open ? 0 : box.scrollHeight) + 'px';
  void box.offsetHeight;                       /* reflow, so the next height animates */
  box.style.transition = '';
  box.style.height = (open ? box.scrollHeight : 0) + 'px';
  if (open) box.addEventListener('transitionend', function done(ev){
    if (ev.propertyName !== 'height') return;
    box.removeEventListener('transitionend', done);
    if (seq === box._openSeq && box.style.height !== '0px') box.style.height = 'auto';
  });
}
function collapsibleGroups(cfg){
  const store = catStore(cfg.storeKey);
  const root = h('div.library-groups', cfg.cls ? {class:cfg.cls} : {});
  const secs = [];
  (cfg.groups || []).forEach(g => {
    const items = (g.items || []).filter(it => it && it.el);
    if (!items.length) return;
    const saved = store.get(g.key);
    const persisted = saved == null ? !!g.defaultOpen : saved;
    if (saved == null) store.set(g.key, persisted);   /* keep the first view stable */
    const gid = 'library-group-' + (++groupSeq);
    const body = h('div.library-groupbody', {id:gid});
    const inner = h('div.library-groupin');
    if (cfg.wrap) inner.append(cfg.wrap(items));
    else items.forEach(it => inner.append(it.el));
    body.append(inner);
    const countText = String(g.count != null ? g.count : items.length);
    const onNow = items.filter(it => it.enabled ? it.enabled() : false).length;
    const metaCount = h('span.library-gmeta', countText);
    const metaOn = g.onCount === false ? null : h('span.library-gmeta', (g.onCount != null ? g.onCount : onNow) + ' on');
    const head = h('button.library-grouphead', {'aria-expanded':'false', 'aria-controls':gid, 'data-group':g.key},
      h('span.library-gchev', H.ic('chev','sm')),
      h('span.library-gname', g.label),
      h('span.library-gdot','·'), metaCount,
      metaOn ? h('span.library-gdot','·') : null, metaOn,
      h('span.grow'));
    const el = h('div.library-group', {'data-group':g.key, 'data-open':String(persisted)}, head, body);
    const sec = {key:g.key, el, head, body, inner, items, persisted, open:persisted, metaCount, metaOn};
    head.addEventListener('click', () => {
      sec.persisted = !sec.open;
      store.set(g.key, sec.persisted);
      paint(sec, sec.persisted, true);
    });
    paint(sec, persisted, false);
    root.append(el);
    secs.push(sec);
  });
  function paint(sec, open, animate){
    sec.open = !!open;
    sec.head.setAttribute('aria-expanded', String(!!open));
    sec.el.setAttribute('data-open', String(!!open));
    sec.inner.inert = !open;                    /* collapsed rows stay out of the tab order */
    sec.inner.setAttribute('aria-hidden', String(!open));
    animateHeight(sec.body, !!open, animate);
  }
  function applySearch(q){
    let total = 0;
    secs.forEach(sec => {
      if (!q){
        sec.el.hidden = false;
        sec.items.forEach(it => { it.el.hidden = false; });
        total += sec.items.length;
        paint(sec, sec.persisted, false);
        return;
      }
      let n = 0;
      sec.items.forEach(it => {
        const hit = !it.search || it.search.includes(q);
        it.el.hidden = !hit;
        if (hit) n++;
      });
      sec.el.hidden = n === 0;
      if (n) paint(sec, true, false);
      total += n;
    });
    return total;
  }
  function refreshCounts(){
    secs.forEach(sec => {
      sec.metaCount.textContent = String(sec.items.length);
      if (sec.metaOn) sec.metaOn.textContent = sec.items.filter(it => it.enabled && it.enabled()).length + ' on';
    });
  }
  return {el:root, applySearch, refreshCounts, sections:secs};
}
/* A plugin's real kind: the thing it plugs into, i.e. its folder under plugins/.
   ~/.hermes/plugins/<name> and top-level bundled plugins have none → Other. */
function pluginCategory(p){
  if (p.kind) return p.kind;
  const parts = String(p.path || '').split(/[\\/]+/).filter(Boolean);
  if (parts.length < 2) return '';
  const parent = parts[parts.length - 2];
  return parent === 'plugins' ? '' : parent;
}
function pluginCategoryGroups(list){
  const by = new Map();
  list.forEach(p => {
    const key = pluginCategory(p) || 'other';
    if (!by.has(key)) by.set(key, []);
    by.get(key).push(p);
  });
  return Array.from(by.keys())
    .sort((a, b) => (a === 'other') - (b === 'other') || catLabel(a).localeCompare(catLabel(b)))
    .map(key => ({key, label:catLabel(key), rows:by.get(key)}));
}
function skillCategoryGroups(list){
  const by = new Map();
  list.forEach(s => {
    const key = String(s.category || s.cat || '').trim() || 'other';
    if (!by.has(key)) by.set(key, []);
    by.get(key).push(s);
  });
  return Array.from(by.keys()).sort((a, b) => (a === 'other') - (b === 'other') || catLabel(a).localeCompare(catLabel(b)))
    .map(key => ({key, label:catLabel(key), rows:by.get(key)}));
}
function skillCatKey(s){ return String((s && (s.category || s.cat)) || '').trim() || 'other'; }
/* The skills list keeps its left/right split; only the list column is grouped. */
function skillGroupsCtl(opts){
  const groups = skillCategoryGroups(opts.list);
  const first = groups.length ? groups[0].key : 'other';
  return collapsibleGroups({
    storeKey:'hermes.library.skills.open',
    groups: groups.map(g => ({
      key:g.key, label:g.label, count:g.rows.length,
      defaultOpen: g.key === (opts.openKey || first),
      items: g.rows.map(s => ({el:opts.row(s), search:opts.search(s),
        enabled: opts.enabled ? () => opts.enabled(s) : null})),
    })),
  });
}

/* -------------------------------------------------------------- shell */
function pageEl(){
  const page = h('div.page.library-page');
  const inn = h('div.library-in');
  inn.append(headEl(), tabsEl(), contentEl());
  page.append(inn);
  return page;
}
function headEl(){
  const place = {skills:'Search skills…', memory:'Search memories…', tools:'Search tools, MCP, plugins…', files:'Search files…'}[state.tab];
  const input = h('input.input.library-searchinput', {type:'search', placeholder:place, value:state.q, 'aria-label':'Search '+state.tab,
    oninput:e => { state.q = e.target.value.trim().toLowerCase(); filterActive(state.q); }});
  return h('div.page-head.library-head',
    h('div.library-headmain',
      h('h1','Library'),
      h('p','Everything Hermes knows and can reach on this machine · skills, memory, tools and the home folder.')),
    h('div.grow'),
    h('div.library-search', H.ic('search','sm'), input));
}
function tabsEl(){
  const bar = H.tabs(TABS, state.tab, id => setTab(id));
  bar.setAttribute('aria-label','Library sections');
  return h('div.library-tabsbar', bar);
}
function setTab(id){
  if (!TABS.some(t => t.id === id)) return;
  state.tab = id; state.q = ''; state.browse = state.browse || 'installed';
  history.replaceState(null, '', '#/library/' + id);
  draw();
}
function draw(){
  const prev = state.root.querySelector('.library-page');
  const top = prev ? prev.scrollTop : 0;
  state.root.replaceChildren(pageEl());
  const next = state.root.querySelector('.library-page');
  if (next && top) next.scrollTop = top;
  if (state.q && filterActive) filterActive(state.q);
}
function refreshTab(){
  history.replaceState(null, '', '#/library/' + state.tab);
  draw();
}
function contentEl(){
  if (state.tab === 'memory') return buildMemory();
  if (state.tab === 'tools') return buildTools();
  if (state.tab === 'files') return buildFiles();
  return buildSkills();
}

/* ------------------------------------------------------------- skills */
function buildSkills(){
  if (LIVE) return buildSkillsLive();
  const wrap = h('div.library-skills');
  let skillsCtl = null, hubCtl = null;
  const summary = h('div.library-summary');
  const summaryText = () => {
    const installed = 34 + state.hubInstalled.size;
    const hub = 6 + state.hubInstalled.size;
    return [num(installed), ' installed · ', num(hub), ' from the hub · ',
      state.curatorRan ? 'curator ran just now' : 'curator last ran 2h ago'];
  };
  summary.append.apply(summary, summaryText());
  const run = h('button.btn.primary', {onclick:() => {
    if (run.disabled) return;
    run.disabled = true; run.textContent = 'Curating…';
    setTimeout(() => {
      if (!run.isConnected) return;
      run.disabled = false; run.textContent = 'Run curator';
      state.curatorRan = true;
      summary.replaceChildren.apply(summary, summaryText());
      state.proposal = true;
      refreshTab();
      toast('Curator finished · 1 merge proposed, 2 skills pinned');
    }, 900);
  }}, 'Run curator');
  const bar = h('div.library-bar', summary, h('div.grow'), run);

  const seg = H.seg([{id:'installed',label:'Installed'},{id:'hub',label:'Hub'},{id:'bundles',label:'Bundles'}], state.browse, id => {
    state.browse = id; buildBody(); if (state.q) filterActive(state.q);
  });
  seg.setAttribute('aria-label','Browse the hub');
  const segRow = h('div.library-segrow', h('span.library-seglabel','Browse the hub'), seg);

  const body = h('div.library-bodyslot');
  wrap.append(bar, segRow, body);

  function buildBody(){
    body.replaceChildren();
    if (state.browse === 'hub') { body.append(hubGrid()); filterActive = filterHub; }
    else if (state.browse === 'bundles') { body.append(bundleGrid()); filterActive = filterBundles; }
    else { body.append(installedView()); filterActive = filterInstalled; }
  }

  function installedView(){
    const holder = h('div');
    if (state.proposal) holder.append(proposalCard());
    const split = h('div.library-split');
    const list = h('div.library-list', {role:'list', 'aria-label':'Installed skills'});
    const sorted = SKILLS.slice().sort((a,b) => {
      const pa = state.pinned.has(a.id) ? 1 : 0, pb = state.pinned.has(b.id) ? 1 : 0;
      return (pb - pa) || (b.uses - a.uses);
    });
    skillsCtl = skillGroupsCtl({
      list: sorted,
      openKey: skillCatKey(currentSkill()),
      row: skillRow,
      search: s => (s.name + ' ' + s.desc + ' ' + s.source + ' ' + s.cat).toLowerCase(),
      enabled: s => !state.disabled.has(s.id),
    });
    list.append(skillsCtl.el);
    const detail = h('div.library-detail');
    detail.append(detailContent(currentSkill()));
    split.append(list, detail);
    holder.append(split, h('div.library-listfoot',
      h('span', '34 installed · 17 built-in, 11 yours, 6 from the hub'),
      h('span.faint', 'Pinned skills stay in context between turns')));
    holder.append(h('div.library-nores', {hidden:true}, 'No installed skills match that search.'));
    return holder;
  }

  function proposalCard(){
    const card = h('div.library-proposal',
      h('span.library-proposalicon', H.ic('sparkle','sm')),
      h('div.grow',
        h('div.library-proposaltitle','Merge 2 near-duplicate skills'),
        h('div.library-proposalsub','backup-verify and verify-backup overlap 84%. The curator keeps the pinned description and folds in 6 steps. Proposed 2h ago.')),
      h('button.btn.sm', {onclick:reviewMerge}, 'Review'),
      h('button.btn.ghost.sm', {onclick:() => { card.remove(); state.proposal = false; toast('Proposal dismissed · the curator will retry in 6h'); }}, 'Dismiss'));
    return card;
  }

  function skillRow(s){
    const isPinned = state.pinned.has(s.id);
    const enabled = !state.disabled.has(s.id);
    const row = h('div.library-skill', {'data-id':s.id,
      'data-search':(s.name+' '+s.desc+' '+s.source).toLowerCase(),
      'aria-current':String(s.id === state.skill)});
    const open = h('button.library-skill-open', {onclick:() => selectSkill(s.id), 'aria-label':'Open '+s.name},
      h('div.library-skill-top', h('span.library-sname', s.name), pill(s.source)),
      h('div.library-skill-desc', s.desc),
      h('div.library-skill-meta', 'used ', h('span.num', String(s.uses)), '× this month',
        isPinned ? h('span.library-pindot', ' · pinned') : null));
    const pin = h('button.library-pin', {'aria-pressed':String(isPinned), 'aria-label':(isPinned?'Unpin ':'Pin ')+s.name,
      title:isPinned?'Unpin':'Pin to context',
      onclick:() => {
        if (state.pinned.has(s.id)) { state.pinned.delete(s.id); toast('Unpinned '+s.name); }
        else { state.pinned.add(s.id); toast('Pinned '+s.name+' · stays in context'); }
        refreshTab();
      }}, H.ic('pin','sm'));
    const sw = H.sw(enabled, v => {
      if (v) { state.disabled.delete(s.id); toast(s.name+' enabled'); }
      else { state.disabled.add(s.id); toast(s.name+' disabled · stays installed'); }
      if (skillsCtl) skillsCtl.refreshCounts();
    }, s.name+' enabled');
    row.append(open, h('div.library-skill-ctl', pin, sw));
    return row;
  }

  function selectSkill(id){
    state.skill = id;
    state.root.querySelectorAll('.library-skill').forEach(n => n.setAttribute('aria-current', String(n.dataset.id === id)));
    const detail = state.root.querySelector('.library-detail');
    if (detail) detail.replaceChildren(detailContent(currentSkill()));
  }

  function detailContent(s){
    const header = h('div.library-detail-h',
      h('div.grow',
        h('div.library-detail-title', h('h3', s.name), pill(s.source)),
        h('div.library-detail-meta',
          h('span','SKILL.md'), h('span.library-dotsep','·'),
          h('span','updated '+s.updated), h('span.library-dotsep','·'),
          h('span','used '), num(s.uses), h('span','× this month'))),
      h('div.library-detail-actions',
        attachBtn(s),
        h('button.btn.sm', {onclick:() => editSkill(s)}, 'Edit'),
        h('button.btn.ghost.sm', {onclick:() => toggleDisable(s)}, state.disabled.has(s.id) ? 'Enable' : 'Disable')));
    return h('div.library-detail-inner', header, skillDoc(s));
  }

  function attachBtn(s){
    const attached = state.attached.has(s.id);
    const b = h('button.btn.sm', {'aria-pressed':String(attached), onclick:() => {
      if (state.attached.has(s.id)) { state.attached.delete(s.id); b.textContent = 'Attach to this thread'; toast('Detached '+s.name); }
      else { state.attached.add(s.id); b.textContent = 'Attached'; toast('Attached '+s.name+' · 1.8k tokens'); }
      b.setAttribute('aria-pressed', String(state.attached.has(s.id)));
    }}, attached ? 'Attached' : 'Attach to this thread');
    return b;
  }

  function toggleDisable(s){
    if (state.disabled.has(s.id)) { state.disabled.delete(s.id); toast(s.name+' enabled'); }
    else { state.disabled.add(s.id); toast(s.name+' disabled · still on disk'); }
    refreshTab();
  }

  function skillDoc(s){
    const md = h('div.library-md');
    const b = h('div.library-md-body');
    const front = ['---','name: '+s.name,'description: '+s.desc,'version: '+s.version,'updated: '+s.updated,'---'].join('\n');
    b.append(h('pre.library-front', front));
    b.append(h('h2','When to use'), h('p', s.when || s.desc));
    b.append(h('h2','Steps'));
    const ol = h('ol.library-steps');
    s.steps.forEach(t => ol.append(h('li', t)));
    b.append(ol);
    if (s.cmd){
      b.append(h('h2','Verify'));
      b.append(h('div.library-preblock',
        h('div.library-prehead', h('span','bash'), h('span.faint','run from the project root')),
        h('pre.library-pre', h('code', s.cmd))));
    }
    b.append(h('h2','Notes'), h('p', s.notes || 'Read-only by default. Ask before writing outside the project root; every write leaves a diff in the thread.'));
    b.append(h('div.library-docfoot',
      h('span','Loaded only when relevant · '), num(1200 + s.name.length * 43), h('span',' tokens'),
      h('span.library-dotsep','·'),
      h('span', state.pinned.has(s.id) ? 'Pinned, so it stays between turns' : 'Not pinned')));
    md.append(b);
    return md;
  }

  function editSkill(s){
    const value = [
      '---','name: '+s.name,'description: '+s.desc,'version: '+s.version,'---','',
      '# '+s.name,'',s.when || s.desc,'','## Steps',
      s.steps.map((t,i) => (i+1)+'. '+t).join('\n'),'','## Verify','```bash',s.cmd,'```','','## Notes',s.notes || '',
    ].join('\n');
    const ta = h('textarea.textarea.library-editor', {'aria-label':'SKILL.md source'}, value);
    const m = H.modal(h('div.library-modal',
      h('div.library-modal-h', h('h3','Edit '+s.name),
        h('button.btn.ghost.icon.sm', {'aria-label':'Close', onclick:() => m.close()}, H.ic('x','sm'))),
      h('p.library-modalsub','SKILL.md is plain text. Saving re-indexes the skill for new turns; running threads keep the old copy.'),
      ta,
      h('div.library-modalfoot',
        h('span.faint','~/.hermes/skills/'+s.name+'/SKILL.md'),
        h('div.grow'),
        h('button.btn.ghost', {onclick:() => m.close()}, 'Cancel'),
        h('button.btn.primary', {onclick:() => {
          if (!ta.value.trim()){ ta.classList.add('library-invalid'); return; }
          m.close(); toast('Saved SKILL.md · curator re-indexes in 2m');
        }}, 'Save skill'))), {width:720});
  }

  function reviewMerge(){
    const m = H.modal(h('div.library-modal',
      h('div.library-modal-h', h('h3','Merge 2 skills'),
        h('button.btn.ghost.icon.sm', {'aria-label':'Close', onclick:() => m.close()}, H.ic('x','sm'))),
      h('p.library-modalsub','The curator would keep backup-verify and fold in 6 steps from verify-backup. Pins, hub installs and running threads are untouched.'),
      h('div.library-compare',
        h('div.library-comparecol', h('div.library-comparehead', pill('Keep'), h('b','backup-verify')),
          h('p','Checks state.db, -wal and -shm in a scratch directory.'), h('span.faint','used 8× this month · pinned description')),
        h('div.library-comparecol', h('div.library-comparehead', pill('Fold in'), h('b','verify-backup')),
          h('p','Compares a zip against its manifest. 6 steps overlap with the skill on the left.'), h('span.faint','used 2× this month · last used 19 days ago'))),
      h('div.library-modalfoot',
        h('span.faint','A merge is reversible for 30 days'),
        h('div.grow'),
        h('button.btn.ghost', {onclick:() => m.close()}, 'Keep both'),
        h('button.btn.primary', {onclick:() => { m.close(); state.proposal = false; refreshTab(); toast('Merged 2 skills · backup-verify updated'); }}, 'Merge skills'))), {width:640});
  }

  function hubGrid(){
    const holder = h('div');
    const cats = [];
    HUB.forEach(x => { if (!cats.some(c => c.cat === x.cat)) cats.push({cat:x.cat}); });
    hubCtl = collapsibleGroups({
      storeKey:'hermes.library.hub.open',
      cls:'library-hubgroups',
      groups: cats.map(c => ({
        key:c.cat || 'other', label:catLabel(c.cat || 'other'), defaultOpen:true,
        onCount:false,
        items: HUB.filter(x => (x.cat || 'other') === (c.cat || 'other')).map(x => ({el:hubCard(x), search:(x.name + ' ' + x.desc + ' ' + (x.cat || '')).toLowerCase()})),
      })),
      wrap: items => h('div.library-hubgrid', items.map(it => it.el)),
    });
    holder.append(h('div.library-hubhead',
      h('div', h('h2','Hub'), h('p','Reviewed skills you can install with one click. Pinned after 8 uses.')),
      h('span.faint','10 skills · updated this week')),
      hubCtl.el, h('div.library-nores','No hub skills match that search.'));
    return holder;
  }
  function hubCard(x){
    const installed = state.hubInstalled.has(x.name);
    const btn = h('button.btn.sm', installed ? {disabled:true} : {onclick:() => {
      state.hubInstalled.add(x.name); btn.textContent = 'Installed'; btn.disabled = true;
      summary.replaceChildren.apply(summary, summaryText());
      toast('Installed '+x.name+' · tools available next turn');
    }}, installed ? 'Installed' : 'Install');
    return h('div.library-hubcard', {'data-search':(x.name+' '+x.desc+' '+x.cat).toLowerCase()},
      h('div.library-hubtop', h('div', h('div.library-hubname', x.name), h('div.library-hubcat', x.cat)), btn),
      h('p.library-hubdesc', x.desc),
      h('div.library-hubmeta', x.meta));
  }
  function bundleGrid(){
    const holder = h('div');
    const grid = h('div.library-bundles');
    BUNDLES.forEach(b => {
      const applied = state.applied.has(b.name);
      const btn = h('button.btn.sm', applied ? {disabled:true} : {onclick:() => {
        state.applied.add(b.name); btn.textContent = 'Applied'; btn.disabled = true;
        toast('Applied “'+b.name+'” to Hermes · 0 conflicts');
      }}, applied ? 'Applied' : 'Apply');
      grid.append(h('div.library-bundle', {'data-search':(b.name+' '+b.desc+' '+b.members.join(' ')).toLowerCase()},
        h('div.library-hubtop', h('div', h('div.library-hubname', b.name), h('div.library-hubcat', b.fit)), btn),
        h('p.library-hubdesc', b.desc),
        h('div.library-members', b.members.map(n => h('span.library-member', n))),
        h('div.library-hubmeta', b.members.length+' skills · no dependencies')));
    });
    holder.append(h('div.library-hubhead',
      h('div', h('h2','Bundles'), h('p','Prepared sets for a kind of work. Applying a bundle turns its skills on; nothing is installed twice.')),
      h('span.faint','3 bundles · 14 skills')), grid,
      h('div.library-nores','No bundles match that search.'));
    return holder;
  }

  function filterInstalled(q){
    const n = skillsCtl ? skillsCtl.applySearch(q) : wrap.querySelectorAll('.library-skill:not([hidden])').length;
    const nr = wrap.querySelector('.library-nores');
    if (nr) nr.hidden = n > 0;
  }
  function filterHub(q){
    const n = hubCtl ? hubCtl.applySearch(q) : 0;
    const nr = wrap.querySelector('.library-nores'); if (nr) nr.hidden = n > 0;
  }
  function filterBundles(q){
    const items = wrap.querySelectorAll('.library-bundle'); let n = 0;
    items.forEach(el => { const hit = !q || el.dataset.search.includes(q); el.hidden = !hit; if (hit) n++; });
    const nr = wrap.querySelector('.library-nores'); if (nr) nr.hidden = n > 0;
  }
  function filterSkills(q){
    if (state.browse === 'hub') filterHub(q);
    else if (state.browse === 'bundles') filterBundles(q);
    else filterInstalled(q);
  }

  buildBody();
  filterActive = filterSkills;
  return wrap;
}

function currentSkill(){ return SKILLS.find(s => s.id === state.skill) || SKILLS[0]; }

/* ------------------------------------------------------------- memory */
function buildMemory(){
  if (LIVE) return buildMemoryLive();
  const wrap = h('div.library-memorywrap');
  const grid = h('div.library-memory');
  const facts = h('div.library-facts');
  const factsNone = h('div.library-nores', {hidden:true}, 'No memories match that search.');
  const memCount = pill('', '');
  const updateCount = () => {
    memCount.textContent = state.memories.length + ' facts';
  };
  updateCount();

  /* soul */
  const ta = h('textarea.textarea.library-soultext', {'aria-label':'SOUL.md', spellcheck:'false'}, state.soulDraft);
  const preview = h('div.library-reply', {hidden:true},
    h('div.library-replybubble',
      H.avatar(H.agent('hermes'), 26),
      h('div', h('div.library-replyname','Hermes'),
        h('p','Backup verified: 214 MB, 3,912 files. state.db, -wal and -shm restored cleanly in a scratch directory. Nothing needs you.'))),
    h('div.library-replymeta','Preview · sample turn, not saved'));
  ta.addEventListener('input', () => { state.soulDraft = ta.value; });
  const previewBtn = h('button.btn.ghost', {onclick:() => {
    const show = preview.hasAttribute('hidden');
    if (show){ preview.removeAttribute('hidden'); previewBtn.textContent = 'Hide preview'; }
    else { preview.setAttribute('hidden',''); previewBtn.textContent = 'Preview how it sounds'; }
  }}, 'Preview how it sounds');
  const soul = h('div.card.library-soul',
    h('div.card-h', h('span','Soul'), h('span.library-path','SOUL.md'),
      h('div.grow'), h('span.faint','Saved 12m ago')),
    h('div.card-b',
      h('p.library-hint','SOUL.md is prepended to every system prompt. Edit tone, boundaries and defaults · not facts; those go in memory.'),
      ta,
      h('div.library-soulrow',
        h('button.btn.primary', {onclick:() => {
          if (ta.value === state.soul){ toast('SOUL.md is already up to date'); return; }
          state.soul = ta.value; state.soulDraft = ta.value;
          toast('SOUL.md saved · takes effect next turn');
        }}, 'Save'),
        h('button.btn', {onclick:() => {
          state.soulDraft = state.soul; ta.value = state.soul;
          toast('Reverted to the saved SOUL.md');
        }}, 'Revert'),
        previewBtn,
        h('div.grow'),
        h('span.faint','~/.hermes/SOUL.md · 28 lines'))),
    preview);

  /* memories */
  function memRow(m){
    const row = h('div.library-mem', {'data-search':(m.text+' '+(m.thread ? (H.thread(m.thread) ? H.thread(m.thread).title : m.thread) : '')).toLowerCase()});
    const t = m.thread ? H.thread(m.thread) : null;
    row.append(
      h('div.library-mem-main',
        h('div.library-mem-text', m.text),
        h('div.library-mem-meta',
          t ? h('span', 'from ', h('button.library-link', {onclick:() => state.ctx.openThread(m.thread)}, t.title))
            : h('span', 'from this thread'),
          h('span.library-dotsep','·'), h('span','learned '+m.date))),
      h('button.btn.ghost.sm.library-forget', {onclick:() => {
        row.replaceChildren(
          h('div.library-confirmtext', 'Forget “'+(m.text.length > 74 ? m.text.slice(0,74)+'…' : m.text)+'”? ',
            h('span.faint','Removes it from MEMORY.md. The source thread keeps its copy.')),
          h('button.btn.sm.danger', {onclick:() => {
            state.memories = state.memories.filter(x => x.id !== m.id);
            row.remove(); updateCount(); paintProvider();
            if (!state.memories.length) facts.append(h('div.empty','Nothing remembered yet.'));
            toast('Forgotten · '+state.memories.length+' facts left');
          }}, 'Forget'),
          h('button.btn.ghost.sm', {onclick:() => row.replaceWith(memRow(m))}, 'Keep'));
      }}, 'Forget'));
    return row;
  }
  state.memories.forEach(m => facts.append(memRow(m)));

  const addInput = h('input.input', {placeholder:'Add a memory · e.g. “Invoices go to finance@”', 'aria-label':'Add a memory',
    onkeydown:e => { if (e.key === 'Enter') addMemory(); }});
  const err = h('div.library-err', {hidden:true}, 'Type a fact first.');
  const addBtn = h('button.btn', {onclick:addMemory}, 'Add');
  function addMemory(){
    const v = addInput.value.trim();
    if (!v){ err.removeAttribute('hidden'); addInput.classList.add('library-invalid'); return; }
    err.setAttribute('hidden',''); addInput.classList.remove('library-invalid');
    const m = {id:'m'+Date.now(), text:v, thread:null, date:'Today'};
    const empty = facts.querySelector('.empty');
    if (empty) empty.remove();
    state.memories.unshift(m);
    facts.prepend(memRow(m));
    addInput.value = ''; updateCount(); paintProvider();
    toast('Memory added · '+state.memories.length+' facts');
  }

  const providerStatus = h('span');
  const PSTAT = {
    'built-in':() => ['Active · '+state.memories.length+' facts in MEMORY.md','pos'],
    honcho:() => ['Connected · 2 peers, synced 2m ago','pos'],
    mem0:() => ['Needs an API key · add it in Settings → Keys','warn'],
    supermemory:() => ['Connected · 12 documents indexed','pos'],
  };
  function paintProvider(){
    const st = PSTAT[state.provider]();
    providerStatus.replaceChildren(h('span.dot' + (st[1] === 'pos' ? '.pos' : '.warn')), h('span', st[0]));
  }
  paintProvider();
  const provider = h('select.select.library-provider#library-provider-sel',
    { 'aria-label':'Memory provider', onchange:e => {
      state.provider = e.target.value; paintProvider();
      toast('Memory provider: '+e.target.options[e.target.selectedIndex].text);
    }},
    [['built-in','Built-in'],['honcho','Honcho'],['mem0','Mem0'],['supermemory','Supermemory']].map(([id,label]) =>
      h('option', {value:id, selected:state.provider === id}, label)));

  const memCard = h('div.card.library-memcard',
    h('div.card-h', h('span','What Hermes remembers'), memCount, h('div.grow'), h('span.faint','curator keeps 400 max')),
    h('div.library-providerrow',
      h('label', {for:'library-provider-sel'}, 'Memory provider'), provider, providerStatus),
    facts, factsNone,
    h('div.library-addmem', addInput, addBtn, err));

  /* journey */
  const journeyBox = h('div.library-journey');
  const noRes = h('div.library-nores', {hidden:true}, 'Nothing learned matches that search.');
  function journeyList(){
    const items = [];
    JOURNEY.forEach(g => {
      const group = h('div.library-jgroup');
      const entries = g.items.filter(x => state.journeyFilter === 'all' ||
        (state.journeyFilter === 'skills' ? x.kind === 'skill' : x.kind !== 'skill'));
      if (!entries.length) return;
      group.append(h('div.library-jday', h('span', g.day), h('span.faint', entries.length + (entries.length === 1 ? ' item' : ' items'))));
      const tl = h('div.library-tl');
      entries.forEach(x => tl.append(h('div.library-tev', {'data-search':(x.title+' '+x.meta+' '+x.kind).toLowerCase(), 'data-kind':x.kind},
        h('span.library-tdot' + (x.kind === 'correction' ? '.warn' : '')),
        h('div.library-tbody',
          h('div.library-ttitle', x.title),
          h('div.library-tmeta', h('span.library-tkind', x.kind === 'skill' ? 'Skill' : x.kind === 'correction' ? 'Correction' : 'Memory'),
            h('span.library-dotsep','·'), h('span', x.meta))))));
      group.append(tl);
      items.push(group);
    });
    journeyBox.replaceChildren.apply(journeyBox, items);
    if (!items.length) journeyBox.append(h('div.empty','Nothing in the last 3 weeks for this filter.'));
  }
  journeyList();
  const jseg = H.seg([{id:'all',label:'All'},{id:'skills',label:'Skills'},{id:'memories',label:'Memories'}], state.journeyFilter, id => {
    state.journeyFilter = id; journeyList(); if (state.q) filterMemory(state.q);
  });
  jseg.setAttribute('aria-label','Filter journey');
  const journey = h('div.sec.library-journeysec',
    h('div.library-journeyhead',
      h('div', h('h2','Journey'), h('p.library-hint','What Hermes learned in the last three weeks · skills, memories and corrections.')),
      h('div.grow'), jseg),
    journeyBox, noRes);

  grid.append(soul, memCard);
  wrap.append(grid, journey);

  function filterMemory(q){
    let nf = 0;
    facts.querySelectorAll('.library-mem').forEach(el => { const hit = !q || el.dataset.search.includes(q); el.hidden = !hit; if (hit) nf++; });
    factsNone.hidden = nf > 0;
    let nj = 0;
    journeyBox.querySelectorAll('.library-tev').forEach(el => { const hit = !q || el.dataset.search.includes(q); el.hidden = !hit; if (hit) nj++; });
    journeyBox.querySelectorAll('.library-jgroup').forEach(g => {
      g.hidden = !g.querySelector('.library-tev:not([hidden])');
    });
    noRes.hidden = nj > 0;
  }
  filterActive = filterMemory;
  return wrap;
}

/* -------------------------------------------------------------- tools */
function buildTools(){
  if (LIVE) return buildToolsLive();
  const wrap = h('div.library-toolswrap');
  const scope = h('select.select.library-scope#library-scope-sel', {
    'aria-label':'Toolsets for', onchange:e => {
      state.scope = e.target.value;
      grid.replaceChildren.apply(grid, toolCards());
      updateSummary();
      if (state.q) filterTools(state.q);
    }},
    [['hermes','Hermes'],['scout','Scout'],['ledger','Ledger'],['thread','This thread']].map(([id,label]) =>
      h('option', {value:id, selected:state.scope === id}, label)));
  const summary = h('div.library-summary', {'data-toolsummary':''}, scopeSummary());
  const bar = h('div.library-bar',
    h('label.library-inline-label', {for:'library-scope-sel'}, 'For:'), scope, summary,
    h('div.grow'), h('span.faint','Changes apply to new turns'));

  const grid = h('div.library-toolgrid');
  function toolCards(){
    return TOOLSETS.map(t => {
      const on = state.scopes[state.scope].has(t.id);
      const count = t.id === 'mcp' ? mcpToolCount() : t.tools;
      const sw = H.sw(on, v => {
        const set = state.scopes[state.scope];
        if (v){ set.add(t.id); if (t.risky) toast(t.name+' on for '+scopeLabel[state.scope]+' · commands still need approval'); }
        else set.delete(t.id);
        card.setAttribute('data-on', String(v));
        updateSummary();
      }, t.name+' for '+scopeLabel[state.scope]);
      const card = h('div.library-tool', {'data-search':(t.name+' '+t.desc).toLowerCase(), 'data-on':String(on)},
        h('div.library-tool-h', h('span.library-tool-name', t.name), sw),
        h('p.library-tool-desc', t.desc),
        h('div.library-tool-foot',
          h('span', h('span.num', String(count)), ' tools'),
          t.risky ? pill('Runs commands','warn') : null,
          t.cost ? h('span.faint', t.cost) : null));
      if (t.id === 'mcp') card.querySelector('.library-tool-foot span').setAttribute('data-mcpfoot','');
      return card;
    });
  }
  grid.append.apply(grid, toolCards());
  const mcpCountText = h('span.faint', state.mcp.length+' servers · '+mcpToolCount()+' tools available');
  function updateSummary(){
    summary.textContent = scopeSummary();
    const foot = wrap.querySelector('[data-mcpfoot]');
    if (foot) foot.replaceChildren(h('span.num', String(mcpToolCount())), ' tools');
    mcpCountText.textContent = state.mcp.length + ' servers · ' + mcpToolCount() + ' tools available';
  }

  /* mcp */
  const table = h('table.tbl.library-mcptbl');
  table.append(h('thead', h('tr',
    h('th','Server'), h('th','Transport'), h('th','Status'), h('th.r','Tools'), h('th','Last test'), h('th.r', h('span.sr','Actions')))));
  const tbody = h('tbody');
  state.mcp.forEach(s => mcpRows(s));
  table.append(tbody);

  function statusNode(s){
    const map = {connected:['pos','Connected'], failed:['neg','Failed'], 'needs auth':['warn','Needs auth']};
    const st = map[s.status] || ['','Unknown'];
    return h('span.library-status', h('span.dot.'+st[0]), st[1]);
  }
  function toolLine(t, s){
    return h('div.library-mcptool',
      h('div.grow', h('div.library-mcptoolname', t.name), h('div.library-mcptooldesc', t.desc)),
      H.sw(t.on, v => { t.on = v; updateSummary(); toast(t.name+(v?' on':' off')+' · '+(s.name)); }, t.name+' enabled'));
  }
  function mcpRows(s){
    const detail = h('tr.library-mcpdetailrow', {hidden: state.expandedMcp !== s.id, 'data-server':s.id, 'data-search':(s.name+' '+s.desc).toLowerCase()},
      h('td', {colspan:'6'},
        h('div.library-mcpdetail',
          s.error ? h('div.library-mcperror', H.ic('warn','sm'), h('div', h('b','Last error · '), s.error, h('div.faint','Expanding still shows the registered tools. Reconnect to refresh the token.'))) : null,
          h('div.library-mcptools', s.tools.map(t => toolLine(t, s))),
          h('div.library-mcpnote',
            h('span', h('span.num', String(s.tools.length)), ' tools registered'),
            h('span.library-dotsep','·'),
            h('span', s.transport === 'stdio' ? s.cmd : s.url),
            s.oauth ? h('span.library-dotsep','·') : null,
            s.oauth ? h('span','OAuth token stored in auth.json') : null))));
    const err = s.error ? h('div.library-mcperr', s.error) : null;
    const status = statusNode(s);
    const last = h('span.library-lasttest', s.lastTest);
    const chev = h('span.library-mchev', H.ic('chev','sm'));
    const nameBtn = h('button.library-mcpname', {'aria-expanded':String(state.expandedMcp === s.id), onclick:() => {
      const open = detail.hasAttribute('hidden');
      if (open){ detail.removeAttribute('hidden'); state.expandedMcp = s.id; }
      else { detail.setAttribute('hidden',''); state.expandedMcp = null; }
      nameBtn.setAttribute('aria-expanded', String(open));
    }}, chev, h('span', s.name));
    const test = h('button.btn.sm', {onclick:() => {
      if (test.disabled) return;
      test.disabled = true; test.textContent = 'Testing…';
      setTimeout(() => {
        if (!test.isConnected) return;
        test.disabled = false; test.textContent = 'Test';
        last.textContent = 'just now';
        if (s.status === 'failed'){
          toast(s.name+': still failing · 401 Unauthorized');
        } else {
          toast(s.name+': '+s.tools.length+' tools responded in 212 ms');
        }
        updateSummary();
      }, 650);
    }}, 'Test');
    const rec = h('button.btn.sm', {onclick:() => {
      if (s.status === 'connected'){ toast(s.name+' is already connected'); return; }
      rec.disabled = true; rec.textContent = 'Reconnecting…';
      setTimeout(() => {
        if (!rec.isConnected) return;
        s.status = 'connected'; s.error = null; s.lastTest = 'just now';
        rec.disabled = false; rec.textContent = 'Reconnect';
        status.replaceWith(statusNode(s)); last.textContent = 'just now';
        if (err) err.remove();
        updateSummary();
        toast(s.name+' reconnected · token valid for 30 days');
      }, 800);
    }}, 'Reconnect');
    const del = h('button.btn.ghost.sm', {onclick:() => {
      const m = H.modal(h('div.library-modal',
        h('div.library-modal-h', h('h3','Remove '+s.name+'?'),
          h('button.btn.ghost.icon.sm', {'aria-label':'Close', onclick:() => m.close()}, H.ic('x','sm'))),
        h('p.library-modalsub','Hermes loses access to '+s.tools.length+' tools. Running threads keep their last result, but the next call will fail.'),
        h('div.library-modalfoot', h('span.faint','Config is kept until you save'),
          h('div.grow'),
          h('button.btn.ghost', {onclick:() => m.close()}, 'Cancel'),
          h('button.btn.danger', {onclick:() => {
            m.close();
            state.mcp = state.mcp.filter(x => x.id !== s.id);
            refreshTab(); toast('Removed '+s.name+' · '+s.tools.length+' tools no longer available');
          }}, 'Remove server'))), {width:520});
    }}, 'Remove');
    const row = h('tr.library-mcprow', {'data-search':(s.name+' '+s.desc+' '+s.transport).toLowerCase()},
      h('td', h('div.library-mcpcell', nameBtn, err ? err : h('div.library-mcpdesc', s.desc))),
      h('td', h('span.mono.library-transport', s.transport)),
      h('td', status),
      h('td.r', h('span.num', String(s.tools.length))),
      h('td', last),
      h('td.r', h('div.library-mcpacts', test, rec, del)));
    tbody.append(row, detail);
  }

  const addBtn = h('button.btn.primary', {onclick:addServer}, 'Add MCP server');
  const mcpSec = h('div.sec.library-mcpsec',
    h('div.library-journeyhead',
      h('div', h('h2','MCP servers'), h('p.library-hint','Model Context Protocol servers Hermes can call. One failed server does not stop the others.')),
      h('div.grow'), mcpCountText, addBtn),
    h('div.scroll-x', table));

  function addServer(){
    const nameIn = h('input.input', {placeholder:'linear', 'aria-label':'Server name'});
    const cmdIn = h('input.input', {placeholder:'npx -y @modelcontextprotocol/server-filesystem ~/hermes-maintenance', 'aria-label':'Command'});
    const argsIn = h('input.input', {placeholder:'(optional) extra arguments', 'aria-label':'Arguments'});
    const envIn = h('textarea.textarea', {rows:'2', placeholder:'GITHUB_TOKEN=…  (one KEY=value per line)', 'aria-label':'Environment'});
    const urlIn = h('input.input', {placeholder:'https://mcp.linear.app/sse', 'aria-label':'Server URL'});
    const oauthStat = h('span.library-oauthstat', 'Not connected');
    const oauthBtn = h('button.btn.sm', {onclick:() => {
      oauthBtn.disabled = true; oauthBtn.textContent = 'Connected';
      oauthStat.textContent = 'Connected · token expires in 30 days';
      oauthStat.classList.add('library-oauthok');
      toast('OAuth connected · token stored in auth.json');
    }}, 'Connect');
    const stdioBox = h('div.library-mform', h('div.field', h('label','Command'), cmdIn),
      h('div.field', h('label','Arguments'), argsIn, h('span.hint','Passed to the command after the binary.')),
      h('div.field', h('label','Environment'), envIn, h('span.hint','Stored in auth.json, never in config.yaml.')));
    const httpBox = h('div.library-mform', {hidden:true},
      h('div.field', h('label','Server URL'), urlIn),
      h('div.library-oauthrow', h('span.library-inline-label','OAuth'), oauthBtn, oauthStat));
    let transport = 'stdio';
    const seg = H.seg([{id:'stdio',label:'stdio'},{id:'http',label:'http'}], 'stdio', id => {
      transport = id;
      hiddenAttr(stdioBox, id !== 'stdio'); hiddenAttr(httpBox, id !== 'http');
    });
    const errLine = h('div.library-err', {hidden:true}, 'Add a name and a command or URL.');
    const m = H.modal(h('div.library-modal',
      h('div.library-modal-h', h('h3','Add MCP server'),
        h('button.btn.ghost.icon.sm', {'aria-label':'Close', onclick:() => m.close()}, H.ic('x','sm'))),
      h('p.library-modalsub','Hermes starts stdio servers itself; http servers need a reachable URL. Test it before telling anyone it works.'),
      h('div.library-mform',
        h('div.field', h('label','Name'), nameIn),
        h('div.field', h('label','Transport'), seg)),
      stdioBox, httpBox, errLine,
      h('div.library-modalfoot', h('span.faint','Server config is written to ~/.hermes/config.yaml'),
        h('div.grow'),
        h('button.btn.ghost', {onclick:() => m.close()}, 'Cancel'),
        h('button.btn.primary', {onclick:() => {
          const name = nameIn.value.trim();
          const ok = name && (transport === 'stdio' ? cmdIn.value.trim() : urlIn.value.trim());
          if (!ok){ errLine.removeAttribute('hidden'); nameIn.classList.toggle('library-invalid', !name);
            if (transport === 'stdio') cmdIn.classList.toggle('library-invalid', !cmdIn.value.trim());
            else urlIn.classList.toggle('library-invalid', !urlIn.value.trim()); return; }
          const server = {id:name, name, desc:'Added from the prototype.', transport,
            cmd:transport === 'stdio' ? (cmdIn.value.trim()+' '+argsIn.value.trim()).trim() : '',
            url:transport === 'http' ? urlIn.value.trim() : '',
            status: transport === 'http' && oauthStat.classList.contains('library-oauthok') ? 'connected' : transport === 'stdio' ? 'connected' : 'needs auth',
            lastTest:'never', oauth:transport === 'http', tools:[]};
          state.mcp.push(server);
          m.close(); refreshTab();
          toast('Added '+name+' · run Test to list its tools');
        }}, 'Add server'))), {width:620});
  }

  /* plugins + hooks */
  let pluginsCtl = null;
  function pluginRow(p){
    const ver = h('span.library-plugin-ver.mono', 'v'+p.version);
    const flag = p.latest ? pill('Update available','warn') : h('span.faint','Up to date');
    const upd = p.latest ? h('button.btn.sm', {onclick:() => {
      p.version = p.latest; p.latest = null;
      ver.textContent = 'v'+p.version;
      flag.replaceWith(h('span.faint','Updated just now'));
      upd.remove();
      toast(p.name+' updated to v'+p.version+' · restart at next turn');
    }}, 'Update') : null;
    return h('div.row.library-plugin', {'data-search':(p.name+' '+p.desc).toLowerCase()},
      h('div.grow', h('div.library-plugin-name', p.name), h('div.s', p.desc)),
      ver, flag, upd,
      H.sw(p.on, v => { p.on = v; toast(p.name+(v?' enabled':' disabled'));
        if (pluginsCtl) pluginsCtl.refreshCounts(); }, p.name+' enabled'));
  }
  pluginsCtl = collapsibleGroups({
    storeKey:'hermes.library.plugins.open',
    groups: pluginCategoryGroups(state.plugins).map(g => ({
      key:g.key, label:g.label, count:g.rows.length,
      defaultOpen: g.rows.some(p => p.on),
      items: g.rows.map(p => ({el:pluginRow(p), search:(p.name + ' ' + p.desc).toLowerCase(),
        enabled: () => !!p.on})),
    })),
  });
  const plugins = h('div.card.library-plugins',
    h('div.card-h', h('span','Plugins'), h('span.faint', state.plugins.length+' installed · 3 updates'), h('div.grow'), h('span.faint','~/.hermes/plugins')),
    pluginsCtl.el);

  const hooks = h('div.card.library-hooks',
    h('div.card-h', h('span','Hooks'), h('span.faint', state.hooks.length+' on'), h('div.grow'), h('span.faint','run in order')),
    h('div.list', state.hooks.map(x => h('div.row.library-hook', {'data-search':(x.event+' '+x.script).toLowerCase()},
      h('div.grow', h('div.library-hookevt', x.event), h('div.library-hookscript', x.script)),
      H.sw(x.on, v => { x.on = v; toast(x.event+(v?' hook on':' hook off')); }, x.event+' hook')))));

  const lower = h('div.library-grid2', plugins, hooks);
  wrap.append(bar, grid, mcpSec, lower);

  function filterTools(q){
    wrap.querySelectorAll('.library-tool').forEach(el => {
      el.hidden = !!q && !el.dataset.search.includes(q);
    });
    wrap.querySelectorAll('.library-mcprow').forEach(el => {
      el.hidden = !!q && !el.dataset.search.includes(q);
    });
    wrap.querySelectorAll('.library-mcpdetailrow').forEach(el => {
      el.hidden = q ? true : el.dataset.server !== state.expandedMcp;
    });
    wrap.querySelectorAll('.library-hook').forEach(el => {
      el.hidden = !!q && !el.dataset.search.includes(q);
    });
    if (pluginsCtl) pluginsCtl.applySearch(q);
    const mcpSecEl = wrap.querySelector('.library-mcpsec');
    if (mcpSecEl){
      mcpSecEl.hidden = !!q && !mcpSecEl.querySelector('.library-mcprow:not([hidden])');
    }
  }
  filterActive = filterTools;
  return wrap;
}

/* -------------------------------------------------------------- files */
function buildFiles(){
  if (LIVE) return buildFilesLive();
  const wrap = h('div.library-fileswrap');
  const rootSel = h('select.select.library-rootsel', {'aria-label':'Project root', onchange:e => {
    state.fileRoot = e.target.value;
    const r = ROOTS.find(x => x.id === state.fileRoot);
    state.fileSel = r.defaultSel;
    expandedFor(state.fileRoot);
    refreshTree(); refreshPreview(); paintHint();
  }}, ROOTS.map(r => h('option', {value:r.id, selected:state.fileRoot === r.id}, r.label)));

  const hint = h('span.library-filehint');
  function currentRoot(){ return ROOTS.find(r => r.id === state.fileRoot) || ROOTS[0]; }
  function leavesOf(nodes, parent){
    let out = [];
    nodes.forEach(n => {
      const p = parent ? parent + '/' + n.name : n.name;
      if (n.type === 'dir') out = out.concat(leavesOf(n.children || [], p));
      else out.push({leaf:n, path:p});
    });
    return out;
  }
  function paintHint(){
    const all = leavesOf(currentRoot().tree, '');
    const hidden = all.filter(x => x.leaf.secret).length;
    hint.textContent = all.length + ' files · ' + hidden + ' hidden by design';
  }
  function treeEl(){
    const box = h('div.library-tree', {role:'tree', 'aria-label':'Files in '+currentRoot().label});
    const q = state.q;
    if (q){
      const hits = leavesOf(currentRoot().tree, '').filter(x => (x.path + ' ' + x.leaf.name).toLowerCase().includes(q));
      if (!hits.length){ box.append(h('div.library-treeempty','No files match “'+q+'”.')); return box; }
      hits.forEach(x => box.append(flatRow(x.leaf, x.path)));
      return box;
    }
    const walk = (nodes, depth, parent) => {
      nodes.forEach(n => {
        const p = parent ? parent + '/' + n.name : n.name;
        if (n.type === 'dir'){
          const set = expandedFor(state.fileRoot);
          const open = set.has(p);
          const btn = h('button.library-folder', {'aria-expanded':String(open), onclick:() => {
            if (set.has(p)) set.delete(p); else set.add(p);
            btn.setAttribute('aria-expanded', String(set.has(p)));
            const kids = btn.nextElementSibling;
            if (kids) hiddenAttr(kids, !set.has(p));
            btn.querySelector('svg.library-chev').style.transform = set.has(p) ? 'rotate(90deg)' : '';
          }},
          h('span.library-chev', H.ic('chev','sm')), H.ic('folder','sm'), h('span.grow.ellip', n.name));
          btn.style.paddingLeft = (8 + depth * 14) + 'px';
          const kids = h('div.library-treekids', {role:'group'}, walk(n.children || [], depth + 1, p));
          hiddenAttr(kids, !open);
          box.append(btn, kids);
        } else {
          box.append(leafRow(n, p, depth));
        }
      });
    };
    walk(currentRoot().tree, 0, '');
    return box;
  }
  function leafRow(leaf, path, depth){
    const sel = path === state.fileSel;
    const b = h('button.library-leaf', {'aria-current':String(sel), 'aria-label':(leaf.secret ? 'Hidden file ' : 'File ') + leaf.name,
      onclick:() => { state.fileSel = path; refreshTree(); refreshPreview(); }},
      h('span.library-leaficon', H.ic(leaf.secret ? 'lock' : 'file','sm')), h('span.grow.ellip', leaf.name),
      leaf.size ? h('span.library-size', leaf.size) : null);
    b.style.paddingLeft = (8 + depth * 14) + 'px';
    return b;
  }
  function flatRow(leaf, path){
    const b = h('button.library-flatrow', {'aria-current':String(path === state.fileSel),
      onclick:() => { state.fileSel = path; refreshTree(); refreshPreview(); }},
      H.ic(leaf.secret ? 'lock' : 'file','sm'),
      h('div.grow', h('div', leaf.name), h('div.library-flatpath', path)),
      leaf.size ? h('span.library-size', leaf.size) : null);
    return b;
  }
  function findLeaf(path){
    const parts = path.split('/');
    let nodes = currentRoot().tree, leaf = null;
    parts.forEach((name, i) => {
      const n = (nodes || []).find(x => x.name === name);
      if (!n) return;
      if (i === parts.length - 1) leaf = n; else nodes = n.children || [];
    });
    return leaf;
  }
  function previewEl(){
    const path = state.fileSel;
    const leaf = findLeaf(path);
    const root = currentRoot();
    if (!leaf) return h('div.library-preview', h('div.empty','Select a file to preview it.'));
    const body = h('div.library-previewbody');
    if (leaf.secret){
      body.append(h('div.library-secret',
        h('span.library-seclogo', H.ic('lock','lg')),
        h('div.library-sectitle','Hidden by design'),
        h('p','Hermes never prints .env, auth.json or vault contents into the workspace. Read a key with ', h('span.mono','hermes config get'), ' or edit the file on the machine.')));
    } else if (leaf.binary){
      body.append(h('div.library-secret',
        h('span.library-seclogo', H.ic('file','lg')),
        h('div.library-sectitle','Binary file'),
        h('p', (leaf.size || 'unknown size') + ' · nothing to preview. Open a shell in ', h('span.mono', root.label), ' to inspect it.')));
    } else {
      const content = leaf.content || '';
      const code = h('div.library-code');
      content.split('\n').forEach((line, i) => {
        code.append(h('div.library-cline', h('span.library-ln', String(i+1)), h('span.library-lc', line.length ? line : ' ')));
      });
      body.append(code);
    }
    const openBtn = h('button.btn.sm', {onclick:() => {
      if (leaf.secret){ toast('Secrets open only in the terminal editor · hermes env edit'); return; }
      if (leaf.binary){ toast(leaf.name+' is binary · no editor preview'); return; }
      toast('Opening '+leaf.name+' in $EDITOR');
    }}, 'Open in editor');
    return h('div.library-preview',
      h('div.library-preview-h',
        h('span.library-fileicon', H.ic(leaf.secret ? 'lock' : 'file','sm')),
        h('div.grow', h('div.library-preview-name', path),
          h('div.library-preview-meta', root.label + ' · ' + (leaf.secret ? 'secret · hidden' : leaf.binary ? 'binary · ' + (leaf.size || '') : 'text · ' + (leaf.content || '').split('\n').length + ' lines'))),
        h('div.library-preview-actions', openBtn)),
      body);
  }
  let treeHolder = treeEl();
  let previewHolder = previewEl();
  function refreshTree(){
    const next = treeEl();
    treeHolder.replaceWith(next); treeHolder = next;
  }
  function refreshPreview(){
    const next = previewEl();
    previewHolder.replaceWith(next); previewHolder = next;
  }
  paintHint();

  const bar = h('div.library-filesbar',
    h('label.library-inline-label','Root'), rootSel, hint,
    h('div.grow'), h('span.faint','Read-only preview · 2 hidden files'));
  const files = h('div.library-files', treeHolder, previewHolder);
  wrap.append(bar, files);
  filterActive = () => refreshTree();
  return wrap;
}

/* ------------------------------------------------------ live: skills */
function fromApiSkill(s){
  return {id:s.name, name:s.name, desc:s.description || '', category:s.category || '',
    source:srcLabel(s.provenance), provenance:s.provenance, uses:s.usage || 0,
    enabled:s.enabled !== false, locked:!!s.locked};
}
function buildSkillsLive(){
  const wrap = h('div.library-skills');
  let skillsCtl = null;
  const summary = h('div.library-summary', 'Loading installed skills…');
  const curatorNote = h('span.faint');
  const run = h('button.btn.primary', {onclick:runCurator}, 'Run curator');
  const bar = h('div.library-bar', summary, h('div.grow'), curatorNote, run);
  const seg = H.seg([{id:'installed',label:'Installed'},{id:'hub',label:'Hub'},{id:'bundles',label:'Bundles'}], state.browse, id => {
    state.browse = id; buildBody();
    if (state.browse === 'hub' && state.q) hubSearch(state.q);
  });
  seg.setAttribute('aria-label','Browse the hub');
  const segRow = h('div.library-segrow', h('span.library-seglabel','Browse the hub'), seg);
  const body = h('div.library-bodyslot');
  wrap.append(bar, segRow, body);

  function paintSummary(){
    const list = live.skills || [];
    const on = list.filter(s => s.enabled).length;
    summary.replaceChildren(num(list.length), ' installed · ', num(on), ' enabled');
    const c = live.curator;
    curatorNote.textContent = c ? (c.paused ? 'Curator paused · last ran ' + fmtAgo(c.last_run_at)
      : 'Curator last ran ' + fmtAgo(c.last_run_at)) : '';
  }
  async function load(){
    summary.textContent = 'Loading installed skills…';
    try {
      const list = await H.api.get('/api/skills');
      live.skills = (Array.isArray(list) ? list : []).map(fromApiSkill);
      live.skillsErr = null;
      live.curator = await H.api.try(() => H.api.get('/api/curator'), null);
      if (!live.skills.some(s => s.id === state.skill)) state.skill = live.skills.length ? live.skills[0].id : null;
    } catch (e){ live.skillsErr = e; live.skills = null; }
    paintSummary();
    buildBody();
  }
  async function runCurator(){
    if (run.disabled) return;
    run.disabled = true; run.textContent = 'Starting…';
    try {
      const r = await H.api.post('/api/curator/run');
      toast('Curator started · ' + (r && r.name ? r.name : 'curator-run'));
      const st = await pollAction(r && r.name, 60);
      if (st && st.exit_code != null && st.exit_code !== 0) toast('Curator exited ' + st.exit_code + (lastLine(st) ? ': ' + lastLine(st) : ''));
      else if (st) toast('Curator finished');
      live.skills = null; await load();
    } catch (e){ toast('Couldn’t run the curator: ' + e.message); }
    finally { run.disabled = false; run.textContent = 'Run curator'; }
  }

  function buildBody(){
    body.replaceChildren();
    if (state.browse === 'hub') body.append(hubView());
    else if (state.browse === 'bundles') body.append(bundlesView());
    else body.append(installedView());
    if (state.q) filterActive(state.q);
  }

  function installedView(){
    if (live.skillsErr) return liveErr(live.skillsErr, () => load(), 'skills');
    if (!live.skills) return liveLoad();
    const holder = h('div');
    if (!live.skills.length) return h('div', h('div.empty', 'No skills installed yet.'), h('div.library-nores','Install one from the Hub tab.'));
    const split = h('div.library-split');
    const list = h('div.library-list', {role:'list', 'aria-label':'Installed skills'});
    const sorted = live.skills.slice().sort((a,b) => (b.enabled - a.enabled) || (b.uses - a.uses) || a.name.localeCompare(b.name));
    const selSkill = live.skills.find(s => s.id === state.skill);
    skillsCtl = skillGroupsCtl({
      list: sorted,
      openKey: selSkill ? skillCatKey(selSkill) : null,
      row: skillRowLive,
      search: s => (s.name + ' ' + s.desc + ' ' + s.category + ' ' + s.source).toLowerCase(),
      enabled: s => !!s.enabled,
    });
    list.append(skillsCtl.el);
    const detail = h('div.library-detail');
    detail.append(liveLoad('Loading SKILL.md…'));
    split.append(list, detail);
    holder.append(split, h('div.library-listfoot',
      h('span', live.skills.length + ' installed · ' + live.skills.filter(s => s.provenance === 'hub').length + ' from the hub'),
      h('span.faint','Read from ~/.hermes/skills · edits apply to new turns')));
    loadDoc(state.skill, detail);
    return holder;
  }
  function skillRowLive(s){
    const row = h('div.library-skill', {'data-id':s.id, 'data-search':(s.name+' '+s.desc+' '+s.category+' '+s.source).toLowerCase(),
      'aria-current':String(s.id === state.skill)});
    const open = h('button.library-skill-open', {onclick:() => select(s.id), 'aria-label':'Open '+s.name},
      h('div.library-skill-top', h('span.library-sname', s.name), pill(s.source), s.locked ? pill('Locked') : null),
      h('div.library-skill-desc', s.desc || 'No description in SKILL.md.'),
      h('div.library-skill-meta', 'used ', h('span.num', String(s.uses)), '× this month'));
    const sw = H.sw(s.enabled, v => toggleSkill(s, v), s.name + ' enabled');
    row.append(open, h('div.library-skill-ctl', h('span', {class:'library-src'}, s.category || ''), sw));
    return row;
  }
  function select(id){
    state.skill = id;
    state.root.querySelectorAll('.library-skill').forEach(n => n.setAttribute('aria-current', String(n.dataset.id === id)));
    const detail = state.root.querySelector('.library-detail');
    if (detail) loadDoc(id, detail);
  }
  async function loadDoc(id, box){
    if (!id){ box.replaceChildren(h('div.empty','No skill selected.')); return; }
    box.replaceChildren(liveLoad('Loading SKILL.md…'));
    try {
      const d = await H.api.get('/api/skills/content?name=' + encodeURIComponent(id));
      const s = (live.skills || []).find(x => x.id === id) || {id, name:id, source:'', locked:false};
      box.replaceChildren(detailContentLive(s, String(d.content || '')));
    } catch (e){
      box.replaceChildren(liveErr(e, () => loadDoc(id, box), 'SKILL.md'));
    }
  }
  function detailContentLive(s, content){
    const enabled = !(s.enabled === false);
    const actions = h('div.library-detail-actions',
      h('button.btn.sm', {onclick:() => toggleSkill(s, !enabled)}, enabled ? 'Disable' : 'Enable'),
      h('button.btn.sm', {onclick:() => editSkillLive(s, content)}, 'Edit'),
      s.provenance === 'hub' ? h('button.btn.ghost.sm', {onclick:() => uninstallSkill(s, content)}, 'Uninstall') : null);
    const header = h('div.library-detail-h',
      h('div.grow',
        h('div.library-detail-title', h('h3', s.name), pill(s.source),
          s.locked ? pill('Locked') : null),
        h('div.library-detail-meta', h('span','SKILL.md'), h('span.library-dotsep','·'),
          h('span', s.category ? 'category ' + s.category : 'no category'), h('span.library-dotsep','·'),
          h('span', h('span.num', String(s.uses || 0)), '× this month'))),
      actions);
    const pre = h('pre.library-front.library-docpre', content || 'SKILL.md is empty.');
    return h('div.library-detail-inner', header, h('div.library-md', h('div.library-md-body', pre)));
  }
  async function toggleSkill(s, enabled){
    try {
      await H.api.put('/api/skills/toggle', {name:s.name, enabled:!!enabled});
      s.enabled = !!enabled;
      toast(s.name + (enabled ? ' enabled' : ' disabled · stays on disk'));
      paintSummary();
      if (skillsCtl) skillsCtl.refreshCounts();
    } catch (e){
      toast('Couldn’t change ' + s.name + ': ' + e.message);
      live.skills = null; await load();
    }
  }
  function editSkillLive(s, content){
    const ta = h('textarea.textarea.library-editor', {'aria-label':'SKILL.md source'}, content);
    const m = H.modal(h('div.library-modal',
      h('div.library-modal-h', h('h3','Edit ' + s.name),
        h('button.btn.ghost.icon.sm', {'aria-label':'Close', onclick:() => m.close()}, H.ic('x','sm'))),
      h('p.library-modalsub','Saving replaces SKILL.md on disk. Running threads keep the copy they started with.'),
      ta,
      h('div.library-modalfoot', h('span.faint','~/.hermes/skills/' + s.name + '/SKILL.md'), h('div.grow'),
        h('button.btn.ghost', {onclick:() => m.close()}, 'Cancel'),
        h('button.btn.primary', {onclick:async ev => {
          const btn = ev.currentTarget;
          if (!ta.value.trim()){ ta.classList.add('library-invalid'); return; }
          btn.disabled = true; btn.textContent = 'Saving…';
          try {
            await H.api.put('/api/skills/content', {name:s.name, content:ta.value});
            m.close(); toast('Saved ' + s.name + '/SKILL.md');
            const detail = state.root.querySelector('.library-detail');
            if (detail) loadDoc(s.id, detail);
            live.skills = null; await load();
          } catch (e){
            btn.disabled = false; btn.textContent = 'Save skill';
            toast('Couldn’t save ' + s.name + ': ' + e.message);
          }
        }}, 'Save skill'))), {width:720});
  }
  function uninstallSkill(s){
    const m = H.modal(h('div.library-modal',
      h('div.library-modal-h', h('h3','Uninstall ' + s.name + '?'),
        h('button.btn.ghost.icon.sm', {'aria-label':'Close', onclick:() => m.close()}, H.ic('x','sm'))),
      h('p.library-modalsub','Removes the hub-installed folder from ~/.hermes/skills. Pinned copies and running threads are untouched.'),
      h('div.library-modalfoot', h('span.faint','Reinstall from the Hub tab'), h('div.grow'),
        h('button.btn.ghost', {onclick:() => m.close()}, 'Cancel'),
        h('button.btn.danger', {onclick:async ev => {
          const btn = ev.currentTarget;
          btn.disabled = true; btn.textContent = 'Uninstalling…';
          try {
            const r = await H.api.post('/api/skills/hub/uninstall', {name:s.name});
            const st = await pollAction(r && r.name, 40);
            if (st && st.exit_code != null && st.exit_code !== 0) toast('Uninstall exited ' + st.exit_code + (lastLine(st) ? ': ' + lastLine(st) : ''));
            else toast(s.name + ' uninstalled');
            m.close(); if (state.skill === s.id) state.skill = null;
            live.skills = null; await load();
          } catch (e){
            btn.disabled = false; btn.textContent = 'Uninstall';
            toast('Couldn’t uninstall ' + s.name + ': ' + e.message);
          }
        }}, 'Uninstall'))), {width:520});
  }

  function hubView(){
    const holder = h('div');
    const updateAll = h('button.btn.sm', {onclick:updateHub}, 'Update hub skills');
    const grid = h('div.library-hubgrid');
    holder.append(h('div.library-hubhead',
      h('div', h('h2','Hub'), h('p','Search the skill hub across the configured sources, then install. Installs run as a background action.')),
      h('div.grow'), updateAll));
    if (!state.q){ grid.append(liveEmpty('Type a name or topic above to search the hub.')); holder.append(grid); return holder; }
    if (live.hubErr){ grid.append(liveErr(live.hubErr, () => hubSearch(state.q), 'hub search')); holder.append(grid); return holder; }
    if (!live.hub){ grid.append(liveLoad('Searching the hub…')); holder.append(grid); return holder; }
    const installed = live.hub.installed || {};
    if (!live.hub.results || !live.hub.results.length){ grid.append(liveEmpty('No hub skills match that search.')); holder.append(grid); return holder; }
    live.hub.results.forEach(x => {
      const isInstalled = !!(installed[x.identifier] || installed[x.name]);
      const busy = live.hubBusy.has(x.identifier);
      const btn = h('button.btn.sm', {disabled:isInstalled || busy,
        title:isInstalled ? 'Already installed' : 'Install from ' + x.source,
        onclick:() => installHub(x, btn)}, isInstalled ? 'Installed' : busy ? 'Installing…' : 'Install');
      grid.append(h('div.library-hubcard', {'data-search':(x.name+' '+x.description+' '+x.source).toLowerCase()},
        h('div.library-hubtop', h('div', h('div.library-hubname', x.name), h('div.library-hubcat', x.source + (x.trust_level ? ' · ' + x.trust_level : ''))), btn),
        h('p.library-hubdesc', x.description || ''),
        h('div.library-hubmeta', (x.tags || []).join(' · ') || x.identifier)));
    });
    holder.append(grid);
    return holder;
  }
  async function installHub(x, btn){
    if (live.hubBusy.has(x.identifier)) return;
    live.hubBusy.add(x.identifier); btn.disabled = true; btn.textContent = 'Installing…';
    try {
      const r = await H.api.post('/api/skills/hub/install', {identifier:x.identifier});
      toast('Installing ' + x.name + '…');
      const st = await pollAction(r && r.name, 90);
      if (st && st.exit_code != null && st.exit_code !== 0) toast(x.name + ' install exited ' + st.exit_code + (lastLine(st) ? ': ' + lastLine(st) : ''));
      else toast(x.name + ' installed · available next turn');
      live.hubBusy.delete(x.identifier);
      live.hub = await H.api.try(() => H.api.get('/api/skills/hub/search?q=' + encodeURIComponent(state.q) + '&limit=20'), live.hub);
      live.skills = null; await load();
      if (state.browse === 'hub') buildBody();
    } catch (e){
      live.hubBusy.delete(x.identifier);
      toast('Couldn’t install ' + x.name + ': ' + e.message);
      btn.disabled = false; btn.textContent = 'Install';
    }
  }
  async function updateHub(){
    try {
      const r = await H.api.post('/api/skills/hub/update', {});
      toast('Updating hub skills…');
      const st = await pollAction(r && r.name, 120);
      if (st && st.exit_code != null && st.exit_code !== 0) toast('Update exited ' + st.exit_code + (lastLine(st) ? ': ' + lastLine(st) : ''));
      else toast('Hub skills updated');
      live.skills = null; await load();
    } catch (e){ toast('Couldn’t update hub skills: ' + e.message); }
  }
  function bundlesView(){
    return h('div',
      h('div.library-hubhead', h('div', h('h2','Bundles'), h('p','Prepared sets of skills. The web API does not expose bundles yet, so this stays read-only in the dashboard.'))),
      liveEmpty('Bundles are not available from the web API yet. Install single skills from the Hub tab.'));
  }

  const hubSearch = debounce(async q => {
    if (state.browse !== 'hub') return;
    if (!q){ live.hub = null; live.hubErr = null; buildBody(); return; }
    live.hubErr = null; live.hub = null;
    if (state.browse === 'hub') buildBody();
    try {
      live.hub = await H.api.get('/api/skills/hub/search?q=' + encodeURIComponent(q) + '&limit=20');
    } catch (e){ live.hubErr = e; }
    if (state.browse === 'hub' && state.q === q) buildBody();
  }, 400);

  function liveFilter(q){
    if (state.browse === 'hub'){ hubSearch(q); return; }
    if (state.browse === 'bundles'){ return; }
    const n = skillsCtl ? skillsCtl.applySearch(q) : 0;
    const nr = body.querySelector('.library-nores');
    if (nr && !nr.classList.contains('library-liveerr')) nr.hidden = !q || n > 0;
  }
  filterActive = liveFilter;

  load();
  return wrap;
}

/* ------------------------------------------------------ live: memory */
function buildMemoryLive(){
  const wrap = h('div.library-memorywrap');
  const grid = h('div.library-memory');
  const facts = h('div.library-facts');
  const factsState = h('div.library-nores', {hidden:true});
  const memCount = pill('–', '');

  /* soul */
  const soulTa = h('textarea.textarea.library-soultext', {'aria-label':'SOUL.md', spellcheck:'false'});
  const soulNote = h('span.faint', 'Loading…');
  soulTa.addEventListener('input', () => { soulNote.textContent = soulTa.value === live.soulSaved ? 'No unsaved changes' : 'Unsaved changes'; });
  const saveSoul = h('button.btn.primary', {onclick:doSaveSoul}, 'Save');
  const revertSoul = h('button.btn', {onclick:doRevertSoul}, 'Revert');
  const soul = h('div.card.library-soul',
    h('div.card-h', h('span','Soul'), h('span.library-path','SOUL.md'), h('div.grow'), soulNote),
    h('div.card-b',
      h('p.library-hint','SOUL.md is prepended to every system prompt. Edit tone, boundaries and defaults · not facts; those go in memory.'),
      soulTa,
      h('div.library-soulrow', saveSoul, revertSoul, h('div.grow'),
        h('span.faint','~/.hermes/SOUL.md · profile ' + live.profile()))));

  /* provider */
  const providerStatus = h('span');
  const provider = h('select.select.library-provider#library-provider-sel', {'aria-label':'Memory provider',
    onchange:e => setProvider(e.target.value, e.target)});

  const addInput = h('input.input', {placeholder:'Add a memory · one sentence', 'aria-label':'Add a memory',
    onkeydown:e => { if (e.key === 'Enter') addMemory(addInput); }});
  const addBtn = h('button.btn', {onclick:() => addMemory(addInput)}, 'Add');

  const memCard = h('div.card.library-memcard',
    h('div.card-h', h('span','What Hermes remembers'), memCount, h('div.grow'), h('span.faint','MEMORY.md · built-in file')),
    h('div.library-providerrow', h('label', {for:'library-provider-sel'}, 'Memory provider'), provider, providerStatus),
    facts, factsState,
    h('div.library-addmem', addInput, addBtn));

  /* journey */
  const journeyBox = h('div.library-journey');
  const journeyState = h('div.library-nores', {hidden:true});
  const jseg = H.seg([{id:'all',label:'All'},{id:'skills',label:'Skills'},{id:'memories',label:'Memories'}], state.journeyFilter, id => {
    state.journeyFilter = id; paintJourney();
  });
  jseg.setAttribute('aria-label','Filter journey');
  const journey = h('div.sec.library-journeysec',
    h('div.library-journeyhead',
      h('div', h('h2','Journey'), h('p.library-hint','What Hermes learned · skills and memories from the learning graph.')),
      h('div.grow'), jseg),
    journeyBox, journeyState);

  grid.append(soul, memCard);
  wrap.append(grid, journey);

  async function loadSoul(){
    soulNote.textContent = 'Loading…';
    try {
      const d = await H.api.get('/api/profiles/' + encodeURIComponent(live.profile()) + '/soul');
      live.soulExists = d && d.exists !== false;
      live.soul = String((d && d.content) || '');
      live.soulSaved = live.soul;
      live.soulErr = null;
      soulTa.value = live.soul;
      soulNote.textContent = live.soulExists ? 'No unsaved changes' : 'No SOUL.md yet · saving creates it';
    } catch (e){
      live.soulErr = e;
      soulTa.disabled = true; saveSoul.disabled = true; revertSoul.disabled = true;
      soulNote.textContent = 'Couldn’t load SOUL.md: ' + e.message;
    }
  }
  async function doSaveSoul(){
    saveSoul.disabled = true; saveSoul.textContent = 'Saving…';
    try {
      await H.api.put('/api/profiles/' + encodeURIComponent(live.profile()) + '/soul', {content:soulTa.value});
      live.soul = soulTa.value; live.soulSaved = soulTa.value;
      soulNote.textContent = 'Saved · takes effect next turn';
      toast('SOUL.md saved');
    } catch (e){ toast('Couldn’t save SOUL.md: ' + e.message); }
    finally { saveSoul.disabled = false; saveSoul.textContent = 'Save'; }
  }
  async function doRevertSoul(){
    await loadSoul();
    toast('Reverted to the saved SOUL.md');
  }

  function providerLabel(name){
    if (!name) return 'Built-in';
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  function paintProvider(){
    const st = live.memStatus;
    if (!st){ providerStatus.replaceChildren(h('span.faint','…')); return; }
    const active = st.active || '';
    const row = (st.providers || []).find(p => p.name === active);
    const ok = !active || (row && row.available);
    providerStatus.replaceChildren(
      h('span.dot' + (ok ? '.pos' : '.warn')),
      h('span', active ? (row ? row.status.replace(/_/g,' ') : 'configured') : (live.memories ? live.memories.length + ' facts in MEMORY.md' : 'built-in file store')));
  }
  function paintProviderSelect(){
    const st = live.memStatus || {providers:[]};
    const opts = [h('option', {value:'', selected:!st.active || st.active === 'built-in'}, 'Built-in (MEMORY.md)')];
    (st.providers || []).forEach(p => {
      const unavailable = !p.available;
      opts.push(h('option', {value:p.name, selected:st.active === p.name, disabled:unavailable,
        title:unavailable ? 'Needs setup: ' + (p.status || 'unavailable') : p.description}, providerLabel(p.name) + (unavailable ? ' · needs setup' : '')));
    });
    provider.replaceChildren.apply(provider, opts);
    const active = (st.providers || []).find(p => p.name === st.active);
    provider.title = active ? active.description : 'Facts live in ~/.hermes/memories/MEMORY.md';
  }
  async function setProvider(value, sel){
    try {
      await H.api.put('/api/memory/provider', {provider:value});
      if (live.memStatus) live.memStatus.active = value;
      paintProvider(); paintProviderSelect();
      toast('Memory provider: ' + providerLabel(value));
    } catch (e){
      toast('Couldn’t switch provider: ' + e.message);
      paintProviderSelect();
    }
  }

  async function loadMemStatus(){
    try {
      live.memStatus = await H.api.get('/api/memory');
      live.memStatusErr = null;
    } catch (e){ live.memStatusErr = e; live.memStatus = null; }
    paintProviderSelect(); paintProvider();
  }
  async function loadFacts(){
    facts.replaceChildren(liveLoad('Loading memories…'));
    try {
      const d = await H.api.get('/api/fs/read-text?path=' + encodeURIComponent(MEM_PATH));
      const entries = parseFacts(d && d.text);
      live.memories = entries;
      live.memoriesErr = null;
      paintFacts();
    } catch (e){
      if (e.status === 404){ live.memories = []; live.memoriesErr = null; paintFacts(); }
      else { live.memoriesErr = e; live.memories = null; facts.replaceChildren(liveErr(e, loadFacts, 'memories')); }
    }
    memCount.textContent = (live.memories ? live.memories.length : '–') + ' facts';
    paintProvider();
  }
  function paintFacts(){
    facts.replaceChildren();
    const list = live.memories || [];
    if (!list.length){ facts.append(h('div.empty','Nothing remembered yet. Add a fact above.')); return; }
    list.forEach((text, i) => facts.append(memRowLive(text, i)));
    if (state.q) filterMemDom(state.q);
  }
  function memRowLive(text, idx){
    const row = h('div.library-mem', {'data-search':text.toLowerCase()},
      h('div.library-mem-main',
        h('div.library-mem-text', text),
        h('div.library-mem-meta', h('span','MEMORY.md'), h('span.library-dotsep','·'), h('span','entry ' + (idx + 1)))),
      h('button.btn.ghost.sm.library-forget', {onclick:() => confirmForget(row, text, idx)}, 'Forget'));
    return row;
  }
  function confirmForget(row, text, idx){
    row.replaceChildren(
      h('div.library-confirmtext', 'Forget “' + (text.length > 74 ? text.slice(0,74) + '…' : text) + '”? ',
        h('span.faint','Rewrites MEMORY.md without this entry.')),
      h('button.btn.sm.danger', {onclick:async ev => {
        const btn = ev.currentTarget; btn.disabled = true; btn.textContent = 'Forgetting…';
        const next = (live.memories || []).filter((_, i) => i !== idx);
        try {
          await writeFacts(next);
          live.memories = next; paintFacts();
          memCount.textContent = next.length + ' facts';
          toast('Forgotten · ' + next.length + ' facts left');
        } catch (e){
          btn.disabled = false; btn.textContent = 'Forget';
          toast('Couldn’t forget that: ' + e.message);
        }
      }}, 'Forget'),
      h('button.btn.ghost.sm', {onclick:() => row.replaceWith(memRowLive(text, idx))}, 'Keep'));
  }
  async function addMemory(input){
    const v = input.value.trim();
    if (!v){ toast('Type a fact first'); input.focus(); return; }
    const next = (live.memories || []).concat([v]);
    try {
      await writeFacts(next);
      live.memories = next; input.value = ''; paintFacts();
      memCount.textContent = next.length + ' facts';
      toast('Memory added · ' + next.length + ' facts');
    } catch (e){ toast('Couldn’t add that memory: ' + e.message); }
  }

  async function loadJourney(){
    journeyBox.replaceChildren(liveLoad('Loading journey…'));
    try {
      const d = await H.api.get('/api/learning/graph');
      live.journey = (d && Array.isArray(d.nodes)) ? d.nodes : [];
      live.journeyErr = null;
      paintJourney();
    } catch (e){
      live.journeyErr = e; live.journey = null;
      journeyBox.replaceChildren(liveErr(e, loadJourney, 'journey'));
    }
  }
  function paintJourney(){
    journeyBox.replaceChildren();
    if (live.journeyErr) return;
    const nodes = live.journey || [];
    const filtered = nodes.filter(n => state.journeyFilter === 'all' || (state.journeyFilter === 'skills' ? n.kind === 'skill' : n.kind !== 'skill'));
    if (!filtered.length){ journeyBox.append(h('div.empty','Nothing learned yet for this filter.')); return; }
    const groups = new Map();
    filtered.forEach(n => {
      const key = fmtDay(n.timestamp);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(n);
    });
    Array.from(groups.entries()).slice(0, 10).forEach(([day, items]) => {
      const group = h('div.library-jgroup');
      group.append(h('div.library-jday', h('span', day), h('span.faint', items.length + (items.length === 1 ? ' item' : ' items'))));
      const tl = h('div.library-tl');
      items.slice(0, 12).forEach(n => tl.append(h('div.library-tev', {'data-search':(n.label + ' ' + (n.category || '') + ' ' + n.kind).toLowerCase(), 'data-kind':n.kind},
        h('span.library-tdot' + (n.kind === 'skill' ? '' : '.warn')),
        h('div.library-tbody',
          h('div.library-ttitle', n.label || n.id),
          h('div.library-tmeta', h('span.library-tkind', n.kind === 'skill' ? 'Skill' : 'Memory'),
            h('span.library-dotsep','·'), h('span', (n.category ? n.category + ' · ' : '') + (n.useCount ? n.useCount + ' uses' : n.state || 'learned')))))));
      group.append(tl);
      journeyBox.append(group);
    });
  }

  function filterMemDom(q){
    let nf = 0;
    facts.querySelectorAll('.library-mem').forEach(el => { const hit = !q || el.dataset.search.includes(q); el.hidden = !hit; if (hit) nf++; });
    factsState.hidden = nf > 0 || !(live.memories || []).length;
    let nj = 0;
    journeyBox.querySelectorAll('.library-tev').forEach(el => { const hit = !q || el.dataset.search.includes(q); el.hidden = !hit; if (hit) nj++; });
    journeyBox.querySelectorAll('.library-jgroup').forEach(g => { g.hidden = !g.querySelector('.library-tev:not([hidden])'); });
    journeyState.hidden = nj > 0;
  }
  filterActive = q => filterMemDom(q);

  factsState.textContent = 'No memories match that search.';
  journeyState.textContent = 'Nothing in the learning graph matches that search.';
  loadSoul(); loadMemStatus(); loadFacts(); loadJourney();
  return wrap;
}

/* ------------------------------------------------------- live: tools */
function buildToolsLive(){
  const wrap = h('div.library-toolswrap');
  let pluginsCtl = null;
  const summary = h('div.library-summary', 'Loading toolsets…');
  const bar = h('div.library-bar',
    h('span.library-inline-label','Profile ' + live.profile()), summary,
    h('div.grow'), h('span.faint','Changes apply to new turns'));
  const grid = h('div.library-toolgrid');
  const mcpSec = h('div.sec.library-mcpsec');
  const lower = h('div.library-grid2');
  wrap.append(bar, grid, mcpSec, lower);

  async function loadToolsets(){
    grid.replaceChildren(liveLoad('Loading toolsets…'));
    try {
      const rows = await H.api.get('/api/tools/toolsets');
      live.toolsets = Array.isArray(rows) ? rows : [];
      live.toolsetsErr = null;
      if (state.scope !== 'hermes') state.scope = 'hermes';
    } catch (e){
      live.toolsetsErr = e; live.toolsets = null;
      grid.replaceChildren(liveErr(e, loadToolsets, 'toolsets')); summary.textContent = 'Couldn’t load toolsets';
      return;
    }
    paintToolsets();
  }
  function paintToolsets(){
    grid.replaceChildren();
    const rows = live.toolsets || [];
    if (!rows.length) grid.append(h('div.empty','No toolsets configured.'));
    rows.forEach(t => grid.append(toolCard(t)));
    const on = rows.filter(t => t.enabled).length;
    const tools = rows.reduce((n, t) => n + (t.enabled ? (t.tools || []).length : 0), 0);
    summary.replaceChildren(num(on), ' of ', num(rows.length), ' toolsets on · ' + tools + ' tools available');
    if (state.q) filterToolsDom(state.q);
  }
  function toolCard(t){
    const card = h('div.library-tool', {'data-search':(t.name + ' ' + (t.label || '') + ' ' + (t.description || '') + ' ' + (t.platform_label || '')).toLowerCase(), 'data-on':String(!!t.enabled)});
    const sw = H.sw(!!t.enabled, v => toggleToolset(t, v, card), (t.label || t.name) + ' for this profile');
    card.append(
      h('div.library-tool-h', h('span.library-tool-name', t.label || t.name), sw),
      h('p.library-tool-desc', t.description || ''),
      h('div.library-tool-foot',
        h('span', h('span.num', String((t.tools || []).length)), ' tools'),
        h('span.faint', t.platform_label || t.platform || ''),
        t.configured ? null : pill('Needs setup','warn')));
    return card;
  }
  async function toggleToolset(t, enabled, card){
    try {
      await H.api.put('/api/tools/toolsets/' + encodeURIComponent(t.name), {enabled:!!enabled});
      t.enabled = !!enabled;
      card.setAttribute('data-on', String(t.enabled));
      paintToolsets();
    } catch (e){
      toast('Couldn’t change ' + (t.label || t.name) + ': ' + e.message);
      live.toolsets = null; await loadToolsets();
    }
  }

  /* MCP */
  async function loadMcp(){
    mcpSec.replaceChildren(liveLoad('Loading MCP servers…'));
    try {
      const d = await H.api.get('/api/mcp/servers');
      live.mcp = Array.isArray(d && d.servers) ? d.servers : [];
      live.mcpErr = null;
    } catch (e){
      live.mcpErr = e; live.mcp = null;
      mcpSec.replaceChildren(h('div.library-journeyhead', h('div', h('h2','MCP servers')), h('div.grow')),
        liveErr(e, loadMcp, 'MCP servers'));
      return;
    }
    paintMcp();
  }
  function paintMcp(){
    const rows = live.mcp || [];
    const table = h('table.tbl.library-mcptbl');
    table.append(h('thead', h('tr', h('th','Server'), h('th','Transport'), h('th','Status'), h('th.r','Tools'), h('th','Last test'), h('th.r', h('span.sr','Actions')))));
    const tbody = h('tbody');
    rows.forEach(s => mcpRowLive(s, tbody));
    table.append(tbody);
    const tested = rows.reduce((n, s) => n + (live.mcpTested[s.name] ? live.mcpTested[s.name].tools.length : 0), 0);
    const addBtn = h('button.btn.primary', {onclick:addServerLive}, 'Add MCP server');
    mcpSec.replaceChildren(
      h('div.library-journeyhead',
        h('div', h('h2','MCP servers'), h('p.library-hint','Model Context Protocol servers Hermes can call. Test a server to list its tools.')),
        h('div.grow'), h('span.faint', rows.length + ' servers · ' + tested + ' tools discovered'), addBtn),
      rows.length ? h('div.scroll-x', table) : liveEmpty('No MCP servers yet. Add one, or install from the catalog in Settings.'));
  }
  function mcpRowLive(s, tbody){
    const tested = live.mcpTested[s.name];
    const status = h('span.library-status',
      h('span.dot.' + (s.enabled ? (s.auth === 'oauth' && !tested ? 'warn' : 'pos') : '')),
      s.enabled ? (s.auth === 'oauth' && !tested ? 'Needs auth' : 'Enabled') : 'Disabled');
    const last = h('span.library-lasttest', tested ? fmtAgo(tested.at / 1000) : 'never');
    const toolCount = tested ? tested.tools.length : '–';
    const chev = h('span.library-mchev', H.ic('chev','sm'));
    const detail = h('tr.library-mcpdetailrow', {hidden:true},
      h('td', {colspan:'6'}, h('div.library-mcpdetail',
        tested && !tested.ok ? h('div.library-mcperror', H.ic('warn','sm'), h('div', h('b','Test failed · '), tested.error || 'unknown error')) : null,
        tested && tested.ok && tested.tools.length ? h('div.library-mcptools', tested.tools.map(t => h('div.library-mcptool',
          h('div.grow', h('div.library-mcptoolname', t.name), h('div.library-mcptooldesc', t.description || ''))))) : null,
        h('div.library-mcpnote',
          h('span', s.transport === 'stdio' ? (s.command || '') + ' ' + (s.args || []).join(' ') : s.url || ''),
          h('span.library-dotsep','·'),
          h('span', 'auth ' + (s.auth || 'none')),
          s.source === 'plugin' ? h('span.library-dotsep','·') : null,
          s.source === 'plugin' ? h('span','provided by plugin ' + s.plugin) : null))));
    const nameBtn = h('button.library-mcpname', {'aria-expanded':'false', onclick:() => {
      const open = detail.hasAttribute('hidden');
      hiddenAttr(detail, !open);
      nameBtn.setAttribute('aria-expanded', String(open));
    }}, chev, h('span', s.name));
    const testBtn = h('button.btn.sm', {onclick:async ev => {
      const b = ev.currentTarget; b.disabled = true; b.textContent = 'Testing…';
      try {
        const r = await H.api.post('/api/mcp/servers/' + encodeURIComponent(s.name) + '/test');
        live.mcpTested[s.name] = {ok: !!r.ok, tools: (r && Array.isArray(r.tools)) ? r.tools : [], error: r && r.error, at: Date.now()};
        toast(r.ok ? s.name + ': ' + (r.tools || []).length + ' tools responded' : s.name + ': ' + (r.error || 'test failed'));
        paintMcp();
      } catch (e){
        b.disabled = false; b.textContent = 'Test';
        toast('Couldn’t test ' + s.name + ': ' + e.message);
      }
    }}, 'Test');
    const enabledSw = H.sw(!!s.enabled, async v => {
      try {
        await H.api.put('/api/mcp/servers/' + encodeURIComponent(s.name) + '/enabled', {enabled:!!v});
        s.enabled = !!v; toast(s.name + (v ? ' enabled' : ' disabled') + ' · applies next session'); paintMcp();
      } catch (e){ toast('Couldn’t change ' + s.name + ': ' + e.message); loadMcp(); }
    }, s.name + ' enabled');
    const del = h('button.btn.ghost.sm', {onclick:() => removeServerLive(s)}, 'Remove');
    tbody.append(h('tr.library-mcprow', {'data-search':(s.name + ' ' + s.transport + ' ' + (s.url || '') + ' ' + (s.command || '')).toLowerCase()},
      h('td', h('div.library-mcpcell', nameBtn, h('div.library-mcpdesc', s.transport === 'stdio' ? (s.command || '') : (s.url || '')))),
      h('td', h('span.mono.library-transport', s.transport)),
      h('td', status),
      h('td.r', h('span.num', String(toolCount))),
      h('td', last),
      h('td.r', h('div.library-mcpacts', testBtn, del, enabledSw))), detail);
  }
  function removeServerLive(s){
    const m = H.modal(h('div.library-modal',
      h('div.library-modal-h', h('h3','Remove ' + s.name + '?'),
        h('button.btn.ghost.icon.sm', {'aria-label':'Close', onclick:() => m.close()}, H.ic('x','sm'))),
      h('p.library-modalsub','Deletes the server entry from config. Credentials it stored in auth.json are left alone.'),
      h('div.library-modalfoot', h('span.faint','Running threads keep their last result'), h('div.grow'),
        h('button.btn.ghost', {onclick:() => m.close()}, 'Cancel'),
        h('button.btn.danger', {onclick:async ev => {
          const b = ev.currentTarget; b.disabled = true; b.textContent = 'Removing…';
          try {
            await H.api.del('/api/mcp/servers/' + encodeURIComponent(s.name));
            delete live.mcpTested[s.name]; m.close();
            toast('Removed ' + s.name);
            await loadMcp();
          } catch (e){ b.disabled = false; b.textContent = 'Remove server'; toast('Couldn’t remove ' + s.name + ': ' + e.message); }
        }}, 'Remove server'))), {width:520});
  }
  function addServerLive(){
    const nameIn = h('input.input', {placeholder:'linear', 'aria-label':'Server name'});
    const cmdIn = h('input.input', {placeholder:'npx -y @modelcontextprotocol/server-filesystem ~/hermes-maintenance', 'aria-label':'Command'});
    const argsIn = h('input.input', {placeholder:'(optional) extra arguments', 'aria-label':'Arguments'});
    const envIn = h('textarea.textarea', {rows:'2', placeholder:'KEY=value  (one per line)', 'aria-label':'Environment'});
    const urlIn = h('input.input', {placeholder:'https://mcp.linear.app/sse', 'aria-label':'Server URL'});
    const authSel = h('select.select', {'aria-label':'Authentication'},
      [['none','None'],['oauth','OAuth'],['header','Bearer token']].map(([v,l]) => h('option', {value:v}, l)));
    const tokenIn = h('input.input', {type:'password', placeholder:'Bearer token (stored in .env, never in config)', 'aria-label':'Bearer token', autocomplete:'off'});
    const tokenField = h('div.field', {hidden:true}, h('label','Bearer token'), tokenIn, h('span.hint','Sent once to the server; never shown again.'));
    authSel.addEventListener('change', () => hiddenAttr(tokenField, authSel.value !== 'header'));
    const stdioBox = h('div.library-mform', h('div.field', h('label','Command'), cmdIn),
      h('div.field', h('label','Arguments'), argsIn),
      h('div.field', h('label','Environment'), envIn, h('span.hint','Values are written to the profile .env, not config.yaml.')));
    const httpBox = h('div.library-mform', {hidden:true},
      h('div.field', h('label','Server URL'), urlIn),
      h('div.field', h('label','Authentication'), authSel), tokenField);
    let transport = 'stdio';
    const seg = H.seg([{id:'stdio',label:'stdio'},{id:'http',label:'http'}], 'stdio', id => {
      transport = id; hiddenAttr(stdioBox, id !== 'stdio'); hiddenAttr(httpBox, id !== 'http');
    });
    const errLine = h('div.library-err', {hidden:true}, 'Add a name and a command or URL.');
    const m = H.modal(h('div.library-modal',
      h('div.library-modal-h', h('h3','Add MCP server'),
        h('button.btn.ghost.icon.sm', {'aria-label':'Close', onclick:() => m.close()}, H.ic('x','sm'))),
      h('p.library-modalsub','Hermes starts stdio servers itself; http servers need a reachable URL. Test it after adding.'),
      h('div.library-mform', h('div.field', h('label','Name'), nameIn), h('div.field', h('label','Transport'), seg)),
      stdioBox, httpBox, errLine,
      h('div.library-modalfoot', h('span.faint','Written to ~/.hermes/config.yaml'), h('div.grow'),
        h('button.btn.ghost', {onclick:() => m.close()}, 'Cancel'),
        h('button.btn.primary', {onclick:async ev => {
          const b = ev.currentTarget;
          const name = nameIn.value.trim();
          const body = {name};
          if (transport === 'stdio'){
            const cmd = cmdIn.value.trim();
            if (!name || !cmd){ errLine.removeAttribute('hidden'); return; }
            body.command = cmd;
            body.args = argsIn.value.trim() ? argsIn.value.trim().split(/\s+/) : [];
            const env = {};
            envIn.value.split('\n').map(l => l.trim()).filter(Boolean).forEach(l => {
              const i = l.indexOf('='); if (i > 0) env[l.slice(0,i).trim()] = l.slice(i+1).trim();
            });
            if (Object.keys(env).length) body.env = env;
          } else {
            const url = urlIn.value.trim();
            if (!name || !url){ errLine.removeAttribute('hidden'); return; }
            body.url = url;
            body.auth = authSel.value;
            if (authSel.value === 'header'){
              if (!tokenIn.value.trim()){ errLine.textContent = 'Enter the bearer token or choose None.'; errLine.removeAttribute('hidden'); return; }
              body.bearer_token = tokenIn.value.trim();
            }
          }
          b.disabled = true; b.textContent = 'Adding…';
          try {
            await H.api.post('/api/mcp/servers', body);
            m.close(); toast('Added ' + name + ' · run Test to list its tools');
            await loadMcp();
          } catch (e){ b.disabled = false; b.textContent = 'Add server'; errLine.textContent = 'Couldn’t add: ' + e.message; errLine.removeAttribute('hidden'); }
        }}, 'Add server'))), {width:620});
  }

  /* plugins + hooks */
  async function loadPlugins(){
    try {
      const d = await H.api.get('/api/dashboard/plugins/hub');
      live.plugins = Array.isArray(d && d.plugins) ? d.plugins : [];
      live.pluginsErr = null;
    } catch (e){ live.pluginsErr = e; live.plugins = null; }
    paintLower();
  }
  async function loadHooks(){
    try {
      const d = await H.api.get('/api/ops/hooks');
      live.hooks = Array.isArray(d && d.hooks) ? d.hooks : [];
      live.hooksErr = null;
    } catch (e){ live.hooksErr = e; live.hooks = null; }
    paintLower();
  }
  function paintLower(){
    const plugins = h('div.card.library-plugins');
    if (live.pluginsErr) plugins.append(liveErr(live.pluginsErr, loadPlugins, 'plugins'));
    else if (!live.plugins) plugins.append(liveLoad('Loading plugins…'));
    else {
      pluginsCtl = collapsibleGroups({
        storeKey:'hermes.library.plugins.open',
        groups: pluginCategoryGroups(live.plugins).map(g => ({
          key:g.key, label:g.label, count:g.rows.length,
          defaultOpen: g.rows.some(p => p.runtime_status !== 'disabled'),
          items: g.rows.map(p => ({el:pluginRowLive(p),
            search:(p.name + ' ' + (p.description || '') + ' ' + (p.source || '')).toLowerCase(),
            enabled: () => p.runtime_status !== 'disabled'})),
        })),
      });
      plugins.append(h('div.card-h', h('span','Plugins'), h('span.faint', live.plugins.length + ' installed'), h('div.grow'), h('span.faint','~/.hermes/plugins')),
        live.plugins.length ? pluginsCtl.el : liveEmpty('No plugins installed.'));
    }
    const hooks = h('div.card.library-hooks');
    if (live.hooksErr) hooks.append(liveErr(live.hooksErr, loadHooks, 'hooks'));
    else if (!live.hooks) hooks.append(liveLoad('Loading hooks…'));
    else {
      hooks.append(h('div.card-h', h('span','Hooks'), h('span.faint', live.hooks.length + ' installed'), h('div.grow'), h('span.faint','read-only here')),
        live.hooks.length ? h('div.list', live.hooks.map(x => h('div.row.library-hook', {'data-search':String(x.event || '').toLowerCase()},
          h('div.grow', h('div.library-hookevt', x.event || 'unknown event'), h('div.library-hookscript', x.command || x.script || '')),
          h('span.faint','on')))) : liveEmpty('No shell hooks installed. Add them with hermes hooks.'));
    }
    lower.replaceChildren(plugins, hooks);
    if (state.q) filterToolsDom(state.q);
  }
  function pluginRowLive(p){
    const enabled = p.runtime_status !== 'disabled';
    const ver = h('span.library-plugin-ver.mono', 'v' + (p.version || '–'));
    const flag = h('span.faint', p.runtime_status === 'inactive' ? 'Inactive' : (p.runtime_status === 'enabled' ? 'Enabled' : 'Disabled'));
    const upd = h('button.btn.sm', {title:'Update this plugin from its source', onclick:ev => updatePlugin(p, ev.currentTarget)}, 'Update');
    return h('div.row.library-plugin', {'data-search':(p.name + ' ' + (p.description || '') + ' ' + (p.source || '')).toLowerCase()},
      h('div.grow', h('div.library-plugin-name', p.name), h('div.s', p.description || '')),
      ver, flag, upd,
      H.sw(enabled, async v => {
        try {
          await H.api.post('/api/dashboard/agent-plugins/' + encodeURIComponent(p.name) + (v ? '/enable' : '/disable'));
          p.runtime_status = v ? 'enabled' : 'disabled';
          toast(p.name + (v ? ' enabled' : ' disabled') + ' · restart required for some');
          paintLower();
        } catch (e){ toast('Couldn’t change ' + p.name + ': ' + e.message); }
      }, p.name + ' enabled'));
  }
  async function updatePlugin(p, btn, accept){
    btn.disabled = true; btn.textContent = 'Updating…';
    try {
      const r = await H.api.post('/api/dashboard/agent-plugins/' + encodeURIComponent(p.name) + '/update',
        {accept_capabilities:!!accept, force:false});
      if (r && r.consent_required){
        btn.disabled = false; btn.textContent = 'Update';
        confirmConsent(p, r, btn);
        return;
      }
      if (r && r.scan_blocked){
        btn.disabled = false; btn.textContent = 'Update';
        toast('Update blocked by the security scan: ' + (r.scan_verdict || 'review required'));
        return;
      }
      toast(p.name + (r && r.unchanged ? ' is already current' : ' updated'));
      await loadPlugins();
    } catch (e){
      btn.disabled = false; btn.textContent = 'Update';
      toast('Couldn’t update ' + p.name + ': ' + e.message);
    }
  }
  function confirmConsent(p, r, btn){
    const m = H.modal(h('div.library-modal',
      h('div.library-modal-h', h('h3','Update ' + p.name + '?'),
        h('button.btn.ghost.icon.sm', {'aria-label':'Close', onclick:() => m.close()}, H.ic('x','sm'))),
      h('p.library-modalsub','The new version widens what this plugin can do. Review the change, then accept to install it.'),
      h('div.library-compare', h('div.library-comparecol', h('div.library-comparehead', h('b','Capability change')),
        (r.delta_lines || []).length ? h('pre.library-front.library-docpre', (r.delta_lines || []).join('\n')) : h('p','No details returned.'))),
      h('div.library-modalfoot', h('span.faint','Nothing changes until you accept'), h('div.grow'),
        h('button.btn.ghost', {onclick:() => m.close()}, 'Cancel'),
        h('button.btn.primary', {onclick:() => { m.close(); updatePlugin(p, btn, true); }}, 'Accept and update'))), {width:640});
  }

  function filterToolsDom(q){
    wrap.querySelectorAll('.library-tool, .library-hook').forEach(el => {
      el.hidden = !!q && !String(el.dataset.search || '').includes(q);
    });
    wrap.querySelectorAll('.library-mcprow').forEach(el => { el.hidden = !!q && !String(el.dataset.search || '').includes(q); });
    if (pluginsCtl) pluginsCtl.applySearch(q);
  }
  filterActive = filterToolsDom;

  loadToolsets(); loadMcp(); loadPlugins(); loadHooks();
  return wrap;
}

/* ------------------------------------------------------- live: files */
function buildFilesLive(){
  const f = live.files;
  const wrap = h('div.library-fileswrap');
  const rootSel = h('select.select.library-rootsel', {'aria-label':'Folder', onchange:e => {
    f.path = e.target.value; f.sel = null; f.doc = null;
    loadDir();
  }}, ['~/.hermes','~','~/hermes-maintenance'].map(p => h('option', {value:p, selected:f.path === p}, p)));
  const crumb = h('span.library-filehint', f.path);
  const upBtn = h('button.btn.sm', {onclick:goUp}, 'Up one level');
  const bar = h('div.library-filesbar', h('label.library-inline-label','Folder'), rootSel, crumb,
    h('div.grow'), upBtn, h('span.faint','Read-only · secrets are never listed'));
  const tree = h('div.library-tree', {role:'tree', 'aria-label':'Files in ' + f.path});
  const preview = h('div.library-preview');
  const files = h('div.library-files', tree, preview);
  wrap.append(bar, files);

  function parentOf(path){
    if (!path || path === '~' || path === '/') return null;
    const i = path.lastIndexOf('/');
    if (i <= 0) return null;
    const p = path.slice(0, i);
    return p === '' ? '/' : p;
  }
  function goUp(){
    const p = parentOf(f.path);
    if (!p){ toast('Already at the top of this folder'); return; }
    f.path = p; f.sel = null; f.doc = null; loadDir();
  }
  async function loadDir(){
    crumb.textContent = f.path;
    tree.replaceChildren(liveLoad('Loading ' + f.path + '…'));
    try {
      const d = await H.api.get('/api/fs/list?path=' + encodeURIComponent(f.path));
      const entries = (d && Array.isArray(d.entries)) ? d.entries : [];
      f.entries = entries.slice().sort((a, b) => (b.isDirectory - a.isDirectory) || a.name.localeCompare(b.name));
      f.err = null;
      paintTree();
    } catch (e){
      f.err = e; f.entries = null;
      tree.replaceChildren(liveErr(e, loadDir, f.path));
    }
  }
  function paintTree(){
    tree.replaceChildren();
    const entries = f.entries || [];
    if (!entries.length){ tree.append(liveEmpty('This folder is empty, or its contents are hidden.')); return; }
    entries.forEach(e => {
      const row = h('button.library-leaf', {'aria-current':String(f.sel === e.path), 'aria-label':(e.isDirectory ? 'Folder ' : 'File ') + e.name,
        'data-search':(e.name + ' ' + e.path).toLowerCase(), onclick:() => {
          if (e.isDirectory){ f.path = e.path; f.sel = null; f.doc = null; loadDir(); }
          else openFile(e);
        }},
        h('span.library-leaficon', H.ic(e.isDirectory ? 'folder' : 'file','sm')),
        h('span.grow.ellip', e.name + (e.isDirectory ? '/' : '')),
        null);
      tree.append(row);
    });
    if (state.q) filterFilesDom(state.q);
  }
  function paintPreview(){
    if (!f.sel){ preview.replaceChildren(h('div.empty','Pick a file to preview it. Secrets never load.')); return; }
    const name = f.sel.slice(f.sel.lastIndexOf('/') + 1);
    const head = h('div.library-preview-h',
      h('span.library-fileicon', H.ic(f.secret ? 'lock' : 'file','sm')),
      h('div.grow', h('div.library-preview-name', f.sel),
        h('div.library-preview-meta', f.doc ? (f.doc.language || 'text') + ' · ' + fmtBytes(f.doc.byteSize) + (f.doc.truncated ? ' · first 64 KB' : '') : 'file')));
    const body = h('div.library-previewbody');
    if (f.secret){
      body.append(h('div.library-secret',
        h('span.library-seclogo', H.ic('lock','lg')),
        h('div.library-sectitle','Hidden by design'),
        h('p','', 'Hermes never sends .env, auth.json or vault contents to the browser. Read a key with ', h('span.mono','hermes config get'), ' or edit the file on the machine.')));
    } else if (f.docErr){
      body.append(h('div.library-nores', h('div','Couldn’t read ' + name + ': ' + f.docErr.message),
        h('button.btn.sm', {onclick:() => openFile({path:f.sel, name})}, 'Retry')));
    } else if (!f.doc){
      body.append(liveLoad('Reading…'));
    } else if (f.doc.binary){
      body.append(h('div.library-secret',
        h('span.library-seclogo', H.ic('file','lg')),
        h('div.library-sectitle','Binary file'),
        h('p', fmtBytes(f.doc.byteSize) + ' · nothing to preview.')));
    } else {
      const code = h('div.library-code');
      String(f.doc.text || '').split('\n').forEach((line, i) => {
        code.append(h('div.library-cline', h('span.library-ln', String(i + 1)), h('span.library-lc', line.length ? line : ' ')));
      });
      body.append(code);
    }
    preview.replaceChildren(h('div.library-preview', head, body));
  }
  async function openFile(e){
    f.sel = e.path; f.doc = null; f.docErr = null; f.secret = false;
    paintTree(); paintPreview();
    try {
      const d = await H.api.get('/api/fs/read-text?path=' + encodeURIComponent(e.path));
      f.doc = d; f.docErr = null;
    } catch (err){
      if (err.status === 403) f.secret = true;
      else f.docErr = err;
    }
    if (f.sel === e.path) paintPreview();
  }
  function filterFilesDom(q){
    let n = 0;
    tree.querySelectorAll('.library-leaf').forEach(el => { const hit = !q || String(el.dataset.search || '').includes(q); el.hidden = !hit; if (hit) n++; });
    const nr = tree.querySelector('.library-nores');
    if (nr && !nr.classList.contains('library-liveerr')) nr.hidden = !q || n > 0;
  }
  filterActive = filterFilesDom;
  paintPreview(); loadDir();
  return wrap;
}

/* --------------------------------------------------------------- view */
H.views.library = {
  title: 'Library',
  render(root, ctx){
    state.ctx = ctx;
    state.root = root;
    const tab = ctx.route && ctx.route[0];
    state.tab = TABS.some(t => t.id === tab) ? tab : 'skills';
    state.q = '';
    history.replaceState(null, '', '#/library/' + state.tab);
    root.replaceChildren(pageEl());
  }
};
})();
