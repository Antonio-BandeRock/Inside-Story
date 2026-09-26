# Competitive Review: Reports tab

Checked 2026-09-25. Read-only review; nothing in the app was changed.

## Progress
- [x] App inventory
- [x] Competitors (8)
- [x] Gap synthesis and ranked recommendations
- [x] Pricing summary

## 1. What the Reports tab does today

Files: `app/(tabs)/reports.tsx` (screen), `lib/reportKinds.ts` (what each report is), `lib/reportGenerator.ts` (gathers records, `buildReport(days, kind)`, plain-text renderer), `lib/reportHtml.ts` (HTML layout for the PDF), `lib/reportPdf.ts` (expo-print to PDF, renamed, handed to the share sheet).

- **Eight reports, each a lens on the tab:** Overview, For Your Doctor, For a Nutritionist, For a Trainer, Looking Back, For a Caregiver, Medical Costs, Garden. Each report names which "core" sections it carries (conditions, nutrients, condition score flags, symptoms and flares, meds and supplements, movement and sleep, weight and blood pressure, personal rules, latest labs) and adds sections read straight from a Trends or Insights lens, so the sentence a clinician reads is the one the person saw on screen.
- **Date range:** three fixed choices, 7, 30 or 90 days. Labs always show the most recent result per test regardless of range.
- **Two outputs:** "Share as PDF" (tables and lists, no charts) and "Share as text" (plain words for a message). Both go through the phone's share sheet; nothing is uploaded.
- **Honesty built in:** every report opens with "It is not a diagnosis... self-reported or read from the phone". Personal rules are labelled as the person's observation or a clinician's instruction, never as research. The clinical-claims audit (`scripts/audit_clinical_claims.js`) covers the report module. A period with nothing logged is said as such, never shown as zero.
- **Doctor report specifics:** next appointment and what changed since the last visit with that provider, blood pressure, doses as scheduled versus as marked, active meds and supplements, labs. Unfinished health notes from the capture inbox surface as questions in the Insights appointment lens (`lib/insightsMore.ts`), which feeds the doctor report's Appointments section.
- **Also unusual:** caregiver, medical-cost (bills, insurance deductible standing) and garden reports, which no competitor reviewed here offers.
- **Not there today:** charts or graphs in the PDF, custom date ranges, choosing individual sections, saved report history (the "My Reports" hub exists but is a generic pinned-items hub), a live link a clinician can open, import of records from a hospital portal (FHIR), a one-page summary at the top, CSV/spreadsheet export for a dietitian, and the desktop app can produce the PDF but no report can be printed directly from a phone.

## 2. Competitors (each checked 2026-09-25)

### Guava Health (https://guavahealth.com/plans)
- **Price:** Free, or Premium at $78 a year. Family pricing is "discounted" with no figure published.
- **What it does well:** Visit Prep for each appointment (a symptom summary, a prioritized list of questions, download, send or print); imports records from over 50,000 US patient portals and reads lab values out of an uploaded PDF; has a provider dashboard.
- **Where Inside Story is ahead:** no account and no server; food, nutrient and condition sections; reports for different readers; medical costs.

### Bearable (https://bearable.app/pricing/)
- **Price:** $6.99 a month or $34.99 a year (often discounted to $18.99). Free tier.
- **What it does well:** strong charts that people screenshot for their doctor; CSV export covering 3 months, 6 months or everything.
- **Where Inside Story is ahead:** Bearable has no laid-out PDF report (still on their roadmap), and its "% effect" figures read as cause and effect.

### Visible (third-party sources; the official pricing page returned "not found")
- **Price:** the app is free. Visible Plus is $19.99 a month or $179.88 a year and requires their band.
- **What it does well:** its PDF charts symptoms as a 7-day rolling average and heart rate and HRV as 2-week averages. It needs 30 days of check-ins before it will make a report.

### CareClinic (App Store listing)
- **Price:** about $5.99 a month or $39.99 a year. A lifetime plan exists, with passes listed from $34.99 to $59.99.
- **What it does well:** charted PDF reports, Care Teams that share with family, stored health documents.
- **Where Inside Story is ahead:** evidence labelling, and depth on food and cost.

### mySymptoms (App Store listing)
- **Price:** $9.99 a month, $39.99 for 6 months, or $59.99 a year. Prices vary by country.
- **What it does well:** food and symptom correlation histograms; export as PDF, CSV or a web report; a "Clinic" web app where the clinician views the diary.

### Cronometer (third-party 2026 reviews; the support page blocked the fetch)
- **Price:** Gold about $10.99 a month or $59.99 a year. Pro, for practitioners, about $39.99 a month.
- **What it does well:** Gold's configurable Print Report; Pro accounts where a dietitian invites the client and sees their diary.
- **Where Inside Story is ahead:** conditions, symptoms and a doctor report.

### Apple Health (Apple Support share-with-provider FAQ)
- **Price:** free on iPhone.
- **What it does well:** US FHIR Health Records import, "Share with Provider" into a participating clinic's records system, family sharing, full XML export.
- **Weaknesses:** no laid-out report, and no Android.

### Healthie (softwarefinder.com, help.gethealthie.com)
- **Price:** practitioner plans. Core $19.99 a month (up to 10 clients), Essentials $49.99, Plus $129.99, Group $149.99. The client uses it free.
- **What it does well:** client portal, food journal review, charting.
- **Weaknesses:** requires a server, which conflicts with the no-server stance.

## 3. Gaps and what each would take (ranked by value per effort)

1. **Longer and custom ranges, plus "since last visit".** Add 6 months and 1 year to `DAY_RANGE_OPTIONS` in `app/(tabs)/reports.tsx`; `buildReport` already accepts any number of days. JS only, over the air. Small.
2. **An "At a glance" front page.** Top symptoms by days present, doses taken against doses scheduled, latest weight and blood pressure, labs outside the range the lab printed. Built in `lib/reportGenerator.ts`, laid out in `lib/reportHtml.ts`. JS only. Small to Medium.
3. **Charts in the PDF.** Inline SVG from a new `lib/reportCharts.ts`, plus an optional chart field on `ReportSection`. expo-print renders SVG, so no native module. Blank periods show as gaps, never zeros, using bars or dots rather than joined lines. JS only. Medium.
4. **Visit prep in For Your Doctor.** A questions list the person can reorder and tick off, tied to one appointment (a new `visit_questions` table, or a priority on capture notes). Builds on the `i-appointment` lens in `lib/insightsMore.ts`. Symptoms stay in the person's words. JS only. Medium.
5. **CSV export** of the table sections through `lib/nativeSharing.ts`. JS only. Small.
6. **A "What I have noticed" section.** Pattern Finder candidates with their denominators from `lib/patternBasis.ts`, plus food-experiment results; every line labelled as a hypothesis from one person's records, checked against `scripts/audit_clinical_claims.js`. JS only. Small to Medium.
7. **A history of reports sent.** A small table recording what was generated, when and for whom, so "since the last report" works. JS only. Small.
8. **Heart rate and HRV** through `lib/healthConnect.ts`. New permissions, likely an EAS rebuild. Medium.
9. **Lab values read from a photo or PDF.** On-device ML Kit, a native module and a rebuild; sending the image to an outside service would break local-first. Large.
10. **FHIR import** (SMART on FHIR, or Health Connect medical records). US-only, heavy to register and test. Large.
11. **Skip:** a provider dashboard, live clinician link or clinic web app. Each needs a server holding health data.

## 4. Pricing

| App | Free | Monthly | Annual | Other |
|---|---|---|---|---|
| Guava | yes | ~$8 (yearly billing) | $78 | family "discounted", no figure |
| Bearable | yes | $6.99 | $34.99 (often $18.99) | sponsored subscriptions |
| Visible Plus | app free | $19.99 | $179.88 | band required |
| CareClinic | yes | ~$5.99 | ~$39.99 | lifetime plan available |
| mySymptoms | limited | $9.99 | $59.99 | 6 months $39.99 |
| Cronometer Gold | yes | ~$10.99 | $59.99 | Pro ~$39.99 a month |
| Apple Health | free | none | none | iPhone only |
| Healthie (practitioner) | client free | $19.99 to $149.99 | about 10% off | practitioner pays |
| **Inside Story (planned)** | Free (no Reports) | $9.99 Individual; $14.99 Partner | $89.99; $134.99 Partner | Caregiver $4.99 a month; household seats $1.99 a month |

Single-purpose trackers cost $35 to $60 a year. Broader record or health organizers cost about $78 to $96 a year. Monthly prices cluster at $6 to $11. At $89.99 a year, Individual sits at the top of the consumer range, defensible because no competitor offers eight reports for different readers, or food, cost and caregiver reports.
