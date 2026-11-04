import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "TapeDog: find the college football favorites worth fading";

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 90, background: "#0a0a09", color: "#f2ede1" }}>
        <div style={{ fontSize: 30, color: "#f5c842", letterSpacing: 8, fontWeight: 700 }}>TAPEDOG</div>
        <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1, marginTop: 28 }}>Find the favorites</div>
        <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1, color: "#f5c842" }}>worth fading.</div>
        <div style={{ fontSize: 32, color: "#a39e8f", marginTop: 36 }}>Upset odds, live scores, highlights and playoff odds for every FBS game.</div>
      </div>
    ),
    size,
  );
}
