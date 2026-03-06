# Projectdock

A workspace for experimenting with a small “dock” stack (API + web UI) and Rust ORM tooling. This repository currently contains:

- **Dock/**
  - `Dock/api/` — a Rust API that can be built and run via Docker
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
npm install
npm run dev
```

Then open:

- http://localhost:3000

> The `Dock/frontend/README.md` also includes the standard Next.js usage notes.

---

### API (Rust) via Docker

There is a multi-stage Docker build for the Rust API at `Dock/api/Dockerfile` that produces a small runtime image and exposes port **8080**.

From `Dock/api`:

```bash
docker build -t projectdock-api .
docker run --rm -p 8080:8080 projectdock-api
```

If the API provides HTTP endpoints, they’ll be available at:

- http://localhost:8080

---

## ORM demos (Rust + Postgres)

### SeaORM demo

The SeaORM demo connects to Postgres with a hard-coded connection string in `ORM/seaorm/src/main.rs`:

```text
postgres://db_user:db_pw@localhost:5432/db1
```

To run it locally you’ll need a Postgres instance with matching credentials and database name (or update the connection string).

---

### Diesel demo

The Diesel demo expects a `DATABASE_URL` environment variable (loaded via dotenv). Typical usage:

```bash
cd ORM/diesel_demo
cp .env.example .env   # if you add one, or create .env manually
# set DATABASE_URL=postgres://...
cargo run
```

---

## Tech stack

- **Rust** (API + ORM demos)
- **Docker** (containerizing the Rust API)
- **Next.js** (frontend)
- **PostgreSQL** (used by the ORM demos)

---

## Contributing

Issues and PRs are welcome. If you’re making larger changes, consider opening an issue first to discuss direction.

---

## License

Add a license you prefer (MIT/Apache-2.0/etc.). If you don’t plan to license it yet, you can remove this section for now.
