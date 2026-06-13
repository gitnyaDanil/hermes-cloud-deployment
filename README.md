# Autonomous AI Agent Cloud Deployment

A comprehensive showcase of deploying, debugging, and optimizing an autonomous AI agent (Hermes) on Google Cloud Platform, designed to run 24/7 with zero-downtime fallback architectures and secure remote access.

## 🛠️ Technical Stack
- **Cloud Infrastructure:** Google Cloud Platform (Compute Engine, Ubuntu LTS)
- **AI/LLM Ecosystem:** DeepSeek V4 API, Gemini 3.1 Flash, Local Gemma (via LM Studio)
- **System Administration:** Linux `systemd`, SSH, Bash
- **Networking & Integration:** Telegram Bot API, GitHub API, Ngrok Tunnels

## 🚀 Key Achievements & Debugging Experience

### 1. Cloud Infrastructure & Headless Server Management
- Provisioned a dedicated Google Cloud VM optimized for high I/O tasks.
- **Challenge:** The agent's background service crashed immediately upon closing the SSH terminal due to strict PAM session termination rules on headless servers.
- **Resolution:** Diagnosed the user-level service termination and resolved it by configuring `systemd` user lingering (`loginctl enable-linger`), ensuring the agent remained awake 24/7.
- Replaced laggy browser-based SSH with seamless local terminal access by securely generating and registering RSA-4096 SSH keys via Google Cloud IAM.

### 2. API Billing Diagnostics & Rate Limit Optimization
- **Challenge:** The agent encountered fatal `HTTP 429 RESOURCE_EXHAUSTED (Limit: 0)` errors from the Gemini API, breaking the Telegram webhook connection.
- **Resolution:** Traced the error back to a conflict between GCP Free Trial credits and Google AI Studio's isolated Prepay billing system. Bypassed the zero-balance lock by migrating the configuration to fully supported Free Tier models, restoring instantaneous bot responses.
- Handled API rate-limiting (15 RPM) during intensive code-parsing tasks by implementing request pacing and fallback routing.

### 3. Hybrid LLM Fallback Architecture
- Designed a cost-optimized "Waterfall" routing architecture to balance local hardware and cloud APIs.
- **Priority 1:** Local RTX 5060 running Gemma models via secure Ngrok tunnels for $0/hr heavy lifting.
- **Priority 2:** Low-Cost Safety Net routing to DeepSeek V4 Flash API for high-workload tasks.
- **Priority 3:** Seamless degradation to Google AI Studio Free Tier (used sparingly due to 15 RPM limits).

### 4. Security, Automation & Future Expansion
- Secured the Telegram Bot gateway by strictly whitelisting authorized Telegram User IDs, preventing unauthorized API usage.
- Handled remote Git authentication by caching Personal Access Tokens (`credential.helper store`) inside the VM, allowing the agent to autonomously push code.
- Established a local cron job (`schtasks` / `/schedule`) to enforce automated daily backups of the agent's internal state to GitHub.
- **Future Roadmap:** Added initial plans for utilizing the AI agent to orchestrate automated task scheduling and perform dynamic web scraping.
