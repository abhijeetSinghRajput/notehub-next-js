import { IconProps } from "@/types/icon";
import React from "react";


const LogoIcon = React.forwardRef<SVGSVGElement, IconProps>(
  (
    { size = 24, color = "currentColor", className = "", style, ...props },
    ref,
  ) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
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
  ),
);

export default LogoIcon;
