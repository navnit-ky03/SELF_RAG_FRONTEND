# Portfolio v2.2 frontend refinement review

Reviewed: 20 October 2026 (UTC).

Baseline: `0f944d3e4bb697129eaf8030526b6cc82ba6b094`. Work is exclusively on `feature/portfolio-v2.2`, with a separate draft PR targeting `feature/portfolio-v2`. The user's direct branch-management instruction supersedes the attached specification's older delivery section. `feature/portfolio-v2` and Draft PR #1 are preserved; no merge, deployment, Sites publication or hosting registration is part of this work.

## Completed refinements

| Area | Result |
| --- | --- |
| Visual identity | Deep charcoal with stronger electric green/cyan ambient lighting, a technical hero grid, selected headline illumination, static glass gradients and reflective upper edges. Existing headline, copy and layout remain intact. |
| Interactive surfaces | Navigation has a cyan active underline and green state; project cards have reflective edges and cyan hover/focus borders. Buttons, filters, architecture nodes/connectors, skills and relationship panels use coordinated green/cyan controls. Selected skills also show a textual **Selected** badge and an inset bar. |
| Documentation layer | Technical paragraphs, decisions, metrics, source notes and README content stay matte with soft white/gray text, restrained borders, comfortable line heights and bounded paragraph widths. No glowing paragraph text. |
| Assistant styling | Glossy frame, restrained ambient glow, calm dark assistant bubbles, distinct light-green user bubbles, a luminous send control and visible keyboard focus. |
| Collapsible suggestions | Both views start collapsed with a compact bulb + **Suggested questions** button. Each controls a uniquely identified, labelled hidden region. Short labels, exact full questions, current-page context and More questions groups are preserved. |
| Submission and state | Accepted typed queries, selected questions and manual retries collapse suggestions. A disappearing focused chip returns focus to its own input. Other focus stays stable. Empty or in-flight rejected submissions do not collapse. Disclosure state is local; history, drafts and thread remain shared. No request is sent by toggling or pagination. |
| Loading and keyboard | Disclosure remains enabled during pending requests; question controls retain the request lock. Enter/Space activate the disclosure. Escape from an expanded disclosure closes it and restores its toggle without closing the floating assistant; a subsequent Escape retains the existing dialog-close behavior. |
| Responsive chat | Expanded questions have bounded independent scrolling; collapsed space returns to the transcript. The floating transcript gains over 70px in the desktop geometry check. Input/send/disclosure remain visible and at least 44px high across requested widths and 320×480. Transcript, suggestions and composer do not overlap. The existing reserved header launcher and Home visibility behavior remain intact. |
| Authentic MRI | Only console/header/tab styling changed. The three original WebPs and asset notes remain byte-identical. Axial 92, Coronal 128 and Sagittal 108, provenance, mask explanation, single-scan outputs and research limits are preserved. No effects cover the scan. Dice 0.8842 stays separate from the single-scan outputs; no inference is triggered. |
| Backend and factual boundaries | Render URL, initial GET pre-warm, non-streaming POST contract, thread/session handling, timeouts, manual retries, safe rendering and cold-start/network distinctions are preserved. No canned AI answers, backend or knowledge-base changes. All project metrics and five documented Live Demo URLs remain unchanged. |

## Files changed

| Area | Files |
| --- | --- |
| Shared styles | `portfolio.css` |
| Disclosure behavior | `portfolio.js` |
| Disclosure HTML generation | `scripts/build.mjs` |
| Regenerated HTML | `index.html`, `404.html`, `about/index.html`, `contact/index.html`, `skills/index.html`, `projects/index.html`, and the seven existing project case-study `index.html` files |
| Verification | `tests/browser.py`, new `tests/v22.test.mjs` |
| Documentation | `README.md`, this report |
| Review images | 28 PNGs in `docs/screenshots/v2.2/` |

All files under `data/` and `assets/neuroscan/` match baseline `0f944d3`. Existing v2.1 screenshots/reports are retained. Other repositories were not modified.

## Validation

- `npm run build`: **PASS** — thirteen generated pages, seven projects, eighteen technologies.
- `npm test`: **PASS — 9 tests**.
- `python tests/browser.py` / `npm run test:browser`: **PASS — 26 tests**.
- **35 automated tests passed**, retaining coverage from all 29 baseline tests. The recruiter/contextual tests now open the disclosure before selecting questions; their original payload, pagination, session and duplicate-message assertions remain.
- All twelve content routes tested at 320, 375, 768 and 1440px, plus a 320×480 chat check. Static deep links, repository-prefix navigation, native touch activation, keyboard navigation and no-JavaScript content remain covered.
- New coverage checks default collapsed state, labelled regions, native Enter/Space activation, Escape/focus restoration, zero requests on toggle/pagination, auto-collapse on typed/suggestion/retry submissions, stable focus, re-expansion while pending, disabled prompt submissions, preserved drafts, no duplicate requests and visible/non-overlapping chat controls.
- Regression coverage includes cold-start readiness retries, downstream service failures, bounded readiness timeout, slow/timeout states, manual retries, unknown network/proxy failures, malformed payloads, safe rendering, cross-page thread/history continuity, interrupted requests and unavailable storage.
- MRI hash checks confirm original images/notes; all three local images load even with Render connectivity unavailable. Browser requests include no NeuroScan inference or application request.
- Reduced-motion checks pass. Representative text contrast checks are at least 4.5:1, including new disclosure/chips and chat text. These checks composite solid background colors; gradients also received visual review. This is not an exhaustive pixel-level or WCAG audit.
- `node --check portfolio.js`, `node --check scripts/build.mjs` and `git diff --check`: **PASS**.

The final desktop/mobile component screenshots were inspected, including the 320×480 expanded assistant, MRI console and restrained technical reading section. Glass reflections are static CSS; transitions remain short. No new dependency, particle system or continuous decorative animation was added. The header's existing blur is disabled on smaller screens.

## Screenshots and comparisons

Current images: [`screenshots/v2.2/`](screenshots/v2.2/). Desktop is 1440px wide, mobile 375px; the short-screen image is 320×480. Fonts are blocked in reproducible captures to exercise local fallbacks. Isolated component captures temporarily hide fixed navigation/progress outside the component. Chat answers are explicitly mocked test fixtures, not a live RAG quality demonstration.

| View | Desktop | Mobile |
| --- | --- | --- |
| Home | [Full page](screenshots/v2.2/home-desktop.png) | [Full page](screenshots/v2.2/home-mobile.png) |
| Featured cards | [Cards](screenshots/v2.2/featured-projects-desktop.png) | [Cards](screenshots/v2.2/featured-projects-mobile.png) |
| Main chat, collapsed | [Collapsed](screenshots/v2.2/chat-desktop-collapsed.png) | [Collapsed](screenshots/v2.2/chat-mobile-collapsed.png) |
| Main chat, expanded | [Expanded](screenshots/v2.2/chat-desktop-expanded.png) | [Expanded](screenshots/v2.2/chat-mobile-expanded.png) |
| Main chat, after answer | [Answer](screenshots/v2.2/chat-desktop-answer.png) | [Answer](screenshots/v2.2/chat-mobile-answer.png) |
| Floating chat, collapsed | [Collapsed](screenshots/v2.2/floating-chat-desktop-collapsed.png) | [Collapsed](screenshots/v2.2/floating-chat-mobile-collapsed.png) |
| Floating chat, expanded | [Expanded](screenshots/v2.2/floating-chat-desktop-expanded.png) | [Expanded](screenshots/v2.2/floating-chat-mobile-expanded.png) |
| Floating chat, after answer | [Answer](screenshots/v2.2/floating-chat-desktop-answer.png) | [Answer](screenshots/v2.2/floating-chat-mobile-answer.png) |
| Skills Explorer | [Skills](screenshots/v2.2/skills-desktop.png) | [Skills](screenshots/v2.2/skills-mobile.png) |
| MRI console | [MRI](screenshots/v2.2/mri-gallery-desktop.png) | [MRI](screenshots/v2.2/mri-gallery-mobile.png) |
| Technical reading | [Reading](screenshots/v2.2/case-study-reading-desktop.png) | [Reading](screenshots/v2.2/case-study-reading-mobile.png) |
| Contact | [Contact](screenshots/v2.2/contact-desktop.png) | [Contact](screenshots/v2.2/contact-mobile.png) |

Additional captures: [320×480 expanded floating assistant](screenshots/v2.2/floating-chat-320x480-expanded.png), [NeuroScan complete desktop case study](screenshots/v2.2/neuroscan-desktop.png), and `home-chat-desktop.png` / `home-chat-mobile.png` for the initial Home component.

| Comparison | v2.1 before | v2.2 after |
| --- | --- | --- |
| Homepage | [Before](screenshots/home-desktop.png) | [After](screenshots/v2.2/home-desktop.png) |
| Main assistant | [Before](screenshots/home-chat-desktop.png) | [Collapsed](screenshots/v2.2/chat-desktop-collapsed.png) · [Expanded](screenshots/v2.2/chat-desktop-expanded.png) |
| Skills mobile | [Before](screenshots/skills-mobile.png) | [After](screenshots/v2.2/skills-mobile.png) |
| MRI console | [Before](screenshots/mri-gallery-desktop.png) | [After](screenshots/v2.2/mri-gallery-desktop.png) |

## Remaining limits

- Live Render-to-LLM/retrieval availability, answer quality and current independent availability of documented demos were not reverified. Automated chat responses are mocked and consume no LLM quota. No cold start, timeout or Codex proxy restriction is evidence here of an offline deployment; no URL or availability status was removed or downgraded.
- The RAG knowledge base is unchanged and may lack current availability details. Static Contact/About content remains the owner-confirmed source; the assistant's existing limitation/contact note remains visible.
- Physical mobile keyboards, iOS/Android devices, Safari/Firefox, screen readers, browser zoom and a comprehensive accessibility/performance audit remain unverified. Chromium geometry, touch, focus and reduced-motion checks supplement the local visual review.
- The short-screen expanded assistant deliberately gives suggestions an internal scroll area and a small scrollable transcript; collapse restores conversation space. Physical keyboard viewport changes still warrant device review.
- No deployed/public-site validation was performed because deployment is outside the authorized scope. The existing public portfolio remains untouched.
