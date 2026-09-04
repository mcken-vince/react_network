const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

/** REST base URL, including the `/api` prefix. */
export const API_BASE_URL = stripTrailingSlash(
  import.meta.env.VITE_API_URL ?? "http://localhost:3001/api",
);

/** Origin the Socket.IO server listens on (no `/api`). */
export const SOCKET_URL = stripTrailingSlash(
  import.meta.env.VITE_SOCKET_URL ?? API_BASE_URL.replace(/\/api$/, ""),
);
