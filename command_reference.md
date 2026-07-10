# Hermes Agent Cloud Deployment: Command Reference Guide

This document serves as an educational reference, tracking and explaining all the major terminal commands used to successfully deploy, secure, and manage the Hermes autonomous AI agent on Google Cloud Platform. 

*Note: All sensitive IP addresses and API keys have been removed.*

---

## 1. Secure Cloud Access (SSH Keys)

Instead of using traditional passwords which can be brute-forced by hackers, we generated cryptographic SSH keys to securely access the Google Cloud VM from a local Windows terminal.

```bash
ssh-keygen -t rsa -b 4096 -f "$HOME\.ssh\gcp_hermes" -C "danielpolii19"
```
*   **`ssh-keygen`**: Invokes the built-in key generation program.
*   **`-t rsa`**: Sets the encryption algorithm to RSA (the industry standard).
*   **`-b 4096`**: Sets the bit size to 4096, providing military-grade encryption strength.
*   **`-f "$HOME\.ssh\gcp_hermes"`**: Dictates the exact filepath to save the private and public key files.

```bash
ssh danielpolii19@<YOUR_VM_EXTERNAL_IP> -i C:\Users\Daniel\.ssh\gcp_hermes
```
*   **`ssh`**: Invokes the Secure Shell program to connect to a remote server.
*   **`danielpolii19@<IP>`**: Specifies the target Linux username and the server's public IP address.
*   **`-i`**: Stands for "identity file." It forces the connection to use our specific private key file rather than asking for a typed password.

---

## 2. Server Management & Uptime

By default, Linux terminates all background processes when a user closes their SSH terminal. To keep the AI agent running 24/7 without needing to keep a laptop open, we manipulated the server's session manager.

```bash
loginctl enable-linger
```
*   **`loginctl`**: Interfaces with the Linux systemd login manager.
*   **`enable-linger`**: Forces the server to keep the user's background services (like the Hermes agent) alive indefinitely, even after they log out.

```bash
systemctl --user restart hermes-gateway
```
*   **`systemctl`**: The command used to control `systemd` (the Linux initialization system).
*   **`--user`**: Specifies that we are managing a service owned by our specific user account, not the root operating system.
*   **`restart`**: Stops and immediately restarts the Hermes background service, usually run after updating configuration settings.

---

## 3. Git Automation & Authentication

To allow the AI agent and scheduled cron jobs to push code autonomously without getting stuck on password prompts, we secured Git authentication using targeted credentials.

```bash
git remote set-url origin https://<USERNAME>:<TOKEN>@github.com/<USERNAME>/<REPO>.git
```
*   **`git remote set-url origin`**: Changes the destination URL that Git uses when pushing code to the cloud.
*   **`https://<USERNAME>:<TOKEN>@...`**: "Binds" a strict, Fine-Grained Personal Access Token directly into the URL. This bypasses the global Windows Credential Manager, ensuring the token is sandboxed strictly to this one repository.

---

## 4. Hybrid LLM Architecture (LiteLLM)

To ensure the agent never crashes if an API goes offline or hits rate limits, we installed a local proxy ("Traffic Cop") to silently route requests from DeepSeek to Google Gemini.

```bash
pip3 install litellm
```
*   **`pip3`**: The package installer for Python 3.
*   **`install litellm`**: Downloads and installs the LiteLLM routing proxy directly onto the Google Cloud VM.

```bash
systemctl --user start litellm
```
*   **`start litellm`**: Powers on the newly created `litellm.service` file we wrote, initiating the proxy on port `4000` in the background so Hermes can connect to it.

---

## 5. Git Credential Debugging

When testing restricted tokens, Git sometimes caches broken tokens globally, throwing 403 errors on other projects. We used these commands to purge the global cache.

```bash
cmdkey /list | findstr github
```
*   **`cmdkey /list`**: A Windows command that lists all saved passwords and credentials in the Windows Credential Manager.
*   **`findstr github`**: Filters the list to only show saved credentials related to GitHub.

```bash
cmdkey /delete:LegacyGeneric:target=git:https://github.com
```
*   **`cmdkey /delete`**: Forcefully deletes a specific cached password record, clearing out the ghost token.

```bash
git config --global --unset credential.helper
```
*   **`git config --global --unset`**: Removes a configuration setting from the global `.gitconfig` file. In this case, we stopped Git from automatically saving passwords globally so tokens stay isolated to local folders.

---

## 6. Guaranteeing 24/7 Agent Uptime

If a server crashes or reboots, the Hermes AI Agent will remain offline until manually restarted. To guarantee 24/7 uptime without human intervention, we registered the agent directly into the Linux `systemd` manager.

```bash
hermes gateway install
```
*   **`hermes gateway install`**: An interactive command that automatically generates a `systemd` service file for the Hermes Agent. When prompted, we configured it to automatically start the gateway on system boot. 

```bash
systemctl --user start hermes-gateway
```
*   **`systemctl --user start`**: Immediately powers on the newly installed Hermes service in the background. Because it is managed by systemd, Linux will autonomously reboot the agent if it ever crashes.

```bash
systemctl --user status hermes-gateway
```
*   **`systemctl --user status`**: Checks the live health of the background service, confirming it is active and displaying the amount of memory it is currently using.

```bash
journalctl --user -u hermes-gateway -f
```
*   **`journalctl`**: The Linux log viewer.
*   **`-u hermes-gateway`**: Filters the logs to strictly show the Hermes Agent.
*   **`-f`**: Stands for "follow." It streams the logs live to the terminal, which is critical for debugging why the agent might not be responding to messages.

---

## 7. GCP to WSL Backup Pipeline

To migrate or backup the Hermes environment from the cloud to a local machine (like WSL), we compress the "brain", proxy config, and systemd services into a single archive.

```bash
tar -czvf hermes_wsl_backup.tar.gz --exclude='.hermes/image_cache' --exclude='.hermes/audio_cache' --exclude='.hermes/sandboxes' --exclude='.hermes/node' --exclude='.hermes/hermes-agent/venv' --exclude='.hermes/hermes-agent/node_modules' --exclude='__pycache__' .hermes .litellm .config/systemd/user
```
*   **`tar -czvf`**: Creates (`c`), zips (`z`), verbosely lists (`v`), into a file (`f`).
*   **`--exclude`**: Ignores heavy caching folders and environment dependencies (`node_modules`, `venv`) that would make the backup too large. The `.hermes` folder contains the agent's vectorized memories, short-term conversational state database, and System Prompt SOUL.

```powershell
scp -i C:\Users\Daniel\.ssh\gcp_hermes danielpolii19@<YOUR_VM_EXTERNAL_IP>:~/hermes_wsl_backup.tar.gz C:\Users\Daniel\.gemini\antigravity\scratch\
```
*   **`scp`**: Secure Copy Protocol. Uses SSH to securely download the `.tar.gz` file from the remote Google Cloud server to the local Windows machine without exposing data to the public internet.

---

## 8. Model Context Protocol (MCP) Tool Connections

To give the Hermes Agent the ability to interact with the outside world (like searching the web, reading emails, or applying to jobs), we connect it to external tool registries like Composio using the Model Context Protocol.

```bash
hermes mcp add composio --url 'https://backend.composio.dev/v3/mcp/...'
```
*   **`hermes mcp add composio`**: Tells the Hermes agent to register a new external tool provider named "composio" into its configuration.
*   **`--url`**: Specifies the exact Server-Sent Events (SSE) endpoint URL where the external tools are hosted. This allows Hermes to use the tools securely over the internet without installing them locally.

---

## 9. Verifying Backup Integrity

When migrating the agent to a new environment, it's crucial to verify that the conversation databases and API configurations were not corrupted during the transfer.

```bash
python -c "import sqlite3; db=sqlite3.connect('.hermes/state.db'); print(db.execute('PRAGMA integrity_check;').fetchone()[0])"
```
*   **`python -c`**: Tells Python to execute a single, inline string of code without needing to create a `.py` file.
*   **`import sqlite3`**: Imports the standard library module to interact with SQLite databases.
*   **`PRAGMA integrity_check;`**: A low-level SQLite command that scans the entire `state.db` database file for missing indices, malformed records, or structural corruption, returning `ok` if the database is perfectly healthy.
