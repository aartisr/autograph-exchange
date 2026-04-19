import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function TwitterImage() {
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
          background: "radial-gradient(circle at 20% 20%, #e0f2fe 0%, #22c55e 42%, #0f766e 100%)",
          color: "#ffffff",
          fontFamily: "Georgia, Cambria, Times New Roman, Times, serif",
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.95 }}>Autograph Exchange</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.06 }}>
            Sign.
          </div>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.06 }}>
            Celebrate.
          </div>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.06 }}>
            Share.
          </div>
        </div>
        <div style={{ fontSize: 24, opacity: 0.92 }}>foreverlotus.com</div>
      </div>
    ),
    {
      ...size,
    },
  );
}
