# GovFrame Federal Security Control Integration Directory PRD

## Purpose

GovFrame explains how U.S. federal security controls connect to the programs, assessments, implementation checks, vulnerability operations, threat-informed context, validation paths, and evidence that support them.

The product answers:

> For this federal control, requirement, baseline, checklist, vulnerability, or threat context: what federal source mandates it, where does it map, what implements it, what assesses it, what validates it, and what evidence supports that relationship?

## Primary Users

- Federal and contractor assessors evaluating control implementation and evidence.
- Security and compliance engineers translating federal requirements.
- System owners preparing authorization and continuous-monitoring artifacts.
- Program teams comparing RMF, FedRAMP, CUI, CMMC, and DoD implementation context.

## Core Experiences

1. Search for a federal control, requirement, program, checklist, vulnerability, or context object.
2. Inspect federal-published relationships before inferred candidates.
3. See baseline, RMF, assessment, implementation, vulnerability, threat, validation, and evidence context.
4. Browse federal sources and understand their authority, lifecycle, access, and provenance.
5. Export source-backed relationship citations and graph data.

## Product Scope

Primary graph content must satisfy at least one criterion:

- Mandated by U.S. federal law, regulation, policy, directive, contract clause, or authorization process.
- Published or operated by a U.S. federal entity.
- Used by a federal cyber program for authorization, assessment, configuration, vulnerability management, or validation.
- Referenced through an official federal source.

Non-federal sources may appear only as `federal_referenced` or `federal_utilized` context with explicit federal provenance. Generic framework aggregation, vendor-authored crosswalks, commercial mappings, blog mappings, and restricted content are not primary product scope.

## Trust Principles

- Every graph node has a defining source.
- Every graph edge has a relationship type, federal provenance class, confidence, and evidence.
- Federal-published and inferred relationships are never conflated.
- Inference is transparent, reproducible, and never displayed as official.
- Restricted or authenticated content is not redistributed or scraped around access controls.
- Evidence quality supports the claim but is not the primary user-facing federal trust label.

## Delivery Constraints

- Static GitHub Pages delivery.
- No accounts, telemetry, cookies, backend, or user-data storage.
- Public and lawfully redistributable artifacts only.
- Large generated artifacts load without blocking first interaction.
- Graph views have accessible text alternatives.

## Release 1 Outcome

Release 1 establishes the federal graph contract and RMF/control backbone:

- Federal source registry and inclusion policy.
- Provenance-aware node, edge, and evidence contracts.
- FIPS 199, FIPS 200, SP 800-37, SP 800-53, SP 800-53B, and SP 800-53A context.
- Canonical OSCAL ingestion and graph-health gates.
- A deployable migration of current search, browse, source, evidence, and onboarding journeys.

## Definition of Done

GovFrame can answer, for a control such as `AC-2`, what federal source defines it, which federal baselines include it, which RMF steps use it, how it is assessed, and what evidence supports every displayed relationship. Later releases add contractor programs, implementation checks, vulnerability context, threat/defense/validation context, graph discovery UX, citations, exports, and governance.
