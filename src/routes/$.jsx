import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/$")({
  component: NotFoundRoute,
});

function NotFoundRoute() {
  return (
    <div className="app">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          gap: "1rem",
        }}
      >
        <h1 style={{ fontSize: "3rem", color: "#667eea" }}>404</h1>
        <h2>Page not found</h2>
        <p style={{ color: "#666", marginBottom: "1rem" }}>
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "0.5rem",
            border: "none",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            cursor: "pointer",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}
