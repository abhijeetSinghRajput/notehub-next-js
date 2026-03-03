import React from "react";

interface ThemeSkeletonIconProps {
  bg?: string;
  fg?: string;
}

const ThemeSkeletonIcon = ({
  bg = "black",
  fg = "#D9D9D9",
}: ThemeSkeletonIconProps) => {
  return (
    <svg
      viewBox="0 0 520 386"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
    >
      <g clipPath="url(#clip0_92_48)">
        <rect width="520" height="386" fill={bg} />
        <path
          d="M86 123C86 106.431 99.4315 93 116 93H526V405H86V123Z"
          fill={fg}
          fillOpacity="0.16"
        />
        <path
          d="M116 94H525V404H87V123C87 106.984 99.9837 94 116 94Z"
          stroke={fg}
          strokeOpacity="0.25"
          strokeWidth="2"
        />
        <path
          d="M207 124C207 116.82 212.82 111 220 111H528V402H207V124Z"
          fill={bg}
        />
        <circle cx="109" cy="115" r="8" fill={fg} fillOpacity="0.25" />
        <circle cx="116" cy="336" r="12" fill={fg} fillOpacity="0.25" />
        <circle cx="129" cy="115" r="8" fill={fg} fillOpacity="0.25" />
        <circle cx="149" cy="115" r="8" fill={fg} fillOpacity="0.25" />
        <rect
          x="101"
          y="152"
          width="58"
          height="15"
          rx="5"
          fill={fg}
          fillOpacity="0.25"
        />
        <rect
          x="101"
          y="176"
          width="78"
          height="15"
          rx="5"
          fill={fg}
          fillOpacity="0.25"
        />
        <rect
          x="248"
          y="178"
          width="98"
          height="11"
          rx="5"
          fill={fg}
          fillOpacity="0.16"
        />
        <rect
          x="248"
          y="331"
          width="60"
          height="12"
          rx="5"
          fill={fg}
          fillOpacity="0.16"
        />
        <rect
          x="248"
          y="155"
          width="69"
          height="16"
          rx="5"
          fill={fg}
          fillOpacity="0.25"
        />
        <rect
          x="248"
          y="222"
          width="98"
          height="74"
          rx="11"
          fill={fg}
          fillOpacity="0.16"
        />
        <rect
          x="362"
          y="222"
          width="98"
          height="74"
          rx="11"
          fill={fg}
          fillOpacity="0.16"
        />
        <rect
          x="476"
          y="222"
          width="98"
          height="74"
          rx="11"
          fill={fg}
          fillOpacity="0.16"
        />
        <rect
          x="101"
          y="200"
          width="36"
          height="15"
          rx="5"
          fill={fg}
          fillOpacity="0.25"
        />
        <rect
          x="141"
          y="331"
          width="42"
          height="15"
          rx="5"
          fill={fg}
          fillOpacity="0.25"
        />
      </g>
      <defs>
        <clipPath id="clip0_92_48">
          <rect width="520" height="386" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default ThemeSkeletonIcon;
