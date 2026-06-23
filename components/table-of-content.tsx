import Link from "next/link";
import React from "react";

type TocItem = {
  id?: string;
  text: string;
  level: number;
};

type TableOfContentProps = {
  noteLink: string;
  data?: TocItem[];
};

const TableOfContent = ({ noteLink, data = [] }: TableOfContentProps) => {
  if (!data.length) return null;

  const STEP = 20;
  const stack: number[] = []; // Track parent levels

  return (
    <div>
      {data.map((item, index) => {
        // Remove stack items that are >= current level
        while (stack.length && stack[stack.length - 1] >= item.level) {
          stack.pop();
        }

        // Current depth = stack length
        const indentLevel = stack.length;

        // Push current level to stack
        stack.push(item.level);

        return (
          <div
            key={index}
            className="relative"
            style={{ paddingLeft: `${indentLevel * STEP + 8}px` }}
          >
            {/* Vertical lines for all ancestors */}
            {stack.slice(0, -1).map((lvl, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0"
                style={{ left: `${i * STEP + 12}px` }}
              >
                <div className="w-px h-full bg-primary/10" />
              </div>
            ))}

            {/* Content */}
            <div className="relative z-10 space-y-3">
              <Link
                href={`${noteLink}#${item.id}`}
                className={`block transition-colors hover:text-primary hover:underline ${
                  indentLevel === 0
                    ? "text-base font-medium"
                    : "text-sm text-primary/70"
                }`}
              >
                {item.text}
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TableOfContent;
