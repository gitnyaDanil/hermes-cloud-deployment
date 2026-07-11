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
- **5:00 PM Loop:** An agent wakes up, reads our chat transcript, and extracts any new terminal commands we learned, formatting them into `command_reference.md`.
- **6:00 PM Loop:** A second agent wakes up, scans the `hermes-portfolio` folder for changes, and runs `git add .` and `git commit` automatically. It uses strict "URL Binding" to authenticate securely without breaking the global Windows Credential Manager.

## 4. Hermes Agentic Automations (Internal Cron)

**What it does:** Sends a daily morning briefing of your Google Calendar schedule directly to you on Telegram.
**How it works:**
The Hermes Agent is equipped with an internal cron scheduler that runs tasks in the cloud VM context.
*   **6:00 AM WIB Briefing (Cron: `0 23 * * *` UTC):**
    *   Triggered at 11:00 PM UTC daily (corresponding to 6:00 AM WIB local time).
    *   Wakes up the agent, calls the **Composio Google Calendar integration** (`GOOGLECALENDAR_FIND_EVENT` / `GOOGLECALENDAR_EVENTS_LIST`) to fetch calendar events from 00:00 to 23:59 Asia/Jakarta time.
    *   Formats the list as a clean, markdown-formatted morning briefing and pushes the notification directly to your Telegram chat.
    *   Automatically falls back to a clean message ("No events scheduled today") if the calendar is empty.
