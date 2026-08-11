import { IconMap } from "@tabler/icons-react";
import type { ViewState } from "../lib/viewState";
import { AppLink, type AppNavigate } from "./AppLink";

export type LibraryMapItem = {
  id: string;
  kind: string;
  label: string;
  group: string;
  destination?: {
    view: ViewState["view"];
    patch?: Partial<ViewState>;
  };
  externalHref?: string;
  onAction?: () => void;
};

export function LibraryAtlasMap(props: {
  ariaLabel?: string;
  description?: string;
  eyebrow?: string;
  emptyMessage?: string;
  groupOverflowLabel?: string;
  heading?: string;
  items: LibraryMapItem[];
  onNavigate: AppNavigate;
  overviewAction?: {
    label: string;
    patch?: Partial<ViewState>;
    view: ViewState["view"];
  } | null;
}) {
  const groups = new Map<string, LibraryMapItem[]>();
  for (const item of props.items) {
    const key = item.group || "Other published material";
    groups.set(key, [...(groups.get(key) || []), item]);
  }

  return (
    <section aria-label={props.ariaLabel || "Map of Library results"} className="library-atlas-map" data-map-node-count={props.items.length}>
      <header className="library-atlas-map__header">
        <div>
          <p className="eyebrow">{props.eyebrow || "Map"}</p>
          <h2>{props.heading || `${props.items.length.toLocaleString()} mapped result${props.items.length === 1 ? "" : "s"}`}</h2>
          <p>{props.description || "The current Library query is grouped by publication. Open any record to see its details."}</p>
        </div>
        {props.overviewAction === null ? null : (
          <AppLink
            className="button button--secondary"
            onNavigate={props.onNavigate}
            patch={props.overviewAction?.patch}
            view={props.overviewAction?.view || "atlas-map"}
          >
            <IconMap aria-hidden="true" size={17} /> {props.overviewAction?.label || "Open Atlas map overview"}
          </AppLink>
        )}
      </header>
      {props.items.length ? (
        <div className="library-atlas-map__groups">
          {[...groups.entries()].map(([group, items]) => (
            <section className="library-atlas-map__group" key={group}>
              <h3>{group} <span>{items.length}</span></h3>
              <div className="library-atlas-map__nodes">
                {items.slice(0, 100).map((item) => {
                  const content = <><small>{item.kind}</small><strong>{item.label}</strong></>;
                  return item.destination ? (
                    <AppLink className="library-map-node" data-map-node-id={item.id} key={`${item.kind}:${item.id}`} onNavigate={props.onNavigate} patch={item.destination.patch} view={item.destination.view}>{content}</AppLink>
                  ) : item.externalHref ? (
                    <a className="library-map-node" data-map-node-id={item.id} href={item.externalHref} key={`${item.kind}:${item.id}`} rel="noopener noreferrer" target="_blank">{content}</a>
                  ) : (
                    <button className="library-map-node" data-map-node-id={item.id} key={`${item.kind}:${item.id}`} onClick={item.onAction} type="button">{content}</button>
                  );
                })}
              </div>
              {items.length > 100 ? <p className="muted">Showing 100 of {items.length.toLocaleString()} in this {props.groupOverflowLabel || "publication"}.</p> : null}
            </section>
          ))}
        </div>
      ) : (
        <p className="empty-state">{props.emptyMessage || "No records match this Library view."}</p>
      )}
    </section>
  );
}
