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
