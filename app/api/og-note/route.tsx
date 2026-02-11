import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const noteTitle = searchParams.get("title") || "Untitled Note";
  const collection = searchParams.get("collection") || "General";
  const authorName = searchParams.get("authorName") || "Anonymous";
  const authorUsername = searchParams.get("authorUsername") || "@anonymous";
  const authorAvatar = searchParams.get("authorAvatar") || "https://placehold.net/avatar.png";

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0a0a",
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          color: "white",
          fontFamily: "system-ui, sans-serif",
          padding: "80px 100px",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        {/* Main Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "32px",
            flex: 1,
            justifyContent: "center",
          }}
        >
          {/* Note Title */}
          <h1
            style={{
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.1,
              margin: 0,
              letterSpacing: "-0.02em",
              maxWidth: "900px",
            }}
          >
            {noteTitle}
          </h1>

          {/* Collection */}
          <div
            style={{
              fontSize: 28,
              fontWeight: 500,
              color: "#666666",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {collection}
          </div>

          {/* Author Info */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              marginTop: 16,
            }}
          >
            <img
              src={authorAvatar}
              width={64}
              height={64}
              style={{ borderRadius: "50%" }}
              alt={authorName}
            />

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                lineHeight: 1.2,
              }}
            >
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  color: "#ffffff",
                }}
              >
                {authorName}
              </span>

              <span
                style={{
                  fontSize: 20,
                  fontWeight: 500,
                  color: "#9ca3af",
                }}
              >
                {authorUsername}
              </span>
            </div>
          </div>
        </div>

        {/* NoteHub Branding */}
        <div
          style={{
            position: "absolute",
            bottom: 60,
            right: 100,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              background: "#ffffff",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              fontWeight: 800,
              color: "#0a0a0a",
            }}
          >
            N
          </div>

          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#ffffff",
            }}
          >
            NoteHub
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
