const LABELS = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
} as const;

export function ConfidencePip({
  confidence,
}: {
  confidence: keyof typeof LABELS | string;
}) {
  const key =
    confidence === "high" || confidence === "medium" || confidence === "low"
      ? confidence
      : "low";

  return (
    <span className={`ca-confidence ca-confidence--${key}`}>
      <span aria-hidden="true" className="ca-confidence__dot" />
      {LABELS[key]}
    </span>
  );
}
