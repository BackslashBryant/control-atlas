// Real logo geometry from the user's brand asset export (components/logo/logo-icon.tsx):
// a 270° "C" arc (gap on the east side) with a navigation-arrow dart centered on it.
const ARC_PATH = "M 61.2 61.2 A 30 30 0 1 1 61.2 18.8";
const ARROW_PATH = "M 31 31 L 53 40 L 43 43 L 40 53 Z";

export function BrandMark() {
  return (
    <span aria-hidden="true" className="brand-icon-mark">
      <svg fill="none" viewBox="0 0 80 80">
        <path
          d={ARC_PATH}
          fill="none"
          stroke="#FFFFFF"
          strokeLinecap="round"
          strokeWidth="7"
        />
        <path d={ARROW_PATH} fill="#FFFFFF" />
      </svg>
    </span>
  );
}

export function BrandFlourish() {
  return (
    <span className="brand-purpose">
      Public reference tool
    </span>
  );
}
