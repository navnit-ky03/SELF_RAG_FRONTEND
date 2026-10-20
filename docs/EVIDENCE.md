# Content evidence · checked 20 October 2026

All reads were through the read-only GitHub connector. Only `SELF_RAG_FRONTEND` was modified. Evaluation/training was not rerun. Owner attestation is explicitly distinguished from repository evidence.

| Project | Checked sources | Public result and interpretation |
| --- | --- | --- |
| Self-Corrective RAG | [`README.md` at v2.0.0](https://github.com/navnit-ky03/self_rag_engine/blob/v2.0.0/README.md), [`main.py`](https://github.com/navnit-ky03/self_rag_engine/blob/v2.0.0/main.py), [`schemas.py`](https://github.com/navnit-ky03/self_rag_engine/blob/v2.0.0/schemas.py) | README local observations: 9.09–9.70 s on four successful questions; ~4.48 s on one fallback. No production SLA, zero-hallucination, sub-second, or <12 ms claim. POST `/chat` question/thread_id → answer; GET `/` is service status only. 10 requests/minute/IP, pipeline exceptions HTTP 503, process-local MemorySaver. |
| NeuroScan AI | [`README.md`](https://github.com/navnit-ky03/BRAIN_TUMOR_SEGMENTATION/blob/main/README.md), [`backend/train.py`](https://github.com/navnit-ky03/BRAIN_TUMOR_SEGMENTATION/blob/main/backend/train.py), [`backend/engine.py`](https://github.com/navnit-ky03/BRAIN_TUMOR_SEGMENTATION/blob/main/backend/engine.py), [`frontend/app.py`](https://github.com/navnit-ky03/BRAIN_TUMOR_SEGMENTATION/blob/main/frontend/app.py) | PyTorch/MONAI 3D U-Net, 128³ patches, positive/negative crops, sliding windows, ONNX, multiplanar viewing and NIfTI export. Best validation Dice **0.8842 (88.42%)**, more than two days of experimentation and 24+ hours compute are **owner/developer-reported in the implementation specification**. Checked README/logs do not independently substantiate that result. No 60 FPS or clinical-validation claim. |
| Voice booking | [`README.md`](https://github.com/navnit-ky03/agentic-voice-booking-assistant/blob/main/README.md) | Four workflow concerns, selective Pinecone retrieval, deterministic date/availability checking, Supabase intake_id correlation, cancellation and fallback. No perfect-accuracy metric. Documented synchronization/concurrency gaps remain. |
| Fraud detection | [`README.md`](https://github.com/navnit-ky03/Credit-Card-Scam-Engine/blob/main/README.md) | README holdout TN=29,963, FP=10, FN=4, TP=23. Derived recall 23/(23+4)=**85.19%**; FPR 10/(29,963+10)=**0.0334%**. README-reported, not independently rerun. Confirms XGBoost, preprocessing/SMOTE, Streamlit. |
| Customer CLV/churn | [`data_files/evaluation_report.txt`](https://github.com/navnit-ky03/Customer-Lifetime-Value/blob/main/data_files/evaluation_report.txt), [`README.md`](https://github.com/navnit-ky03/Customer-Lifetime-Value/blob/main/README.md), [`Train_Test files/model_train.py`](https://github.com/navnit-ky03/Customer-Lifetime-Value/blob/main/Train_Test%20files/model_train.py) | Saved report: accuracy **0.9209**, precision **0.8934**, recall **0.8879**, F1 **0.8906**, ROC-AUC **0.9790**; CLV R² **0.9462**, MAE **$447.32**, RMSE **$912.80**. XGBClassifier/XGBRegressor with separate tasks. Decoupled FastAPI and Streamlit, saved artifacts and batch prediction. Old conflicting frontend figures removed. |
| Delivery analytics | [`README.md`](https://github.com/navnit-ky03/delivery_analytics_engine/blob/main/README.md), [`ML_FILES/eval.py`](https://github.com/navnit-ky03/delivery_analytics_engine/blob/main/ML_FILES/eval.py), [`ML_FILES/train.py`](https://github.com/navnit-ky03/delivery_analytics_engine/blob/main/ML_FILES/train.py), complete Git tree | Streamlit/Plotly operational exploration, XGBRegressor, evaluation split/script. No saved numerical-results artifact found. Old R²/MAE/RMSE withheld. README city count conflicts with old frontend; no city count asserted without dataset calculation. |
| Lecture RAG | [`README.md`](https://github.com/navnit-ky03/rag_based_teaching_model/blob/main/README.md), [`app.py`](https://github.com/navnit-ky03/rag_based_teaching_model/blob/main/app.py) | Whisper transcript timestamps, retrieval, Gemini synthesis with citations. README Gemini embedding description differs from current app.py's Hugging Face BAAI/bge-m3 query embedding request. Saved document-vector compatibility/deployment configuration unverified; discrepancy disclosed. No sub-second benchmark claim. |

## Documented deployments vs current availability

All five existing frontend URLs were preserved. GitHub repository homepage fields independently confirmed four candidates. No URL is removed or labeled broken because a tool cannot open it.

| Live Demo URL | URL provenance | Current availability |
| --- | --- | --- |
| https://braintumorsegmentationmri.streamlit.app/ | Original frontend; repository homepage is empty | Unverified |
| https://credit-card-scam-engine.streamlit.app/ | Original frontend + GitHub repository homepage | Unverified |
| https://customer-lifetime-value-ky03.streamlit.app/ | Original frontend + GitHub repository homepage | Unverified |
| https://delivery-analytics-engine.streamlit.app/ | Original frontend + GitHub repository homepage | Unverified |
| https://rag-assistant-model.streamlit.app/ | Original frontend + GitHub repository homepage | Unverified |

The live-access tool reported that the Streamlit URLs were not accessible through that tool. This is a tool access limitation, not evidence that the apps failed. No deployment has evidence of persistent failure from this task. Documented URLs remain Live Demo buttons with a free-tier startup note. No separate voice-booking or standalone RAG demo was documented; the RAG engine is integrated into this portfolio.

The initial shell check could not reach the configured Codex proxy. After supported network access, one readiness attempt timed out; a longer retry returned HTTP 200. A separate real non-streaming `/chat` request returned HTTP 200 with a nonempty string answer and an allowed-origin header. These are individual reachability/integration observations, not an ongoing availability guarantee. See `LIVE_CHECKS.md` for the sequence and limits.

## Other factual content

Name, email and GitHub were retained from the original frontend. Education and biography use the owner-approved specification; no job, award, date of graduation or personal anecdote was invented. About copy is centralized in `data/site.json` for owner review. Decorative project motifs are locally generated abstract graphics, not representations of running applications.
