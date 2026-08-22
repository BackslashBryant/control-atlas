import { useId, type CSSProperties, type ReactNode } from "react";

import {
  areaCssVariables,
  areaPresentationFor,
} from "../lib/areaVisualLanguage";

type CustomProperties = CSSProperties & Record<`--${string}`, string>;

export function BucketTag(props: {
  area: string;
  children?: ReactNode;
  className?: string;
  explanation?: string;
}) {
  const descriptionId = useId();
  const presentation = areaPresentationFor(props.area);
  const style = presentation
    ? (areaCssVariables(presentation) as CustomProperties)
    : undefined;

  return (
    <span
      aria-describedby={props.explanation ? descriptionId : undefined}
      className={`bucket-tag${presentation ? "" : " bucket-tag--neutral"}${props.explanation ? " bucket-tag--explained" : ""}${props.className ? ` ${props.className}` : ""}`}
      data-tooltip={props.explanation || undefined}
      data-area-id={presentation?.id}
      style={style}
      tabIndex={props.explanation ? 0 : undefined}
      title={props.explanation}
    >
      <span>{props.children ?? presentation?.label ?? props.area}</span>
      {props.explanation ? <span className="visually-hidden" id={descriptionId}>{props.explanation}</span> : null}
    </span>
  );
}

export function LineTag(props: {
  children: ReactNode;
  className?: string;
  explanation?: string;
}) {
  const descriptionId = useId();
  return (
    <span
      aria-describedby={props.explanation ? descriptionId : undefined}
      className={`line-tag${props.explanation ? " line-tag--explained" : ""}${props.className ? ` ${props.className}` : ""}`}
      data-tooltip={props.explanation || undefined}
      tabIndex={props.explanation ? 0 : undefined}
      title={props.explanation}
    >
      <span>{props.children}</span>
      {props.explanation ? <span className="visually-hidden" id={descriptionId}>{props.explanation}</span> : null}
    </span>
  );
}
