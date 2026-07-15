# ⚙️ System Architecture: Loops & Automation

*This is a living educational document. It explains the "Why" and "How" of every background system keeping the Hermes Agent alive. It is updated immediately whenever a new architectural change is deployed.*

---

## 1. The Fallback Proxy Loop (LiteLLM)

**What it does:** Ensures the Hermes agent never crashes when talking to the AI models.
**How it works:**
Normally, an agent talks directly to an API (like DeepSeek). If that API goes down, the agent crashes. We bypassed this by installing `LiteLLM` as a proxy. 
1. Hermes sends its text to `http://localhost:4000`.
2. LiteLLM intercepts it and forwards it to DeepSeek.
3. If DeepSeek returns a `500 Server Error` or a Rate Limit, LiteLLM catches the error, silently swallows it, and routes the exact same question to Google Gemini Flash.
4. Hermes receives the answer, completely unaware that a fallback occurred.

## 2. The Agentic Heartbeat (`systemd` linger)

**What it does:** Keeps the server running after you close your laptop.
**How it works:**
Linux servers are designed to kill all background tasks when an SSH connection closes to save memory. By enabling `loginctl enable-linger`, we tricked the Linux kernel into treating your specific user account as a permanent system service. This ensures the Hermes backend never sleeps.

## 3. The CI/CD Backup Loops (Cron Jobs)

**What it does:** Completely automates version control and code backups.
**How it works:**
We have autonomous background agents (cron schedules) running directly on the local machine to manage Git.
- **9:00 AM Loop (Standup):** An agent wakes up every morning, compiles yesterday's git logs and task progress into `daily_standup.md`, and sends the standup briefing directly to your Telegram chat via the VM's API connection.
- **5:00 PM Loop (Documentation):** An agent wakes up, reads our chat transcript, and extracts any new terminal commands we learned, formatting them into `command_reference.md`.
- **5:05 PM Loop (Push Command Reference):** A staggered agent that runs 5 minutes after the documentation loop, committing and pushing any new `command_reference.md` changes in `hermes-portfolio` directly to your remote GitHub repository on the `main` branch.
- **6:00 PM Loop (Staging):** An agent scans the `hermes-portfolio` folder for changes, and runs `git add .` and `git commit` automatically.
- **6:05 PM Loop (Push Backup):** A staggered agent that runs 5 minutes after the staging loop, checking `hermes-agent-project` for modifications, committing, and pushing them to your remote GitHub backup repository.
- **Weekly VM Backup (Saturday 9:00 AM / Cron: `0 9 * * 6`):** An agent wakes up, SSHs into the GCP VM to compress the active folders (excluding heavy dependencies and media caches), downloads the full `tar.gz` archive to your local backups directory with a datestamp using SCP, and purges the remote archive on the VM to save server space. This schedule runs for 7 iterations, auto-terminating on September 3, 2026.
- **Additional VM Backup (Wednesday Sept 2, 9:00 AM / Cron: `0 9 2 9 *`):** A one-shot agent that executes a full backup on September 2, 2026, at 9:00 AM, downloading the archive locally and cleaning up VM server space.

## 4. Hermes Agentic Automations (Internal Cron)

**What it does:** Runs automated background workflows directly in the cloud, interacting with your tools and messaging platforms.
**How it works:**
The Hermes Agent is equipped with an internal cron scheduler that runs tasks in the cloud VM context.
*   **6:00 AM WIB Briefing (Cron: `0 23 * * *` UTC):**
    *   Triggered at 11:00 PM UTC daily (corresponding to 6:00 AM WIB local time).
    *   Wakes up the agent, calls the **Composio Google Calendar integration** (`GOOGLECALENDAR_FIND_EVENT` / `GOOGLECALENDAR_EVENTS_LIST`) to fetch calendar events from 00:00 to 23:59 Asia/Jakarta time.
    *   Formats the list as a clean, markdown-formatted morning briefing and pushes the notification directly to your Telegram chat.
    *   Automatically falls back to a clean message ("No events scheduled today") if the calendar is empty.
*   **5:30 PM WIB Spending Tracker (Cron: `30 10 * * *` UTC):**
    *   Triggered at 10:30 AM UTC daily (corresponding to 5:30 PM WIB local time, delivering the update right before your 6:00 PM quiet hours block).
    *   Wakes up the agent, calls the **Composio Gmail integration** to scan recent emails from the past 24 hours.
    *   Extracts purchase receipts, ride-hailing/delivery transactions, online marketplace payment slips, and subscription notifications.
    *   Logs the date, merchant, and amount into a local SQLite database (`~/spending.db`).
    *   Pushes a compiled daily spending report directly to your Telegram chat.
