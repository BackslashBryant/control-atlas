import { resolveIdentity } from "../../shared/identity-registry.mjs";

export function IdentityMark(props: {
  termId: string;
  size?: number;
  decorative?: boolean;
}) {
  const identity = resolveIdentity(props.termId);
  if (!identity) return null;

  const size = props.size ?? 18;
  const isDecorative = props.decorative !== false;
  const fallback = identity.fallback;

  if (identity.verification_status === "verified_official" && identity.asset_path) {
    return (
      <img
        alt={isDecorative ? "" : identity.accessible_name}
        aria-hidden={isDecorative}
        className="identity-mark identity-mark--official"
        height={size}
        src={identity.asset_path}
        width={size}
      />
    );
  }

  return (
    <span
      aria-hidden={isDecorative}
      aria-label={isDecorative ? undefined : identity.accessible_name}
      className="identity-mark identity-mark--monogram"
      role={isDecorative ? undefined : "img"}
      style={{ fontSize: `${Math.round(size * 0.55)}px`, width: `${size}px`, height: `${size}px` }}
    >
      {fallback.value}
    </span>
  );
}
