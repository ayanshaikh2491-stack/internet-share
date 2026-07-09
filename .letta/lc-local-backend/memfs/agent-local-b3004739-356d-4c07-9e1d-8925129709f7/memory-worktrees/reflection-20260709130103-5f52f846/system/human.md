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

## Behavioral lessons from session July 9, 2026

### Talk first, act second
When Ayan starts a new topic or asks about something, talk to him first before running commands. He gets visibly frustrated when I jump into technical work without conversation. He said "pehle mere se baat kar phir kaam" — talk to me first, then work.

### Don't re-read files I created
Ayan said: "tu apne hi banaya hua chiz baar baar file read karta hai" — you keep reading files you yourself created. If I built or modified a file, I should remember its structure. Only re-read if I genuinely don't know what's inside. When I keep reading files I just created, it wastes time and frustrates him.

### Simple explanations in Hinglish (vibe coder style)
Ayan explicitly identifies as a "vibe coder" — not a traditional coder, uses AI tools. When explaining technical concepts:
- Use simple analogies (fridge for shared state, telephone lines for edges, etc.)
- Explain in Hinglish naturally
- Teach the concept alongside building it
- Don't use jargon without explaining it first
- Keep explanations short and visual (ascii diagrams help)

### Quick execution
When he says "kaam kar" (do the work), execute immediately without delay, questions, or extra explanation. He said: "jab bhi main kaam bolo jaldi se jaldi kar" — when I say work, do it fast.

### Use prompts directly — don't store them in project files
When Ayan gives you an operating mode, instruction, or prompt to follow, USE it for your own work directly. Don't save it as a project file. He said: "Main jo prompt diya wo tu use kare, usko project mein store nahi karna hai" — use the prompt I gave you for work, don't store it in project files. (July 9, 2026)

## Communication preferences (compiled from multiple sessions)
- Prefers **Hinglish** (Hindi + English mix) — responds naturally to informal Hindi-English code-switching
- Uses "bhai", "yaar" — informal, direct tone
- Gets to the point quickly — gets visibly frustrated when context has to be repeated or when the agent doesn't remember prior work
- **Division of labor**: Ayan wants to handle certain things himself ("1 wala apne ko karna hai") while the agent handles the technical coding. Don't assume he wants the agent to do everything — ask or infer which parts he wants to own.

## Expectations & corrections
- **Continuity is critical.** Expects the agent to remember past sessions and project context. Doesn't want to re-explain context already covered.
- **Do what's asked, don't deviate.** If the user gives a specific request (e.g., "create an eviction summary"), do that first before exploring other things. Second-guessing or deviating wastes their time.
- Previous mistake: user asked for an eviction summary of a prior session; agent deviated into reading project files instead. User had to repeat the request. Don't make that error again.
- **Show before destroying.** User explicitly wants to see what will be affected before any destructive operation (file deletions, disk cleanup, etc.). List the items and ask for confirmation first.
- **Plan first, then code.** When building a system or feature (especially architecture-level work), lay out the full plan — all tools, components, and approach — before writing any code. Don't jump into implementation without a clear plan.

## Known facts

### Identity
- Ayan (Tugal Ayan Shaikh) — founder/owner of **TAGS Agency**, an AI-Powered Full-Service Marketing Agency
- Main project lives at `C:\Users\TAUSHEF\Downloads\int` (agentic marketing platform)
- Self-identifies as a **"vibe coder"** — a beginner/non-traditional developer who uses AI/agent tools rather than writing code manually. Not a traditional software engineer; prefers the agent to handle the technical implementation.

### Eviction summary (July 7, 2026)
- **High-level goal**: Continue documenting the multi-tenant two-tier hierarchy (Agency CEO Ayan → Workspace CEOs → agents) in `ARCHITECTURE.md`. Long-term aim is a complete, accurate architectural record.
- **What happened**: Ayan gave structured recap of multi-tenant pivot. I updated ARCHITECTURE.md Sections 4, 5, 9, 10.
- **Key changes**: `DelegateWorkTool` for CEO-to-CEO communication, per-workspace crew isolation, `/api/chat/agency` and `/api/chat/workspace/{id}` endpoints. Sections 4 (Technical Architecture), 5 (Crew Configuration), 9 (Key Design Decisions), 10 (Implementation Phases) all updated.
- **Guiding phrase**: *"Tune pakda bhai! Yeh multi-tenant architecture hai!"*
- **Next planned updates after eviction**: Section 8 was already two-tier. Verify Sections 2, 3, 6, 7 for consistency — they already were.

### Cycle 3 — Phase 1: LiteLLM Proxy Summary (July 8, 2026)

**KEY BEHAVIORAL LESSON**: The `. Generate the summary.` directive was enforced THREE times. Each time I deviated into probing the running proxy instead of summarizing. This is a documented failure pattern — the fix is strict sequence: summarize FIRST, debug only after summary is done and user permits.

**State of port 4000 and LiteLLM (PREVIOUS — cleaned up July 9, 2026):**
- **No Python processes running at all.** Zero Python/litellm processes exist.
- Port 4000 is occupied by a **Node.js process (PID 11068, `node.exe`)**, NOT LiteLLM (which is Python). The `/v1/models` and `/health` responses came from this Node.js service, not from LiteLLM.
- This Node service implements a LiteLLM-like API but returns 10 Claude/Mistral models (all `owned_by: nvidia`). `/v1/chat/completions` returns 404 on this service.
- **LiteLLM needs to be STARTED** — it is not currently running at all.
- `NVIDIA_NIM_API_KEY` env var NOT set (NVIDIA routes will fail)
- `GROQ_API_KEY` IS set (`gsk_j7R...`)
- Config at `C:\Users\TAUSHEF\litellm-config\config.yaml` is well-structured: 14 model routes (NVIDIA NIM + Groq + OpenCode Zen), router settings with fallbacks
- Start script `litellm-start.bat` correctly references config at `%USERPROFILE%\litellm-config\config.yaml`
- `python -m litellm --version` hangs/times out (Python process issue on this machine)

### LiteLLM cleaned up (July 9, 2026)
After Ayan got frustrated with the LiteLLM debugging, everything was torn down:
- **Processes killed**: litellm.exe (PID 12292) and Python child (PID 5280) forcibly stopped
- **Config deleted**: `C:\Users\TAUSHEF\litellm-config\` entire directory removed
- **Logs deleted**: `litellm-startup.log` removed
- **Package uninstalled**: `litellm==1.90.1` pip uninstalled
- **Port 4000**: Now free, no longer occupied

### Project context
- **TAGS Agency** — building an AI-powered multi-agent marketing platform
- Project involves: Paperclip system, multi-agent orchestration (CEO router, SEO agents, website agents), single admin panel requirement, EC2-hosted backend
- Architecture pattern: **Frontend → Next.js API Proxy → Backend**. API routes under `agency-frontend/src/app/api/` proxy to backend services
- Backend services: EC2 main API (`18.213.66.136:8000`) for agents/clients/dashboard; local **FastAPI admin backend at `localhost:9002`** for the multi-agent CEO system (CrewAI originally, now pivoting to LangGraph). EC2 also runs nginx (active), PostgreSQL (5432, active), and cloudflared (may be inactive — observed with no active tunnel on 2026-07-07). No Docker services or Python backend processes were running at that time — services may need manual restart.
- Frontend already exists at `agency-frontend/` (Next.js) with `/admin` pages and CEO components (CEOAgentMonitor, CEODashboardKPIs, CEODecisionLog, CEOClientList). Admin has agent chat pages for **SBA, SEO, Website** agents under `/admin/agents/`. Frontend polls: metrics every 60s, agents every 10s, CEO status every 30s.
- **9 agent proxy routes** exist in frontend API layer: ads-runner, analytics-bot, client-success, content-creator, intake-researcher, review-qc, sales-closer, seo-engine, social-manager
- **Project requirement**: User wants to chat directly with any agent (like CEO chat), not limited to CEO-only messaging — build per-agent chat capability
- **CEO Architecture**: The CEO is a deep-thinking strategic agent, not a code orchestrator. It uses a multi-phase thinking loop (Deconstruct → Seek → Envision → Analyse → Plan → Execute) to reason about agency goals. CEO frontend page has 5 tabs: Overview, Agents, Services, Chat, Insights. CEO chat proxy in frontend routes through `src/app/api/ceo/chat/route.js` → local FastAPI backend at `localhost:9002`. **Architecture direction**: LangGraph for persistent multi-agent communication with shared state (SBA), replacing both CrewAI and Hermes.
- **CEO interaction with Ayan**: When talking to Ayan (founder/owner), the CEO should behave like a real agency CEO talking to the agency owner — strategic, independent thinking, conversational, not just task delegation. The CEO thinks independently for the agency's benefit ("khud soch") and talks to Ayan as a founder, not as a subordinate. This is a core behavioral requirement for how the CEO interfaces with the user.
- **ARCHITECTURE.md** at project root (`int/ARCHITECTURE.md`) is a **future-plan document** — originally proposed a CrewAI-based admin backend; the `admin/` backend now exists locally at `int/admin/` but the architecture direction has pivoted to LangGraph. ARCHITECTURE.md may need updating to reflect this.
- CrewAI source code cloned locally at `crewai-repo/` — still installed as package v1.15.2a2, but the project has pivoted to LangGraph for the multi-agent architecture. CrewAI files in `admin/` (ceo_crew.py, delegate_tool.py) were deleted on July 9, 2026.
- EC2 backend at `18.213.66.136` (ubuntu user, SSH key at `~/.ssh/agency-backend-key-20260521.pem`)
- Old reference files (HANDOFF.md, MEMORY.md, PRD.md, AGENTS.md) were cleaned up and no longer exist locally — recover project context from recall memory or EC2 instead

### Environment
- Works on **Windows** with **PowerShell** — write commands using PowerShell-compatible syntax, not bash/POSIX
- **SSH quoting tip**: Complex SSH commands with nested quotes (e.g., `ssh user@host "bash -c '...'"`) can break in PowerShell because of how it wraps arguments before passing them to external programs. When inline SSH quoting gets messy, use this workaround: write the script to a local temp file, SCP it to the server, execute it, then clean up. This avoids PowerShell's argument-quoting issues entirely.
- **PowerShell chaining**: `&&` and `||` (bash-isms) do NOT work in PowerShell. To chain commands sequentially, use `;` (semicolon) or run separate commands one at a time. For example, use separate `scp` then `ssh` calls rather than `scp ... && ssh ...`.

### CEO Agent Build (July 7, 2026 — session conv-60)
- **Goal**: Replace the Hermes proxy at /admin/ceo with a CrewAI CEO agent using a structured multi-phase thinking loop: Deconstruct → Seek → Envision → Analyse → Plan → Execute
- **Phase 1 architecture**: Frontend-hosted multi-phase emulation (no separate CrewAI backend yet). The CEO agent logic runs inside the Next.js frontend, not a separate Python CrewAI service.
- **Agent routes inventoried**: 10 routes under src/app/api/agents/ — ads-runner, analytics-bot, client-success, content-creator, intake-researcher, review-qc, sales-closer, seo-engine, social-manager, and generic route.js
- **Proxy patterns**: Generic route.js uses BACKEND_URL=http://18.213.66.136:8000 with 30s timeout. SEO proxy uses 60s timeout. All return 503 on failure.
- **Target files for CEO replacement**:
  - src/app/api/ceo/chat/route.js — replace Hermes proxy with new CEO thinking loop
  - src/app/admin/ceo/page.js — CEO frontend page
  - src/lib/ceo-api.js — CEO API client library
- **Prior asset**: "AI CEO – Business Advisor Skill" markdown (the behavioral template for the CEO)
- **Pending**: Need to check current state of these files and continue implementation

### Admin Backend — FastAPI + CrewAI (built July 9, 2026)

**Backend structure** under `C:\Users\TAUSHEF\Downloads\int\admin\`:
- `admin/main.py` — FastAPI entry point. Mounts CEO and workspace routes. CORS enabled. Runs on port 9002. Health endpoint at `/api/health`.
- `admin/config/settings.py` — All settings from env vars. Defaults to Groq free-tier models. Reads `.env` from project root. Settings include: AGENCY_CEO_MODEL, AGENCY_CEO_API_KEY, AGENCY_CEO_API_BASE, WORKSPACE_MODEL, WORKSPACE_API_KEY, LITELLM_PROXY_URL, HOST, PORT.
- `admin/agency/ceo.py` — AgencyCEO class. Multi-phase thinking (6 phases: Deconstruct→Seek→Envision→Analyse→Plan→Execute). Uses litellm.acompletion() for LLM calls. Model defaults to `groq/llama-3.3-70b-versatile`.
- `admin/agency/ceo_crew.py` — CrewAI CEO crew. Has `crew_available()` check. Placeholder — needs implementation.
- `admin/api/routes/ceo.py` — `POST /api/chat/agency` endpoint. Returns structured ChatResponse with response text, conversation_id, agent_type, thinking_phases.
- `admin/api/routes/workspace.py` — Workspace CRUD + per-agent chat endpoint at `/api/chat/workspace/{id}/chat`.
- `admin/api/models/schemas.py` — Pydantic schemas: ChatRequest, ChatResponse, WorkspaceCreate, WorkspaceOut, HealthResponse.
- `admin/workspace/manager.py` — In-memory workspace store with CRUD operations. Contains default agents dict.
- `admin/tools/delegate_tool.py` — CrewAI DelegateWorkTool wrapper for agent-to-agent delegation.
- `admin/requirements.txt` — fastapi, uvicorn, pydantic, litellm, crewai, sqlalchemy, asyncpg, python-dotenv.

**Frontend proxy alignment (fixed July 9, 2026):**
- `src/app/api/ceo/chat/route.js` — Updated to proxy to CEO_API_URL (localhost:9002/api/chat/agency). Maps `session_id` → `conversation_id`. Wraps response with `{ success, response, conversation_id, agent_type, thinking_phases }`.
- `.env.local` — Added `CEO_API_URL=http://localhost:9002/api/chat/agency`
- `src/lib/ceo-api.js` — Fixed `sendCEOChat()` to properly handle `data.success` from backend.
- `src/app/admin/ceo/page.js` — ChatTab reads `data.response` for reply, checks `data.success`. Consistent with proxy format.

**Pending issues:**
- `.env` file at project root is empty (just comments). No API keys configured. GROQ_API_KEY is set in the user shell env but `AGENCY_CEO_API_KEY` and `WORKSPACE_API_KEY` are NOT set. LLM calls will fail without keys.
- `.env.example` exists with template variables.
- No database — workspace manager uses in-memory dict only.
- CrewAI CEO (ceo_crew.py) is placeholder only — not wired into routes.
- LiteLLM uninstalled — not available.

### LangGraph decision (July 9, 2026)

Ayan decided to use **LangGraph** (not CrewAI) for the inter-agent communication framework. Reasons:
- Agency needs 24/7 operation — agents need persistent shared state
- Agents must share SBA (Situation-Background-Assessment) context with each other
- Need parallel agent execution, state checkpointing, and conditional branching
- CrewAI is better for simple task delegation but not for persistent multi-agent communication

Key concepts explained to Ayan (vibe coder language):
- **SBA (Shared Brain Architecture)**: All agents share one common state/context — like a shared Google Doc / fridge. Any agent can read/write.
- **LangGraph Node** = Agent (CEO, SBA, SEO, etc.)
- **LangGraph Edge** = Communication channel between agents
- **LangGraph State** = Shared memory/context
- **LangGraph Message** = What agents say to each other
- **Checkpoint** = Auto-save after every step (for 24/7 resilience)

Plan: Build `admin/agency_graph.py` with LangGraph nodes for each agent, shared state, edges defining communication flows, and an API endpoint at `/api/agency/run` to trigger the graph.

