import type { CompareWorkbench } from './viewState';

export type StartHereAnswers = {
  systemType: string;
  dataSensitivity: string;
  environment: string;
};

export type StartHereLibraryLink =
  | { kind: 'library-catalog'; catalogId: string; label: string; rationale: string }
  | { kind: 'library-node'; nodeId: string; label: string; rationale: string };

export type StartHereCompareLink = {
  kind: 'compare';
  workbench: CompareWorkbench;
  patch: Record<string, string>;
  label: string;
  rationale: string;
};

export type StartHerePatternLink = {
  kind: 'pattern';
  patternId: string;
  label: string;
  rationale: string;
};

export type StartHereTemplateLink = {
  kind: 'template';
  templateType: string;
  label: string;
  rationale: string;
};

export type StartHereRecommendations = {
  library: StartHereLibraryLink[];
  compare: StartHereCompareLink[];
  patterns: StartHerePatternLink[];
  templates: StartHereTemplateLink[];
};

export declare function buildStartHereRecommendations(
  answers: StartHereAnswers,
): StartHereRecommendations | null;

export declare function hasCompleteStartHereContext(
  answers: StartHereAnswers,
): boolean;
