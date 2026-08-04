# FreeStack — Free Multi-Cloud Backend Platform (Design Doc)

**Date:** 2026-08-02
**Status:** Draft for review

## 1. Vision

One open-source platform that pools **free** cloud resources (CPU, storage, database, Docker) from many providers into a single usable "SuperServer". The user adds their free accounts; the platform routes work across them so that **no paid server is ever needed**.

Analogy: OmniRoute aggregates 237 AI providers behind one endpoint. FreeStack aggregates free *compute + storage* providers behind one platform.

## 2. Goals & Non-Goals

### Goals
- Never require a paid server for the base system.
- Base system works with **no-card** providers only (Render, Hugging Face, Railway, Cloudflare, Neon, Supabase, Koyeb).
- Card-based providers (AWS, DigitalOcean, Oracle) are **optional time-limited boosts**; their expiry never breaks the system.
- Any single server can fail without downtime: automatic failover in ≤ 60 s.
- Data is never stored on a disposable free server.
- One dashboard + one public URL for everything.

### Non-Goals (Phase 1)
- Multi-tenant public signups (Phase 2).
- GPU-heavy training (Phase 2+, via HF ZeroGPU / Colab as adapters).
- Guaranteed SLAs; best-effort free infra by design.

## 3. Architecture

```
                    ┌────────────────────────────────────┐
                    │          CONTROL PLANE             │
                    │  Router · Job Queue · Secrets      │
                    │  Dashboard (Next.js) · API         │
                    │  Runs: Render (primary) +          │
                    │  Fly.io (mirror), Cloudflare DNS   │
                    │  health-check failover             │
                    └──────────────┬─────────────────────┘
                                   │ outbound WS/SSE only
          ┌────────────────────────┼─────────────────────────┐
          ▼                        ▼                         ▼
   [Worker HF]             [Worker Render]           [Worker Railway]
   Docker image            Docker image             Docker image
          │                        │                         │
          └──────────────┬─────────┴──────────┬──────────────┘
                         ▼                    ▼
                ☁️ Cloudflare R2        🗄️ Neon Postgres
                (files, S3 API)        (primary DB, job queue)
                + Backblaze B2         + Supabase (replica,
                  (mirror)               read fallback)
```

### 3.1 Control Plane (the brain — never dies)
- **Primary:** Render free web service (no card).
- **Mirror:** Fly.io shared VM (no card) — standby, same code.
- **Failover:** Cloudflare **free** DNS health checks every 30 s switch the public URL to whichever brain is alive.
- **Storage of secrets:** only in the control plane. Per-task environment variables are injected at dispatch time; workers never hold keys.

### 3.2 Durable Layer (data never dies)
- **Files/objects:** Cloudflare R2 (10 GB free, S3 API). Mirror to Backblaze B2 (10 GB free) for redundancy.
- **Database:** Neon Postgres (primary, 0.5 GB) + Supabase Postgres (read replica/backup).
- **Job queue:** durable, Postgres-backed (BullMQ-style). A task is deleted only after a worker ACKs completion, so no task is ever lost.

### 3.3 Compute Pool (disposable workers)
- Each connected free server runs one **worker agent** — a small Docker image that:
  1. Opens an **outbound** WebSocket/SSE to the control plane (no inbound ports needed, works on every free tier).
  2. Pulls jobs from the queue, pulls the app image, runs it, streams logs back.
  3. Sends a **heartbeat every 30 s**.
- Worker dies → control plane requeues its in-flight task → another worker picks it up within ~60 s.

### 3.4 Provider Adapters
Phase 1 adapters (no card): Render, Hugging Face Spaces, Railway, Koyeb, Cloudflare.
Phase 1.5 adapters (optional boost, time-limited): AWS (EC2 credits), DigitalOcean (60-day credits), Oracle (always-free ARM).

## 4. How Free Limits Are Managed (the "no paid server" guarantee)

| Free-tier problem | Mitigation |
|---|---|
| Render sleeps after 15 min idle | Free pinger (UptimeRobot/cron-job.org) pings every 5 min; worker auto-rejoins |
| HF Spaces sleeps on idle | Same pinger + worker rejoin |
| Railway $5/mo credit cap | Control plane quota tracker caps usage per provider |
| Cold starts 30–60 s | Pinger keeps workers warm; urgent tasks route to always-on Oracle (if present) else next warmest worker |
| No inbound ports on some tiers | Outbound WS only — works everywhere |
| Ephemeral local disk | Workers never persist; all I/O goes to R2/Postgres |
| Egress/request rate limits | Round-robin routing + quota tracker keeps usage under each cap |
| Free tier expires (AWS/DO credits) | Adapter marks provider as "boost/expiring"; system never depends on it |

## 5. User Flow (Phase 1, personal)

```
freestack add render --key <key>
freestack add hf --token <token>
freestack add railway --token <token>
freestack deploy ./my-app
freestack status            # dashboard: workers, load, jobs
```

- `deploy` → control plane builds the image, pushes to GHCR (free), enqueues a deploy task.
- Workers pull the image and report readiness.
- Public URL: `https://<app>.freestack.dev` (Cloudflare Tunnel / DNS), load-balanced across workers with auto-failover.

## 6. Tech Stack

- Control plane: **Node.js (Fastify) + Next.js dashboard**
- Job queue: **BullMQ on Neon Postgres**
- Storage SDK: AWS SDK v3 (S3-compatible) for R2 + B2
- Worker agent: **Node.js or Go** binary inside a minimal Docker image
- Registry: **GitHub Container Registry** (free)
- Deploy targets: Docker-based adapters per provider

## 7. Phases

### Phase 1 — Personal MVP (this project)
Single user. Control plane + 3 providers (Render, Hugging Face, Railway) + R2/B2 storage + Neon DB + dashboard + CLI. Success: deploy a sample app, kill a worker, see it recover automatically in ≤ 60 s.

### Phase 2 — Open-source multi-user
Auth, per-user keys, user-added servers, quotas, shared public pool.

## 8. Risks & Mitigations

- **Provider TOS ambiguity** (pooling free tiers): mitigate by being transparent, personal single-account usage, outbound-only agents, no abusive load.
- **Unexpected provider changes:** adapters are isolated modules; a broken adapter never takes down the queue.
- **Security:** secrets only in control plane; workers get scoped, expiring tokens; R2 bucket private with signed URLs.

## 9. Success Criteria (Phase 1)

1. `freestack deploy` of a sample web app succeeds via 3 different free providers.
2. Killing any worker: zero lost tasks, service restored in ≤ 60 s.
3. R2 + Neon remain the source of truth; no data loss on any worker death.
4. No paid resource required to operate the base system.
