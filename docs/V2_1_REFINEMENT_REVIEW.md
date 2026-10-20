# Portfolio v2.1 refinement review

- Repository: `navnit-ky03/SELF_RAG_FRONTEND`
- Branch: `feature/portfolio-v2`
- Existing draft: [PR #1](https://github.com/navnit-ky03/SELF_RAG_FRONTEND/pull/1)
- Refinement baseline: `f08d27c156fc36c4c97ee937a0f5fe2b8cc9d2e4`
Reviewed: 20 October 2026

This is a refinement of the approved v2 layout and implementation. All twelve content routes, the registry, project metrics, architecture interactions, session model, backend URLs/contracts, and five documented Live Demo URLs are preserved. No other repository, backend, RAG knowledge base, deployment or hosting service was changed.

## Files changed

| Area | Source files |
| --- | --- |
| Visual styling and shared interactions | `portfolio.css`, `portfolio.js` |
| Existing generator and focused render helpers | `scripts/build.mjs`, new `scripts/refinements.mjs` |
| Professional content | `data/site.json` |
| Contextual short-label/full-question pairs | new `data/chat-prompts.json` |
| Authentic MRI manifest and source files | new `data/neuroscan.json`; `assets/neuroscan/ASSET_NOTES.md`; `neuroscan_axial_slice92.webp`, `neuroscan_coronal_slice128.webp`, `neuroscan_sagittal_slice108.webp` |
| Generated pages | `index.html`, `about/index.html`, `contact/index.html`, `skills/index.html`, `projects/index.html`, seven `projects/<id>/index.html` files, and `404.html` |
| Verification | `tests/browser.py`, new `tests/refinements.test.mjs`; existing `tests/registry.test.mjs` retained |
| Documentation and review images | `README.md`, `docs/EVIDENCE.md`, `docs/REVIEW.md`, this report, and `docs/screenshots/` |

`data/projects.json` is unchanged. No project result, owner-reported validation figure, project count definition, deployment URL, or verification status was silently revised.

## Refinement results

| Requirement | Result |
| --- | --- |
| Futuristic neon identity | **PASS.** Deep charcoal surfaces, restrained lime/cyan hero grid and ambient gradients, selected headline illumination, consistent hover edges, active navigation underline, ambient assistant border, cyan architecture connectors, and stronger selected-skill relationships. Static gradients and short CSS transitions; no particles or dependencies. |
| Recruiter-oriented assistant | **PASS.** Ten Home prompts cover positioning, hiring, strengths, end-to-end systems, automation, freelance availability, skills, problem solving and contact. Four initial chips; accessible manual More questions groups. Short labels expose and send the exact full question. Hero prompts use the main assistant. |
| Contextual suggestions | **PASS.** Projects, NeuroScan, RAG, Skills, About and Contact have their specified contexts. Other project prompts derive from their actual registry title. Free input and technology-specific skills questions remain available. No hidden query context or fabricated assistant answers. |
| Professional availability | **PASS.** AI/ML engineering identity is grounded in project work. About/Contact communicate active automation freelance interest and supported services. ML/DS opportunities are considered individually after an email discussion. Automation CTAs use the existing email/contact path. No invented employment or agency/client history. |
| Knowledge-base boundary | **PASS with model-content limit.** No backend/KB changes. Returned answers are unchanged except existing safe formatting. Each assistant explicitly notes that recent availability may be absent from its sources and links to Contact. This frontend cannot guarantee a model's future factual wording without a separate backend/KB change. |
| Authentic MRI visualization | **PASS.** Local, byte-identical supplied WebPs appear before the architecture walkthrough. Axial 92, Coronal 128 and Sagittal 108 switch immediately via accessible roving-focus tabs and Arrow/Home/End keys. Alt text, red-mask explanation, original source notes and research/clinical interpretation are present. |
| Single-scan interpretation | **PASS.** Detection/volume/burden/dimensions are labeled as outputs from one demonstration scan. The owner-reported Dice 0.8842 remains separately in Results & evidence. The native axial source is never enlarged above 240×240. No synthetic slices, masks or unsupported before/after images. |
| Mobile launcher and panel | **PASS.** Launcher occupies reserved header space and hides while Home's assistant is visible, with focus retention for keyboard users. It does not cover skills/project controls. Pointer activation and Escape preserve scroll and focus. The shared panel fits requested widths, a 320×480 short-screen case and a native touch check. |
| Backend behavior | **PASS for regressions.** Existing initial GET pre-warm, non-streaming POST `/chat`, thread/session storage, request lock, draft preservation, bounded startup checks, timeouts, retries and safe output all retained and exercised through mocked responses. Cold starts, network/proxy restrictions and downstream failures remain distinct. |

## Verification

- `npm run build`: **PASS**, 13 generated pages (twelve content routes plus 404).
- `npm test`: **PASS**, **8** registry/content/integrity tests.
- `npm run test:browser`: **PASS**, **21** Chromium acceptance tests.
- Total: **29 automated tests passed**, retaining coverage of all original 21 tests (five registry + sixteen browser). The two baseline launcher setups were adapted to the intentional header/visibility change while preserving their original session, draft, focus and duplicate-request assertions.
- Browser coverage: 320, 375, 768 and 1440 pixels across all twelve content routes; no horizontal overflow. Additional short-screen and touch checks passed.
- Tested exact payloads for all ten Home prompts and contextual prompts across seven page contexts, stable thread/history, unmodified returned answers, safe rendering, native MRI keyboard controls, independent image loading with Render connectivity unavailable, original file hashes/notes, header control geometry, native touch activation, focus/scroll, reduced motion, and representative solid-surface text contrast at or above 4.5:1.
- `node --check portfolio.js`, `node --check scripts/build.mjs`, `node --check scripts/refinements.mjs`, and `git diff --check`: **PASS**.
- All three MRI images loaded from local routes, with zero requests to the NeuroScan application or inference API. Page-level Render pre-warming remains intentionally separate.
- The existing v2 live HTTP probe is recorded in `docs/LIVE_CHECKS.md`. No fresh LLM quota was consumed by the v2.1 browser suite; all its backend responses were mocked.

The static component screenshots were visually inspected. Representative contrast checks supplement the visual review; this is not a comprehensive WCAG or assistive-technology certification.

## Updated screenshots

All files are under `docs/screenshots/`:

| View | Screenshot |
| --- | --- |
| Home, desktop | `home-desktop.png` |
| Home, mobile | `home-mobile.png` |
| Main assistant, desktop | `home-chat-desktop.png` |
| Main assistant, mobile | `home-chat-mobile.png` |
| NeuroScan case study, desktop | `neuroscan-desktop.png` |
| MRI gallery, desktop | `mri-gallery-desktop.png` |
| MRI gallery, mobile | `mri-gallery-mobile.png` |
| Skills Explorer, mobile | `skills-mobile.png` |
| Contact, desktop | `contact-desktop.png` |
| Contact, mobile | `contact-mobile.png` |

Desktop captures use 1440px width; mobile captures use 375px width. Fonts are blocked in the reproducible test captures so fallback typography is exercised. Isolated component captures omit fixed navigation/progress elements outside that component. MRI assets themselves are never edited or generated.

## Remaining limitations and unverified behavior

- The backend knowledge base intentionally has not received the new availability details. Contact/static content is the owner-confirmed source until that separate update is made; no hardcoded availability answer is injected into chat.
- Current independent availability of all five documented deployments remains unverified. Their URLs/buttons are preserved, including `https://braintumorsegmentationmri.streamlit.app/`. No transient failure was used to label an app broken.
- There is no original unmodified MRI/NIfTI file in this upload for a genuine before/after comparison. It was omitted rather than fabricated.
- Physical iOS/Android keyboards, Safari/Firefox, screen readers and a comprehensive contrast/accessibility audit were not tested. Native Chromium touch/visual-viewport behavior and representative contrast were tested.
- Deployed-browser end-to-end behavior and the final canonical hosting URL still require owner review before any approved publication. No merge, deployment, Sites publication or hosting registration was performed.
