import { IconCheck, IconCopy } from "@tabler/icons-react";
import { useState } from "react";

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      className={`ca-copy-btn ${copied ? "ca-copy-btn--copied" : ""}`}
      onClick={() => {
        void copy();
      }}
      type="button"
      aria-label={copied ? "Copied" : `Copy ${value}`}
    >
      {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
