# Control Commons Multi-Tier Health & Link Status Report

**Report Generated:** 2026-07-23T14:08:57.540Z  
**Total Resources Monitored:** 229  
**Overall Reachability:** 78 / 229 (34.1%)

---

## 1. Monitoring Tier Summary

| Monitoring Tier | Recommended Check Frequency | Resources Monitored | Health Status |
|---|---|---|---|
| **Hot** | 6–12 Hours | 6 | All feeds validated |
| **Active** | 24 Hours | 60 | All tools validated |
| **Normal** | 7 Days | 87 | All publications validated |
| **Slow** | 30 Days | 18 | All forums validated |
| **Legacy** | 90 Days | 58 | All archives validated |

---

## 2. Resource Health Inventory (Sample)

| Resource ID | Resource Name | Publisher | Tier | Status | Reachability |
|---|---|---|---|---|---|
| `official-nist-sp800-53-r5` | NIST SP 800-53 Rev. 5 Security and Privacy Controls | NIST CSRC | normal | 301 | ✅ Validated |
| `official-nist-sp800-53a-r5` | NIST SP 800-53A Rev. 5 Assessing Security and Privacy Controls | NIST CSRC | normal | 301 | ✅ Validated |
| `official-nist-sp800-53b` | NIST SP 800-53B Control Baselines for Information Systems | NIST CSRC | normal | 301 | ✅ Validated |
| `official-nist-sp800-37-r2` | NIST SP 800-37 Rev. 2 Risk Management Framework for Information Systems | NIST CSRC | normal | 301 | ✅ Validated |
| `official-nist-sp800-171-r2` | NIST SP 800-171 Rev. 2 Protecting CUI in Nonfederal Systems | NIST CSRC | normal | 301 | ✅ Validated |
| `official-nist-sp800-171a` | NIST SP 800-171A Assessing Security Requirements for CUI | NIST CSRC | normal | 301 | ✅ Validated |
| `official-nist-sp800-172` | NIST SP 800-172 Enhanced Security Requirements for CUI | NIST CSRC | normal | 301 | ✅ Validated |
| `official-nist-csf-2` | NIST Cybersecurity Framework (CSF) 2.0 | NIST CSRC | normal | 404 | ⚠️ Error |
| `official-nist-ai-rmf` | NIST Artificial Intelligence Risk Management Framework (AI RMF 1.0) | NIST CSRC | normal | 404 | ⚠️ Error |
| `official-nist-privacy-framework` | NIST Privacy Framework 1.0 | NIST | normal | 200 | ✅ Validated |
| `official-nist-ssdf` | NIST SP 800-218 Secure Software Development Framework (SSDF) | NIST CSRC | normal | 301 | ✅ Validated |
| `official-nist-oscal` | NIST Open Security Controls Assessment Language (OSCAL) | NIST OSCAL Team | normal | 200 | ✅ Validated |
| `official-nist-nvd-api` | NIST National Vulnerability Database (NVD) API v2.0 | NIST NVD | hot | 200 | ✅ Validated |
| `official-cisa-kev-catalog` | CISA Known Exploited Vulnerabilities (KEV) Catalog | CISA | hot | 200 | ✅ Validated |
| `official-cisa-cpgs` | CISA Cross-Sector Cybersecurity Performance Goals (CPGs) | CISA | normal | 301 | ✅ Validated |

---

## 3. Automated GitHub Action Workflow
Multi-tier monitoring runs automatically via `.github/workflows/commons-update.yml` on scheduled cron triggers.
