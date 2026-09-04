// The API client moved to src/lib/api.ts. This re-export keeps existing
// `../utils/api` / `../../utils/api` imports working until they are updated
// (migration plan, phases 3–7). Prefer importing from "../lib/api" in new code.
export * from "../lib/api";
