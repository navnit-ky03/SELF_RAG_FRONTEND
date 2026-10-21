/* Navnit Kumar Yadav · Portfolio v2
   Buildless browser runtime. All factual content comes from data/*.json. */
'use strict';
document.documentElement.classList.add('js');
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const { projects, skills, site, base, suggestions } = JSON.parse($('#site-data').textContent);

/* Keep old portfolio hash links useful after moving to static routes. */
function legacyRoute() {
  if (document.body.dataset.page !== 'home') return;
  const target = { '#projects':'projects/', '#stack':'skills/', '#skills':'skills/', '#about':'about/', '#contact':'contact/' }[location.hash];
  if (target) location.replace(base + target);
  if (location.hash === '#flagship') { history.replaceState(null,'','#architecture'); $('#architecture')?.scrollIntoView(); }
  if (location.hash === '#top' || location.hash === '#home') { history.replaceState(null,'',location.pathname + location.search); window.scrollTo(0,0); }
}
legacyRoute();
window.addEventListener('hashchange', legacyRoute);

/* Preserve the existing Render endpoint and page-load pre-warming mechanism. */
const CHATBOT_API_URL = 'https://self-rag-engine.onrender.com/chat';
const HEALTH_URL = 'https://self-rag-engine.onrender.com/';
const pageRequests = new Set();
let queryGeneration = 0;
const TIMING = Object.freeze({ healthTimeout: 12000, startupBudget: 60000, chatTimeout: 90000, slowAfter: 12000, healthFreshness: 30000 });
class RequestError extends Error {
  constructor(kind, status = 0) { super(kind); this.kind = kind; this.status = status; }
}
/* Keep the timeout active while consuming the body, not only until headers arrive. */
async function fetchWithTimeout(url, options, timeoutMs, consume = response => response) {
  const controller = new AbortController();
  pageRequests.add(controller);
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return await consume(response);
  } catch (error) {
    if (timedOut) throw new RequestError('timeout');
    if (error instanceof RequestError) throw error;
    throw new RequestError('network');
  } finally { clearTimeout(timer); pageRequests.delete(controller); }
}
let healthProbe = null;
let healthState = { kind: 'unchecked', checkedAt: 0 };
function connectionStatus(label, state, explanation = '') {
  $$('.chat-connection').forEach(el => { el.textContent = label; el.title = explanation; });
  $$('.chat-status-dot').forEach(el => { el.dataset.state = state; });
}
/* GET / only proves that the HTTP service answered; it never marks LLMs healthy. */
function checkBackendReadiness(timeoutMs = TIMING.healthTimeout) {
  if (healthProbe) return healthProbe;
  healthProbe = (async () => {
    let kind;
    try {
      const result = await fetchWithTimeout(HEALTH_URL, { method: 'GET', mode: 'cors', cache: 'no-store' }, timeoutMs, async response => {
        const result = response.ok ? 'reachable' : [502, 503, 504].includes(response.status) ? 'starting' : 'unconfirmed';
        // Cancel an unused body; an HTML hosting response need not be downloaded.
        if (response.body) await response.body.cancel();
        return result;
      });
      kind = result;
    } catch (error) { kind = error.kind === 'timeout' ? 'timeout' : 'network'; }
    healthState = { kind, checkedAt: Date.now() };
    return healthState;
  })().finally(() => { healthProbe = null; });
  return healthProbe;
}
const prewarmPromise = (async function prewarmRenderBackend() {
  // Always send the original background GET as soon as this script loads.
  const result = await checkBackendReadiness();
  if (result.kind === 'reachable') {
    connectionStatus('Server reachable · AI checked on request', 'reachable', 'GET / succeeded; downstream LLM availability is not established.');
  } else {
    connectionStatus('Readiness unconfirmed · you can still ask', 'unknown', 'A delay or network restriction does not establish an application failure.');
  }
  return result;
})();

/* Accessible mobile navigation; normal static links preserve browser history. */
const menuToggle = $('#menuToggle');
function closeMenu() { $('#mainNav').classList.remove('open'); menuToggle.setAttribute('aria-expanded', 'false'); }
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  $('#mainNav').classList.toggle('open', open);
});
$('#mainNav').addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && $('#mainNav').classList.contains('open')) { closeMenu(); menuToggle.focus(); }
});
window.addEventListener('pageshow', closeMenu);
window.addEventListener('scroll', () => {
  const total = document.documentElement.scrollHeight - innerHeight;
  $('#scrollProgress').style.width = `${total > 0 ? Math.min(100, scrollY / total * 100) : 0}%`;
}, { passive: true });

/* Registry-derived project filtering and search. */
let selectedCategory = 'All';
function filterProjects() {
  const query = $('#projectSearch')?.value.trim().toLowerCase() || '';
  let visible = 0;
  $$('#projectGrid .project-card').forEach(card => {
    card.hidden = !((selectedCategory === 'All' || card.dataset.category === selectedCategory) && card.dataset.search.includes(query));
    if (!card.hidden) visible++;
  });
  if ($('#projectCount')) $('#projectCount').textContent = `${visible} ${visible === 1 ? 'project' : 'projects'}`;
  if ($('#emptyProjects')) $('#emptyProjects').hidden = visible !== 0;
}
$$('[data-project-filter]').forEach(button => button.addEventListener('click', () => {
  selectedCategory = button.dataset.projectFilter;
  $$('[data-project-filter]').forEach(b => { b.setAttribute('aria-pressed', String(b === button)); b.classList.toggle('active', b === button); });
  filterProjects();
}));
$('#projectSearch')?.addEventListener('input', filterProjects);

/* Three authentic local MRI views; switching never requests inference. */
$$('.mri-tabs').forEach(tablist => {
  const tabs = [...tablist.querySelectorAll('[role="tab"]')];
  function selectTab(index, focus = false) {
    tabs.forEach((tab,i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = i !== index;
    });
    if (focus) tabs[index].focus();
  }
  tabs.forEach((tab,index) => {
    tab.addEventListener('click', () => selectTab(index));
    tab.addEventListener('keydown', event => {
      const next = {ArrowRight:(index+1)%tabs.length, ArrowLeft:(index-1+tabs.length)%tabs.length, Home:0, End:tabs.length-1}[event.key];
      if (next !== undefined) { event.preventDefault(); selectTab(next,true); }
    });
  });
  selectTab(0);
});

/* Disclosure state belongs to each view; conversation state remains shared.
   Closing never leaves keyboard focus inside a hidden suggestions panel. */
function setSuggestionsExpanded(view, expanded, returnToToggle = false) {
  const panel = view.querySelector('[data-suggestion-panel]');
  const toggle = view.querySelector('[data-suggestion-toggle]');
  const focusWouldDisappear = !expanded && panel.contains(document.activeElement);
  panel.hidden = !expanded;
  toggle.setAttribute('aria-expanded',String(expanded));
  if (focusWouldDisappear) {
    const target = returnToToggle ? toggle : view.querySelector('.chat-form input');
    target.focus({preventScroll:true});
  }
}
function collapseSuggestionsAfterSubmission() {
  $$('[data-chat-view]').forEach(view => setSuggestionsExpanded(view,false));
}
$$('[data-chat-view]').forEach(view => {
  const toggle = view.querySelector('[data-suggestion-toggle]');
  toggle.addEventListener('click', () => setSuggestionsExpanded(view,toggle.getAttribute('aria-expanded') !== 'true'));
  view.querySelector('.chat-suggestions').addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      event.preventDefault(); event.stopPropagation();
      setSuggestionsExpanded(view,false,true);
      toggle.focus({preventScroll:true});
    }
  });
});

/* Visitor-oriented, page-specific prompts. Pagination changes suggestions only;
   the exact selected question still uses the existing shared request model. */
$$('[data-chat-view]').forEach(view => {
  let group = 0;
  const groups = Math.ceil(suggestions.length / 4);
  const button = view.querySelector('[data-more-questions]');
  button.addEventListener('click', () => {
    group = (group + 1) % groups;
    const list = view.querySelector('[data-suggestion-list]');
    list.replaceChildren();
    suggestions.slice(group*4,group*4+4).forEach(({label,question}) => {
      const prompt = element('button','chip suggestion-chip',label);
      prompt.type = 'button'; prompt.dataset.question = question;
      prompt.setAttribute('aria-label',question); prompt.title = question;
      prompt.append(element('span','', '↗')); prompt.lastChild.setAttribute('aria-hidden','true');
      prompt.disabled = inFlight; list.append(prompt);
    });
    view.querySelector('[data-suggestion-status]').textContent = `Question group ${group+1} of ${groups}`;
  });
});

/* Preserve flagship node explanations with explicit, keyboard-accessible controls. */
$$('.architecture').forEach(panel => {
  const project = projects.find(p => p.id === panel.dataset.project);
  let step = 0;
  function selectStep(index) {
    step = (index + project.architecture.length) % project.architecture.length;
    panel.querySelectorAll('[data-step]').forEach((button, i) => button.setAttribute('aria-pressed', String(i === step)));
    const explanation = panel.querySelector('.architecture-explanation');
    explanation.querySelector('h3').textContent = project.architecture[step][0];
    explanation.querySelector('p').textContent = project.architecture[step][1];
    panel.querySelector('.step-count').textContent = `${String(step + 1).padStart(2, '0')} / ${String(project.architecture.length).padStart(2, '0')}`;
  }
  panel.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => selectStep(Number(button.dataset.step))));
  panel.querySelectorAll('[data-direction]').forEach(button => button.addEventListener('click', () => selectStep(step + Number(button.dataset.direction))));
});
$$('[data-flagship]').forEach(button => button.addEventListener('click', () => {
  $$('[data-flagship]').forEach(b => { b.setAttribute('aria-pressed', String(b === button)); b.classList.toggle('active', b === button); });
  $$('.flagship-panel').forEach(panel => { panel.hidden = panel.id !== `flagship-${button.dataset.flagship}`; });
}));

/* DOM-only helpers: no remote content or user input is inserted as HTML. */
function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
/* A small Markdown subset, built exclusively with DOM nodes. HTML remains
   literal text; links must be absolute HTTPS URLs without embedded credentials. */
function appendAnswerText(container, text) {
  function inline(parent, source) {
    const pattern = /\*\*([^*\n]+)\*\*|`([^`\n]+)`|\[([^\]\n]+)\]\(([^)\n]+)\)/g;
    let start = 0;
    for (const match of source.matchAll(pattern)) {
      parent.append(document.createTextNode(source.slice(start, match.index)));
      if (match[1]) parent.append(element('strong','',match[1]));
      else if (match[2]) parent.append(element('code','',match[2]));
      else {
        let href;
        try { const url = new URL(match[4]); if (url.protocol === 'https:' && !url.username && !url.password) href = url.href; } catch { /* Preserve unsafe/relative links as text. */ }
        if (href) { const link = element('a','',match[3]); link.href = href; link.target = '_blank'; link.rel = 'noopener noreferrer'; parent.append(link); }
        else parent.append(document.createTextNode(match[0]));
      }
      start = match.index + match[0].length;
    }
    parent.append(document.createTextNode(source.slice(start)));
  }
  for (const block of text.split(/\n\s*\n/)) {
    const lines = block.split('\n');
    if (lines.every(line => /^[-*]\s+/.test(line))) {
      const list = element('ul');
      lines.forEach(line => { const item = element('li'); inline(item,line.replace(/^[-*]\s+/,'')); list.append(item); });
      container.append(list);
    } else {
      const paragraph = element('p');
      lines.forEach((line,index) => { if (index) paragraph.append(document.createElement('br')); inline(paragraph,line); });
      container.append(paragraph);
    }
  }
}
function selectSkill(id, updateUrl = true) {
  const skill = skills.find(s => s.id === id);
  if (!skill || !$('#skillDetail')) return;
  $$('[data-skill]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.skill === id)));
  const panel = $('#skillDetail');
  panel.replaceChildren(element('p','eyebrow','SKILL → PROJECTS'), element('h2','',skill.name), element('p','',skill.description));
  const map = element('div','skill-map');
  projects.filter(p => p.skills.includes(id)).forEach(project => {
    const link = element('a','skill-project-link');
    link.href = `${base}projects/${project.id}/`;
    link.append(element('strong','',`${project.title} ↗`), element('span','',project.description));
    map.append(link);
  });
  panel.append(map);
  const question = element('button','chip',`How has Navnit used ${skill.name}? ↗`);
  question.type = 'button';
  question.dataset.question = `How has Navnit used ${skill.name} in his projects?`;
  panel.append(question);
  if (updateUrl) {
    const url = new URL(location.href); url.searchParams.set('skill', id);
    history.replaceState(null, '', url);
  }
}
$$('[data-skill]').forEach(button => button.addEventListener('click', () => {
  selectSkill(button.dataset.skill);
  if (matchMedia('(max-width: 640px)').matches) $('#skillDetail').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
}));
$$('[data-skill-filter]').forEach(button => button.addEventListener('click', () => {
  $$('[data-skill-filter]').forEach(b => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button)); });
  const category = button.dataset.skillFilter;
  $$('[data-skill]').forEach(b => { b.hidden = category !== 'All' && b.dataset.category !== category; });
  const selected = $('[data-skill][aria-pressed="true"]');
  if (!selected || selected.hidden) selectSkill($$('[data-skill]').find(b => !b.hidden).dataset.skill);
}));
if ($('#skillDetail')) selectSkill(new URLSearchParams(location.search).get('skill') || skills[0].id, false);
window.addEventListener('popstate', () => { if ($('#skillDetail')) selectSkill(new URLSearchParams(location.search).get('skill') || skills[0].id, false); });

/* Remote README content is always rendered as text, including HTML and links.
   No executable Markdown parser is loaded. Requests are bounded and retryable. */
$$('[data-readme]').forEach(button => button.addEventListener('click', async () => {
  if (button.disabled) return;
  const project = projects.find(p => p.id === button.dataset.readme);
  const content = $('#readmeContent'), status = $('#readmeStatus');
  button.disabled = true; status.textContent = 'Loading source documentation…';
  try {
    const text = await fetchWithTimeout(project.readme, {}, 15000, async response => {
      if (!response.ok) throw new RequestError('http', response.status);
      const text = await response.text();
      if (text.length > 500000) throw new RequestError('invalid');
      return text;
    });
    content.textContent = text; content.hidden = false;
    status.textContent = 'Source Markdown shown as text. Repository links remain available above.';
    button.textContent = 'Refresh README ↻';
  } catch {
    status.textContent = 'Could not load the README from this browser. The GitHub source link above is still available.';
    button.textContent = 'Retry README ↻';
  } finally { button.disabled = false; }
}));

/* Optional local terminal showcase, with facts derived from the same registry. */
function terminalCommand(command) {
  const output = $('#terminalOutput');
  if (!output) return;
  const key = command.trim().toLowerCase();
  if (!key) return;
  if (key === 'clear') { output.replaceChildren(); return; }
  output.append(element('div','',`$ ${key}`));
  const commands = {
    help: () => ['Commands: about, projects, skills, contact, clear'],
    about: () => [site.about.intro],
    projects: () => projects.map(p => `${p.title} — ${p.category}`),
    skills: () => skills.map(s => s.name),
    contact: () => [site.email, site.github]
  };
  (commands[key] ? commands[key]() : ['Command not found. Try help.']).forEach(line => output.append(element('div','',line)));
  output.scrollTop = output.scrollHeight;
}
$('#terminalForm')?.addEventListener('submit', event => { event.preventDefault(); terminalCommand($('#terminalInput').value); $('#terminalInput').value = ''; });
$$('[data-command]').forEach(button => button.addEventListener('click', () => terminalCommand(button.dataset.command)));
$('#copyEmail')?.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(site.email); $('#copyStatus').textContent = 'Email address copied.'; }
  catch { $('#copyStatus').textContent = `Copy this address: ${site.email}`; }
});
/* Progressive enhancement: counters start with the correct static registry value. */
if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    observer.unobserve(entry.target);
    const target = Number(entry.target.dataset.count), started = performance.now();
    const tick = now => { const progress = Math.min((now - started) / 650, 1); entry.target.textContent = String(Math.round(progress * target)); if (progress < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }));
  $$('[data-count]').forEach(el => observer.observe(el));
}

/* One tab/session conversation across every static page and both entry points. */
const STORAGE_KEY = 'navnit_portfolio_chat_v2';
const greeting = 'Hi! I can help you explore Navnit’s projects, engineering strengths, and fit for an opportunity. What would you like to know?';
function newId() { return window.crypto?.randomUUID?.() || `thread_${Date.now()}_${Math.random().toString(36).slice(2)}`; }
function loadConversation() {
  let saved;
  try { saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY)); } catch { /* Storage may be disabled or malformed. */ }
  const valid = saved && saved.version === 2 && typeof saved.threadId === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(saved.threadId) && Array.isArray(saved.messages) && saved.messages.length <= 100 && saved.messages.every(m => m && typeof m.id === 'string' && m.id.length < 150 && ['user','bot'].includes(m.role) && typeof m.text === 'string' && m.text.length <= 30000 && ['complete','pending','failed'].includes(m.status));
  if (!valid) return { version: 2, threadId: newId(), messages: [], drafts: {} };
  // Treat saved content as untrusted and retain only explicitly supported fields.
  return { version: 2, threadId: saved.threadId, messages: saved.messages.map(m => ({ id: m.id, role: m.role, text: m.text, status: m.status === 'pending' ? 'failed' : m.status, failure: m.status === 'pending' ? { kind: 'interrupted', status: 0 } : { kind: ['network','timeout','http','invalid','interrupted'].includes(m.failure?.kind) ? m.failure.kind : 'network', status: Number.isInteger(m.failure?.status) ? m.failure.status : 0, reachable: m.failure?.reachable === true } })), drafts: Object.fromEntries(['hero','floating'].map(key => [key, typeof saved.drafts?.[key] === 'string' ? saved.drafts[key].slice(0,2000) : ''])) };
}
const conversation = loadConversation();
// Keep legacy thread identity when possible, without depending on storage access.
try {
  const legacy = sessionStorage.getItem('navnit_chat_thread_id');
  if (!conversation.messages.length && legacy && /^[a-zA-Z0-9_-]{1,128}$/.test(legacy)) conversation.threadId = legacy;
  sessionStorage.setItem('navnit_chat_thread_id', conversation.threadId);
} catch { /* In-memory chat remains usable. */ }
let inFlight = false;
let activeMessage = null;
let currentStatus = '';
let lastFocusedElement = null;
function saveConversation() {
  // Bound stored history; never trim a user question away from its answer.
  while (conversation.messages.length > 80) {
    const nextTurn = conversation.messages.findIndex((message,index) => index > 0 && message.role === 'user');
    if (nextTurn < 0) break;
    conversation.messages.splice(0,nextTurn);
  }
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(conversation)); } catch { /* Quota/privacy mode: keep the working in-memory session. */ }
}
function errorMessage(failure) {
  const reachable = failure.reachable;
  if (failure.kind === 'interrupted') return 'The previous request was interrupted by navigation. Your question is saved. You can retry; the server may already have processed it.';
  if (failure.kind === 'timeout') return reachable ? 'The server answered its readiness check, but the AI answer took too long. The request timed out; downstream AI services may be delayed. You can retry.' : 'The request timed out. The server may still be starting, or the connection may be delayed. This does not confirm an application failure. You can retry.';
  if (failure.kind === 'network') return 'The connection could not be confirmed. A network, browser, or proxy restriction may be involved; this does not prove the app is offline. Your question is saved for retry.';
  if (failure.kind === 'invalid') return 'The API returned an unexpected response instead of an answer. Your question is saved. You can retry or contact Navnit.';
  if (failure.status === 429) return 'The API rate limit was reached. Wait about a minute before retrying. Your question is saved.';
  if ([502,503,504].includes(failure.status)) return reachable ? `The server is reachable, but the chat request returned HTTP ${failure.status}. The AI service may be temporarily unavailable. This is separate from server readiness. Please retry shortly.` : `The service returned HTTP ${failure.status}. It may still be starting or temporarily unavailable; readiness is not confirmed. Please retry shortly.`;
  if (failure.status >= 400 && failure.status < 500) return `The API rejected this request (HTTP ${failure.status}). This is not a cold-start delay. Check your question or contact Navnit.`;
  return `The API returned HTTP ${failure.status || 'error'}. This is an API response failure, not a confirmed cold start. Your question is saved for retry.`;
}
function renderChat() {
  $$('.chat-body').forEach(body => {
    const wasNearBottom = body.scrollHeight - body.scrollTop - body.clientHeight < 65;
    body.replaceChildren(element('div','msg bot',greeting));
    conversation.messages.forEach(message => {
      const bubble = element('div',`msg ${message.role}`);
      if (message.role === 'bot') appendAnswerText(bubble,message.text);
      else bubble.textContent = message.text;
      body.append(bubble);
      if (message.status === 'failed') {
        const error = element('div','chat-error');
        error.append(element('p','',errorMessage(message.failure || { kind:'network' })));
        const retry = element('button','', 'Retry saved question ↻');
        retry.type = 'button'; retry.dataset.retry = message.id; retry.disabled = inFlight;
        retry.setAttribute('aria-label', `Retry question: ${message.text.slice(0,100)}`);
        error.append(retry); body.append(error);
      }
    });
    if (inFlight) {
      const status = element('div','chat-status-text',currentStatus);
      status.setAttribute('role','status'); body.append(status);
    }
    if (wasNearBottom || inFlight) body.scrollTop = body.scrollHeight;
  });
  $$('.chat-form button, [data-question]').forEach(button => { button.disabled = inFlight; });
  $$('.chat-form').forEach(form => form.setAttribute('aria-busy',String(inFlight)));
}
function setWaitingStatus(text) {
  currentStatus = text;
  $$('.chat-status-text').forEach(el => { el.textContent = text; });
}
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
async function waitForStartup(generation) {
  const deadline = Date.now() + TIMING.startupBudget;
  let result = await prewarmPromise;
  if (generation !== queryGeneration) return result;
  if (Date.now() - result.checkedAt > TIMING.healthFreshness) result = await checkBackendReadiness();
  let attempts = 0;
  // Only lightweight GETs retry automatically. No automatic POST replay: the
  // backend has no idempotency contract and may already have processed a turn.
  while (generation === queryGeneration && ['starting','timeout'].includes(result.kind) && Date.now() < deadline && attempts < 4) {
    setWaitingStatus('The server may be waking up after inactivity. Your question is saved; checking again…');
    const pause = Math.min(2000 * 2 ** attempts, Math.max(0,deadline - Date.now()));
    await delay(pause);
    const remaining = deadline - Date.now();
    if (remaining <= 0 || generation !== queryGeneration) break;
    result = await checkBackendReadiness(Math.min(TIMING.healthTimeout, remaining));
    attempts++;
  }
  // An inconclusive root endpoint must not block a potentially working /chat.
  return result;
}
async function executeRAGQuery(question, input = null, retryId = null) {
  if (inFlight) return;
  const q = String(question || input?.value || '').trim();
  if (!q || q.length > 2000) return;
  const message = retryId ? conversation.messages.find(m => m.id === retryId && m.role === 'user' && m.status === 'failed') : { id:newId(), role:'user', text:q, status:'pending' };
  if (!message) return;
  // Retrying an older failed turn after later messages would contaminate backend
  // thread order. Only the latest unresolved turn is offered in the UI.
  if (retryId && message !== conversation.messages.at(-1)) return;
  collapseSuggestionsAfterSubmission();
  const generation = ++queryGeneration;
  inFlight = true; activeMessage = message; message.status = 'pending'; delete message.failure;
  if (!retryId) {
    conversation.messages.forEach(m => { if (m.status === 'failed') m.status = 'complete'; });
    conversation.messages.push(message);
  }
  if (input) {
    input.value = '';
    conversation.drafts[input.closest('[data-chat-view]').dataset.chatView] = '';
  }
  currentStatus = 'Preparing the server. First requests can take longer after inactivity…';
  connectionStatus('Preparing server…','checking');
  saveConversation(); renderChat();
  let slowTimer;
  let readiness;
  try {
    readiness = await waitForStartup(generation);
    if (generation !== queryGeneration) return;
    setWaitingStatus(readiness.kind === 'reachable' ? 'Server reached. Asking the AI about your question…' : 'Readiness is unconfirmed. Trying your question; startup or network delays are possible…');
    connectionStatus('Asking AI…','answering','Server readiness and downstream LLM availability are checked separately.');
    slowTimer = setTimeout(() => setWaitingStatus(readiness.kind === 'reachable' ? 'The AI is taking longer than usual. The server responded; downstream processing may be delayed…' : 'Still waiting. The server may be starting or the connection may be delayed…'), TIMING.slowAfter);
    const answer = await fetchWithTimeout(CHATBOT_API_URL, {
      method:'POST', mode:'cors', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({question:q,thread_id:conversation.threadId})
    }, TIMING.chatTimeout, async response => {
      if (!response.ok) throw new RequestError('http',response.status);
      let data;
      try { data = await response.json(); } catch { throw new RequestError('invalid'); }
      if (!data || typeof data.answer !== 'string' || !data.answer.trim() || data.answer.length > 30000) throw new RequestError('invalid');
      return data.answer;
    });
    if (generation !== queryGeneration) return;
    message.status = 'complete';
    conversation.messages.push({id:newId(),role:'bot',text:answer,status:'complete'});
    connectionStatus('Answer received · session memory can reset','ready');
  } catch (error) {
    if (generation !== queryGeneration) return;
    message.status = 'failed';
    message.failure = {kind:error.kind || 'network',status:error.status || 0,reachable:readiness?.kind === 'reachable'};
    connectionStatus(error.kind === 'network' ? 'Connection unconfirmed' : error.kind === 'timeout' ? 'Request timed out · retry available' : 'Chat response unavailable · retry available','unknown');
  } finally {
    clearTimeout(slowTimer);
    if (generation === queryGeneration) {
      inFlight = false; activeMessage = null;
      saveConversation(); renderChat();
    }
    // Drafts written in either view during the request remain untouched.
    if (input && document.activeElement === input) input.focus();
  }
}
$$('[data-chat-view]').forEach(view => {
  const input = view.querySelector('input');
  input.value = conversation.drafts[view.dataset.chatView] || '';
  input.addEventListener('input', () => { conversation.drafts[view.dataset.chatView] = input.value; saveConversation(); });
  view.querySelector('form').addEventListener('submit', event => { event.preventDefault(); executeRAGQuery(null,input); });
});
/* Header-docked launcher reserves its own layout space instead of covering
   cards or controls. Hide it while the main assistant is visible. */
let heroAssistantVisible = false;
function updateLauncherVisibility() {
  const hero = $('#heroChatConsole');
  if (hero) {
    const rect = hero.getBoundingClientRect();
    const visible = Math.min(rect.bottom,innerHeight) - Math.max(rect.top,$('.site-header').getBoundingClientRect().bottom);
    heroAssistantVisible = visible > rect.height * .08;
  }
  $('#chatFab').hidden = heroAssistantVisible && $('#chatWindow').hidden && document.activeElement !== $('#chatFab');
}
if ($('#heroChatConsole') && 'IntersectionObserver' in window) {
  const launcherObserver = new IntersectionObserver(entries => {
    updateLauncherVisibility();
  }, {threshold:[0,.08],rootMargin:'-90px 0px 0px 0px'});
  launcherObserver.observe($('#heroChatConsole'));
} else updateLauncherVisibility();
window.addEventListener('scroll',updateLauncherVisibility,{passive:true});
function positionChatPanel() {
  const viewport = window.visualViewport;
  const top = Math.max(12, $('.site-header').getBoundingClientRect().bottom + 12);
  const available = (viewport?.height || innerHeight) + (viewport?.offsetTop || 0) - top - 12;
  $('#chatWindow').style.setProperty('--chat-panel-top', `${top}px`);
  $('#chatWindow').style.setProperty('--chat-panel-height', `${Math.max(100,Math.min(620,available))}px`);
}
/* Full screen is a reversible presentation mode of the existing shared chat,
   not another conversation, API request, or persisted thread. */
let chatFullscreen = false;
function setChatFullscreen(expanded, focus = true) {
  const panel = $('#chatWindow');
  chatFullscreen = Boolean(expanded);
  panel.classList.toggle('is-fullscreen', chatFullscreen);
  document.body.classList.toggle('chat-fullscreen-active', chatFullscreen && !panel.hidden);
  const button = $('#chatExpand');
  button.setAttribute('aria-pressed', String(chatFullscreen));
  button.setAttribute('aria-label', chatFullscreen ? 'Exit full screen AI assistant' : 'Expand AI assistant to full screen');
  button.title = chatFullscreen ? 'Exit full screen' : 'Full screen';
  button.textContent = chatFullscreen ? '⤢' : '⛶';
  if (focus && !panel.hidden) button.focus({preventScroll:true});
}
function openChat() {
  if ($('#chatWindow').hidden) lastFocusedElement = document.activeElement;
  $('#chatWindow').hidden = false; $('#chatFab').setAttribute('aria-expanded','true');
  document.body.classList.toggle('chat-fullscreen-active', chatFullscreen);
  updateLauncherVisibility(); positionChatPanel(); $('#chatInput').focus({preventScroll:true});
}
function closeChat() {
  setChatFullscreen(false, false);
  $('#chatWindow').hidden = true; $('#chatFab').setAttribute('aria-expanded','false');
  if (lastFocusedElement === $('#chatFab')) $('#chatFab').hidden = false;
  else updateLauncherVisibility();
  if (lastFocusedElement?.isConnected && lastFocusedElement.getClientRects().length) lastFocusedElement.focus({preventScroll:true});
  else if (heroAssistantVisible) $('#heroChatInput').focus({preventScroll:true});
  else $('#chatFab').focus({preventScroll:true});
  updateLauncherVisibility();
}
window.addEventListener('resize',positionChatPanel);
window.visualViewport?.addEventListener('resize', () => {
  positionChatPanel();
  if (!$('#chatWindow').hidden && $('#chatWindow').contains(document.activeElement)) document.activeElement.scrollIntoView({block:'nearest'});
});
// Avoid a native focus scroll to the sticky header’s original document position.
$('#chatFab').addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  event.preventDefault(); $('#chatFab').focus({preventScroll:true});
});
$('#chatFab').addEventListener('blur', () => requestAnimationFrame(updateLauncherVisibility));
$('#chatFab').addEventListener('click', () => { if ($('#chatWindow').hidden) openChat(); else closeChat(); });
$('#chatClose').addEventListener('click',closeChat);
$('#chatExpand').addEventListener('click', () => setChatFullscreen(!chatFullscreen));
$('#heroChatExpand')?.addEventListener('click', () => {
  // Expand the existing floating view; both views share a thread and transcript.
  openChat();
  setChatFullscreen(true);
});
document.addEventListener('click', event => {
  const retry = event.target.closest('[data-retry]');
  if (retry) { const saved = conversation.messages.find(m => m.id === retry.dataset.retry); if (saved) executeRAGQuery(saved.text,null,saved.id); return; }
  const question = event.target.closest('[data-question]');
  if (question && !inFlight) {
    if (question.closest('[data-chat-view=hero]')) $('#heroChatInput').focus();
    else openChat();
    executeRAGQuery(question.dataset.question);
  }
  if (event.target.closest('[data-open-chat]')) openChat();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !$('#chatWindow').hidden) {
    if (chatFullscreen) {
      event.preventDefault();
      setChatFullscreen(false);
    } else closeChat();
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    if ($('#chatWindow').hidden && $('#heroChatInput')) $('#heroChatInput').focus(); else openChat();
  }
});
// Save pending state and drafts before a full-page navigation. On the next page
// the pending question becomes an explicit interrupted request, never a replay.
window.addEventListener('pagehide', () => {
  queryGeneration++;
  if (activeMessage) { activeMessage.status = 'failed'; activeMessage.failure = {kind:'interrupted',status:0}; }
  inFlight = false; activeMessage = null;
  saveConversation();
  pageRequests.forEach(controller => controller.abort());
});
window.addEventListener('pageshow', event => {
  if (!event.persisted) return;
  const latest = loadConversation();
  conversation.messages = latest.messages; conversation.drafts = latest.drafts; conversation.threadId = latest.threadId;
  if (activeMessage) {
    // A BFCache-restored request can no longer reliably own the current thread.
    // A reload recovers persisted state and prevents a stale response from rendering.
    location.reload(); return;
  }
  $$('[data-chat-view]').forEach(view => { view.querySelector('input').value = conversation.drafts[view.dataset.chatView] || ''; });
  renderChat();
});
saveConversation(); renderChat();
