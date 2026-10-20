# Navnit Kumar Yadav · Portfolio v2.1

A lightweight, static multipage portfolio with source-backed case studies, an interactive skills explorer, architecture walkthroughs, and two synchronized entry points to the existing RAG assistant. No production framework, runtime package, API key, or backend modification is required.

## Run and review

Requirements: Node.js 20.11+ and Python 3. Run from this repository:

```sh
npm run build
npm test
npm run serve
```

Open `http://localhost:4173/`. `npm run build` generates the committed HTML pages; it does not deploy anything. The browser runtime is plain JavaScript. Google Fonts is optional; local system fonts remain usable when the font network is unavailable.

For browser acceptance tests, install Python Playwright in your development environment and supply Chromium:

```sh
python -m pip install playwright
# Either install Chromium yourself or use Playwright's managed browser:
python -m playwright install chromium
# If using the managed browser, set CHROMIUM_PATH to its executable.
npm run test:browser
```

The test runner defaults to `/usr/bin/chromium`; set `CHROMIUM_PATH` for another path. It starts its own loopback server and mocks all Render/LLM requests. It does not consume LLM quota or verify a deployment. Screenshots are written to `docs/screenshots/`.

## Pages and hosting

```text
index.html                       Home dashboard and prominent assistant
projects/index.html              Searchable, domain-filterable gallery
projects/<project-id>/index.html  One independently shareable case study per project
skills/index.html                Technology → project explorer
about/index.html                 Editable personal introduction
contact/index.html               Email and GitHub
404.html                         Missing-page fallback
portfolio.js / portfolio.css      Shared browser behavior and styling
data/projects.json               Single published-project registry
data/skills.json                 Technology names, categories, descriptions
data/site.json                   Contact, About, confirmed availability, optional public URL
data/chat-prompts.json           Recruiter and contextual prompt labels/full questions
data/neuroscan.json              Authentic single-scan visualization manifest
assets/neuroscan/                Three original WebPs and unchanged asset attribution
scripts/build.mjs                Dependency-free static page generator
scripts/refinements.mjs          Prompt, availability and MRI section renderers
tests/                           Registry/link and browser acceptance tests
docs/                            Evidence, review results, screenshots
```

Serve/deploy the repository root as static files. Nested directory `index.html` routes support direct access, refresh, and normal browser back/forward without SPA rewrite rules. All assets and internal links use relative paths, including under a GitHub Pages repository prefix. No modal is required to read a case study. Primary navigation and case-study content also work without JavaScript; the mobile navigation remains visible as a wrapped list when scripting is disabled.

For GitHub Pages, choose the branch/root directory in the repository's Pages settings **only when deployment is approved**. No deployment workflow has been introduced. Set `siteUrl` in `data/site.json` to the actual published HTTPS base URL, including its trailing slash (for example, an owner-confirmed `https://<owner>.github.io/<repo>/`). Rebuild to emit absolute canonical/Open Graph URLs and a correct hosted 404 base. It is intentionally empty until the public URL is confirmed. Do not assume the repository's homepage is the deployed portfolio URL.

Legacy hash links such as `/#projects` are redirected to the corresponding static page. Existing content links are otherwise normal relative URLs.

## Add an eighth project

1. Add a new object to `data/projects.json`, using an existing case as a schema reference. Give it a unique lowercase `id` such as `my-eighth-project`; the ID becomes its stable URL. Fill in `title`, `eyebrow`, `category`, `tags`, `description`, `problem`, `solution`, `features`, `architecture` (ordered `[title, explanation]` steps), `challenges` (`[decision, explanation]` pairs), `limitations`, and `questions`.
2. Add factual `skills` IDs, the HTTPS `github` and raw `readme` URLs, a precise `source` path/reference, and `sourceStatus` describing what was actually checked. Set `published: true`. Use `featured: true` only if it belongs on Home; the featured section derives from this flag.
3. Add `metrics` only when substantiated. Each result has `label`, `value`, and `note` explaining its source, evaluation circumstances, and whether it is owner-reported or independently measured. Use `metrics: []` when results are unavailable. Do not carry an old number forward without checking it.
4. Register new technologies in `data/skills.json` (`id`, `name`, `category`, `description`) and reference their IDs in the project. The skills counts, linked project map, gallery search, related projects, and terminal output derive from these relationships.
5. Set `demo: null` when no deployment is documented. For a documented deployment use `{ "url": "https://…", "status": "unverified", "source": "Where this URL was documented" }`. This **preserves and displays its Live Demo button** even when a current availability check is inconclusive. Only use `status: "verified"` after a functional check, adding `verifiedAt` and `evidence`; the generator requires both. Never mark a link broken because of a cold start, timeout, or proxy/tool restriction. For confirmed persistent failure, use `status: "persistent-failure"` with `checkedAt` and `evidence` describing the reasonable retries performed; retain the URL for owner review.
6. Run the single generation command `npm run build`, then `npm test`. The new route, cards, counters, skills links, and related-project navigation are generated automatically. No manual HTML route creation is needed. Unpublishing a formerly published project also requires removing its old generated folder from the checkout; this avoids an automated script deleting owner files.

`visual` selects an optional decorative card motif (`rag`, `vision`, `voice`, `fraud`, `customer`, `delivery`, or `lecture`). These are abstract visual identifiers, not product screenshots. The actual explanatory architecture is always generated from the ordered `architecture` data and can be navigated by click, keyboard, or previous/next controls. Use the same data structure for a new walkthrough; do not invent complex topology that the implementation does not have.

## Update existing content

- **About:** edit `about.intro`, `about.paragraphs`, and `about.exploring` in `data/site.json`, then rebuild. Contact information is also centralized there. Owner review of the written biography is recommended before publication.
- **Results:** update the relevant project's `metrics`, `source`, and `sourceStatus`. Describe the dataset/split or observed circumstances; link the precise report in `docs/EVIDENCE.md`. Do not label a README observation as independently rerun validation.
- **Skill relationships:** edit project `skills` arrays rather than manually changing the explorer. There are no percentage-based skill ratings.
- **Demo status:** URLs document deployments; current availability is a different field. The gallery counts published studies, distinct domains, documented deployments, and verified checks separately. A failed test does not remove a Live Demo link.

## Chat integration and startup handling

The existing backend remains `https://self-rag-engine.onrender.com/chat`. The lightweight readiness URL remains `https://self-rag-engine.onrender.com/`. The v2.0.0 backend is read-only. The portfolio uses non-streaming POST JSON:

```json
{"question":"How does the RAG engine correct an answer?","thread_id":"stable-tab-session-id"}
```

Expected response: `{"answer":"…"}`. `/chat/stream` is not used.

`portfolio.js` retains the immediate `prewarmRenderBackend()` background GET on every page load. GET probes have a 12-second timeout. When a visitor submits during a likely startup delay (a health timeout or HTTP 502/503/504), readiness GETs retry with increasing pauses, at most four additional probes and a 60-second startup budget. Probes share an in-flight promise; there is no idle keepalive loop or repeated chat POST. A recent successful readiness result is reused for 30 seconds. Inconclusive readiness does not prevent a subsequent `/chat` attempt.

The chat request has a 90-second timeout, including response parsing. A slow-processing message appears after 12 seconds. A successful root response means **HTTP service reachable**, never **downstream LLM healthy**. HTTP 429, request rejection, transient gateway/service responses, malformed payloads, timeouts, and unknown network connectivity have separate messages. Network, CORS, and proxy restrictions do not establish that an application is offline.

Only a visitor initiates a chat retry. There is no automatic POST replay because the API has no idempotency contract; a timed-out request may already have changed process-local conversation state. The UI advises waiting about a minute after HTTP 429. Retrying reuses the saved question and thread without duplicating the user bubble. Both entry points share an explicit in-flight lock; Enter, send buttons, chips, and retries cannot submit a concurrent turn. Inputs remain editable while waiting; other drafts are never silently cleared.

A versioned, validated `sessionStorage` record stores bounded history, drafts, and thread identity for this browser tab. On navigation, active requests are aborted, the question is saved as interrupted, and the next page offers an explicit retry. Generation guards discard stale request completions. Back/forward restores the latest stored conversation. Storage failure falls back to memory for the current page. Backend `MemorySaver` is process-local and may reset on restart; the UI does not promise permanent memory.

AI answers, user input, and fetched README Markdown are untrusted **text**. They are rendered through DOM text nodes/`textContent`; AI answers support a small DOM-only subset for bold, inline code, lists and absolute HTTPS links. Raw HTML and unsafe links remain literal text. Remote HTML, Markdown HTML, `javascript:` links, images, and scripts are not executed. README loading is explicit, bounded, retryable, and optional. All actual external navigation uses documented HTTPS URLs with `noopener noreferrer`. The build rejects unsafe registry URLs and invalid path IDs. There are no keys in the frontend.

## Review and live checks

See `docs/EVIDENCE.md` for source provenance and `docs/REVIEW.md` for the recorded results and limitations. Browser tests use mocked success/failure cases. They do not establish real Render-to-Groq/Gemini/Pinecone health.

After publication is approved, check in a normal browser:

1. Open Home, allow the initial readiness request to complete, and send one question. Inspect the real `/chat` request/answer and CORS behavior. Allow startup time after inactivity.
2. Navigate to another page and open the floating assistant; verify history and thread continuity. If the server restarted, do not assume prior backend memory survived.
3. Exercise a follow-up and compare the answer against the repository sources. Respect the backend's ten requests/minute/IP limit.
4. Open each documented Live Demo, allow free-tier startup time, and retry reasonably before diagnosing a persistent failure. Record timestamp, successful interaction, and evidence separately from URL provenance.
5. Test a mobile device, browser zoom, keyboard-only navigation, and a screen reader. The automated checks do not replace assistive-technology or real-device review.

No merge or deployment is part of this implementation.

## Portfolio v2.1 refinements

The approved v2 layout, registry and twelve content routes are preserved. The refinement adds a low-opacity technical hero grid, restrained lime/cyan illumination, clearer navigation and architecture states, and selected-skill relationship highlighting. No dependencies, particle effects, streaming, hosting registration or deployment were added. Reduced-motion preferences disable transitions and the small MRI-panel fade.

### Recruiter and contextual suggestions

Edit `data/chat-prompts.json` to change the short button labels and full questions. Home has ten recruiter/client-oriented prompts: four are shown initially, and a keyboard-accessible **More questions** button cycles through manual groups. There is no automatic rotation. The full question appears in the accessible label/tooltip and is sent exactly as stored; no hidden context or qualification is appended.

The floating assistant uses the current page's context: Home, Projects, NeuroScan, self-corrective RAG, Skills, About or Contact. Other project pages derive their questions from the published registry entry's actual title. Skills retain their individual technology-to-project question controls. Suggestions use the same conversation, session storage, thread ID, request lock, loading states and manual retry as typed questions. Choosing a homepage suggestion uses the visible main assistant. Browsing more suggestions does not send a request or reset history.

### Accurate professional availability

`data/site.json` → `professional` contains the owner-confirmed AI/ML engineering positioning, automation freelance availability, supported service list, and case-by-case ML/Data Science contract policy. About, Contact and automation CTAs derive from this data. The site does not imply professional employment experience or blanket acceptance of ML/DS work.

This frontend content is separate from the RAG knowledge base. Neither the backend nor its knowledge base was changed. Assistant responses are not replaced with canned availability claims; each assistant links to Contact with a visible note that its sources may not contain recent availability. The owner can update backend knowledge separately.

### Authentic MRI gallery

`data/neuroscan.json` describes the owner-supplied `BraTS20_Validation_001_flair.nii` sample, three image paths, intrinsic dimensions, alt text, SHA-256 hashes and explicitly separate single-scan outputs. `assets/neuroscan/ASSET_NOTES.md` is preserved verbatim. The WebP assets are also byte-for-byte unchanged from the upload; they are already optimized and total approximately 48 KiB.

The gallery appears immediately after the NeuroScan project hero, before the existing architecture walkthrough. It supports Axial (92), Coronal (128) and Sagittal (108) tabs with native buttons, roving tab focus, Left/Right/Home/End keys, labels and descriptive alt text. All three assets are requested locally up front, so switching needs no inference request. Without JavaScript, all three views remain readable. The page's existing Render pre-warming still runs; it is unrelated to MRI loading.

The complete axial image is displayed at no more than its native 240×240 pixels. The other two images are cropped app captures. No raw unmodified scan was supplied, so there is no invented before/after comparison, additional slice or synthetic mask. Red means a **predicted** mask, not a ground-truth annotation. The single-scan volume/burden/detection output is labeled as a demonstration, independent of the owner-reported validation Dice in Results & evidence. These predictions are not clinical diagnoses or medical advice.

To replace or add genuine captures later, preserve provenance, update the visualization manifest and its integrity-test fixtures, and rebuild. Do not infer new slices from these screenshots. The original NeuroScan Live Demo URL remains unchanged.

### Header launcher and small screens

Ask AI now occupies reserved header space instead of covering project/skill controls. On Home it is hidden while the main assistant is visible, except when retaining focus is necessary for keyboard access. The floating conversation panel remains shared. Native pointer activation avoids scrolling to the sticky header's original document position; Escape returns focus without a page jump.

The panel sizes itself below the header using the available visual viewport and supports internal scrolling on short screens. Tests cover 320, 375, 768 and 1440 pixels, an additional 320×480 panel check, native touch activation, and minimum 44px key controls. Physical device keyboards and screen readers still need owner review.

See `docs/V2_1_REFINEMENT_REVIEW.md` for the current refinement report and screenshot inventory. The original v2 evidence and live-check records are retained in `docs/EVIDENCE.md` and `docs/LIVE_CHECKS.md`.
