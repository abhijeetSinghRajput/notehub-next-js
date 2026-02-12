"use client";

import { useState } from "react";
import { ShareNotePopover } from "./ShareNotePopover";

function ShareNotePopoverWrapper({ shareLink }: { shareLink: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <ShareNotePopover
      shareLink={shareLink}
      copied={copied}
      onCopy={copyToClipboard}
    />
  );
}

export default ShareNotePopoverWrapper;
