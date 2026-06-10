export const statusLabels = {
  officialMatch: {
    label: "Official match",
    badgeClass: "badge-official",
    action: "Review and cite the source.",
    description: "A trusted source directly links these requirements."
  },
  possibleConnection: {
    label: "Possible connection",
    badgeClass: "badge-connection",
    action: "Review each step.",
    description: "GovFrame found a path through related requirements."
  },
  needsSupportingSource: {
    label: "Needs supporting source",
    badgeClass: "badge-needs-source",
    action: "Suggest supporting source.",
    description: "GovFrame found a source, but has not found another source to confirm it."
  },
  noKnownMatch: {
    label: "No known match",
    badgeClass: "badge-no-match",
    action: "Assess separately.",
    description: "GovFrame has not found a public source-backed match."
  }
};
