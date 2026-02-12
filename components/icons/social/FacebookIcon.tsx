import { IconProps } from "@/types/icon";
import React from "react";

const FacebookIcon = ({
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
      viewBox="0 0 200 201"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clip-path="url(#clip0_80_16)">
        <path
          d="M200 100.033C200 150.554 162.562 192.321 113.926 199.099C109.379 199.729 104.726 200.059 100.004 200.059C94.5521 200.059 89.1988 199.624 83.9856 198.783C36.3662 191.115 0 149.818 0 100.033C0 44.7877 44.7746 0 99.9965 0C155.218 0 200 44.7877 200 100.033Z"
          fill="#1877F2"
        />
        <path
          d="M113.926 80.3172V102.108H140.875L136.608 131.462H113.926V199.092C109.379 199.723 104.726 200.052 100.003 200.052C94.552 200.052 89.1986 199.617 83.9854 198.776V131.462H59.1317V102.108H83.9854V75.4459C83.9854 58.9046 97.3898 45.4893 113.933 45.4893V45.5033C113.982 45.5033 114.024 45.4893 114.073 45.4893H140.882V70.876H123.365C118.158 70.876 113.933 75.1024 113.933 80.3102L113.926 80.3172Z"
          fill="white"
        />
      </g>
      <defs>
        <clipPath id="clip0_80_16">
          <rect width="200" height="201" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default FacebookIcon;
