import type { CSSProperties, ReactNode } from "react";

import {
  areaCssVariables,
  areaPresentationFor,
} from "../lib/areaVisualLanguage";

type CustomProperties = CSSProperties & Record<`--${string}`, string>;

export function BucketTag(props: {
  area: string;
  children?: ReactNode;
  className?: string;
}) {
  const presentation = areaPresentationFor(props.area);
  const style = presentation
    ? (areaCssVariables(presentation) as CustomProperties)
    : undefined;

  return (
    <span
      className={`bucket-tag${presentation ? "" : " bucket-tag--neutral"}${props.className ? ` ${props.className}` : ""}`}
      data-area-id={presentation?.id}
      style={style}
    >
      {presentation ? <span aria-hidden="true" className="bucket-tag__dot" /> : null}
      <span>{props.children ?? presentation?.label ?? props.area}</span>
    </span>
  );
}

export function LineTag(props: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`line-tag${props.className ? ` ${props.className}` : ""}`}>
      <span aria-hidden="true" className="line-tag__line" />
      <span>{props.children}</span>
    </span>
  );
}
