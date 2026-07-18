import { patternsData } from '../../app/patterns-data.mjs';

const PATTERN_LABELS = {
  'csp-inheritance': 'Using FedRAMP Inheritance',
  'shared-responsibility': 'What Your Cloud Provider Owns vs What You Own',
  'reciprocity-basics': 'Reusing Prior Authorization Work',
  'conmon-cadence': 'Keeping Authorization Evidence Current',
  'boundary-patterns': 'Defining the Right Authorization Boundary',
  'boe-reuse': 'Packaging Evidence for Reuse',
  'enterprise-inheritance': 'Enterprise Control Inheritance',
  'ato-vs-fedramp': 'ATO vs. FedRAMP Authorization',
  'rmf-lifecycle': 'RMF Lifecycle Planning',
  'evidence-patterns': 'Evidence Expectation Patterns',
  'control-inheritance': 'Control Inheritance Model',
  'poam-concepts': 'POA&M Concepts',
};

const TEMPLATE_LABELS = {
  security_plan_starter: 'Security Plan Starter',
  assessment_planning_worksheet: 'Assessment Planning Worksheet',
  inheritance_worksheet: 'Inheritance Worksheet',
  stig_evidence_checklist: 'STIG Evidence Checklist',
  poam_starter: 'POA&M Starter',
  reciprocity_checklist: 'Reciprocity Checklist',
};

// Per-item plain-language "why this one" strings. Keep acronyms spelled out on
// first mention so a newcomer never hits an unexplained term.
const PATTERN_RATIONALES = {
  'csp-inheritance': 'How to claim the controls your cloud provider already runs, so you are not re-documenting work FedRAMP has already covered.',
  'shared-responsibility': "Spells out which security controls are yours versus your cloud provider's — the line people most often get wrong.",
  'reciprocity-basics': "How to reuse another team's authorization work instead of building your evidence from scratch.",
  'conmon-cadence': 'What you have to keep doing after authorization to keep your evidence current.',
  'boundary-patterns': 'How to draw the line around what your system includes — the boundary decision that scopes everything else.',
  'boe-reuse': 'How to package evidence once so it can be reused across audits.',
  'enterprise-inheritance': 'How a shared enterprise service passes common controls down to the systems that run on it.',
  'ato-vs-fedramp': 'Explains the difference between a single-agency Authorization to Operate (ATO) and a FedRAMP authorization, so you pursue the right one.',
  'rmf-lifecycle': 'Walks the Risk Management Framework (RMF) end to end so you know which step you are actually on.',
  'evidence-patterns': 'What assessors expect your evidence to look like, before they ask for it.',
  'control-inheritance': 'How controls get inherited between systems so you only document what is truly yours.',
  'poam-concepts': 'How to handle findings you cannot fix immediately without stalling your authorization.',
};

const TEMPLATE_RATIONALES = {
  security_plan_starter: 'A starter system security plan scaffold — the core document every authorization package is built around.',
  assessment_planning_worksheet: 'Plans out how your controls will be tested before an assessor arrives.',
  inheritance_worksheet: 'Records which controls you inherit from a provider versus own yourself, so nothing falls through the cracks.',
  stig_evidence_checklist: 'Tracks which DISA Security Technical Implementation Guide (STIG) checks you have evidence for — the technical proof DoD assessors ask for.',
  poam_starter: 'A Plan of Action & Milestones (POA&M) scaffold for tracking findings you have not closed yet.',
  reciprocity_checklist: 'Walks the steps to reuse a prior authorization so you are not redoing already-accepted work.',
};

function systemTypePhrase(systemType) {
  switch (systemType) {
    case 'Cloud SaaS':
      return 'a cloud SaaS system';
    case 'Platform service':
      return 'a platform service';
    case 'On-premises':
      return 'an on-premises system';
    case 'Hybrid':
      return 'a hybrid system';
    case 'Enterprise service':
      return 'an enterprise service';
    default:
      return 'a system (type not yet decided)';
  }
}

function sensitivityPhrase(sensitivity) {
  switch (sensitivity) {
    case 'Low':
      return 'low-impact data';
    case 'Moderate':
      return 'moderate-impact data';
    case 'High':
      return 'high-impact data';
    case 'CUI':
      return 'Controlled Unclassified Information (CUI)';
    default:
      return 'data of an impact level you have not set yet';
  }
}

function environmentPhrase(environment) {
  switch (environment) {
    case 'Federal civilian':
      return 'a federal civilian agency';
    case 'DoD':
      return 'the Department of Defense (DoD)';
    case 'Contractor':
      return 'a federal contractor';
    case 'CSP':
      return 'a cloud service provider (CSP)';
    default:
      return 'a federal setting';
  }
}

function patternLabel(patternId) {
  return PATTERN_LABELS[patternId] || patternsData.find((entry) => entry.id === patternId)?.title || patternId;
}

function templateLabel(templateType) {
  return TEMPLATE_LABELS[templateType] || templateType.replaceAll('_', ' ');
}

function nistBaselineId(sensitivity) {
  if (sensitivity === 'Low') return 'nist-800-53b:LOW';
  if (sensitivity === 'Moderate') return 'nist-800-53b:MODERATE';
  if (sensitivity === 'High') return 'nist-800-53b:HIGH';
  return null;
}

function fedrampBaselineId(sensitivity) {
  if (sensitivity === 'Low') return 'fedramp-rev5:LOW';
  if (sensitivity === 'Moderate') return 'fedramp-rev5:MODERATE';
  if (sensitivity === 'High') return 'fedramp-rev5:HIGH';
  return null;
}

function baselineLabel(prefix, sensitivity) {
  if (sensitivity === 'Low') return `${prefix} Low Baseline`;
  if (sensitivity === 'Moderate') return `${prefix} Moderate Baseline`;
  if (sensitivity === 'High') return `${prefix} High Baseline`;
  return `${prefix} Baseline`;
}

function uniquePatternIds(ids) {
  return [...new Set(ids)];
}

function uniqueTemplateIds(ids) {
  return [...new Set(ids)];
}

export function hasCompleteStartHereContext(answers) {
  return Boolean(
    answers.systemType && answers.dataSensitivity && answers.environment,
  );
}

export function buildStartHereRecommendations(answers) {
  const { systemType, dataSensitivity, environment } = answers;
  if (!hasCompleteStartHereContext(answers)) {
    return null;
  }

  // "Not sure" is a valid answer: fall back to the broadest sensible default
  // and record what we assumed so the result can say so plainly.
  const assumptions = [];
  const effectiveSensitivity = dataSensitivity === 'Not sure' ? 'Moderate' : dataSensitivity;
  const effectiveEnvironment = environment === 'Not sure' ? 'Federal civilian' : environment;
  if (dataSensitivity === 'Not sure') {
    assumptions.push('You picked "Not sure" for data sensitivity, so we used Moderate — the most common federal starting baseline. Change it above once you know your impact level.');
  }
  if (environment === 'Not sure') {
    assumptions.push('You picked "Not sure" for environment, so we assumed a federal civilian agency. Change it above if your system is DoD, contractor-run, or a cloud service provider.');
  }
  if (systemType === 'Not sure') {
    assumptions.push('You picked "Not sure" for system type, so these recommendations stay general — revisit once you know whether it is cloud, on-premises, or hybrid.');
  }

  const library = [];
  const compare = [];
  const patternIds = [];
  const templateIds = [];
  // Assigned in every branch of the exhaustive environment/path chain below.
  let pathLabel;
  let narrative;

  const isCloud = systemType === 'Cloud SaaS' || systemType === 'Platform service';
  const isEnterpriseShape = systemType === 'Hybrid' || systemType === 'Enterprise service' || systemType === 'On-premises';
  const isCui = effectiveSensitivity === 'CUI';

  if (isCloud) {
    patternIds.push('csp-inheritance', 'shared-responsibility');
    templateIds.push('inheritance_worksheet');
  } else if (isEnterpriseShape) {
    patternIds.push('enterprise-inheritance', 'boundary-patterns');
    templateIds.push('inheritance_worksheet');
  }

  if (effectiveEnvironment === 'DoD') {
    pathLabel = 'DoD RMF + STIG path';
    narrative = `You're working on ${systemTypePhrase(systemType)} for ${environmentPhrase('DoD')}, handling ${sensitivityPhrase(effectiveSensitivity)}. DoD systems get authorized through the Risk Management Framework (RMF) and layer DISA Security Technical Implementation Guides (STIGs) — the specific technical hardening checks — on top of the NIST SP 800-53 controls every federal system shares. Start with the NIST baseline below to scope your controls, then use Compare to trace each STIG rule back to the control it satisfies.${isCloud ? ' Because this is a cloud system, your scope is also set by a DoD Impact Level (IL2–IL6) under the DISA Cloud Computing SRG.' : ''}`;

    library.push(
      {
        kind: 'library-catalog',
        catalogId: 'nist-800-53',
        label: 'NIST SP 800-53 Rev. 5',
        rationale: 'DoD systems still trace back to NIST controls even when STIGs drive the technical checks.',
      },
      {
        kind: 'library-catalog',
        catalogId: 'disa-stig',
        label: 'DISA STIG / SRG',
        rationale: 'DoD operational environments usually need the public STIG and SRG library alongside NIST controls.',
      },
    );

    if (isCloud) {
      library.push({
        kind: 'library-catalog',
        catalogId: 'disa-srg',
        label: 'DISA SRG Library',
        rationale: 'DoD cloud systems are scoped by Impact Level (IL2 through IL6) under the DISA Cloud Computing SRG — check the SRG library for the technology-area requirements that apply once you know your IL, rather than the commercial FedRAMP path.',
      });
    }

    const nistBaseline = nistBaselineId(effectiveSensitivity);
    if (nistBaseline) {
      library.push({
        kind: 'library-node',
        nodeId: nistBaseline,
        label: baselineLabel('NIST SP 800-53B', effectiveSensitivity),
        rationale: `Use this baseline to see which controls apply at the ${effectiveSensitivity.toLowerCase()} impact level you selected.`,
      });
    }

    patternIds.push('rmf-lifecycle', 'evidence-patterns');
    templateIds.push('stig_evidence_checklist');

    compare.push({
      kind: 'compare',
      workbench: 'stig-chain',
      patch: {},
      label: 'Trace STIG rules to controls',
      rationale: 'Follow the public STIG to CCI to NIST chain so you know where a technical rule lands in control language.',
    });
  } else if (effectiveEnvironment === 'CSP' || systemType === 'Cloud SaaS') {
    pathLabel = 'FedRAMP authorization path';
    narrative = `You're authorizing ${systemTypePhrase(systemType)} that handles ${sensitivityPhrase(effectiveSensitivity)}${effectiveEnvironment === 'CSP' ? ' as a cloud service provider (CSP)' : ''}. Cloud systems that serve federal agencies get authorized against FedRAMP baselines, which build on the underlying NIST SP 800-53 controls. Start with the FedRAMP baseline below, then compare it against NIST to see which controls you can inherit rather than build yourself.`;

    library.push({
      kind: 'library-catalog',
      catalogId: 'fedramp-rev5',
      label: 'FedRAMP Rev. 5 Baselines',
      rationale: 'Cloud and CSP paths usually start with the public FedRAMP baseline catalog before you map inheritance.',
    });

    const fedrampBaseline = fedrampBaselineId(effectiveSensitivity);
    if (fedrampBaseline) {
      library.push({
        kind: 'library-node',
        nodeId: fedrampBaseline,
        label: baselineLabel('FedRAMP', effectiveSensitivity),
        rationale: `Your ${effectiveSensitivity.toLowerCase()} sensitivity answer points to this public FedRAMP baseline as a first reference set.`,
      });
    }

    patternIds.push('ato-vs-fedramp');

    const nistBaseline = nistBaselineId(effectiveSensitivity);
    if (fedrampBaseline && nistBaseline) {
      compare.push({
        kind: 'compare',
        workbench: 'baseline-compare',
        patch: { baselineA: fedrampBaseline, baselineB: nistBaseline },
        label: 'Compare FedRAMP and NIST baselines',
        rationale: 'See what your FedRAMP baseline shares with the matching NIST baseline before you plan controls.',
      });
    }
  } else if (effectiveEnvironment === 'Contractor' || isCui) {
    pathLabel = 'NIST SP 800-171 (contractor / CUI) path';
    narrative = `You're ${effectiveEnvironment === 'Contractor' ? 'working as a federal contractor' : 'handling Controlled Unclassified Information (CUI)'}${systemType && systemType !== 'Not sure' ? ` on ${systemTypePhrase(systemType)}` : ''}. That points you to NIST SP 800-171 — the control set contractors must meet to protect CUI — which maps back into the broader NIST SP 800-53 catalog a government system may later inherit. Start with the 800-171 control set below.`;

    library.push({
      kind: 'library-catalog',
      catalogId: 'nist-800-171-rev2',
      label: 'NIST SP 800-171 Rev. 2',
      rationale: 'Contractor and CUI paths usually begin with the public 800-171 control set before you expand into broader RMF artifacts.',
    });

    patternIds.push('reciprocity-basics', 'poam-concepts');
    templateIds.push('poam_starter');

    compare.push({
      kind: 'compare',
      workbench: 'relationships',
      patch: { source: 'nist-800-171-rev2', target: 'nist-800-53' },
      label: 'Compare 800-171 to NIST controls',
      rationale: 'See how contractor-facing requirements map to the broader NIST control catalog you may inherit later.',
    });
  } else {
    pathLabel = 'NIST RMF path';
    narrative = `You're authorizing ${systemTypePhrase(systemType)} for ${environmentPhrase(effectiveEnvironment)}, handling ${sensitivityPhrase(effectiveSensitivity)}. Federal systems get authorized through the Risk Management Framework (RMF), scoping controls from the NIST SP 800-53 catalog at your impact level. Start with the NIST baseline below.`;

    library.push({
      kind: 'library-catalog',
      catalogId: 'nist-800-53',
      label: 'NIST SP 800-53 Rev. 5',
      rationale: 'Federal civilian systems usually begin with the public NIST control catalog and baseline placement.',
    });

    const nistBaseline = nistBaselineId(effectiveSensitivity);
    if (nistBaseline) {
      library.push({
        kind: 'library-node',
        nodeId: nistBaseline,
        label: baselineLabel('NIST SP 800-53B', effectiveSensitivity),
        rationale: `This baseline matches the ${effectiveSensitivity.toLowerCase()} impact level you selected for scoping controls.`,
      });

      compare.push({
        kind: 'compare',
        workbench: 'baseline-compare',
        patch: { baselineA: nistBaseline, baselineB: 'fedramp-rev5:MODERATE' },
        label: 'Compare your NIST baseline to FedRAMP Moderate',
        rationale: 'Check overlap with a common cloud authorization baseline before you inherit or tailor controls.',
      });
    } else {
      compare.push({
        kind: 'compare',
        workbench: 'relationships',
        patch: { source: 'nist-800-53', target: 'fedramp-rev5' },
        label: 'Compare NIST and FedRAMP catalogs',
        rationale: 'Start with a framework-to-framework view when you have not pinned a baseline impact level yet.',
      });
    }

    patternIds.push('rmf-lifecycle', 'control-inheritance');
  }

  if (effectiveSensitivity === 'Moderate' || effectiveSensitivity === 'High') {
    templateIds.push('poam_starter', 'assessment_planning_worksheet');
  }

  if (templateIds.length === 0) {
    templateIds.push('security_plan_starter');
  } else if (!templateIds.includes('security_plan_starter')) {
    templateIds.push('security_plan_starter');
  }

  const patterns = uniquePatternIds(patternIds).map((patternId) => ({
    kind: 'pattern',
    patternId,
    label: patternLabel(patternId),
    rationale:
      PATTERN_RATIONALES[patternId] ||
      `This playbook explains a concept that commonly blocks ${systemType} teams in a ${environment} setting.`,
  }));

  const templates = uniqueTemplateIds(templateIds).map((templateType) => ({
    kind: 'template',
    templateType,
    label: templateLabel(templateType),
    rationale:
      TEMPLATE_RATIONALES[templateType] ||
      'Generate this starter artifact locally to turn the reference path into a planning worksheet without storing your data.',
  }));

  const situation = {
    answers: { systemType, dataSensitivity, environment },
    pathLabel,
    narrative,
    assumptions,
  };

  return { situation, library, compare, patterns, templates };
}
