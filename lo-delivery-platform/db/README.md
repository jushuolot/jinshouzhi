# Database layer (SQLite)

This repo’s Web demo is **static HTML**; the database files here are a **reference schema** and **demo seed** aligned with `web/index.html` / `docs/index.html` (LO orders, chain stages, ecosystem roles, timeline events, econ bar, daily goal templates).

## Create a database from scratch

From the repository root:

```bash
sqlite3 lot.db < db/schema.sql
sqlite3 lot.db < db/seed.sql
```

You can use any filename instead of `lot.db` (for example `lo_delivery.db`).

## Tables

| Table | Purpose |
|-------|---------|
| `lo_orders` | One row per LO: channel, status, risk, priority, chain lane/index, `bars_json` (SLA / proof / recon), `chain_notes_json`, `side_json` |
| `order_events` | Timeline rows (`time_label`, `event_code`, `category`) per `lo_id` |
| `ecosystem_roles` | Role cards: id, display name, short code, hint, two hex colors |
| `chain_stage_definitions` | S01–S10: gate copy, `checklist_json`, optional `secondary_role_keys_json` |
| `user_view_role` | Optional `(user_id → role_key)` for a future API (empty until your app inserts) |
| `sim_econ_state` | Single row `id = 1`: cash, rep, morale, queue, autorecon %, sim clock (matches demo defaults) |
| `daily_goal_templates` | Static copy of the three “今日经营目标” cards |

## Migrations

There is no migration runner in this repo. For small changes:

1. Export data you care about (`sqlite3 lot.db .dump` or targeted `SELECT`).
2. Edit `db/schema.sql` / `db/seed.sql` as needed.
3. Recreate the file or apply incremental SQL with `sqlite3 lot.db < your_changes.sql`.

For a production service, add your own migration tool (e.g. Atlas, goose, or app-managed version table) on top of this schema.

## Optional checks

```bash
sqlite3 lot.db "PRAGMA foreign_key_check;"
sqlite3 lot.db "SELECT id, status, chain_current FROM lo_orders;"
```
