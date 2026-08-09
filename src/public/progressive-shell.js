/* global document, URL, URLSearchParams, window */

(function () {
  "use strict";

  var CATALOG_NAMES = {
    "cmmc-2": "CMMC 2.0",
    "csf-2": "NIST CSF 2.0",
    "cui-policy": "CUI Program",
    "disa-cci": "DISA CCI",
    "disa-srg": "DISA SRG",
    "disa-stig": "DISA STIG",
    "dod-rai": "DoD RAI",
    "dod-zt": "DoD Zero Trust",
    "fedramp-rev5": "FedRAMP Rev. 5",
    "fips-199": "FIPS 199",
    "fips-200": "FIPS 200",
    "mitre-attack": "MITRE ATT&CK",
    "mitre-attack-ics": "MITRE ATT&CK for ICS",
    "mitre-d3fend": "MITRE D3FEND",
    "nist-800-171": "SP 800-171 Rev. 3",
    "nist-800-171-rev2": "SP 800-171 Rev. 2",
    "nist-800-172": "SP 800-172 Rev. 3",
    "nist-800-37": "SP 800-37 Rev. 2",
    "nist-800-53": "SP 800-53 Rev. 5",
    "nist-800-53a": "SP 800-53A Rev. 5",
    "nist-800-53b": "SP 800-53B",
    "nist-ai-rmf": "AI RMF",
    "nist-ssdf": "SSDF"
  };

  function decode(value) {
    try {
      return decodeURIComponent(value || "");
    } catch {
      return value || "";
    }
  }

  function routeIdentity() {
    var raw = window.location.hash.replace(/^#/, "") || "/";
    var routeUrl = new URL(raw, window.location.origin);
    var segments = routeUrl.pathname.split("/").filter(Boolean);
    var route = segments[0] || "";
    var query = routeUrl.searchParams;

    if (route === "explore") {
      var rawNode = query.get("node") || "";
      var nodeParts = decode(rawNode).split(":");
      var identifier = nodeParts[nodeParts.length - 1] || "";
      return identifier
        ? {
            eyebrow: "Atlas record",
            kind: "atlas",
            summary: "Published structure and cited connections around this record.",
            title: identifier
          }
        : {
            eyebrow: "Atlas",
            kind: "atlas",
            summary: "Pick an area, then a publication, then a record.",
            title: "Atlas"
          };
    }
    if (route === "catalog") {
      var catalogId = decode(segments[1] || "");
      return catalogId
        ? {
            eyebrow: "Published structure",
            kind: "catalog",
            summary: "Publisher records, source identity, and structural groups.",
            title: CATALOG_NAMES[catalogId] || catalogId
          }
        : {
            eyebrow: "Library",
            kind: "catalog",
            summary: "Browse official publications and open their published records.",
            title: "Library"
          };
    }
    if (route === "record") {
      return {
        eyebrow: "Official publisher record",
        kind: "record",
        summary: "Official content, structural location, provenance, and source-linked next steps.",
        title: decode(segments.slice(2).join("/")) || "Record"
      };
    }
    if (route === "compare") {
      return {
        eyebrow: "Compare",
        kind: "compare",
        summary: "Align published structures, mappings, evidence, and gaps.",
        title: "What do you want to compare?"
      };
    }
    if (route === "build") {
      return {
        eyebrow: "Documents",
        kind: "documents",
        summary: "Choose a task or starter document, then keep its public references attached.",
        title: segments[1] === "tasks" ? "Tasks" : "Documents"
      };
    }
    if (route === "resources" || route === "resources-detail") {
      if (segments.length > 1) return null;
      return {
        eyebrow: "Resources",
        kind: "resources",
        summary: "Tools, portals, training, templates, and practitioner communities.",
        title: "Find the ecosystem around the work"
      };
    }
    if (route === "sources") {
      if (query.get("source")) return null;
      return {
        eyebrow: "Sources",
        kind: "sources",
        summary: "Publisher, coverage, version, and last-checked date for every publication.",
        title: "Sources"
      };
    }
    if (route === "start") {
      return {
        eyebrow: "Start here",
        kind: "start",
        summary: "Answer two questions to get a starting point in the public material.",
        title: "Start here"
      };
    }
    if (route === "learn") {
      if (query.get("pattern")) return null;
      return {
        eyebrow: "Guides",
        kind: "guides",
        summary: "Field guidance for finding, reading, and using public cybersecurity material.",
        title: "Practitioner guides"
      };
    }
    if (route === "about") {
      return {
        eyebrow: "About",
        kind: "about",
        summary: "A public-source workbench for governing, securing, assessing, operating, and defending systems.",
        title: "About Control Atlas"
      };
    }
    return null;
  }

  function isHome() {
    var route = window.location.hash.replace(/^#/, "");
    return route === "" || route === "/" || route.indexOf("/?") === 0;
  }

  function isSearch() {
    return window.location.hash.replace(/^#/, "").indexOf("/search") === 0;
  }

  function setHidden(element, hidden) {
    if (element) element.toggleAttribute("hidden", hidden);
  }

  function remove(element) {
    if (element) element.remove();
  }

  function syncFirstPaintShell() {
    var root = document.getElementById("root");
    if (!root) return;
    var home = isHome();
    var search = isSearch();
    var identity = routeIdentity();
    var shell = root.querySelector("[data-static-route]");

    if (home) {
      remove(root.querySelector("[data-static-route]"));
      remove(root.querySelector("[data-static-search]"));
    } else if (search) {
      remove(root.querySelector("[data-static-home]"));
      remove(root.querySelector("[data-static-route]"));
    } else {
      remove(root.querySelector("[data-static-home]"));
      remove(root.querySelector("[data-static-search]"));
    }

    if (search) root.dataset.staticSearchActive = "true";
    else delete root.dataset.staticSearchActive;

    if (identity && shell && !home && !search) {
      root.dataset.staticRoutePersistent = "true";
      root.dataset.staticRouteActive = "true";
      root.dataset.staticRouteKind = identity.kind;
      shell.querySelector("[data-static-route-eyebrow]").textContent = identity.eyebrow;
      shell.querySelector("[data-static-route-title]").textContent = identity.title;
      shell.querySelector("[data-static-route-summary]").textContent = identity.summary;
      shell.removeAttribute("hidden");
    } else if (shell) {
      setHidden(shell, true);
    }

    if (search) {
      var raw = window.location.hash.replace(/^#/, "");
      var queryIndex = raw.indexOf("?");
      var input = root.querySelector("[data-static-search-input]");
      if (input) {
        input.value = queryIndex === -1
          ? ""
          : new URLSearchParams(raw.slice(queryIndex + 1)).get("q") || "";
      }
    }
  }

  window.controlAtlasProgressiveRouteIdentity = routeIdentity;
  window.controlAtlasSyncFirstPaintShell = syncFirstPaintShell;
  syncFirstPaintShell();
})();
