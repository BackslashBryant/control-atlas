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

  const library = [];
  const compare = [];
  const patternIds = [];
  const templateIds = [];

  const isCloud = systemType === 'Cloud SaaS' || systemType === 'Platform service';
  const isEnterpriseShape = systemType === 'Hybrid' || systemType === 'Enterprise service' || systemType === 'On-premises';
  const isCui = dataSensitivity === 'CUI';

  if (isCloud) {
    patternIds.push('csp-inheritance', 'shared-responsibility');
    templateIds.push('inheritance_worksheet');
  } else if (isEnterpriseShape) {
    patternIds.push('enterprise-inheritance', 'boundary-patterns');
    templateIds.push('inheritance_worksheet');
  }

  if (environment === 'CSP' || systemType === 'Cloud SaaS') {
    library.push({
      kind: 'library-catalog',
      catalogId: 'fedramp-rev5',
      label: 'FedRAMP Rev. 5 Baselines',
      rationale: 'Cloud and CSP paths usually start with the public FedRAMP baseline catalog before you map inheritance.',
    });

    const fedrampBaseline = fedrampBaselineId(dataSensitivity);
    if (fedrampBaseline) {
      library.push({
        kind: 'library-node',
        nodeId: fedrampBaseline,
        label: baselineLabel('FedRAMP', dataSensitivity),
        rationale: `Your ${dataSensitivity.toLowerCase()} sensitivity answer points to this public FedRAMP baseline as a first reference set.`,
      });
    }

    patternIds.push('ato-vs-fedramp');

    const nistBaseline = nistBaselineId(dataSensitivity);
    if (fedrampBaseline && nistBaseline) {
      compare.push({
        kind: 'compare',
        workbench: 'baseline-compare',
        patch: { baselineA: fedrampBaseline, baselineB: nistBaseline },
        label: 'Compare FedRAMP and NIST baselines',
        rationale: 'See what your FedRAMP baseline shares with the matching NIST baseline before you plan controls.',
      });
    }
  } else if (environment === 'DoD') {
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

    const nistBaseline = nistBaselineId(dataSensitivity);
    if (nistBaseline) {
      library.push({
        kind: 'library-node',
        nodeId: nistBaseline,
        label: baselineLabel('NIST SP 800-53B', dataSensitivity),
        rationale: `Use this baseline to see which controls apply at the ${dataSensitivity.toLowerCase()} impact level you selected.`,
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
  } else if (environment === 'Contractor' || isCui) {
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
    library.push({
      kind: 'library-catalog',
      catalogId: 'nist-800-53',
      label: 'NIST SP 800-53 Rev. 5',
      rationale: 'Federal civilian systems usually begin with the public NIST control catalog and baseline placement.',
    });

    const nistBaseline = nistBaselineId(dataSensitivity);
    if (nistBaseline) {
      library.push({
        kind: 'library-node',
        nodeId: nistBaseline,
        label: baselineLabel('NIST SP 800-53B', dataSensitivity),
        rationale: `This baseline matches the ${dataSensitivity.toLowerCase()} impact level you selected for scoping controls.`,
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

  if (dataSensitivity === 'Moderate' || dataSensitivity === 'High') {
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
    rationale: `This pattern explains a concept that commonly blocks ${systemType.toLowerCase()} teams in a ${environment.toLowerCase()} setting.`,
  }));

  const templates = uniqueTemplateIds(templateIds).map((templateType) => ({
    kind: 'template',
    templateType,
    label: templateLabel(templateType),
    rationale: 'Generate this blank artifact locally to turn the reference path into a planning worksheet without storing your data.',
  }));

  return { library, compare, patterns, templates };
}
