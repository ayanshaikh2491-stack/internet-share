# FreeSuperserver — Deep Modified Design (v2)

**Date:** 2026-08-02
**Status:** Deep design for review

## 0. Core Philosophy (Honest Engineering)

> **Jaise OmniCloud/Fraunhofer storage providers ko ek bade disk mein jodta hai, waise FreeSuperserver sab free cloud providers (compute + storage + DB) ko ek virtual superserver mein jodta hai.**

Two honest truths that shape this design:

1. **RAM/CPU "pooling" across servers for ONE process is not physically possible on free tiers.** No distributed shared memory exists for free. What IS real: run the same project on MANY servers (replicas), split traffic across all of them, and let any surviving replica take over. That is how "combined power" actually works. Per-replica RAM adds up in throughput, not in single-process size.

2. **Storage pooling IS fully possible and mature** — the rclone `union` backend (used by OmniCloud-style tools) merges many remotes into one unified filesystem. We build on this.

## 1. Architecture Overview

```
┌────────────────────────────────────────────────────────────┐
│  CONTROL PLANE (self-hosted, Docker + Cloudflare Tunnel)   │
│  API · Dashboard · Scheduler · Health Monitor · Secrets    │
│  Deployer · Storage Mapper (union) · Quota Tracker         │
└──────────┬──────────────────────────────┬──────────────────┘
           │ HTTP/outbound WS only        │ S3/libSQL/HTTP
           ▼                              ▼
┌───────────────────────┐   ┌──────────────────────────────┐
│  COMPUTE CLUSTER      │   │  DATA LAYER (never dies)     │
│  (many replicas)      │   │  Storage Pool (union)        │
│  Koyeb · Render · HF  │   │  R2 + B2 + HF + GitHub LFS   │
│  Railway · Vercel     │   │  Database Pool               │
│  Netlify · Deno       │   │  Neon + Supabase + Turso     │
│  Cloudflare Workers   │   │  Cache/Queue Upstash Redis   │
└───────────────────────┘   └──────────────────────────────┘
```

## 2. Control Plane (The Brain)

### 2.1 Components
| Component | Job |
|---|---|
| **API server** | REST + WS endpoints; auth token |
| **Scheduler** | assigns deployments/jobs to replicas |
| **Health monitor** | pings every replica every 15 s; maintains live set |
| **Deployer** | builds image, pushes to GHCR, triggers deploy on all targets |
| **Storage mapper** | rclone union over R2/B2/HF/GitHub LFS; presents one mount |
| **Quota tracker** | per-provider usage counters; never exceeds free caps |
| **Secret vault** | env vars injected at dispatch; workers never store keys |
| **Dashboard** | status: workers, replicas, load, storage usage, jobs |

### 2.2 Where it runs
- Primary: user's machine via Docker (`docker compose up`).
- Public URL: Cloudflare Tunnel (free, no open ports, no IP).
- The control plane itself is stateless: state lives in Neon/Supabase/Upstash, so it can be restarted any time without loss.

## 3. Compute Cluster (Projects Run on ALL Servers Together)

### 3.1 Active-Active Replica Model
```
Project "myapp" v12
   ├─ Replica on Koyeb      (healthy)
   ├─ Replica on Render     (healthy)
   ├─ Replica on HF Space   (healthy)
   ├─ Replica on Railway    (healthy)
   └─ Replica on Cloudflare (edge fn) (healthy)
              │
              ▼
        Load Balancer (on Cloudflare)
        • least-connections across healthy replicas
        • replica unhealthy for >15s → removed from rotation
        • health check fails on 2+ replicas → deployer spins
          up replacement on the next free provider
```
- **All replicas serve simultaneously** — total throughput = sum of replica capacity. This is the honest form of "combined CPU/RAM".
- Any replica dying = zero user impact (others keep serving).

### 3.2 Provider Adapters (isolated modules)
Each adapter implements one interface: `provision`, `deploy`, `health`, `logs`, `scale`.

| Adapter | Status | Notes |
|---|---|---|
| Koyeb | ✅ no card, always-on | Docker-based, 1 free service |
| Render | ✅ no card | free web service, pinger keeps awake |
| Hugging Face Spaces | ✅ no card | Docker Space, 2 vCPU/16GB |
| Railway | ✅ no card (hobby) | $5/mo credit, quota-tracked |
| Vercel | ✅ no card | serverless functions |
| Netlify | ✅ no card | functions + site |
| Deno Deploy | ✅ no card | JS edge functions |
| Cloudflare Workers | ✅ no card | 100k req/day, unlimited-ish |
| *(Removed)* Fly.io | ❌ no free plan in 2026 | confirmed via costbench |
| *(Phase 2)* Oracle/AWS/DO | card, time-limited | optional boost, auto-expire |

### 3.3 Statelessness Rule
Every replica is **stateless**: no session data, no local files. All state → Data Layer. So any replica can die and be replaced with zero data loss.

## 4. Data Layer (Never Dies)

### 4.1 Storage Pool — OmniCloud model via rclone union
```
rclone union:
   upstreams = R2: (10GB) + B2: (10GB) + HF: (50GB) + GH-LFS: (1GB)
   policy    = epall  (write to all, read from fastest/healthiest)
                or least-used (write to emptiest)
   result    = ONE mount point "superserver-disk"
```
- Files are written to **all** upstreams (mirror) by default → any single storage dying loses nothing.
- When one upstream is full: union automatically stops writing there, keeps serving reads from others. **No downtime.**
- Optional: `policy = random` distributes writes across many accounts (OmniCloud-style striping) with per-file metadata in DB to locate pieces. Phase 2.

### 4.2 Database Pool
| DB | Role | Free |
|---|---|---|
| Neon Postgres | primary | 0.5GB |
| Supabase Postgres | replica (reads) | 0.5GB |
| Turso libSQL | secondary / edge reads | 5GB |
| Upstash Redis | queue + cache + pub/sub | 1MB/day writes, free tier |

- Writes → Neon (single writer). Reads → any replica. Neon down → promote Supabase to writer (control plane does this automatically).
- **Queue rule:** jobs are deleted only after a worker ACKs completion. No task is ever lost.

## 5. Keep-Alive & Sleep Prevention

| Provider | Kept awake by |
|---|---|
| Koyeb, Vercel, Netlify, Deno, CF Workers | always-on by design |
| Render | free pinger (UptimeRobot 50 checks / cron-job.org) every 5 min |
| HF Space | pinger + auto-rejoin |
| Railway | pinger + quota tracker (stays under $5) |

## 6. Failure Matrix (Every Failure Has an Answer)

| Failure | Automatic response |
|---|---|
| Replica dies | others keep serving; deployer replaces on another provider ≤ 60 s |
| Deploy broken | rollback to previous image (5 kept in GHCR) |
| Storage full (one) | union stops writing there, others take over |
| Storage provider down | mirror copy serves reads |
| DB primary down | replica promoted, zero data loss |
| Credit provider (Railway) exhausted | quota tracker drains it before cap; never depended on |
| Control plane down | restarts stateless; state in DB; Cloudflare Tunnel reconnects |
| Provider API error during deploy | adapter retries 3×, then marks provider degraded, tries next |

## 7. Deployment Flow (User View)

```
freestack deploy ./myapp
  1. detect project type (Dockerfile? package.json? pyproject?) + build
  2. push image → GHCR (free, private)
  3. scheduler picks target providers (all healthy, within quotas)
  4. deploy replica on each (parallel)
  5. health check all; unhealthy ones replaced
  6. done → live URL + replica dashboard
```

## 8. Success Criteria (Phase 1 MVP)

1. Deploy one sample app to ≥ 5 providers simultaneously.
2. Kill any 2 replicas → app keeps serving, replacements appear ≤ 60 s.
3. Fill one storage upstream → writes continue to others, zero errors.
4. Kill DB primary → reads/writes continue via replica promotion.
5. Total paid spend: **$0**.
