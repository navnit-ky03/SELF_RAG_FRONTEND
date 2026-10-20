"""Browser acceptance tests. Uses mocked Render responses; never calls an LLM.
Requires Python Playwright and a Chromium binary (CHROMIUM_PATH overrides path).
Run: npm run test:browser
"""
import functools
import http.server
import json
import os
from pathlib import Path
import threading
import unittest
from playwright.sync_api import sync_playwright, expect, Error

ROOT = Path(__file__).resolve().parents[1]
PROJECTS = json.loads((ROOT / 'data/projects.json').read_text())
RENDER = 'https://self-rag-engine.onrender.com/'
HEADERS = {'access-control-allow-origin':'*','access-control-allow-headers':'content-type','access-control-allow-methods':'GET, POST, OPTIONS'}

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args): pass
    def translate_path(self,path):
        # Also exercise deployment under a GitHub Pages repository prefix.
        if path.startswith('/SELF_RAG_FRONTEND/'):
            path=path[len('/SELF_RAG_FRONTEND'):]
        return super().translate_path(path)

class PortfolioBrowserTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        handler = functools.partial(QuietHandler, directory=str(ROOT))
        cls.server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.url = f'http://127.0.0.1:{cls.server.server_port}/'
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
        (ROOT / 'docs/screenshots').mkdir(parents=True,exist_ok=True)
    @classmethod
    def tearDownClass(cls):
        cls.browser.close(); cls.playwright.stop(); cls.server.shutdown(); cls.server.server_close()
    def setUp(self):
        self.context = self.browser.new_context(viewport={'width':1440,'height':1000}, reduced_motion='reduce')
        self.page = self.context.new_page()
        self.page.set_default_timeout(7000)
        self.errors=[]; self.page.on('pageerror',lambda error:self.errors.append(str(error)))
        self.health_calls=0; self.posts=[]; self.held=[]; self.mode='success'; self.health_mode='success'
        self.page.route('https://fonts.googleapis.com/**',lambda route:route.abort())
        self.page.route('https://fonts.gstatic.com/**',lambda route:route.abort())
        self.page.route(RENDER+'**',self.backend)
    def tearDown(self):
        for route in self.held:
            try: route.abort()
            except Error: pass
        self.page.unroute_all(behavior='ignoreErrors')
        self.context.close()
        self.assertEqual(self.errors,[],'Unexpected browser script errors')
    def backend(self,route):
        request=route.request
        if request.method=='OPTIONS': route.fulfill(status=204,headers=HEADERS); return
        if request.url==RENDER:
            self.health_calls+=1
            if self.health_mode=='network':route.abort();return
            if self.health_mode=='cold' and self.health_calls==1:route.fulfill(status=503,headers=HEADERS,body='starting');return
            if self.health_mode=='always-cold':route.fulfill(status=503,headers=HEADERS,body='starting');return
            if self.health_mode=='hold':self.held.append(route);return
            route.fulfill(status=200,headers=HEADERS,json={'status':'ok'});return
        self.posts.append(request.post_data_json)
        if self.mode=='hold': self.held.append(route);return
        if self.mode=='network':route.abort();return
        if isinstance(self.mode,int): route.fulfill(status=self.mode,headers=HEADERS,json={'detail':'test failure'});return
        if self.mode=='invalid':route.fulfill(status=200,headers=HEADERS,json={'unexpected':'payload'});return
        answer = '<img src=x onerror="window.injected=1"> **Answer** [source](https://github.com/navnit-ky03) [bad](javascript:alert(1))' if self.mode=='unsafe' else 'A grounded answer from the test backend.'
        route.fulfill(status=200,headers=HEADERS,json={'answer':answer})
    def goto(self,path=''):
        return self.page.goto(self.url+path,wait_until='domcontentloaded')
    def submit(self,text='Explain the RAG engine'):
        self.page.locator('#heroChatInput').fill(text)
        self.page.locator('[data-chat-view=hero] .send-button').click()
    def test_01_static_routes_and_responsive_overflow(self):
        paths=['','projects/','skills/','about/','contact/']+[f'projects/{p["id"]}/' for p in PROJECTS]
        for width in [320,375,768,1440]:
            self.page.set_viewport_size({'width':width,'height':900})
            for path in paths:
                with self.subTest(width=width,path=path):
                    self.assertEqual(self.goto(path).status,200)
                    self.assertTrue(self.page.title().endswith('Navnit Kumar Yadav'))
                    expect(self.page.locator('h1')).to_have_count(1)
                    self.assertFalse(self.page.evaluate('document.documentElement.scrollWidth > innerWidth'),f'Overflow at {width} {path}')
        self.goto('projects/neuroscan-ai/')
        self.assertEqual(self.page.reload().status,200)
        self.assertIn('0.8842',self.page.locator('main').inner_text())
        self.assertIn('owner-reported',self.page.locator('main').inner_text())
    def test_02_gallery_and_demos(self):
        self.goto('projects/')
        expect(self.page.locator('#projectGrid .project-card:visible')).to_have_count(7)
        self.page.locator('[data-project-filter="AI & agents"]').click()
        expect(self.page.locator('#projectGrid .project-card:visible')).to_have_count(3)
        self.page.locator('#projectSearch').fill('xyz-no-match')
        expect(self.page.locator('#emptyProjects')).to_be_visible()
        self.page.locator('[data-project-filter=All]').click();self.page.locator('#projectSearch').fill('MONAI')
        expect(self.page.locator('#projectGrid .project-card:visible')).to_have_count(1)
        for project in PROJECTS:
            self.goto(f'projects/{project["id"]}/')
            demo=self.page.get_by_role('link',name='Live Demo')
            expect(demo).to_have_count(1 if project.get('demo') else 0)
            if project.get('demo'):
                expect(demo).to_have_attribute('href',project['demo']['url'])
                self.assertIn('Free-tier hosting',self.page.locator('.case-hero').inner_text())
    def test_03_skills_mapping_and_context(self):
        self.goto('skills/?skill=monai')
        expect(self.page.locator('#skillDetail h2')).to_have_text('MONAI')
        expect(self.page.locator('#skillDetail .skill-project-link')).to_have_count(1)
        expect(self.page.locator('#skillDetail a')).to_have_attribute('href','../projects/neuroscan-ai/')
        self.page.locator('[data-skill-filter=Engineering]').click()
        expect(self.page.locator('[data-skill=monai]')).to_be_hidden()
        expect(self.page.locator('#skillDetail h2')).to_have_text('Python')
        self.page.locator('#skillDetail [data-question]').click()
        expect(self.page.locator('#chatWindow .msg.bot')).to_have_count(2)
        self.assertEqual(self.posts[0]['question'],'How has Navnit used Python in his projects?')
    def test_04_architecture_terminal_and_mobile_navigation(self):
        self.goto()
        self.page.locator('[data-flagship=voice-booking]').click()
        panel=self.page.locator('#flagship-voice-booking')
        panel.locator('[data-step="3"]').click()
        expect(panel.locator('.architecture-explanation h3')).to_have_text('Save booking')
        panel.locator('[data-direction="1"]').click()
        expect(panel.locator('.architecture-explanation h3')).to_have_text('Follow-up form')
        self.page.locator('.terminal summary').click()
        self.page.locator('#terminalInput').fill('projects');self.page.locator('#terminalInput').press('Enter')
        self.assertIn('Multimodal Lecture RAG',self.page.locator('#terminalOutput').inner_text())
        self.page.set_viewport_size({'width':320,'height':800})
        expect(self.page.locator('#mainNav')).to_be_hidden()
        self.page.locator('#menuToggle').click();expect(self.page.locator('#menuToggle')).to_have_attribute('aria-expanded','true')
        self.page.locator('#mainNav').get_by_role('link',name='About',exact=True).click()
        expect(self.page.locator('h1')).to_contain_text('Hi, I’m Navnit.')
        self.page.go_back();self.assertIn('Home',self.page.title())
        self.page.go_forward();self.assertIn('About',self.page.title())
    def test_05_shared_chat_dedup_drafts_and_session_navigation(self):
        self.goto();self.mode='hold'
        self.page.locator('#chatFab').click()
        self.page.locator('#chatInput').fill('Keep the floating draft')
        self.page.locator('#chatClose').click()
        self.submit('One question only')
        self.page.locator('#heroChatInput').fill('Next draft')
        self.page.locator('#heroChatInput').press('Enter')
        expect(self.page.locator('[data-chat-view=hero] .send-button')).to_be_disabled()
        self.assertEqual(len(self.posts),1)
        self.held[-1].fulfill(status=200,headers=HEADERS,json={'answer':'Finished once'})
        expect(self.page.locator('#heroChatBody .msg.bot')).to_have_count(2)
        expect(self.page.locator('#chatBody .msg.bot')).to_have_count(2)
        expect(self.page.locator('#heroChatInput')).to_have_value('Next draft')
        expect(self.page.locator('#chatInput')).to_have_value('Keep the floating draft')
        thread=self.posts[0]['thread_id']
        self.mode='success';self.goto('about/')
        self.page.locator('#chatFab').click()
        expect(self.page.locator('#chatBody')).to_contain_text('Finished once')
        expect(self.page.locator('#chatInput')).to_have_value('Keep the floating draft')
        self.page.locator('#chatInput').fill('Second question');self.page.locator('#chatInput').press('Enter')
        expect(self.page.locator('#chatBody')).to_contain_text('A grounded answer')
        self.assertEqual(self.posts[-1]['thread_id'],thread)
    def test_06_service_health_does_not_establish_llm_health_and_retry_no_duplicates(self):
        self.goto();self.mode=503;self.submit()
        expect(self.page.locator('#heroChatBody .chat-error')).to_contain_text('server is reachable')
        expect(self.page.locator('#heroChatBody .chat-error')).to_contain_text('AI service may be temporarily unavailable')
        self.assertEqual(len(self.posts),1)
        self.mode='success';self.page.locator('#heroChatBody [data-retry]').click()
        expect(self.page.locator('#heroChatBody .chat-error')).to_have_count(0)
        expect(self.page.locator('#heroChatBody .msg.user')).to_have_count(1)
        self.assertEqual(len(self.posts),2)
        self.assertEqual(self.posts[0],self.posts[1])
    def test_07_cold_start_get_retry_before_single_post(self):
        self.page.clock.install();self.health_mode='cold';self.goto();self.submit()
        expect(self.page.locator('#heroChatBody .chat-status-text')).to_contain_text('waking up')
        self.assertEqual(len(self.posts),0)
        self.page.clock.run_for(2100)
        expect(self.page.locator('#heroChatBody')).to_contain_text('A grounded answer')
        self.assertEqual(self.health_calls,2);self.assertEqual(len(self.posts),1)
    def test_08_timeout_slow_indicator_and_user_retry(self):
        self.page.clock.install();self.goto();self.mode='hold';self.submit()
        self.page.clock.run_for(12100)
        expect(self.page.locator('#heroChatBody .chat-status-text')).to_contain_text('taking longer')
        self.page.clock.run_for(78000)
        expect(self.page.locator('#heroChatBody .chat-error')).to_contain_text('downstream AI services may be delayed')
        expect(self.page.locator('[data-chat-view=hero] .send-button')).to_be_enabled()
        self.assertEqual(len(self.posts),1)
        self.mode='success';self.page.locator('#heroChatBody [data-retry]').click()
        expect(self.page.locator('#heroChatBody .chat-error')).to_have_count(0)
        expect(self.page.locator('#heroChatBody .msg.user')).to_have_count(1)
    def test_09_network_unknown_rate_limit_bad_request_and_invalid_payload(self):
        self.health_mode='network';self.mode='network';self.goto();self.submit()
        expect(self.page.locator('#heroChatBody .chat-error')).to_contain_text('does not prove the app is offline')
        self.assertEqual(len(self.posts),1)
        for mode,text in [(429,'rate limit'),(422,'not a cold-start delay'),(500,'API response failure'),('invalid','unexpected response')]:
            self.mode=mode;self.page.locator('#heroChatBody [data-retry]').click()
            expect(self.page.locator('#heroChatBody .chat-error')).to_contain_text(text)
        self.assertEqual(len(self.posts),5)
    def test_10_untrusted_answers_readme_and_user_text_are_inert(self):
        self.mode='unsafe';self.goto();self.submit('<svg onload="window.injected=1">')
        expect(self.page.locator('#heroChatBody')).to_contain_text('<img src=x')
        self.assertEqual(self.page.locator('.chat-body img,.chat-body svg').count(),0)
        self.assertIsNone(self.page.evaluate('window.injected'))
        expect(self.page.locator('#heroChatBody strong')).to_have_text('Answer')
        expect(self.page.locator('#heroChatBody a')).to_have_count(1)
        expect(self.page.locator('#heroChatBody a')).to_have_attribute('href','https://github.com/navnit-ky03')
        self.page.route('https://raw.githubusercontent.com/**',lambda r:r.fulfill(status=200,body='<script>window.injected=1</script> [x](javascript:alert(1)) <img onerror="window.injected=1">'))
        self.goto('projects/neuroscan-ai/');self.page.locator('[data-readme]').click()
        expect(self.page.locator('#readmeContent')).to_be_visible()
        expect(self.page.locator('#readmeContent')).to_contain_text('<script>')
        self.assertEqual(self.page.locator('#readmeContent script,#readmeContent img,#readmeContent a').count(),0)
        self.assertIsNone(self.page.evaluate('window.injected'))
    def test_11_inflight_navigation_recovers_question_without_post_replay(self):
        self.mode='hold';self.goto();self.submit('Saved across navigation')
        self.goto('contact/');self.page.locator('#chatFab').click()
        expect(self.page.locator('#chatBody .chat-error')).to_contain_text('interrupted by navigation')
        self.assertEqual(len(self.posts),1)
        self.mode='success';self.page.locator('#chatBody [data-retry]').click()
        expect(self.page.locator('#chatBody')).to_contain_text('A grounded answer')
        self.assertEqual(len(self.posts),2)
    def test_12_storage_disabled_keyboard_and_focus(self):
        self.context.add_init_script("Object.defineProperty(window, 'sessionStorage', {get(){throw new Error('blocked')}})")
        self.goto();self.submit()
        expect(self.page.locator('#heroChatBody')).to_contain_text('A grounded answer')
        self.page.keyboard.press('Control+k');expect(self.page.locator('#heroChatInput')).to_be_focused()
        self.page.locator('#chatFab').click();expect(self.page.locator('#chatInput')).to_be_focused()
        self.page.keyboard.press('Escape');expect(self.page.locator('#chatFab')).to_be_focused()
        expect(self.page.locator('#chatWindow')).to_be_hidden()
    def test_13_invalid_session_and_readme_failure(self):
        self.page.add_init_script("sessionStorage.setItem('navnit_portfolio_chat_v2','{malformed')")
        self.goto();self.submit();expect(self.page.locator('#heroChatBody')).to_contain_text('A grounded answer')
        self.page.route('https://raw.githubusercontent.com/**',lambda r:r.abort())
        self.goto('projects/lecture-rag/');self.page.locator('[data-readme]').click()
        expect(self.page.locator('#readmeStatus')).to_contain_text('Could not load')
        expect(self.page.locator('[data-readme]')).to_have_text('Retry README ↻')
    def test_14_no_javascript_content_and_screenshots(self):
        context=self.browser.new_context(java_script_enabled=False,viewport={'width':375,'height':812})
        page=context.new_page();page.route('https://fonts.googleapis.com/**',lambda r:r.abort())
        page.goto(self.url+'projects/neuroscan-ai/')
        expect(page.locator('h1')).to_have_text('NeuroScan AI')
        expect(page.get_by_role('link',name='Live Demo')).to_be_visible()
        expect(page.locator('#mainNav').get_by_role('link',name='Skills',exact=True)).to_be_visible()
        context.close()
        self.goto();self.page.screenshot(path=str(ROOT/'docs/screenshots/home-desktop.png'),full_page=True)
        self.page.set_viewport_size({'width':375,'height':812});self.page.screenshot(path=str(ROOT/'docs/screenshots/home-mobile.png'),full_page=True)
        self.goto('skills/?skill=langgraph');self.page.screenshot(path=str(ROOT/'docs/screenshots/skills-mobile.png'),full_page=True)
        self.page.set_viewport_size({'width':1440,'height':1000});self.goto('projects/neuroscan-ai/');self.page.screenshot(path=str(ROOT/'docs/screenshots/neuroscan-desktop.png'),full_page=True)

    def test_15_repository_prefix_legacy_links_contact_and_keyboard(self):
        self.goto('SELF_RAG_FRONTEND/projects/neuroscan-ai/')
        self.assertEqual(self.page.locator('link[rel=stylesheet]').evaluate('(el)=>new URL(el.href).pathname'),'/SELF_RAG_FRONTEND/portfolio.css')
        self.page.locator('#mainNav').get_by_role('link',name='Skills',exact=True).click()
        self.assertIn('/SELF_RAG_FRONTEND/skills/',self.page.url)
        expect(self.page.locator('#skillDetail h2')).to_have_text('Python')
        self.goto('#projects');expect(self.page.locator('h1')).to_contain_text('Built with curiosity.')
        self.goto('contact/')
        expect(self.page.locator('a.contact-address')).to_have_attribute('href','mailto:yadavnv1526@gmail.com')
        self.page.locator('#copyEmail').click();expect(self.page.locator('#copyStatus')).to_have_text('Email address copied.')
        self.page.set_viewport_size({'width':375,'height':812})
        self.page.locator('#menuToggle').click()
        self.page.locator('#mainNav').get_by_role('link',name='Home',exact=True).focus()
        self.page.keyboard.press('Escape');expect(self.page.locator('#menuToggle')).to_be_focused()
    def test_16_health_timeout_budget_does_not_gate_working_chat_forever(self):
        self.page.clock.install();self.health_mode='hold';self.goto();self.submit('Can chat work when readiness is inconclusive?')
        for elapsed in [12010,2010,12010,4010,12010,8010,10010]:
            self.page.clock.run_for(elapsed)
        expect(self.page.locator('#heroChatBody')).to_contain_text('A grounded answer')
        self.assertEqual(len(self.posts),1)
        self.assertGreater(self.health_calls,1)
        self.assertLessEqual(self.health_calls,5)

if __name__=='__main__':unittest.main(verbosity=2)
