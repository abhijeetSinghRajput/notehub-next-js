import { Input } from "@/components/ui/input";

export default function LabelInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label htmlFor="label" className="flex items-center gap-1 border-b">
      <div className="text-muted-foreground w-max shrink-0 text-sm">Label :</div>
      <Input
        id="label"
        value={value}
        placeholder="e.g. Beta users"
        className="bg-transparent! focus-visible:ring-0 shadow-none outline-none! border-none rounded-none"
        onChange={(e) => onChange(e.target.value)}
        autoFocus
      />
    </label>
  );
}