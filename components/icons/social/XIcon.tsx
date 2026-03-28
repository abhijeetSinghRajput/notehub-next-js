import { IconProps } from "@/types/icon";
import React from "react";

const XIcon = ({
  size = 24,
  color = "currentColor",
  className = "",
  ...props
}: IconProps) => {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      viewBox="0 0 201 201"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clipPath="url(#clip0_80_5)">
        <path
          d="M200.281 100.423C200.281 150.943 162.844 192.708 114.21 199.486C109.663 200.116 105.01 200.446 100.288 200.446C94.8367 200.446 89.4835 200.011 84.2705 199.17C36.6598 191.503 0.294922 150.207 0.294922 100.423C0.294922 45.1798 45.0679 0.393555 100.295 0.393555C155.522 0.393555 200.295 45.1798 200.295 100.423H200.281Z"
          fill={color}
        />
        <path
          d="M40.8499 44.5146L86.9681 106.192L40.5626 156.339H51.0096L91.6417 112.436L124.468 156.339H160.013L111.302 91.1932L154.499 44.5146H144.052L106.636 84.9483L76.402 44.5146H40.8568H40.8499ZM56.2086 52.2103H72.5343L144.641 148.644H128.315L56.2086 52.2103Z"
          fill="white"
        />
      </g>
      <defs>
        <clipPath id="clip0_80_5">
          <rect width="201" height="201" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default XIcon;
