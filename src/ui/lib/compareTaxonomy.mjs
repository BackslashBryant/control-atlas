function uniqueTags(tags) {
  const byId = new Map();
  for (const tag of tags || []) {
    if (tag?.id && !byId.has(tag.id)) byId.set(tag.id, tag);
  }
  return byId;
}

function sorted(tags) {
  return [...tags].sort((left, right) =>
    String(left.kind || "").localeCompare(String(right.kind || "")) ||
    String(left.label || left.id).localeCompare(String(right.label || right.id)),
  );
}

export function compareTaxonomyTags(rows) {
  const source = uniqueTags(rows.flatMap((row) => row.from_taxonomy_tags || []));
  const target = uniqueTags(rows.flatMap((row) =>
    (row.targets || []).flatMap((targetRow) => targetRow.to_taxonomy_tags || []),
  ));
  return {
    shared: sorted([...source.values()].filter((tag) => target.has(tag.id))),
    onlySource: sorted([...source.values()].filter((tag) => !target.has(tag.id))),
    onlyTarget: sorted([...target.values()].filter((tag) => !source.has(tag.id))),
  };
}
