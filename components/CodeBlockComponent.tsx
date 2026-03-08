"use client";

import {
  useMemo,
  useRef,
  useState,
  useCallback,
  memo,
} from "react";
import {
  Check,
  ChevronsUpDown,
  Copy,
  CopyCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NodeViewContent, NodeViewWrapper, NodeViewProps } from "@tiptap/react";

// ─── LanguageSelector ─────────────────────────────────────────────────────────

interface LanguageSelectorProps {
  language: string;
  languages: string[];
  onSelect: (lang: string) => void;
}

const LanguageSelector = memo(({ language, languages, onSelect }: LanguageSelectorProps) => {
  const [open, setOpen] = useState(false);

  const handleSelect = useCallback(
    (lang: string) => {
      onSelect(lang);
      setOpen(false);
    },
    [onSelect]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="min-w-32 justify-between h-7"
          contentEditable={false}
        >
          {language || "Select language…"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-50 bg-neutral-800 border-neutral-800 p-0" align="start">
        <Command className="bg-transparent text-neutral-50 border-neutral-800">
          <CommandInput
            placeholder="Search language…"
            className="h-9 placeholder:text-neutral-400"
            wrapperClassName="border-[#595959]"
          />
          <CommandList>
            <CommandEmpty>No language found.</CommandEmpty>
            <CommandGroup>
              {languages.map((lang) => (
                <CommandItem
                  key={lang}
                  value={lang}
                  onSelect={handleSelect}
                  style={{ color: "white" }}
                  className="data-[selected=true]:bg-neutral-700 data-[selected=true]:text-white"
                >
                  {lang}
                  <Check
                    className={cn(
                      "ml-auto h-3 w-3",
                      language === lang ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});
LanguageSelector.displayName = "LanguageSelector";

// ─── CopyButton ───────────────────────────────────────────────────────────────

const CopyButton = memo(({ codeRef }: { codeRef: React.RefObject<HTMLPreElement | null> }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const text = codeRef.current?.textContent ?? "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }, [codeRef]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className="size-7"
      title={copied ? "Copied!" : "Copy code"}
    >
      {copied ? <CopyCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
});
CopyButton.displayName = "CopyButton";

// ─── Main Component ───────────────────────────────────────────────────────────

const CodeBlockComponent: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  extension,
}) => {
  const language: string = node?.attrs?.language ?? "";
  // NOTE: we intentionally do NOT read node.textContent here.
  // Reading it would mean every keystroke gives this component a "new" value,
  // defeating our custom memo comparator below.

  // Static — computed once per session, never changes
  const languages = useMemo<string[]>(() => {
    const ll: string[] = extension.options.lowlight.listLanguages();
    return [...ll].sort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const codeRef = useRef<HTMLPreElement | null>(null);

  const handleLanguageSelect = useCallback(
    (lang: string) => {
      updateAttributes({ language: lang === language ? "" : lang });
    },
    [language, updateAttributes]
  );

  return (
    <NodeViewWrapper
      className="code-block relative rounded-2xl overflow-hidden"
    >
      {/* ── Header ── */}
      <header className="rounded-t-lg w-full flex items-center justify-between py-2 px-4">
        <LanguageSelector
          language={language}
          languages={languages}
          onSelect={handleLanguageSelect}
        />

        <div className="flex items-center gap-2" contentEditable={false}>
          <CopyButton codeRef={codeRef} />
        </div>
      </header>

      {/* ── Code pane ── */}
      <div className="bg-[#181818]">
        <pre
          ref={codeRef}
          className="p-4 overflow-x-auto m-0 bg-transparent"
          style={{
            tabSize: 4,
            whiteSpace: "pre",
            fontFamily: "monospace",
            fontSize: "0.875rem",
            lineHeight: 1.625,
          }}
        >
          {/* @ts-ignore */}
          <NodeViewContent as="code" className={`language-${language}`} />
        </pre>
      </div>
    </NodeViewWrapper>
  );
};

// Custom memo comparator: only re-render when the language attribute changes.
// Content changes (typing) are handled entirely by ProseMirror through its
// contentDOM — React has nothing to do with it. Without this comparator,
// memo() sees a new `node` reference on EVERY keystroke and re-renders the
// entire component tree, which is the root cause of the typing lag.
export default memo(CodeBlockComponent, (prevProps, nextProps) => {
  return prevProps.node.attrs.language === nextProps.node.attrs.language;
});