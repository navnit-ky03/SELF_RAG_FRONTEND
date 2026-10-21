# Portfolio v2.2 — Full-Screen Chat Reading Mode

Requested before deployment because recruiter-facing answers can be long.

## Implementation

- The existing homepage assistant header now has a **Full screen** button.
- The floating assistant header has a **Full screen** / **Exit full screen** toggle beside Close.
- Clicking the homepage button opens the **existing** floating assistant and expands it; it does not create another chat instance, send a message, reset thread ID, or clear the draft.
- Large desktop layout fills the viewport with a readable independently scrollable transcript and composer fixed in the chat's flex layout. On mobile the height follows visualViewport to account for the keyboard.
- Escape when expanded **exits full screen**; pressing Escape again closes the floating assistant. Close still closes directly. Focus moves to the control, and controls advertise accurate accessible labels and aria-pressed.
- In full-screen mode the page background is inert and its scroll is locked. The existing assistant has dialog semantics with aria-modal set only in fullscreen mode. Keyboard Tab wraps inside the assistant.
- Existing loading, safe Markdown rendering, sessionStorage, suggested questions, request lock, connection prewarm, model API and retry handling are unchanged.
- Applies to all 13 existing generated HTML pages. Original project facts, MRI assets and metrics are untouched.

## Source inventory
- scripts/build.mjs — header control markup in both chatBox variants
- portfolio.js — reversible full-screen state, focus, keyboard and viewport behavior
- portfolio.css — desktop/mobile responsive reading layout
- index.html and 12 other generated static pages — identical control markup
- tests/fullscreen.test.mjs — static checks for controls on all pages, shared state, and responsive styling

## Local testing (must pass before shipping)

    npm run build
    npm test
    node --check portfolio.js

Then serve locally and check:
1. Home: type or receive a long response, select Full screen. Confirm entire chat is readable by scrolling while composer remains accessible.
2. Exit full screen using the header control and again via Escape. The conversation, question draft, and thread must remain intact.
3. Navigate to another page, open floating assistant, expand/collapse there.
4. Test 320px and 375px mobile widths and a short viewport; confirm no horizontal overflow and keyboard can reach input.
5. Test keyboard-only Tab cycling, Escape, focus restoration and reduced-motion setting.
6. Confirm the **real** existing backend URL and `/chat` JSON contract remain unchanged.

## Release boundaries

Changes are limited to the frontend v2.2 feature branch and its draft PR. No GitHub Pages settings, deployments, production Render changes, backend code, vector namespaces or secrets were modified by this feature. Browser integration, physical mobile keyboard and screen-reader behavior still need manual verification before calling them validated.
