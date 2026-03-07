// utils/tocIndent.ts

/**
 * Returns the indent level for a TOC item based on its position in the list and heading levels.
 * This matches the logic used in table-of-content.tsx for precise indentation.
 *
 * @param toc - Array of TOC items (must have .level)
 * @returns Array of indent levels (same order as toc)
 */
export function computeTocIndentLevels<T extends { level: number }>(toc: T[]): number[] {
  const stack: number[] = [];
  return toc.map((item) => {
    while (stack.length && stack[stack.length - 1] >= item.level) {
      stack.pop();
    }
    const indentLevel = stack.length;
    stack.push(item.level);
    return indentLevel;
  });
}
