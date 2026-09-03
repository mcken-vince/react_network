# Server

Express + Socket.IO + Sequelize (Postgres), run with `tsx`.

## Scripts
- `npm run dev` — start with file watching
- `npm run start` — start (also via tsx; see D5 in the refactor notes re: a compiled build)
- `npm run typecheck` / `lint` / `knip` — must all be clean before merging
- `npm run db:setup` — run migrations · `db:seed` — seed demo data · `db:drop` — drop everything · `db:test` — connectivity check

## Layout
- `shared/` (repo root) — wire types, socket event map, limits, notification config. Shared with the client; the server must not diverge from it.
- `routes/` — thin: validate → model/service → `satisfies` response type
- `services/` — anything that both writes and emits a socket event
- `websocket/` — auth middleware, `io.ts` emit helpers, `handlers.ts` (presence + typing)
- `lib/` — jwt, typed HTTP errors, handler wrappers, serialization

## The JavaScript exception
`migrations/`, `seeders/`, and `config/database.cli.js` are intentionally JavaScript:
`sequelize-cli` cannot load TypeScript. They are excluded from `tsc`, `eslint`, and `knip`.
Everything else is TypeScript with `allowJs` off.