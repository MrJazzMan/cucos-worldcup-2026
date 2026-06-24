import { ImageResponse } from "next/og";

export const alt =
  "wc26.pt — Mundial FIFA 2026: jogos, horários em Portugal e canais de TV";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// OG image estática (gerada por código). Próximo passo, num handoff futuro:
// versão dinâmica «jogos de hoje» — o gancho fica preparado neste ficheiro.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0e0b08",
          padding: "80px",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "96px",
              height: "96px",
              borderRadius: "24px",
              background: "#E0451F",
              fontSize: "52px",
              fontWeight: 800,
            }}
          >
            26
          </div>
          <div style={{ display: "flex", fontSize: "40px", fontWeight: 700, color: "#d6d3d1" }}>
            Mundial FIFA 2026
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", fontSize: "112px", fontWeight: 800, letterSpacing: "-2px" }}>
            <span>wc26</span>
            <span style={{ color: "#E0451F" }}>.pt</span>
          </div>
          <div style={{ display: "flex", fontSize: "48px", fontWeight: 600, color: "#fafaf9" }}>
            Onde ver o Mundial em Portugal
          </div>
        </div>

        <div style={{ display: "flex", fontSize: "34px", color: "#a8a29e" }}>
          Jogos de hoje · Horários em Portugal · Canais de TV
        </div>
      </div>
    ),
    { ...size }
  );
}
