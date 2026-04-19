import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px",
          background: "linear-gradient(140deg, #0f766e 0%, #0ea5e9 40%, #0369a1 100%)",
          color: "#ffffff",
          fontFamily: "Georgia, Cambria, Times New Roman, Times, serif",
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.95 }}>ForeverLotus</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.06 }}>
            Autograph Exchange
          </div>
          <div style={{ fontSize: 30, opacity: 0.95, maxWidth: "90%" }}>
            Capture signatures, messages, and keepsakes people love to share.
          </div>
        </div>
        <div style={{ fontSize: 24, opacity: 0.92 }}>autograph.foreverlotus.com</div>
      </div>
    ),
    {
      ...size,
    },
  );
}
