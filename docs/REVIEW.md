# Portfolio v2 review

Current refinement: see [Portfolio v2.1 review](V2_1_REFINEMENT_REVIEW.md). The original v2 baseline review follows.

Implementation branch: `feature/portfolio-v2` in `navnit-ky03/SELF_RAG_FRONTEND`.
Base: `e48cde0156ee1a7145e4ff5f1b3003ed713cc1d6` (`main` at inspection).
Scope: frontend repository only. Other project repositories were read-only. No merge, deployment, production-branch overwrite, credentials or secrets were introduced.

## Requirement status

| Requirement | Status | Evidence / limit |
| --- | --- | --- |
| Home, Projects, Skills, About, Contact | PASS | Independently generated static routes; unique titles, descriptions, navigation and share metadata. |
| Seven dedicated case studies | PASS | Problem/solution, features, first-position architecture walkthrough, decisions, sourced results, limitations, technologies, related work, README and GitHub. |
| Homepage dashboard and visual identity | PASS | Dark/neon green/cyan treatment, primary assistant, registry-derived facts, featured cards, manual flagship architecture showcase and optional terminal. |
| Project registry and growth | PASS | Projects, skills mappings, search, filters, counters and related links derive from JSON. Isolated eighth-project test creates route and updates counts without template edits. |
| Interactive skills explorer | PASS | Technology categories, real project relationships, deep-linked skill selection, project navigation and contextual prompts. |
| About and Contact | PASS | Centrally editable biography, verified existing email/GitHub, mail links and copy control. Owner editorial review still advised. |
| Two synchronized chat entry points | PASS | One session-backed thread/history, draft retention, consistent hero/floating views, contextual prompts and free input. |
| Pre-warming/startup/errors/retry | PASS | Original URLs and immediate GET preserved. Shared bounded readiness probes, slow states, request timeout, request lock, manual saved-question retry and navigation recovery. HTTP health never implies LLM health. |
| Real backend integration | PASS for one HTTP probe | GET / and non-streaming POST /chat returned HTTP 200 after a delayed readiness attempt. POST returned answer text with allowed-origin header. Not a deployment health guarantee; production-browser integration not tested. |
| Safe untrusted output | PASS | DOM-only answer formatting and HTTPS links; all raw HTML/unsafe links remain text. README is inert text with timeout/retry. Injection tests passed. |
| Documented deployments | PASS | All five URLs preserved as Live Demo buttons; startup notes; documented vs verified counts remain separate. |
| Current demo availability | NOT VERIFIED | Tool/destination access limits. No deployment labeled broken or offline. |
| Responsive/browser behavior | PASS | Chromium at 320, 375, 768, 1440 pixels on all twelve content routes. No horizontal viewport overflow. Direct refresh, history, repo-prefix routes, gallery, skills and architecture exercised. |
| Accessibility basics | PASS / PARTIAL | Semantic controls, labels, visible focus, menu ARIA/Escape focus, chat focus return, reduced motion, keyboard forms, inert text. Real screen-reader, mobile-device and comprehensive contrast audit not performed. |
| Static hosting | PASS locally | Nested folder routes, GitHub Pages prefix, relative assets and links, no SPA rewrite requirement; core content and mobile nav usable without JS. |
| Canonical published URLs | PENDING CONFIGURATION | Set the actual public `siteUrl` and rebuild after hosting URL is confirmed. Open Graph/title/description are already generated. |
| Documentation | PASS | Exact project/skill/architecture/result/About/demo maintenance workflow, source table, hosting notes, test and live-smoke instructions. |
| Review stage only | PASS | Feature branch prepared; no merge or deployment. |

## Automated verification

- `npm run build`: **PASS** — 13 generated pages: twelve content routes plus a 404 page.
- `npm test`: **PASS** — five registry, provenance, documented-deployment, internal-link and eighth-project-generation tests.
- `npm run test:browser`: **PASS** — sixteen Chromium acceptance tests; all Render responses in this suite are mocked. Fonts were blocked in the reproducible screenshots to exercise the local fallback.
- `node --check portfolio.js`: **PASS**.
- `git diff --check`: **PASS**.

Browser coverage includes 48 viewport/route combinations, nested-page refresh, gallery search/no-results, all five demo buttons, skills mappings/context prompts, flagship node selection and stepping, optional terminal, mobile menu, browser back/forward, draft retention, synchronized views, stable thread, concurrent-send prevention, manual retry without duplicate bubbles, readiness-success/chat-503 separation, cold-start GET recovery, slow processing, timeouts, rate-limit/422/500 handling, unknown network connectivity, invalid JSON contract, inert HTML/unsafe links, README failure/retry, interrupted navigation, denied/malformed storage, keyboard focus and JavaScript-disabled content/navigation. The bounded-readiness test verifies that inconclusive health does not prevent a working `/chat` endpoint from being tried.

Screenshots: `docs/screenshots/home-desktop.png`, `home-mobile.png`, `skills-mobile.png`, `neuroscan-desktop.png`.

## Content decisions and open evidence

- NeuroScan Dice **0.8842** is included as owner/developer-reported validation, with compute/experimentation context. It is not independently logged or clinical validation.
- RAG latency observations are labeled local README observations; no vector-latency or zero-hallucination promise remains.
- Fraud recall/FPR are derived from the README holdout confusion matrix and labeled accordingly.
- CLV/churn values use the checked saved evaluation report: ROC-AUC **0.9790**, R² **0.9462**, MAE **$447.32**, RMSE **$912.80**, plus the report's classification metrics.
- Delivery numerical metrics and city count are withheld; the checked evaluation script does not supply a saved numerical result.
- Lecture README/app embedding discrepancy is disclosed; saved-vector compatibility is unresolved in the read-only source project.
- All five deployment URLs remain linked. Zero verified availability checks does not mean zero working deployments.

Detailed sources and the full numeric metric/source table are in `EVIDENCE.md`. Live backend observations are in `LIVE_CHECKS.md`.

## Remaining owner checks before merge/publication

Review the editable biography, confirm the intended public URL for canonical metadata, exercise the actual frontend against Render in a normal browser, check all five Streamlit apps after allowing startup time, and review on a real mobile device/screen reader. Confirm the lecture embedding configuration and add a reproducible delivery results artifact in their source repositories separately if desired; no backend/source project changes were made here.
