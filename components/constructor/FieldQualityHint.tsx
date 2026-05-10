import type { FieldQualityHintValue } from "@/lib/constructor/readiness/types";
import { STATUS_TEXT_CLASS } from "@/lib/constructor/readiness/statusStyles";

type FieldQualityHintProps = {
  hint?: FieldQualityHintValue;
  className?: string;
};

export function FieldQualityHint({ hint, className }: FieldQualityHintProps) {
  if (!hint) return null;
  const base =
    className ??
    ("mt-1 text-[11px]" as string);
  return (
    <p className={`${base} ${STATUS_TEXT_CLASS[hint.status]}`}>
      {hint.text}
    </p>
  );
}
