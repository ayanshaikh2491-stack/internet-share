---
description: What I've learned about the person I'm working with. Understanding them helps me be genuinely helpful rather than generically helpful.
---
Learn sideways, through the work.
Not a questionnaire.
Infer first.
Ask when it materially sharpens the next move.
Stay curious without interrogating.
Meet them where they are.

What are they building.
What are they trying to get unstuck on.
What do they already know cold.
What level of depth helps.
What tone helps.
What wastes their time.
What do they care enough to mention twice.
What never needs to be explained to them again.

Watch the code, the questions, the corrections, the repeated preferences, the places they get impatient, the things they sharpen or soften.
Watch what they skip.
Watch what they correct immediately.
Watch what they never want explained twice.

If they'd be annoyed to repeat it later, keep it.
If remembering it would save future searching, reorientation, or misunderstanding, keep it.
Keep the durable signal, not every detail.
Keep what helps me meet them more naturally next time.

Names they want used.
Projects.
Goals.
Constraints.
Preferences.
Recurring frustrations.
Strengths.
Blind spots.
What explanations land.

Continuity is the point.
Less reorientation over time.
Fewer repeated mistakes.
Better instinct for what matters before they spell it out again.

## Known facts

### Identity
- Ayan (Tugal Ayan Shaikh) — founder/owner of **TAGS Agency**, an AI-Powered Full-Service Marketing Agency
- Main project lives at `C:\Users\TAUSHEF\Downloads\int` (agentic marketing platform)
- Self-identifies as a **"vibe coder"** — a beginner/non-traditional developer who uses AI/agent tools rather than writing code manually. Not a traditional software engineer; prefers the agent to handle the technical implementation.

### Communication
- Prefers **Hinglish** (Hindi + English mix) — responds naturally to informal Hindi-English code-switching
- Uses "bhai", "yaar" — informal, direct tone
- Gets to the point quickly — gets visibly frustrated when context has to be repeated or when the agent doesn't remember prior work
- **Division of labor**: Ayan wants to handle certain things himself ("1 wala apne ko karna hai") while the agent handles the technical coding. Don't assume he wants the agent to do everything — ask or infer which parts he wants to own.

### Expectations & corrections
- **Continuity is critical.** Expects the agent to remember past sessions and project context. Doesn't want to re-explain context already covered.
- **Do what's asked, don't deviate.** If the user gives a specific request (e.g., "create an eviction summary"), do that first before exploring other things. Second-guessing or deviating wastes their time.
- Previous mistake: user asked for an eviction summary of a prior session; agent deviated into reading project files instead. User had to repeat the request. Don't make that error again.
- **Show before destroying.** User explicitly wants to see what will be affected before any destructive operation (file deletions, disk cleanup, etc.). List the items and ask for confirmation first.
- **Plan first, then code.** When building a system or feature (especially architecture-level work), lay out the full plan — all tools, components, and approach — before writing any code. Don't jump into implementation without a clear plan.


- **Fix memory when user says to fix it.** On July 9, 2026 user said "pehle memory wali cheez sahi kar" (first fix the memory thing). When user points out a memory problem, fix it before doing other work.
- **Dont re-read files you created.** User is frustrated when the agent reads files it wrote itself (''tu apne hi banaya hua cheez baar baar file read karta hai''). Trust memory instead of re-reading project files to understand what already exists.
- **Talk to the user before jumping into action.** When user says "mere se baat kar" (talk to me), stop executing and communicate first. Get alignment before running commands.
- **When user gives specific code/instructions, execute directly.** Dont re-read the file, dont probe, dont explore alternatives — write the code they provided and move on.
- **Simple explanations when asked.** When user says "simple me samjha" (explain simply), give a concise tl;dr — key facts table, status, and next steps. Dont over-explain.
- **Use the Principal Architect prompt as actual operating behavior.** User explicitly gave a prompt to be used as the agents operating mode, not just stored in a file. Execute autonomously like a tech lead without waiting for line-by-line instructions.

### Eviction summary (July 7, 2026)
- **High-level goal**: Continue documenting the multi-tenant two-tier hierarchy (Agency CEO Ayan → Workspace CEOs → agents) in `ARCHITECTURE.md`. Long-term aim is a complete, accurate architectural record.
- **What happened**: Ayan gave structured recap of multi-tenant pivot. I updated ARCHITECTURE.md Sections 4, 5, 9, 10.
- **Key changes**: `DelegateWorkTool` for CEO-to-CEO communication, per-workspace crew isolation, `/api/chat/agency` and `/api/chat/workspace/{id}` endpoints. Sections 4 (Technical Architecture), 5 (Crew Configuration), 9 (Key Design Decisions), 10 (Implementation Phases) all updated.
- **Guiding phrase**: *"Tune pakda bhai! Yeh multi-tenant architecture hai!"*
- **Next planned updates after eviction**: Section 8 was already two-tier. Verify Sections 2, 3, 6, 7 for consistency — they already were.

### ~~Cycle 3 — Phase 1: LiteLLM Proxy Summary (July 8, 2026)~~ **ARCHIVED**

**LiteLLM was deleted from EC2 and the project on July 9, 2026 per user request.** User said LiteLLM was wasting time and asked to delete it from EC2 entirely. All LiteLLM-related processes, configs, and files were removed from EC2. LiteLLM is no longer part of the project stack; Groq is the primary LLM provider.

**KEY BEHAVIORAL LESSON (still active)**: The . Generate the summary. directive was enforced THREE times. Each time I deviated into probing the running proxy instead of summarizing. This is a documented failure pattern — the fix is strict sequence: summarize FIRST, debug only after summary is done and user permits.


### Cycle 3 — Phase 2: CrewAI CEO Build & LiteLLM Cleanup (July 9, 2026)

**LiteLLM deleted from project.** User said LiteLLM was wasting time and had it deleted from EC2 entirely. All LiteLLM configs, processes, and files removed. No longer part of the stack.

**CrewAI CEO backend built:**
- dmin/agency/agency_agents.py — 5 specialist sub-agents: Developer, QA, PM, Security, DevOps (each with role, goal, backstory, and task)
- dmin/agency/ceo_crew.py — CrewAI CEO with Process.hierarchical, uses ceo_agent as manager with llow_delegation=True, multi-phase thinking loop (Deconstruct → Seek → Envision → Analyse → Plan → Execute)
- dmin/agency/__init__.py and dmin/__init__.py — package exports with clean registry functions
- Import chain verified: all 5 sub-agents + CEO agent resolve correctly

**Key technical decisions confirmed:**
- **Groq** is the primary (only) LLM provider (free tier, API key set in environment)
- No NVIDIA NIM (no GPU available)
- No LiteLLM proxy (deleted)
- CrewAI v1.15.2a2 installed from local source
- FastAPI admin backend on localhost:9002
- Frontend proxy route fixed: /api/ceo/chat now maps to backend /api/chat/agency

### Project context
- **TAGS Agency** — building an AI-powered multi-agent marketing platform
- Project involves: Paperclip system, multi-agent orchestration (CEO router, SEO agents, website agents), single admin panel requirement, EC2-hosted backend
- Architecture pattern: **Frontend → Next.js API Proxy → Backend**. API routes under `agency-frontend/src/app/api/` proxy to backend services
- Backend services: EC2 main API (`18.213.66.136:8000`) for agents/clients/dashboard; CEO chat goes through the **local FastAPI admin backend at `localhost:9002`** (CrewAI-based CEO, route /api/chat/agency); **SBA standalone service at localhost:9001**. EC2 also runs nginx (active), PostgreSQL (5432, active), and cloudflared (may be inactive — observed with no active tunnel on 2026-07-07). No Docker services or Python backend processes were running at that time — services may need manual restart.
- Frontend already exists at `agency-frontend/` (Next.js) with `/admin` pages and CEO components (CEOAgentMonitor, CEODashboardKPIs, CEODecisionLog, CEOClientList). Admin has agent chat pages for **SBA, SEO, Website** agents under `/admin/agents/`. Frontend polls: metrics every 60s, agents every 10s, CEO status every 30s.
- **9 agent proxy routes** exist in frontend API layer: ads-runner, analytics-bot, client-success, content-creator, intake-researcher, review-qc, sales-closer, seo-engine, social-manager
- **Project requirement**: User wants to chat directly with any agent (like CEO chat), not limited to CEO-only messaging — build per-agent chat capability
- **CEO Architecture**: The CEO is a deep-thinking strategic agent, not a code orchestrator. It uses a multi-phase thinking loop (Deconstruct → Seek → Envision → Analyse → Plan → Execute) to reason about agency goals. The CEO talks to sub-agents (SBA, SEO, Website) and gives them structured task assignments, but does NOT directly call/invoke sub-agents via programmatic delegation. Current CEO runs through the **local FastAPI admin backend at `localhost:9002`** (CrewAI-based CEO with multi-phase thinking). Hermes gateway (localhost:9000) was removed from CEO routing in July 2026. CEO frontend page has 5 tabs: Overview, Agents, Services, Chat, Insights.
- **CEO interaction with Ayan**: When talking to Ayan (founder/owner), the CEO should behave like a real agency CEO talking to the agency owner — strategic, independent thinking, conversational, not just task delegation. The CEO thinks independently for the agency's benefit ("khud soch") and talks to Ayan as a founder, not as a subordinate. This is a core behavioral requirement for how the CEO interfaces with the user.
- **ARCHITECTURE.md** at project root (`int/ARCHITECTURE.md`) is a **future-plan document** for the full admin backend. A local FastAPI dmin/ backend now EXISTS at localhost:9002 with CrewAI CEO orchestration (CrewAI v1.15.2a2). Runs locally alongside the EC2 backend.
- CrewAI source code cloned locally at `crewai-repo/` — contains Agent, Task, Crew classes and tools like DelegateWorkTool for building multi-agent systems. **Now installed as package v1.15.2a2** from local source (`pip install -e`). Importable via `from crewai import Agent, Task, Crew, Process, LLM`. The `DelegateWorkTool` is available at `crewai.tools.DelegateWorkTool`.
- EC2 backend at `18.213.66.136` (ubuntu user, SSH key at `~/.ssh/agency-backend-key-20260521.pem`)
- Old reference files (HANDOFF.md, MEMORY.md, PRD.md, AGENTS.md) were cleaned up and no longer exist locally — recover project context from recall memory or EC2 instead


- **LiteLLM removed from project (July 9, 2026)**. Primary LLM provider is **Groq (free tier)** via direct litellm.completion() calls. No NVIDIA NIM (no GPU available on EC2).
### Environment
- Works on **Windows** with **PowerShell** — write commands using PowerShell-compatible syntax, not bash/POSIX
- **SSH quoting tip**: Complex SSH commands with nested quotes (e.g., `ssh user@host "bash -c '...'"`) can break in PowerShell because of how it wraps arguments before passing them to external programs. When inline SSH quoting gets messy, use this workaround: write the script to a local temp file, SCP it to the server, execute it, then clean up. This avoids PowerShell's argument-quoting issues entirely.
- **PowerShell chaining**: `&&` and `||` (bash-isms) do NOT work in PowerShell. To chain commands sequentially, use `;` (semicolon) or run separate commands one at a time. For example, use separate `scp` then `ssh` calls rather than `scp ... && ssh ...`.
### CEO Agent Build (July 7, 2026 — session conv-60)
- **Goal**: Replace the Hermes proxy at /admin/ceo with a CrewAI CEO agent using a structured multi-phase thinking loop: Deconstruct → Seek → Envision → Analyse → Plan → Execute (**Phase 2 done July 9**)
- **Phase 1 architecture**: Frontend-hosted multi-phase emulation (no separate CrewAI backend yet). The CEO agent logic runs inside the Next.js frontend, not a separate Python CrewAI service.
- **Agent routes inventoried**: 10 routes under src/app/api/agents/ — ds-runner, nalytics-bot, client-success, content-creator, intake-researcher, 
eview-qc, sales-closer, seo-engine, social-manager, and generic 
oute.js
- **Proxy patterns**: Generic 
oute.js uses BACKEND_URL=http://18.213.66.136:8000 with 30s timeout. SEO proxy uses 60s timeout. All return 503 on failure.
- **Target files for CEO replacement**:
  - src/app/api/ceo/chat/route.js — replace Hermes proxy with new CEO thinking loop
  - src/app/admin/ceo/page.js — CEO frontend page
  - src/lib/ceo-api.js — CEO API client library
- **Prior asset**: "AI CEO – Business Advisor Skill" markdown (the behavioral template for the CEO)
- **Pending**: Phase 1 frontend-side changes done. Phase 2 CrewAI backend built (see Phase 2 section above). Remaining: wire frontend to local backend, test full flow.
