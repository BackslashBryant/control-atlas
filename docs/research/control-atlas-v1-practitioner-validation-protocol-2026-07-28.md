# Control Atlas V1 practitioner validation protocol

Date: 2026-07-28  
Purpose: prove the release candidate works for practitioners without relying on internal familiarity or synthetic personas.

## Research question

Can working practitioners use Control Atlas to find, verify, relate, compare, and act on published material and external resources while correctly understanding source authority and the limits of product judgment?

## Participants

Minimum: five participants across at least three of these roles:

- federal cybersecurity or risk practitioner;
- assessor or control-validation practitioner;
- contractor GRC or authorization-package practitioner;
- security engineer implementing requirements;
- program/product owner responsible for evidence or governance;
- researcher, educator, or analyst who routinely verifies primary sources.

Recruit for current work, not labels such as novice, beginner, or expert. Do not coach participants on the product taxonomy before tasks begin.

## Format

- 45–60 minute moderated remote or in-person session.
- Release candidate or deployed preview at desktop size.
- At least two participants repeat the mobile task subset on a physical phone.
- Think-aloud encouraged, but task completion is judged by observed behavior.
- Record screen and audio only with consent.
- Store anonymized notes; do not collect sensitive system, authorization, or customer data.

## Opening

Ask:

1. What kind of cybersecurity information do you normally have to find?
2. How do you currently verify that information?
3. What tools, documents, or communities do you use after finding a requirement?

Do not explain Control Atlas beyond:

> Control Atlas is a public reference workbench for finding and connecting published cybersecurity material and external working resources. Please use it as you naturally would.

## Critical tasks

Give tasks one at a time without naming the destination.

1. Find AC-2 and identify its official title, publisher, source publication, and official text.
2. Find material about encryption without using an identifier. Explain why the first useful result appears.
3. Search for a nonsense term and explain what the result means.
4. Find DE.AE-08, state where it sits in its publisher structure, and identify one published mapping.
5. Open a related record and return without losing the original work.
6. Browse one framework from overview to record using Path, Map, and List. Explain what changes and what stays in scope.
7. Configure a framework comparison, share/copy the state, and explain what the mapping does not prove.
8. Find the source used for a record and explain how Control Atlas used it.
9. Find one external tool, one template or starter document, and one practitioner community.
10. Distinguish Sources from Build → Resources.
11. Recover from a stale/invalid link or empty filter.
12. Refresh and use back/forward while preserving the active task.

Mobile subset: tasks 1, 2, 6, 9, and 11.

## Authority questions

After tasks, ask without leading:

1. Which text came from an official publisher?
2. Which text was written by Control Atlas?
3. Did the product tell you which baseline or framework applies?
4. Does a displayed mapping prove equivalent coverage?
5. Would you treat a generated starter document as complete authorization evidence?
6. Where would you verify a consequential decision?

Any answer implying that Control Atlas determined applicability, compliance, inheritance, authorization, or source authority is a Critical comprehension failure.

## Measures

Record per task:

- completed without moderator help;
- completed with one prompt;
- failed or abandoned;
- time to first useful result;
- wrong turn or dead end;
- source/product confusion;
- structure/applicability confusion;
- copied/shared state preserved;
- participant confidence: 1–5;
- single ease question: 1–7;
- exact words used when describing the product.

Do not use satisfaction scores to override observed failure.

## V1 thresholds

- At least 80% of critical tasks completed without moderator help across participants.
- Known-identifier result reached within 60 seconds by at least four of five.
- Topic result and official source reached within two minutes by at least four of five.
- External Resource reached within two minutes by at least four of five.
- At least four of five correctly distinguish Sources from Resources.
- At least four of five correctly distinguish official text from Control Atlas notes.
- Zero source misattribution encountered.
- Zero participant concludes that Control Atlas determined applicability, compliance, baseline, inheritance, authorization, or ATO.
- No Critical/High dead end on Home, Search, Explore, Catalog, Record, Compare, Build/Resources, or Sources.

## Severity

- Critical: wrong source/authority, prohibited determination, inaccessible task, unsafe output.
- High: defining task fails, dead end, hidden capability, lost state, or repeated participant misunderstanding.
- Medium: significant delay, wrong turn, dense/confusing copy, or responsive friction.
- Low: isolated polish with no task or truth impact.

Every Critical/High observation requires correction and replay with at least two participants before V1.

## Reporting

Produce:

- participant-role summary without identifying data;
- task completion table;
- time/ease results;
- observed language and misunderstandings;
- findings with severity and evidence;
- correction/replay results;
- launch recommendation.

Internal persona walkthroughs and automated tests are useful preparation, but they do not count as participant evidence.

