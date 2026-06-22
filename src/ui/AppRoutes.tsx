import type { ComponentType } from "react";

import { AboutPage } from "./pages/AboutPage";
import { AtlasMapPage } from "./pages/AtlasMapPage";
import { ComparePage } from "./pages/ComparePage";
import { ExplorePage } from "./pages/ExplorePage";
import { HomePage } from "./pages/HomePage";
import { ObjectDetailPage } from "./pages/ObjectDetailPage";
import { PlaybooksPage } from "./pages/PlaybooksPage";
import { SourcesPage } from "./pages/SourcesPage";
import { StartHerePage } from "./pages/StartHerePage";
import { TemplatesPage } from "./pages/TemplatesPage";

/** Hash route table — paths are HashRouter segments; labels live in navigation.ts. */
export const APP_HASH_ROUTES = [
  { path: "/", label: "Home", page: HomePage },
  { path: "/start", label: "Start", page: StartHerePage },
  { path: "/atlas-map", label: "Atlas Map", page: AtlasMapPage },
  { path: "/explore", label: "Explore", page: ExplorePage },
  { path: "/record/:type/:id", label: "Record detail", page: ObjectDetailPage },
  { path: "/compare", label: "Compare", page: ComparePage },
  { path: "/playbooks", label: "Playbooks", page: PlaybooksPage },
  { path: "/playbooks/:slug", label: "Playbook detail", page: PlaybooksPage },
  { path: "/templates", label: "Templates", page: TemplatesPage },
  { path: "/sources", label: "Sources", page: SourcesPage },
  { path: "/about", label: "About", page: AboutPage },
] as const satisfies ReadonlyArray<{
  path: string;
  label: string;
  page: ComponentType<unknown>;
}>;
