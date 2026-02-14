import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const fullName = searchParams.get("fullName") || "Anonymous";
  const userName = searchParams.get("userName") || "@anonymous";
  const avatar =
    searchParams.get("avatar") || "https://placehold.net/avatar.png";
  const role = searchParams.get("role") || "user";

  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        background: "white",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        position: "relative",
      }}
    >
      {/* Left Section - Content */}
      <div
        style={{
          flex: 1,
          background: "white",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 80px",
        }}
      >
        {/* Logo at top */}
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
              fontWeight: 700,
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
            flex: 1,
          }}
        >
          {/* Title - Large for social media */}
          <div
            style={{
              fontSize: "72px",
              fontWeight: 800,
              lineHeight: 1.1,
              color: "#111111",
              display: "flex",
              flexWrap: "wrap",
              marginBottom: "16px",
              maxWidth: "700px",
              letterSpacing: "-0.02em",
            }}
          >
            {fullName}
          </div>

          <div
            style={{
              fontSize: "42px",
              lineHeight: 1.1,
              color: "#666666",
              display: "flex",
              gap: "8px",
              alignItems: "center",
              flexWrap: "wrap",
              marginBottom: "48px",
              maxWidth: "700px",
              letterSpacing: "-0.02em",
            }}
          >
            /{userName}
            {role === "admin" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={38}
                height={38}
                viewBox="0 0 24 24"
                fill="#2b7fff"
                aria-label="Verified"
                // className={className}
              >
                <path d="M24 12a4.454 4.454 0 0 0-2.564-3.91 4.437 4.437 0 0 0-.948-4.578 4.436 4.436 0 0 0-4.577-.948A4.44 4.44 0 0 0 12 0a4.423 4.423 0 0 0-3.9 2.564 4.434 4.434 0 0 0-2.43-.178 4.425 4.425 0 0 0-2.158 1.126 4.42 4.42 0 0 0-1.12 2.156 4.42 4.42 0 0 0 .183 2.421A4.456 4.456 0 0 0 0 12a4.465 4.465 0 0 0 2.576 3.91 4.433 4.433 0 0 0 .936 4.577 4.459 4.459 0 0 0 4.577.95A4.454 4.454 0 0 0 12 24a4.439 4.439 0 0 0 3.91-2.563 4.26 4.26 0 0 0 5.526-5.526A4.453 4.453 0 0 0 24 12Zm-13.709 4.917-4.38-4.378 1.652-1.663 2.646 2.646L15.83 7.4l1.72 1.591-7.258 7.926Z" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Right Section - Dark Gradient with Large Image */}
      <div
        style={{
          flex: 1,
          background: "linear-gradient(135deg, #171717 0%, #0a0a0a 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
          position: "relative",
        }}
      >
        {/* Large Image Container - About half the height of the card */}
        <div
          style={{
            width: "420px",
            height: "420px",
            borderRadius: "50%",
            overflow: "hidden",
            display: "flex",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
            marginBottom: "24px",
            border: "4px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <img
            src={avatar}
            width="280"
            height="280"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "flex",
            }}
            alt="Collection"
          />
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}
