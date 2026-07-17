"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "20px",
      background: "#050b25",
      color: "#f6f9ff",
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: "20px",
    }}>
      <div style={{
        width: "48px",
        height: "48px",
        display: "grid",
        placeItems: "center",
        borderRadius: "50%",
        background: "#ff5848",
        fontSize: "24px",
      }}>
        ⚠
      </div>
      <h2 style={{ margin: 0, fontSize: "24px" }}>Something went wrong</h2>
      <p style={{ margin: 0, color: "#8998bd", maxWidth: "400px", textAlign: "center" }}>
        {error.message || "An unexpected error occurred"}
      </p>
      <button
        onClick={reset}
        style={{
          padding: "10px 20px",
          background: "#3673ff",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "600",
        }}
      >
        Try again
      </button>
      <details style={{ marginTop: "20px", maxWidth: "600px" }}>
        <summary style={{ cursor: "pointer", color: "#8998bd", fontSize: "12px" }}>
          Technical details
        </summary>
        <pre style={{
          marginTop: "10px",
          padding: "12px",
          background: "#0b1538",
          borderRadius: "8px",
          fontSize: "11px",
          overflow: "auto",
          maxWidth: "100%",
        }}>
          {error.stack}
        </pre>
      </details>
    </div>
  );
}
