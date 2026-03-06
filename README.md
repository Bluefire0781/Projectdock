# Projectdock

A workspace for experimenting with a small “dock” stack (API + web UI) and Rust ORM tooling. This repository currently contains:

- **Dock/**
  - `Dock/api/` — a Rust API that can be built and run
  - `Dock/frontend/` — a Next.js frontend
- **ORM/**
  - `ORM/diesel_demo/` — Diesel + Postgres example project
  - `ORM/seaorm/` — SeaORM + Postgres example project
- **Performance/**
  - (reserved for performance experiments / benchmarks)

> This repo is a work-in-progress sandbox for learning, prototyping, and comparing approaches.

---

## Repository layout

```text
.
├── Dock/
│   ├── api/
│   │   └── Dockerfile
│   └── frontend/
│       └── README.md
├── ORM/
│   ├── diesel_demo/
│   └── seaorm/
└── Performance/
```

---

## Quick start

### Frontend (Next.js)

From `Dock/frontend`:

```bash
Docker compose up - build
```

Then open:

- http://localhost:3000

> The `Dock/frontend/README.md` also includes the standard Next.js usage notes.

---

### API (Rust) via Docker

There is a multi-stage Docker build for the Rust API at `Dock/api/Dockerfile` that produces a small runtime image and exposes port **8080**.

From `Dock/api`:

```bash
Docker compose up - build
```

If the API provides HTTP endpoints, they’ll be available at:

- http://localhost:8080

---

## Tech stack

- **Docker** (containerizing the whole application)
- **Rust** (API + Seaorm)
- **Next.js** (frontend)
- **PostgreSQL**

---

