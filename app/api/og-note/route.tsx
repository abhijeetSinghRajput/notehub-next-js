import { optimizeImageUrl } from "@/lib/utils";
import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const fontPromise = fetch(
  new URL("../../../assets/InterSubset.ttf", import.meta.url),
  {cache: "force-cache"}
).then((res) => res.arrayBuffer());

async function getFontData(): Promise<ArrayBuffer> {
  return fontPromise;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const noteTitle = searchParams.get("title") || "Untitled Note";
  const collection = searchParams.get("collection") || "General";
  const authorName = searchParams.get("authorName") || "Anonymous";
  const authorUsername = searchParams.get("authorUsername") || "@anonymous";
  const authorAvatar = searchParams.get("authorAvatar") || "https://placehold.net/avatar.png";

  const avatarSize = 280;
  const fontData = await getFontData();
  const optimizedAvatar = optimizeImageUrl(authorAvatar, avatarSize, avatarSize);

  const response = new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        background: "white",
        fontFamily: "Inter",
      }}
    >
      {/* Left Section */}
      <div
        style={{
          flex: 2,
          background: "white",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 80px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 128 128"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="64" cy="64" r="64" fill="black" />
            <path
              opacity="0.5"
              d="M56.32 43.52c0-8.48-6.88-15.36-15.36-15.36s-15.36 6.88-15.36 15.36v40.96c0 8.48 6.88 15.36 15.36 15.36s15.36-6.88 15.36-15.36V43.52Z"
              fill="#D9D9D9"
            />
            <path
              d="M84.48 28.16c8.48 0 15.36 6.88 15.36 15.36v40.96c0 .27-.01.54-.02.8.07 3.94-1.36 7.9-4.31 10.96-5.89 6.1-15.62 6.27-21.72.38l-43.3-41.81c-6.1-5.89-6.27-15.62-.38-21.72 5.89-6.1 15.62-6.27 21.72-.38l17.29 16.69v-5.88c0-8.48 6.88-15.36 15.36-15.36Z"
              fill="#D9D9D9"
            />
          </svg>

          <div
            style={{
              fontSize: "32px",
              display: "flex",
              letterSpacing: "-0.02em",
              color: "#111111",
            }}
          >
            NoteHub
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
          }}
        >
          <div
            style={{
              fontSize: "62px",
              lineHeight: 1.1,
              color: "#111111",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
              marginBottom: "24px",
              maxWidth: "700px",
              letterSpacing: "-0.02em",
            }}
          >
            {noteTitle}
          </div>

          <div
            style={{
              fontSize: "48px",
              lineHeight: 1.1,
              color: "#666666",
              display: "flex",
              marginBottom: "48px",
              maxWidth: "700px",
              letterSpacing: "-0.02em",
            }}
          >
            /{collection}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontSize: "38px",
                  color: "#111111",
                  display: "flex",
                }}
              >
                {authorName}
              </div>
              <div
                style={{
                  fontSize: "32px",
                  color: "#666666",
                  display: "flex",
                }}
              >
                {authorUsername}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div
        style={{
          flex: 1,
          background: "linear-gradient(135deg, #171717 0%, #0a0a0a 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
        }}
      >
        <div
          style={{
            width: "280px",
            height: "280px",
            borderRadius: "24px",
            overflow: "hidden",
            display: "flex",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
            border: "4px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <img
            src={optimizedAvatar}
            width={avatarSize}
            height={avatarSize}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            alt="Author"
          />
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [{ name: "Inter", data: fontData, style: "normal" }],
    },
  );

  response.headers.set(
    "Cache-Control",
    "public, immutable, no-transform, s-maxage=31536000, max-age=31536000",
  );

  return response;
}
