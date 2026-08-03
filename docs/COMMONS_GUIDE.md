# Resources directory guide

Resources is Control Atlas's directory of external places and artifacts that help practitioners do the work. It is not a second Library.

## Ownership boundary

- Library owns authoritative publications, regulations, standards, baselines, and ingested source records.
- Resources owns portals, tools, clearly accessible templates, public datasets, training, product-assurance directories, government systems, and practitioner communities.
- A publisher's paid product or consulting service is not a resource. A commercial publisher is eligible only for a specific independently accessible artifact, such as a free template, public documentation, or no-cost community account.
- Restricted government workflows may be listed when their access boundary is explicit; they are not described as public.

I-Assure is the concrete boundary example: Resources links only to its public no-cost RMF template library, not its consulting or managed-service offerings. Tenable product-dependent entries and managed Platform One service offerings are rejected.

## Curated collections

1. DoD cybersecurity portals
2. Reciprocity and authorization reuse
3. Implementation and assessment tools
4. Product assurance and approved products
5. Cloud, DevSecOps, and software factories
6. CMMC and the defense industrial base
7. Cyber workforce and training
8. Practitioner communities

Collections are editorial browse aids. They do not create structural Atlas parentage or imply endorsement.

## Data contract

- Dataset: `data/commons-resource-dataset.json`
- Schema: `data/schemas/commons-resource-schema.json`
- Candidate dispositions: `data/commons-candidate-manifest.json`
- Research and platform decision: `data/resource-ecosystem-disposition.json`
- Brand sources and fallbacks: `data/resource-brand-assets.json`
- Generated search index: `data/generated/commons-search-index.json`

Every resource carries a concise card purpose, publisher and publisher type, access and cost labels, official status, technology scope, search aliases, collection membership, brand key, source evidence, verification method, and review dates. Parent/child links connect external ecosystems only; they do not alter Atlas or Library structure.

## Verification

```text
npm run resources:validate
npm run resources:health
npm run build:site
```

The health checker follows redirects, retries public HEAD failures with a bounded GET, records expected restricted-access boundaries, and never fabricates a successful fast-mode response.

Community detail pages show this warning once:

> Do not post CUI, credentials, system details, assessment evidence, or other non-public organizational information.
