import { Fragment, type ReactNode } from "react";

const ACRONYM_EXPANSIONS: Record<string, string> = Object.freeze({
  "ATT&CK": "Adversarial Tactics, Techniques, and Common Knowledge",
  "CMMC": "Cybersecurity Maturity Model Certification",
  "CCI": "Control Correlation Identifier",
  "CSF": "Cybersecurity Framework",
  "CUI": "Controlled Unclassified Information",
  "D3FEND": "Detection, Denial, and Disruption Framework Empowering Network Defense",
  "DISA": "Defense Information Systems Agency",
  "FIPS": "Federal Information Processing Standards",
  "MITRE": "The MITRE Corporation",
  "NIST": "National Institute of Standards and Technology",
  "OSCAL": "Open Security Controls Assessment Language",
  "POA&M": "Plan of Action and Milestones",
  "RMF": "Risk Management Framework",
  "SRG": "Security Requirements Guide",
  "SSP": "System Security Plan",
  "STIG": "Security Technical Implementation Guide",
});

const ACRONYM_PATTERN = new RegExp(
  `(${Object.keys(ACRONYM_EXPANSIONS)
    .sort((left, right) => right.length - left.length)
    .map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|")})`,
  "g",
);

export function AccessibleTerm(props: { children: string; explanation: string }) {
  return (
    <span className="accessible-term">
      <abbr
        className="accessible-term__label"
        data-tooltip={props.explanation}
        tabIndex={0}
        title={props.explanation}
      >
        {props.children}
      </abbr>
    </span>
  );
}

export function AcronymText(props: { children: string }): ReactNode {
  const parts = props.children.split(ACRONYM_PATTERN);
  return parts.map((part, index) => {
    const explanation = ACRONYM_EXPANSIONS[part];
    return explanation
      ? <AccessibleTerm explanation={explanation} key={`${part}-${index}`}>{part}</AccessibleTerm>
      : <Fragment key={`text-${index}`}>{part}</Fragment>;
  });
}
