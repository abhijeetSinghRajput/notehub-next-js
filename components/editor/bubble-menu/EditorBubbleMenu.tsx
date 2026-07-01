// components > editor > bubble-menu > 
/**
 * EditorBubbleMenu
 *
 * Orchestrates three mutually exclusive bubble menus with clear priority:
 *   Image > List (cursor only) > Text selection
 *
 * Each sub-menu's `shouldShow` logic is self-contained and designed so
 * only one can be visible at any given time.
 */
import ImageBubbleMenu from "./ImageBubbleMenu";
import TextBubbleMenu from "./TextBubbleMenu";

export default function EditorBubbleMenu() {
  return (
    <>
      {/* Priority 1 – Image node selected */}
      <ImageBubbleMenu />

      {/* Priority 3 – Non-empty text selection (works inside lists too) */}
      <TextBubbleMenu />
    </>
  );
}
