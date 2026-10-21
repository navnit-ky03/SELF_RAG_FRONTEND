# Live integration check · 20 October 2026

These observations describe individual requests, not guaranteed ongoing availability.

- Initial shell GET could not connect to the configured Codex proxy under sandbox restrictions. This was not an application failure.
- After the supported network access was available, one readiness attempt timed out after 25 seconds with no response. It was treated as an inconclusive startup/connection delay.
- A longer retry to the **unchanged** `https://self-rag-engine.onrender.com/` returned **HTTP 200**, JSON `{"status":"online","service":"Navnit's AI Assistant RAG Pipeline"}`. Observed at approximately **07:52 IST**. This establishes HTTP service reachability only.
- A separate non-streaming POST to **unchanged** `https://self-rag-engine.onrender.com/chat` returned **HTTP 200** with a nonempty string `answer` at approximately **07:53 IST**. Question: “How does Navnit’s self-corrective RAG engine evaluate and correct its answers?” A fresh review-only thread was used. Reported upstream service time was approximately 7.66 seconds; this is a single observation, not a new public performance claim.
- The POST carried `Origin: http://127.0.0.1:4173`; response header `access-control-allow-origin: *` was present. The answer described relevance grading, groundedness, usefulness, bounded correction, and fallback handling. Answer quality was not independently scored.
- This was an HTTP integration probe. The real service was not exercised through a deployed portfolio or an authenticated end-to-end production-browser session. Browser behavior, request payloads, synchronization, security and failure handling were tested separately with intercepted responses.

The five documented Streamlit deployments remain unverified from this environment. The read tool's inability to access them and the cloud destination restrictions are not evidence of persistent application failure. All their Live Demo buttons remain present, and the gallery separately counts five documented deployment URLs and zero functionally verified demo availability checks.
