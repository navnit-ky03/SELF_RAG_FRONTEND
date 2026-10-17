/* ==========================================================================
   NAVNIT KUMAR YADAV - MASTER PORTFOLIO LOGIC
   ========================================================================== */

const $ = s => document.querySelector(s);
const EMAIL = 'yadavnv1526@gmail.com';

/* Configurable FastAPI Backend Streaming Endpoint for RAG Chatbot */
const CHATBOT_STREAM_API_URL = "https://self-rag-engine.onrender.com";

/* Currently active project selected in modal */
let currentProject = null;

/* Centralized Real-Time Synchronized Chat History */
const chatHistory = [
  {
    sender: 'bot',
    prefix: '// system_init',
    text: "Hi! I'm Navnit's RAG AI assistant. Ask me anything about his projects, experience, or technical stack."
  }
];
/* ==========================================================================
   RENDER COLD-START PRE-WARMER
   ========================================================================== */
(async function prewarmRenderBackend() {
  const HEALTH_URL = "https://self-rag-engine.onrender.com";
  try {
    // Fire background GET request as soon as page loads
    await fetch(HEALTH_URL, { method: 'GET', mode: 'cors' });
    console.log('[Pre-warm] Render backend wake-up signal sent successfully.');
  } catch (err) {
    console.warn('[Pre-warm] Render backend ping failed or waking up:', err);
  }
})();

/* ==========================================================================
   SPA HASH ROUTER
   ========================================================================== */

function handleHashRouting() {
  let hash = window.location.hash || '#home';
  if (hash === '#top') hash = '#home';

  const targetId = hash.replace('#', '');
  const sections = document.querySelectorAll('main > section');
  const navLinks = document.querySelectorAll('#mainNav a');

  let targetFound = false;

  sections.forEach(sec => {
    if (sec.id === targetId) {
      sec.classList.add('active-page');
      targetFound = true;
    } else {
      sec.classList.remove('active-page');
    }
  });

  if (!targetFound && sections.length > 0) {
    sections[0].classList.add('active-page');
  }

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === hash || (hash === '#home' && href === '#top')) {
      link.classList.add('on');
    } else {
      link.classList.remove('on');
    }
  });

  window.scrollTo({ top: 0, behavior: 'instant' });
}

window.addEventListener('hashchange', handleHashRouting);
window.addEventListener('DOMContentLoaded', handleHashRouting);

/* ==========================================================================
   FLAGSHIP CAROUSEL DATA
   ========================================================================== */

const F = [
  {
    n: 'Agentic Voice Booking Assistant',
    k: 'n8n · Pinecone · Supabase · ElevenLabs',
    d: 'An AI receptionist that books appointments across 3 clinic branches by voice, then completes the record through a follow-up form.',
    nodes: [
      ['Voice call', 'ElevenLabs runs the voice call and streams user intent to n8n.'],
      ['AI Agent', 'Agentic RAG: queries Pinecone vectors strictly when FAQ context is needed.'],
      ['Date_Check', 'A deterministic sub-workflow validates 10-day windows and closed slots, bypassing LLM date math.'],
      ['Supabase', 'A partial appointment record is saved with a unique intake_id correlation key.'],
      ['Intake form', 'Form link carrying intake_id updates the same database row with user details.']
    ],
    pts: [
      '100% deterministic mathematical date accuracy instead of prompt trust',
      'Unique intake_id correlation key connecting phone voice state to web forms',
      'Mass-cancellation workflow with personalized batched SMS/email alerts'
    ],
    l: [
      ['Code ↗', 'https://github.com/navnit-ky03/agentic-voice-booking-assistant']
    ]
  },
  {
    n: 'NeuroScan AI',
    k: 'PyTorch · MONAI · ONNX Runtime · Streamlit',
    d: 'End-to-end 3D brain tumor segmentation from FLAIR MRI with automatic volumetric tumor estimation.',
    nodes: [
      ['FLAIR MRI', 'A 3D volumetric NIfTI scan (.nii/.nii.gz) is uploaded.'],
      ['Sliding window', 'Patch-based sliding window (128×128×128) runs inference over full volume.'],
      ['3D UNet', 'MONAI 3D UNet architecture predicts voxel-wise tumor segmentation masks.'],
      ['ONNX Runtime', 'Exported ONNX model runs efficiently on Hugging Face ZeroGPU CPU backends.'],
      ['Volume + masks', 'Renders tumor volume in cm³ alongside interactive 60 FPS slice viewers.']
    ],
    pts: [
      'Validation Dice Similarity Coefficient (DSC) = 0.8842',
      'Positive/negative crop sampling ratios to overcome extreme background class imbalance',
      'Axial, coronal, and sagittal interactive slice viewer with downloadable masks'
    ],
    l: [
      ['Live Demo ↗', 'https://braintumorsegmentationmri.streamlit.app/'],
      ['Code ↗', 'https://github.com/navnit-ky03/BRAIN_TUMOR_SEGMENTATION']
    ]
  },
  {
    n: 'Portfolio Master RAG Engine',
    k: 'LangGraph · Pinecone · Groq · FastAPI · SlowAPI',
    d: 'Decoupled, self-correcting RAG service with automated relevance filters and groundedness verification.',
    nodes: [
      ['User Query', 'Dual-route intent classifier determines whether vector retrieval is required.'],
      ['Pinecone RAG', 'Hybrid vector search queries indexed master knowledge base embeddings (<12ms latency).'],
      ['Relevance Filter', 'Batched LLM evaluator filters out ungrounded context chunks before generation.'],
      ['Self-Correction', 'Dual evaluator nodes (issup & isuse) test groundedness and execute query rewriting.'],
      ['FastAPI Stream', 'Rate-limited microservice (10 req/min) streams SSE tokens in real-time to UI.']
    ],
    pts: [
      'Self-correcting LangGraph state graph with automated query rewriting loops',
      'Zero-hallucination guardrails suppressing ungrounded assertions and banning broken markdown tables',
      'Decoupled REST backend architecture protected with SlowAPI rate-limiting and SSE streaming'
    ],
    l: [
      ['Code ↗', 'https://github.com/navnit-ky03/master-rag-engine']
    ]
  }
];

/* ==========================================================================
   ALL PROJECTS DATA
   ========================================================================== */

const P = [
  {
    num: '01',
    t: 'Agentic Voice Booking Assistant',
    d: 'AI receptionist for 3 clinic branches: voice booking, deterministic date checks, form follow-up.',
    k: ['ai'],
    s: ['n8n', 'Pinecone', 'Supabase', 'ElevenLabs', 'JavaScript'],
    metric: '100% Date Accuracy',
    domain: 'Voice AI / Agentic RAG',
    readmeUrl: 'https://raw.githubusercontent.com/navnit-ky03/agentic-voice-booking-assistant/main/README.md',
    archSvg: `
      <svg viewBox="0 0 760 200" style="width:100%; font-family:monospace; background:#070a0f; border-radius:8px; padding:10px;">
        <rect x="10" y="70" width="130" height="50" rx="8" fill="#0d141d" stroke="#1c2a3a"/>
        <text x="25" y="100" fill="#22d3ee" font-size="11" font-weight="bold">ElevenLabs</text>
        <path d="M 140 95 L 190 95" stroke="#39ff9c" stroke-width="2"/>
        <rect x="190" y="70" width="140" height="50" rx="8" fill="#0d141d" stroke="#39ff9c" stroke-width="2"/>
        <text x="210" y="100" fill="#39ff9c" font-size="11" font-weight="bold">n8n Agent</text>
        <path d="M 330 95 L 380 95" stroke="#39ff9c" stroke-width="2"/>
        <rect x="380" y="20" width="150" height="50" rx="8" fill="#0a1018" stroke="#22d3ee"/>
        <text x="395" y="50" fill="#22d3ee" font-size="11">Pinecone Vector DB</text>
        <rect x="380" y="120" width="150" height="50" rx="8" fill="#0a1018" stroke="#39ff9c"/>
        <text x="395" y="150" fill="#39ff9c" font-size="11">Date Check Subflow</text>
        <path d="M 530 145 L 580 145" stroke="#39ff9c" stroke-width="2"/>
        <rect x="580" y="120" width="140" height="50" rx="8" fill="#0d141d" stroke="#a78bfa"/>
        <text x="595" y="150" fill="#a78bfa" font-size="11">Supabase DB</text>
      </svg>`,
    problem: 'Large Language Models regularly hallucinate date arithmetic, availability windows, and scheduling logic when booking appointments directly during live phone calls.',
    arch: 'Decoupled voice architecture separating LLM intent recognition from deterministic JavaScript sub-workflows across 3 clinic branches.',
    decisions: [
      'Implemented deterministic JavaScript date validation sub-workflows (100% mathematical accuracy for closed slots and 10-day booking windows).',
      'Restricted Pinecone vector search strictly to FAQ queries rather than invoking vector retrieval on every call turn.',
      'Utilized unique intake_id correlation keys to maintain state persistence across voice calls and follow-up web forms.'
    ],
    l: [
      ['Code ↗', 'https://github.com/navnit-ky03/agentic-voice-booking-assistant']
    ]
  },
  {
    num: '02',
    t: 'NeuroScan AI',
    d: '3D brain tumor segmentation from FLAIR MRI with automatic tumor volume estimation.',
    k: ['cv', 'ml'],
    s: ['PyTorch', 'MONAI', 'ONNX Runtime', 'Streamlit', 'Nibabel'],
    metric: 'Dice = 0.8842',
    domain: '3D Medical Vision',
    readmeUrl: 'https://raw.githubusercontent.com/navnit-ky03/BRAIN_TUMOR_SEGMENTATION/main/README.md',
    archSvg: `
      <svg viewBox="0 0 760 180" style="width:100%; font-family:monospace; background:#070a0f; border-radius:8px; padding:10px;">
        <rect x="20" y="60" width="140" height="50" rx="8" fill="#0d141d" stroke="#22d3ee"/>
        <text x="35" y="90" fill="#22d3ee" font-size="11">FLAIR MRI (.nii)</text>
        <path d="M 160 85 L 210 85" stroke="#39ff9c" stroke-width="2"/>
        <rect x="210" y="60" width="160" height="50" rx="8" fill="#0a1018" stroke="#39ff9c"/>
        <text x="220" y="90" fill="#39ff9c" font-size="11">Sliding Window (128³)</text>
        <path d="M 370 85 L 420 85" stroke="#39ff9c" stroke-width="2"/>
        <rect x="420" y="60" width="140" height="50" rx="8" fill="#0d141d" stroke="#a78bfa"/>
        <text x="435" y="90" fill="#a78bfa" font-size="11">MONAI 3D UNet</text>
        <path d="M 560 85 L 610 85" stroke="#39ff9c" stroke-width="2"/>
        <rect x="610" y="60" width="130" height="50" rx="8" fill="#0d141d" stroke="#22d3ee"/>
        <text x="620" y="90" fill="#22d3ee" font-size="11">ONNX Runtime</text>
      </svg>`,
    problem: 'Standard 2D convolutional networks lose spatial depth across slices, while raw 3D MRI FLAIR volumes exceed GPU memory limits during standard batch UNet training.',
    arch: 'Patch-based sliding window inference pipeline executing 3D UNet voxel segmentation over FLAIR MRI scans exported to ONNX Runtime.',
    decisions: [
      'Achieved validation Dice Similarity Coefficient (DSC) = 0.8842 on test splits.',
      'Applied positive/negative crop sampling ratios during dataset preprocessing to resolve extreme background-to-tumor voxel class imbalance.',
      'Exported model weights to ONNX Runtime for zero-GPU CPU deployment with real-time 60 FPS slice rendering.'
    ],
    l: [
      ['Live Demo ↗', 'https://braintumorsegmentationmri.streamlit.app/'],
      ['Code ↗', 'https://github.com/navnit-ky03/BRAIN_TUMOR_SEGMENTATION']
    ]
  },
  {
    num: '03',
    t: 'Portfolio Master RAG Engine',
    d: 'Decoupled, self-correcting RAG microservice with state graph verification and thread memory.',
    k: ['ai'],
    s: ['LangGraph', 'Pinecone', 'Groq API', 'FastAPI', 'SlowAPI', 'Pydantic'],
    metric: '<12ms Latency',
    domain: 'Self-Correcting GenAI',
    readmeUrl: 'https://raw.githubusercontent.com/navnit-ky03/self_rag_engine/main/README.md',
    archSvg: `
      <svg viewBox="0 0 760 180" style="width:100%; font-family:monospace; background:#070a0f; border-radius:8px; padding:10px;">
        <rect x="20" y="60" width="130" height="50" rx="8" fill="#0d141d" stroke="#22d3ee"/>
        <text x="35" y="90" fill="#22d3ee" font-size="11">User Query</text>
        <path d="M 150 85 L 200 85" stroke="#39ff9c" stroke-width="2"/>
        <rect x="200" y="60" width="150" height="50" rx="8" fill="#0a1018" stroke="#39ff9c"/>
        <text x="210" y="90" fill="#39ff9c" font-size="11">LangGraph Router</text>
        <path d="M 350 85 L 400 85" stroke="#39ff9c" stroke-width="2"/>
        <rect x="400" y="60" width="150" height="50" rx="8" fill="#0d141d" stroke="#a78bfa"/>
        <text x="410" y="90" fill="#a78bfa" font-size="11">Pinecone Vector DB</text>
        <path d="M 550 85 L 600 85" stroke="#39ff9c" stroke-width="2"/>
        <rect x="600" y="60" width="140" height="50" rx="8" fill="#0d141d" stroke="#39ff9c"/>
        <text x="615" y="90" fill="#39ff9c" font-size="11">FastAPI Stream</text>
      </svg>`,
    problem: 'Standard linear RAG pipelines frequently output ungrounded hallucinations, robotic preamble strings, and broken markdown tables when answering complex technical queries.',
    arch: 'Decoupled self-correcting RAG microservice built with LangGraph state graphs, Pinecone vector indexes, Groq LLM inference, and FastAPI.',
    decisions: [
      'Built dual evaluation nodes (issup for context support and isuse for answer usefulness) that trigger automated query rewriting when context quality drops.',
      'Implemented strict system prompt formatting constraints banning markdown tables and robotic intro phrasing.',
      'Implemented SlowAPI rate-limiting (10 req/min) and wide CORS preflight handling (allow_methods=["*"]).'
    ],
    l: [
      ['Code ↗', 'https://github.com/navnit-ky03/self_rag_engine']
    ]
  },
  {
    num: '04',
    t: 'Churn & 12-Month CLV Engine',
    d: 'Decoupled ML service: XGBoost churn model plus 12-month CLV regression behind async APIs.',
    k: ['ml'],
    s: ['FastAPI', 'XGBoost', 'Scikit-Learn', 'Pydantic v2', 'Streamlit'],
    metric: 'ROC-AUC = 0.912',
    domain: 'Predictive Analytics',
    readmeUrl: 'https://raw.githubusercontent.com/navnit-ky03/Customer-Lifetime-Value/main/README.md',
    archSvg: `
      <svg viewBox="0 0 760 180" style="width:100%; font-family:monospace; background:#070a0f; border-radius:8px; padding:10px;">
        <rect x="30" y="60" width="140" height="50" rx="8" fill="#0d141d" stroke="#22d3ee"/>
        <text x="45" y="90" fill="#22d3ee" font-size="11">FastAPI Endpoint</text>
        <path d="M 170 85 L 220 85" stroke="#39ff9c" stroke-width="2"/>
        <rect x="220" y="20" width="160" height="50" rx="8" fill="#0a1018" stroke="#39ff9c"/>
        <text x="230" y="50" fill="#39ff9c" font-size="11">XGBoost Churn Classifier</text>
        <rect x="220" y="100" width="160" height="50" rx="8" fill="#0a1018" stroke="#a78bfa"/>
        <text x="230" y="130" fill="#a78bfa" font-size="11">XGBoost CLV Regressor</text>
      </svg>`,
    problem: 'Coupling classification (churn prediction) and regression (lifetime value estimation) into a single monolithic model creates tight dependency locks and deployment friction.',
    arch: 'Asynchronous FastAPI microservice operating decoupled XGBoost classification and XGBoost regressor pipelines.',
    decisions: [
      'Achieved Churn Classifier ROC-AUC = 0.912 (Accuracy = 92.4%) and CLV Regressor R² = 0.884 (RMSE = $142.10, MAE = $98.45).',
      'Enforced strict Pydantic v2 schema validation across single-record and batch JSON request payloads.',
      'Hosted interactive analytical dashboard on Hugging Face / Streamlit backends.'
    ],
    l: [
      ['Live Demo ↗', 'https://customer-lifetime-value-ky03.streamlit.app/'],
      ['Code ↗', 'https://github.com/navnit-ky03/Customer-Lifetime-Value']
    ]
  },
  {
    num: '05',
    t: 'Delivery Analytics Engine',
    d: 'Interactive ops dashboard across 13 cities and 8 quick-commerce brands with XGBoost delivery predictor.',
    k: ['viz', 'ml'],
    s: ['Plotly', 'Pandas', 'XGBoost', 'Streamlit', 'Scikit-Learn'],
    metric: 'R² = 89.4%',
    domain: 'Logistics Analytics',
    readmeUrl: 'https://raw.githubusercontent.com/navnit-ky03/delivery_analytics_engine/main/README.md',
    archSvg: `
      <svg viewBox="0 0 760 180" style="width:100%; font-family:monospace; background:#070a0f; border-radius:8px; padding:10px;">
        <rect x="40" y="60" width="150" height="50" rx="8" fill="#0d141d" stroke="#22d3ee"/>
        <text x="55" y="90" fill="#22d3ee" font-size="11">Streamlit Dashboard</text>
        <path d="M 190 85 L 240 85" stroke="#39ff9c" stroke-width="2"/>
        <rect x="240" y="60" width="170" height="50" rx="8" fill="#0a1018" stroke="#39ff9c"/>
        <text x="250" y="90" fill="#39ff9c" font-size="11">Geospatial Heatmaps</text>
        <path d="M 410 85 L 460 85" stroke="#39ff9c" stroke-width="2"/>
        <rect x="460" y="60" width="160" height="50" rx="8" fill="#0d141d" stroke="#a78bfa"/>
        <text x="470" y="90" fill="#a78bfa" font-size="11">XGBoost Duration Predictor</text>
      </svg>`,
    problem: 'Quick-commerce operations teams lack unified real-time visibility into driver transit delays and regional SLA bottleneck variables across multiple city hubs.',
    arch: 'Interactive Streamlit analytics dashboard combined with real-time feature engineering feeding into an XGBoost duration prediction pipeline.',
    decisions: [
      'Achieved duration prediction accuracy of R² = 89.4% (MAE = 1.84 min, RMSE = 2.31 min).',
      'Engineered geospatial heatmaps tracking order density across 13 cities and 8 quick-commerce brands.',
      'Created custom delay index metrics weighting weather conditions, driver availability, and traffic density.'
    ],
    l: [
      ['Live Demo ↗', 'https://delivery-analytics-engine.streamlit.app/'],
      ['Code ↗', 'https://github.com/navnit-ky03/delivery_analytics_engine']
    ]
  },
  {
    num: '06',
    t: 'Credit Card Fraud Detection Engine',
    d: 'Handles severe class imbalance with SMOTE and evaluates on precision-recall curves.',
    k: ['ml'],
    s: ['Scikit-Learn', 'SMOTE', 'XGBoost', 'Streamlit', 'Imbalanced-Learn'],
    metric: 'Recall = 85.2%',
    domain: 'Financial Anomaly ML',
    readmeUrl: 'https://raw.githubusercontent.com/navnit-ky03/Credit-Card-Scam-Engine/main/README.md',
    archSvg: `
      <svg viewBox="0 0 760 180" style="width:100%; font-family:monospace; background:#070a0f; border-radius:8px; padding:10px;">
        <rect x="40" y="60" width="140" height="50" rx="8" fill="#0d141d" stroke="#22d3ee"/>
        <text x="50" y="90" fill="#22d3ee" font-size="11">Transaction Data</text>
        <path d="M 180 85 L 230 85" stroke="#39ff9c" stroke-width="2"/>
        <rect x="230" y="60" width="160" height="50" rx="8" fill="#0a1018" stroke="#39ff9c"/>
        <text x="240" y="90" fill="#39ff9c" font-size="11">SMOTE Oversampling</text>
        <path d="M 390 85 L 440 85" stroke="#39ff9c" stroke-width="2"/>
        <rect x="440" y="60" width="160" height="50" rx="8" fill="#0d141d" stroke="#a78bfa"/>
        <text x="450" y="90" fill="#a78bfa" font-size="11">XGBoost PR Curve</text>
      </svg>`,
    problem: 'Standard model accuracy is highly misleading in financial fraud datasets where positive fraudulent cases represent <0.1% of total transaction volume.',
    arch: 'Class-imbalance mitigation pipeline utilizing SMOTE oversampling and cost-sensitive XGBoost training evaluated strictly via Precision-Recall curves.',
    decisions: [
      'Prioritized false-negative reduction, achieving Recall = 85.2%, Specificity = 99.96%, and a False Positive Rate = 0.033%.',
      'Developed an interactive risk-threshold slider inside the UI allowing risk managers to adjust cost matrices in real time.'
    ],
    l: [
      ['Live Demo ↗', 'https://credit-card-scam-engine.streamlit.app/'],
      ['Code ↗', 'https://github.com/navnit-ky03/Credit-Card-Scam-Engine']
    ]
  },
  {
    num: '07',
    t: 'Multimodal Lecture RAG Assistant',
    d: 'Converts lecture video audio to timestamped chunks with Whisper, indexed via SentenceTransformers for Gemini 3.6 Flash QA.',
    k: ['ai'],
    s: ['Python', 'Whisper', 'SentenceTransformers', 'Gemini API', 'Streamlit', 'Vector DB'],
    metric: 'Sub-second RAG',
    domain: 'Multimodal GenAI / Video RAG',
    readmeUrl: 'https://raw.githubusercontent.com/navnit-ky03/rag_based_teaching_model/main/README.md',
    archSvg: `
      <svg viewBox="0 0 760 180" style="width:100%; font-family:monospace; background:#070a0f; border-radius:8px; padding:10px;">
        <rect x="20" y="60" width="130" height="50" rx="8" fill="#0d141d" stroke="#22d3ee"/>
        <text x="30" y="90" fill="#22d3ee" font-size="11">Lecture Video</text>
        <path d="M 150 85 L 190 85" stroke="#39ff9c" stroke-width="2"/>
        <rect x="190" y="60" width="140" height="50" rx="8" fill="#0a1018" stroke="#39ff9c"/>
        <text x="200" y="90" fill="#39ff9c" font-size="11">OpenAI Whisper</text>
        <path d="M 330 85 L 370 85" stroke="#39ff9c" stroke-width="2"/>
        <rect x="370" y="60" width="150" height="50" rx="8" fill="#0d141d" stroke="#a78bfa"/>
        <text x="380" y="90" fill="#a78bfa" font-size="11">SentenceTransformers</text>
        <path d="M 520 85 L 560 85" stroke="#39ff9c" stroke-width="2"/>
        <rect x="560" y="60" width="140" height="50" rx="8" fill="#0d141d" stroke="#22d3ee"/>
        <text x="575" y="90" fill="#22d3ee" font-size="11">Gemini RAG</text>
      </svg>`,
    problem: 'Extracting specific concepts or answers from hours of video lectures requires tedious manual scrubbing across video timelines.',
    arch: 'Multimodal processing pipeline converting video audio streams into timestamped transcript chunks via OpenAI Whisper, indexed with SentenceTransformers, and queried through Gemini API.',
    decisions: [
      'Utilized OpenAI Whisper for speech recognition to extract chunked transcripts with exact video timecodes.',
      'Indexed transcript chunks using SentenceTransformers dense vectors to pinpoint precise video timestamps during semantic search.',
      'Designed an interactive Streamlit frontend that links cited answer sources directly to video timestamp markers.'
    ],
    l: [
      ['Live Demo ↗', 'https://rag-assistant-model.streamlit.app/'],
      ['Code ↗', 'https://github.com/navnit-ky03/rag_based_teaching_model']
    ]
  }
];

const links = a => a.map(([x, u]) => `<a href="${u}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${x}</a>`).join('');

/* Hero Terminal Typing Animation */
(async () => {
  const el = $('#ty');
  if (!el) return;
  const L = [
    '$ whoami',
    'navnit-kumar-yadav | B.Tech Data Science, IILM | grad May 2027',
    '$ cat focus.txt',
    'ML systems · GenAI/RAG · agentic automation · computer vision',
    '$ ls projects/ | wc -l',
    '7 deployed, all live'
  ];
  for (const l of L) {
    const d = document.createElement('div');
    if (l[0] === '$') d.className = 'cmd';
    el.append(d);
    for (const ch of l) {
      d.textContent += ch;
      await new Promise(r => setTimeout(r, l[0] === '$' ? 40 : 12));
    }
    await new Promise(r => setTimeout(r, 220));
  }
})();

/* Flagship Carousel Setup */
let fi = 0, ni = 0, hold = 0;
const tabs = $('#tabs'), pl = $('#pl');

if (tabs && pl) {
  F.forEach((f, i) => {
    const b = document.createElement('button');
    b.className = 'tab';
    b.textContent = f.n;
    b.onclick = () => { fi = i; hold = Date.now() + 9000; renderF(); };
    tabs.append(b);
  });

  function renderF() {
    const f = F[fi];
    ni = 0;
    [...tabs.children].forEach((t, i) => t.classList.toggle('on', i === fi));
    $('#ft').textContent = f.n;
    $('#fk').textContent = f.k;
    $('#fd').textContent = f.d;
    pl.innerHTML = '';
    
    f.nodes.forEach(([n], i) => {
      const b = document.createElement('button');
      b.className = 'nd';
      b.textContent = n;
      b.onclick = () => { ni = i; hold = Date.now() + 9000; hl(); };
      pl.append(b);
      if (i < f.nodes.length - 1) {
        const a = document.createElement('span');
        a.className = 'ar';
        a.textContent = '→';
        pl.append(a);
      }
    });
    
    $('#fp').innerHTML = f.pts.map(p => `<li>${p}</li>`).join('');
    $('#fx').innerHTML = links(f.l);
    hl();
  }

  function hl() {
    const f = F[fi];
    [...pl.querySelectorAll('.nd')].forEach((b, i) => b.classList.toggle('on', i === ni));
    $('#tip').textContent = f.nodes[ni][1];
    $('#pg').style.width = ((ni + 1) / f.nodes.length * 100) + '%';
  }

  setInterval(() => {
    if (Date.now() < hold) return;
    ni++;
    if (ni >= F[fi].nodes.length) {
      fi = (fi + 1) % F.length;
      renderF();
    } else hl();
  }, 2200);

  const flEl = $('#fl');
  if (flEl) {
    flEl.onmouseenter = () => hold = Infinity;
    flEl.onmouseleave = () => hold = Date.now() + 2000;
  }
  renderF();
}

/* ==========================================================================
   PROJECT LIST & TABBED MODAL WITH DYNAMIC README FETCHER
   ========================================================================== */

const projectList = $('#projectList'), fil = $('#fil');
const modalOverlay = $('#modalOverlay'), modalClose = $('#modalClose');

if (projectList) {
  P.forEach((p) => {
    const row = document.createElement('div');
    row.className = 'project-row';
    row.dataset.k = p.k.join(' ');

    row.innerHTML = `
      <span class="m row-num">${p.num}</span>
      <div>
        <h3>${p.t}</h3>
        <div class="ch" style="margin-top:4px;">${p.s.slice(0,3).map(s => `<span>${s}</span>`).join('')}</div>
      </div>
      <p class="row-desc">${p.d}</p>
      <div class="row-metric">${p.metric}</div>
      <div class="row-actions">${links(p.l)}</div>
    `;

    row.onclick = () => openProjectModal(p);
    projectList.append(row);
  });
}

function openProjectModal(p) {
  currentProject = p;
  $('#mNum').textContent = p.num;
  $('#mTitle').textContent = p.t;
  $('#mDomain').textContent = p.domain;
  $('#mProblem').textContent = p.problem;
  $('#mArch').textContent = p.arch;
  $('#mDecisions').innerHTML = p.decisions.map(d => `<li>${d}</li>`).join('');
  $('#mStack').innerHTML = p.s.map(s => `<span>${s}</span>`).join('');
  $('#mLinks').innerHTML = links(p.l);
  
  $('#mDiagramWrapper').innerHTML = p.archSvg || '<p>Architecture diagram unavailable.</p>';
  switchModalTab('overview');
  modalOverlay.classList.add('open');
}

const modalTabs = document.querySelectorAll('.m-tab');
modalTabs.forEach(tab => {
  tab.onclick = () => switchModalTab(tab.dataset.tab);
});

async function switchModalTab(tabKey) {
  modalTabs.forEach(t => t.classList.toggle('on', t.dataset.tab === tabKey));
  
  $('#tabOverview').classList.toggle('on', tabKey === 'overview');
  $('#tabArchitecture').classList.toggle('on', tabKey === 'architecture');
  $('#tabReadme').classList.toggle('on', tabKey === 'readme');

  if (tabKey === 'readme' && currentProject) {
    const container = $('#mReadmeContent');
    container.innerHTML = '<p style="color:var(--text-muted)">Fetching full README documentation from GitHub repository...</p>';
    
    try {
      const res = await fetch(currentProject.readmeUrl);
      if (!res.ok) throw new Error('README fetch failed');
      const markdown = await res.text();
      
      if (typeof marked !== 'undefined') {
        container.innerHTML = marked.parse(markdown);
      } else {
        container.textContent = markdown;
      }
    } catch (err) {
      container.innerHTML = `
        <p style="color:var(--accent-cyan); margin-bottom:8px;"><strong>Full Repository Documentation:</strong></p>
        <p>Could not load live README stream directly. You can inspect the full documentation on GitHub:</p>
        <div style="margin-top:12px;">${links(currentProject.l)}</div>
      `;
    }
  }
}

if (modalClose) modalClose.onclick = () => modalOverlay.classList.remove('open');
if (modalOverlay) {
  modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.remove('open');
  };
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('open')) {
    modalOverlay.classList.remove('open');
  }
});

/* Category Filters Setup */
if (fil) {
  [
    ['all', 'All'],
    ['ai', 'GenAI & Agents'],
    ['cv', 'Vision'],
    ['ml', 'ML Systems'],
    ['viz', 'Dashboards']
  ].forEach(([k, t], i) => {
    const b = document.createElement('button');
    b.className = 'b' + (i ? '' : ' on');
    b.textContent = t;
    b.onclick = () => {
      [...fil.children].forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      [...projectList.children].forEach(row => {
        row.classList.toggle('hide', k !== 'all' && !row.dataset.k.split(' ').includes(k));
      });
    };
    fil.append(b);
  });
}

/* Terminal Interactive Shell */
const out = $('#out'), inp = $('#in');
const C = {
  help: () => ['commands: about, projects, skills, contact, clear'],
  about: () => ['Navnit Kumar Yadav, final-year B.Tech Data Science (IILM University, May 2027).', 'Specializing in ML systems, 3D medical vision, and agentic RAG microservices.'],
  projects: () => P.map((p) => `${p.num}. ${p.t} [${p.metric}] - ${p.d}`),
  skills: () => [
    'Core ML: Python, SQL, PyTorch, Scikit-Learn, XGBoost, Pandas, NumPy',
    'GenAI/Agents: LangGraph, Pinecone, RAG, n8n, Groq API',
    'Vision: 3D Segmentation, MONAI, ONNX Runtime, OpenCV',
    'Deployment: FastAPI, Pydantic v2, Streamlit, Supabase, HF Hub'
  ],
  contact: () => [EMAIL, 'github.com/navnit-ky03']
};

function addCmd(t, c) {
  const d = document.createElement('div');
  d.textContent = t;
  if (c) d.className = c;
  out.append(d);
}

function runCmd(v) {
  const c = v.trim().toLowerCase();
  if (!c) return;
  if (c === 'clear') {
    out.textContent = '';
    return;
  }
  addCmd('$ ' + c, 'cmd');
  (C[c] ? C[c]() : ['command not found: ' + c + '. try "help"']).forEach(x => addCmd(x));
  $('#tm').scrollTop = $('#tm').scrollHeight;
}

if (out && inp) {
  addCmd('type a command, or click a button below. try "help".');
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { runCmd(inp.value); inp.value = ''; } });

  ['help', 'about', 'projects', 'skills', 'contact', 'clear'].forEach(c => {
    const b = document.createElement('button');
    b.className = 'b m';
    b.textContent = c;
    b.onclick = () => runCmd(c);
    $('#qc').append(b);
  });
}

/* Toast */
const toast = t => {
  const e = $('#ts');
  if (!e) return;
  e.textContent = t;
  e.classList.add('sh');
  setTimeout(() => e.classList.remove('sh'), 1800);
};

const cpBtn = $('#cp');
if (cpBtn) {
  cpBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      toast('Email copied');
    } catch (e) {
      toast(EMAIL);
    }
  };
}

/* Scroll Animations */
addEventListener('scroll', () => {
  const bar = $('#bar');
  if (bar) bar.style.width = (scrollY / (document.documentElement.scrollHeight - innerHeight) * 100) + '%';
}, { passive: true });

const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) {
    e.target.classList.add('in');
    io.unobserve(e.target);
  }
}), { threshold: 0.1 });

document.querySelectorAll('.rv').forEach(x => io.observe(x));

const io2 = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  io2.unobserve(e.target);
  const n = +e.target.dataset.n, t0 = performance.now();
  (function s(t) {
    const p = Math.min((t - t0) / 800, 1);
    e.target.textContent = Math.round(n * p);
    if (p < 1) requestAnimationFrame(s);
  })(t0);
}));

document.querySelectorAll('[data-n]').forEach(x => io2.observe(x));

/* ==========================================================================
   REAL-TIME SYNCHRONIZED MULTI-VIEW STREAMING RAG CHATBOT
   ========================================================================== */

let threadId = sessionStorage.getItem('navnit_chat_thread_id');
if (!threadId) {
  threadId = (window.crypto && window.crypto.randomUUID)
    ? window.crypto.randomUUID()
    : 'thread_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  sessionStorage.setItem('navnit_chat_thread_id', threadId);
}

const heroChatConsole = $('#heroChatConsole');
const chatFab = $('#chatFab'), chatWindow = $('#chatWindow'), chatClose = $('#chatClose');

if (heroChatConsole && chatFab) {
  const fabObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) {
        chatFab.classList.add('visible');
      } else {
        chatFab.classList.remove('visible');
        if (chatWindow) chatWindow.classList.remove('open');
      }
    });
  }, { threshold: 0.1 });

  fabObserver.observe(heroChatConsole);
}

if (chatFab && chatClose) {
  chatFab.onclick = () => chatWindow.classList.toggle('open');
  chatClose.onclick = () => chatWindow.classList.remove('open');
}

/* Append User Message Concurrently to Both Chat Views */
function appendUserMessageToAllViews(text) {
  chatHistory.push({ text, sender: 'user', prefix: '' });
  const bodies = [$('#heroChatBody'), $('#chatBody')].filter(Boolean);

  bodies.forEach(bodyEl => {
    const msg = document.createElement('div');
    msg.className = 'msg user';

    const content = document.createElement('div');
    content.className = 'msg-content';
    content.textContent = text;

    msg.append(content);
    bodyEl.append(msg);
    bodyEl.scrollTop = bodyEl.scrollHeight;
  });
}

/* Prepare Synchronized Streaming Bot Message Elements in Both Views */
function prepareStreamingBotMessageToAllViews(prefix = '// rag_response') {
  const bodies = [$('#heroChatBody'), $('#chatBody')].filter(Boolean);
  const targetElements = [];

  bodies.forEach(bodyEl => {
    const msg = document.createElement('div');
    msg.className = 'msg bot';

    if (prefix) {
      const p = document.createElement('div');
      p.className = 'cmd-prefix';
      p.textContent = prefix;
      msg.append(p);
    }

    const content = document.createElement('div');
    content.className = 'msg-content';
    content.innerHTML = '<span style="color:var(--text-muted)">Thinking...</span>';

    msg.append(content);
    bodyEl.append(msg);
    bodyEl.scrollTop = bodyEl.scrollHeight;

    targetElements.push({ bodyEl, contentEl: content });
  });

  return {
    update(accumulatedText) {
      targetElements.forEach(({ bodyEl, contentEl }) => {
        if (typeof marked !== 'undefined') {
          contentEl.innerHTML = marked.parse(accumulatedText);
        } else {
          contentEl.textContent = accumulatedText;
        }
        bodyEl.scrollTop = bodyEl.scrollHeight;
      });
    },
    setError(errMessage) {
      targetElements.forEach(({ bodyEl, contentEl }) => {
        contentEl.textContent = errMessage;
        bodyEl.scrollTop = bodyEl.scrollHeight;
      });
    }
  };
}

/* Synchronized SSE Streaming API Execution */
async function executeRAGQuery(query, activeInputEl) {
  const q = query || (activeInputEl ? activeInputEl.value.trim() : '');
  if (!q) return;

  // Clear BOTH input fields simultaneously
  const heroIn = $('#heroChatInput'), chatIn = $('#chatInput');
  if (heroIn) heroIn.value = '';
  if (chatIn) chatIn.value = '';

  // 1. Render User Query in both chat bodies
  appendUserMessageToAllViews(q);

  // 2. Spawn streaming message placeholders in both chat bodies
  const streamer = prepareStreamingBotMessageToAllViews('// rag_response');

  try {
    const response = await fetch(CHATBOT_STREAM_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: q,
        thread_id: threadId
      })
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let accumulatedText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop(); // Hold incomplete trailing line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const dataStr = trimmed.replace('data: ', '').trim();
          if (dataStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.token) {
              accumulatedText += parsed.token;
              streamer.update(accumulatedText);
            }
          } catch (e) {
            console.error('Error parsing SSE token:', e);
          }
        }
      }
    }

    // Push final streamed answer into chat history
    if (accumulatedText) {
      chatHistory.push({
        text: accumulatedText,
        sender: 'bot',
        prefix: '// rag_response'
      });
    } else {
      const fallback = "I couldn't find specific details to answer that accurately.";
      streamer.setError(fallback);
      chatHistory.push({
        text: fallback,
        sender: 'bot',
        prefix: '// rag_response'
      });
    }

  } catch (err) {
    const errorMsg = "Server waking up or unreachable. Please try again in a few seconds or reach out at yadavnv1526@gmail.com.";
    streamer.setError(errorMsg);
    chatHistory.push({
      text: errorMsg,
      sender: 'bot',
      prefix: '// error'
    });
  }
}

/* Event Listeners for Hero Chat Console */
const heroChatInput = $('#heroChatInput'), heroChatSend = $('#heroChatSend');
if (heroChatSend && heroChatInput) {
  heroChatSend.onclick = () => executeRAGQuery(null, heroChatInput);
  heroChatInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') executeRAGQuery(null, heroChatInput);
  });
}

/* Event Listeners for Floating Chat Widget */
const chatInput = $('#chatInput'), chatSend = $('#chatSend');
if (chatSend && chatInput) {
  chatSend.onclick = () => executeRAGQuery(null, chatInput);
  chatInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') executeRAGQuery(null, chatInput);
  });
}

function sendSharedChip(text) {
  if (chatWindow && !chatWindow.classList.contains('open') && chatFab && chatFab.classList.contains('visible')) {
    chatWindow.classList.add('open');
  }
  executeRAGQuery(text, null);
}

/* Ctrl+K Focus Shortcut */
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    if (chatWindow && chatWindow.classList.contains('open') && chatInput) {
      chatInput.focus();
    } else if (heroChatInput) {
      heroChatInput.focus();
    }
  }
});
