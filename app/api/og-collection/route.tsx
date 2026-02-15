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

  const collectionTitle = searchParams.get("title") || "Untitled Collection";
  const totalNotes = searchParams.get("totalNotes") || "0";
  const authorName = searchParams.get("authorName") || "Anonymous";
  const authorUsername = searchParams.get("authorUsername") || "@anonymous";
  const authorAvatar = searchParams.get("authorAvatar") || "https://placehold.net/avatar.png";

  const avatarSize = 100;
  const fontData = await getFontData();
  const optimizedAvatar = optimizeImageUrl(authorAvatar, avatarSize, avatarSize);

  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        background: "white",
        fontFamily: "Inter",
        position: "relative",
      }}
    >
      {/* Left Section - Content */}
      <div
        style={{
          flex: 2,
          background: "white",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between", // Changed from "center" to "space-between"
          padding: "60px 80px", // Reduced top/bottom padding
        }}
      >
        {/* Logo at top */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            marginBottom: "40px", // Add space below logo
          }}
        >
          <svg
            width="48" // Slightly reduced size
            height="48"
            viewBox="0 0 128 128"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: "flex" }}
          >
            <g clipPath="url(#clip0_79_2)">
              <circle cx="64" cy="64" r="64" fill="black" />
              <path
                opacity="0.5"
                d="M56.32 43.5202C56.32 35.0371 49.4431 28.1602 40.96 28.1602C32.4769 28.1602 25.6 35.0371 25.6 43.5202V84.4802C25.6 92.9632 32.4769 99.8402 40.96 99.8402C49.4431 99.8402 56.32 92.9632 56.32 84.4802V43.5202Z"
                fill="#D9D9D9"
              />
              <path
                d="M84.48 28.1602C92.963 28.1602 99.84 35.0371 99.84 43.5202V84.4802C99.84 84.7484 99.831 85.0152 99.8174 85.2802C99.8917 89.2174 98.4617 93.1836 95.51 96.2403C89.6171 102.342 79.8919 102.51 73.7899 96.6176L30.4949 54.8077C24.3927 48.9148 24.2221 39.1899 30.115 33.0876C36.0079 26.9856 45.7328 26.8174 51.8348 32.71L69.12 49.4002V43.5202C69.12 35.0371 75.9969 28.1602 84.48 28.1602Z"
                fill="#D9D9D9"
              />
            </g>
            <defs>
              <clipPath id="clip0_79_2">
                <rect width="128" height="128" fill="white" />
              </clipPath>
            </defs>
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

        {/* Main content centered vertically */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1, // Take remaining space
          }}
        >
          {/* Title - Large for social media */}
          <div
            style={{
              fontSize: "62px",
              lineHeight: 1.1,
              color: "#111111",
              display: "-webkit-box", // key for line clamping
              WebkitLineClamp: 3, // number of lines to clamp
              WebkitBoxOrient: "vertical", // vertical orientation
              overflow: "hidden", // hides overflowing text
              textOverflow: "ellipsis", // adds "..." at the end
              flexWrap: "wrap",
              marginBottom: "38px",
              maxWidth: "700px",
              letterSpacing: "-0.02em",
            }}
          >
            {collectionTitle}
          </div>

          {/* Author - Large enough to read */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
            }}
          >
            <img
              src={optimizedAvatar}
              width={avatarSize}
              height={avatarSize}
              style={{
                borderRadius: "50%",
                display: "flex",
                border: "3px solid #f3f4f6",
              }}
              alt={authorName}
            />
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

      {/* Right Section - Dark Gradient */}
      <div
        style={{
          flex: 1,
          background: "linear-gradient(135deg, #171717 0%, #0a0a0a 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
        }}
      >
        {/* Large Number - Very visible */}
        <div
          style={{
            color: "white",
            fontSize: "120px",
            lineHeight: 0.8,
            marginBottom: "24px",
            display: "flex",
            opacity: 0.95,
          }}
        >
          {totalNotes}
        </div>

        {/* Label */}
        <div
          style={{
            color: "#94a3b8",
            fontSize: "32px",
            display: "flex",
            marginBottom: "80px",
          }}
        >
          total notes
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [{ name: "Inter", data: fontData, style: "normal" }],
    },
  );
}
