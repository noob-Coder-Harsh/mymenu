import { ImageResponse } from "next/og";

export const alt = "FoodBaba — free QR menu & billing";
export const size = { width: 1200, height: 630 };
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
          padding: 64,
          background: "linear-gradient(145deg, #f7f1ea 0%, #efe4d8 45%, #e8d5c4 100%)",
          color: "#2c1810",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "#a65d37",
              color: "#fffdf9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "-0.04em",
            }}
          >
            FB
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: "-0.03em",
            }}
          >
            FoodBaba
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              maxWidth: 900,
            }}
          >
            Free QR menu & billing for QSR and food carts
          </div>
          <div style={{ fontSize: 28, color: "#6d5d55", maxWidth: 820 }}>
            Customers scan, order on phone — no app download.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 22,
            fontWeight: 600,
            color: "#a65d37",
          }}
        >
          Free forever · India-first for carts & QSR
        </div>
      </div>
    ),
    { ...size },
  );
}
