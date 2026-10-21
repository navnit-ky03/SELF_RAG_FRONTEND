import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const get = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const paths = [
  'index.html', '404.html', 'projects/index.html', 'skills/index.html',
  'about/index.html', 'contact/index.html',
  ...['self-corrective-rag','neuroscan-ai','voice-booking','fraud-detection',
      'customer-value','delivery-analytics','lecture-rag'].map(id => `projects/${id}/index.html`),
];

test('every generated page includes an accessible full-screen toggle for floating chat', () => {
  for (const path of paths) {
    const html = get(path);
    assert.match(html, /id="chatExpand" aria-controls="chatWindow" aria-pressed="false"/, path);
    assert.match(html, /aria-label="Expand AI assistant to full screen"/, path);
    assert.match(html, /id="chatClose"/, path);
  }
});

test('homepage includes a full-screen button that promotes the shared conversation', () => {
  assert.match(get('index.html'), /id="heroChatExpand"/);
});

test('full-screen mode reuses existing floating panel and conversation state', () => {
  const source = get('portfolio.js');
  assert.match(source, /function setChatFullscreen\(expanded/);
  assert.match(source, /\$\('#heroChatExpand'\).*addEventListener\('click'/);
  assert.match(source, /setChatFullscreen\(true\)/);
  assert.match(source, /panel\.classList\.toggle\('is-fullscreen', chatFullscreen\)/);
  assert.match(source, /if \(event\.key === 'Escape' && !\$\('#chatWindow'\)\.hidden\)/);
  assert.match(source, /setChatFullscreen\(false, false\)/);
  assert.match(source, /body:JSON\.stringify\(\{question:q,thread_id:conversation\.threadId\}\)/);
});

test('full-screen CSS supports scrollable transcript, mobile and reduced motion', () => {
  const css = get('portfolio.css');
  assert.match(css, /\.chat-window\.is-fullscreen \.chat-body/);
  assert.match(css, /body\.chat-fullscreen-active \{ overflow:hidden; \}/);
  assert.match(css, /--chat-vv-height/);
  assert.match(css, /prefers-reduced-motion/);
});
