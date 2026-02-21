"use client";

import { useState } from "react";
import { SharePopover } from "./ShareNotePopover";

function SharePopoverWrapper({
  shareLink,
  triggerVariant,
}: {
  shareLink: string;
  triggerVariant?: React.ComponentProps<typeof SharePopover>["triggerVariant"];
}) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <SharePopover
      shareLink={shareLink}
      copied={copied}
      onCopy={copyToClipboard}
      triggerVariant={triggerVariant}
    />
  );
}

export default SharePopoverWrapper;
