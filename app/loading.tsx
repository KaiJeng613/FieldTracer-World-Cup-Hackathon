export default function Loading() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeContent: "center",
        justifyItems: "center",
        gap: "10px",
        background: "radial-gradient(circle, rgba(183,243,74,.08), transparent 34%), #050b25",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          display: "grid",
          placeItems: "center",
          borderRadius: "14px 5px 14px 5px",
          background: "#b8ef25",
          color: "#0a120a",
          boxShadow: "0 0 34px rgba(183,243,74,.18)",
          fontSize: "26px",
        }}
      >
        ⚽
      </div>
      <strong
        style={{
          marginTop: "6px",
          fontSize: "13px",
          letterSpacing: ".18em",
          color: "#f6f9ff",
        }}
      >
        FIELDTRACER
      </strong>
      <span
        style={{
          color: "#8998bd",
          fontWeight: 600,
          fontSize: "8px",
          letterSpacing: ".12em",
          textTransform: "uppercase",
        }}
      >
        Preparing replay studio
      </span>
    </main>
  );
}
