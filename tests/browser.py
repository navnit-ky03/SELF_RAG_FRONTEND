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
SCREENSHOTS = ROOT / 'docs/screenshots/v2.2'
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
        SCREENSHOTS.mkdir(parents=True,exist_ok=True)
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
    def open_floating(self):
        if self.page.locator('body').get_attribute('data-page')=='home':
            self.page.locator('.featured-section').evaluate("el => el.scrollIntoView({block:'start'})")
        expect(self.page.locator('#chatFab')).to_be_visible()
        self.page.evaluate('()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')
        box=self.page.locator('#chatFab').bounding_box()
        # Native pointer click avoids Playwright trying to scroll a sticky header
        # button into the document's 100px anchor-scroll padding.
        self.page.mouse.click(box['x']+box['width']/2,box['y']+box['height']/2)
        expect(self.page.locator('#chatWindow')).to_be_visible()
    def capture_component(self,selector,filename):
        # Exclude fixed navigation outside the component from long element captures.
        style=self.page.add_style_tag(content='.site-header,.skip-link,#scrollProgress {visibility:hidden!important}')
        try:self.page.locator(selector).screenshot(path=str(SCREENSHOTS/filename))
        finally:style.evaluate('(el)=>el.remove()')
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
        self.open_floating()
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
        self.open_floating()
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
        self.goto('contact/');self.open_floating()
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
        self.open_floating();expect(self.page.locator('#chatInput')).to_be_focused()
        self.assertGreater(self.page.evaluate('scrollY'),500)
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
        self.goto()
        self.page.screenshot(path=str(SCREENSHOTS/'home-desktop.png'),full_page=True)
        self.capture_component('#heroChatConsole','home-chat-desktop.png')
        self.page.set_viewport_size({'width':375,'height':812})
        self.page.screenshot(path=str(SCREENSHOTS/'home-mobile.png'),full_page=True)
        self.capture_component('#heroChatConsole','home-chat-mobile.png')
        self.goto('skills/?skill=langgraph')
        self.page.screenshot(path=str(SCREENSHOTS/'skills-mobile.png'),full_page=True)
        self.goto('projects/neuroscan-ai/')
        self.capture_component('#mri-gallery','mri-gallery-mobile.png')
        self.page.set_viewport_size({'width':1440,'height':1000})
        self.goto('projects/neuroscan-ai/')
        self.page.screenshot(path=str(SCREENSHOTS/'neuroscan-desktop.png'),full_page=True)
        self.capture_component('#mri-gallery','mri-gallery-desktop.png')
        self.goto('contact/')
        self.page.screenshot(path=str(SCREENSHOTS/'contact-desktop.png'),full_page=True)
        self.page.set_viewport_size({'width':375,'height':812})
        self.page.screenshot(path=str(SCREENSHOTS/'contact-mobile.png'),full_page=True)

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

    def test_17_recruiter_prompts_pagination_and_exact_payloads(self):
        prompts=json.loads((ROOT/'data/chat-prompts.json').read_text())['home']
        self.goto()
        expect(self.page.locator('#heroSuggestions [data-question]')).to_have_count(4)
        expect(self.page.locator('#chatFab')).to_be_hidden()
        more=self.page.locator('[data-chat-view=hero] [data-more-questions]')
        for group in range(3):
            current=prompts[group*4:group*4+4]
            expect(self.page.locator('#heroSuggestions [data-question]')).to_have_count(len(current))
            for index,prompt in enumerate(current):
                button=self.page.locator('#heroSuggestions [data-question]').nth(index)
                expect(button).to_have_attribute('data-question',prompt['question'])
                expect(button).to_contain_text(prompt['label'])
                self.page.locator('#heroSuggestionToggle').click()
                button.click()
                expect(self.page.locator('#heroChatBody .msg.bot')).to_have_count(len(self.posts)+1)
                self.assertEqual(self.posts[-1]['question'],prompt['question'])
                self.assertEqual(set(self.posts[-1]),{'question','thread_id'})
                expect(self.page.locator('#chatWindow')).to_be_hidden()
            self.page.locator('#heroSuggestionToggle').click()
            more.focus();self.page.keyboard.press('Enter')
            expect(more).to_be_focused()
            self.page.locator('#heroSuggestionToggle').click()
        self.assertEqual(len(self.posts),10)
        self.assertEqual(len({post['thread_id'] for post in self.posts}),1)
        expect(self.page.locator('#heroChatBody .msg.user')).to_have_count(10)
        expect(self.page.locator('#heroSuggestions [data-question]')).to_have_count(4)
    def test_18_contextual_prompts_use_existing_session_and_unmodified_answers(self):
        prompts=json.loads((ROOT/'data/chat-prompts.json').read_text())
        paths=[('','home'),('projects/','projects'),('projects/neuroscan-ai/','neuroscan-ai'),('projects/self-corrective-rag/','self-corrective-rag'),('skills/','skills'),('about/','about'),('contact/','contact')]
        for index,(path,key) in enumerate(paths):
            self.goto(path);self.open_floating()
            buttons=self.page.locator('#floatingSuggestions [data-question]')
            expect(buttons).to_have_count(min(4,len(prompts[key])))
            expect(buttons.first).to_have_attribute('aria-label',prompts[key][0]['question'])
            self.page.locator('#floatingSuggestionToggle').click()
            buttons.first.click()
            expect(self.page.locator('#chatBody .msg.bot')).to_have_count(index+2)
            self.assertEqual(self.posts[-1]['question'],prompts[key][0]['question'])
            expect(self.page.locator('#chatBody .msg.bot').last).to_have_text('A grounded answer from the test backend.')
            expect(self.page.locator('#chatWindow .chat-disclaimer')).to_contain_text('AI sources may not include recent availability')
        self.assertEqual(len({post['thread_id'] for post in self.posts}),1)
        expect(self.page.locator('#chatBody .msg.user')).to_have_count(len(paths))
    def test_19_authentic_mri_planes_keyboard_attribution_and_no_inference(self):
        self.health_mode='network'
        requests=[];self.page.on('request',lambda request:requests.append(request.url))
        self.goto('projects/neuroscan-ai/')
        gallery=self.page.locator('#mri-gallery')
        expect(gallery).to_be_visible()
        for plane,index in [('axial',92),('coronal',128),('sagittal',108)]:
            tab=self.page.locator('#mri-tab-'+plane);tab.click()
            expect(tab).to_have_attribute('aria-selected','true')
            panel=self.page.locator('#mri-panel-'+plane)
            expect(panel).to_be_visible();expect(panel).to_contain_text('slice '+str(index))
            image=panel.locator('img')
            image.evaluate('(img)=>img.decode()')
            self.assertTrue(image.evaluate('(img)=>img.complete && img.naturalWidth > 0'))
            expect(image).to_have_attribute('alt',__import__('re').compile('model-predicted tumor mask'))
        self.page.locator('#mri-tab-sagittal').focus();self.page.keyboard.press('ArrowRight')
        expect(self.page.locator('#mri-tab-axial')).to_be_focused()
        expect(self.page.locator('#mri-panel-axial')).to_be_visible()
        self.assertLessEqual(self.page.locator('.mri-image.axial').bounding_box()['width'],240)
        self.page.keyboard.press('End');expect(self.page.locator('#mri-panel-sagittal')).to_be_visible()
        self.page.keyboard.press('Home');expect(self.page.locator('#mri-panel-axial')).to_be_visible()
        self.assertIn('Owner-provided captures',gallery.inner_text())
        self.assertIn('not ground-truth',gallery.inner_text())
        self.assertIn('122.51',gallery.inner_text());self.assertIn('7.68',gallery.inner_text())
        self.assertNotIn('0.8842',gallery.inner_text())
        self.assertIn('0.8842',self.page.locator('#evidence').inner_text())
        self.assertFalse(any('braintumorsegmentationmri.streamlit.app' in url for url in requests))
        self.assertEqual(self.posts,[])
        self.assertEqual(len([url for url in requests if url.endswith('.webp')]),3)
        context=self.browser.new_context(java_script_enabled=False)
        page=context.new_page();page.route('https://fonts.googleapis.com/**',lambda r:r.abort())
        page.goto(self.url+'projects/neuroscan-ai/')
        expect(page.locator('.mri-panel:visible')).to_have_count(3)
        context.close()
    def test_20_header_launcher_reserved_space_and_panel_fit(self):
        for width in [320,375,768,1440]:
            with self.subTest(width=width):
                self.page.set_viewport_size({'width':width,'height':812})
                self.goto();expect(self.page.locator('#chatFab')).to_be_hidden()
                self.page.locator('.featured-section').evaluate("el=>el.scrollIntoView({block:'start'})")
                expect(self.page.locator('#chatFab')).to_be_visible()
                self.goto('skills/')
                launcher=self.page.locator('#chatFab').bounding_box()
                header=self.page.locator('.site-header').bounding_box()
                self.assertGreaterEqual(launcher['y'],header['y'])
                self.assertLessEqual(launcher['y']+launcher['height'],header['y']+header['height']+1)
                for control in ['.site-header .brand','#menuToggle','#mainNav']:
                    locator=self.page.locator(control)
                    if not locator.is_visible():continue
                    box=locator.bounding_box()
                    overlap=min(launcher['x']+launcher['width'],box['x']+box['width'])-max(launcher['x'],box['x'])
                    self.assertLessEqual(overlap,0,control+' overlaps launcher')
                self.open_floating()
                panel=self.page.locator('#chatWindow').bounding_box()
                self.assertGreaterEqual(panel['x'],0);self.assertLessEqual(panel['x']+panel['width'],width+1)
                self.assertGreaterEqual(panel['y'],header['height']);self.assertLessEqual(panel['y']+panel['height'],813)
                self.assertGreaterEqual(self.page.locator('#chatWindow .send-button').bounding_box()['height'],44)
                self.page.keyboard.press('Escape');expect(self.page.locator('#chatFab')).to_be_focused()
                self.assertFalse(self.page.evaluate('document.documentElement.scrollWidth > innerWidth'))
        self.page.set_viewport_size({'width':320,'height':480});self.goto('contact/');self.open_floating()
        panel=self.page.locator('#chatWindow').bounding_box()
        self.assertLessEqual(panel['y']+panel['height'],481)
        touch=self.browser.new_context(viewport={'width':375,'height':812},has_touch=True,is_mobile=True,reduced_motion='reduce')
        page=touch.new_page();page.route('https://fonts.googleapis.com/**',lambda r:r.abort())
        page.route(RENDER+'**',lambda r:r.fulfill(status=200,headers=HEADERS,json={'status':'ok'}))
        page.goto(self.url+'skills/')
        box=page.locator('#chatFab').bounding_box();page.touchscreen.tap(box['x']+box['width']/2,box['y']+box['height']/2)
        expect(page.locator('#chatWindow')).to_be_visible()
        page.locator('#chatClose').click();expect(page.locator('#chatWindow')).to_be_hidden()
        touch.close()
    def test_22_suggestion_disclosures_keyboard_and_transcript_space(self):
        self.goto()
        for kind in ['hero','floating']:
            if kind=='floating':self.open_floating()
            view=self.page.locator(f'[data-chat-view={kind}]')
            toggle=view.locator('[data-suggestion-toggle]');panel=view.locator('[data-suggestion-panel]')
            expect(toggle).to_have_attribute('aria-expanded','false');expect(panel).to_be_hidden()
            self.assertEqual(toggle.get_attribute('aria-controls'),panel.get_attribute('id'))
            self.assertLessEqual(view.locator('.chat-suggestions').bounding_box()['height'],50)
            before=view.locator('.chat-body').bounding_box()['height']
            toggle.focus();self.page.keyboard.press('Enter')
            expect(toggle).to_have_attribute('aria-expanded','true');expect(panel).to_be_visible()
            if kind=='floating':self.assertGreater(before-view.locator('.chat-body').bounding_box()['height'],70)
            more=view.locator('[data-more-questions]')
            more.focus();self.page.keyboard.press('Enter');expect(more).to_be_focused()
            self.assertEqual(self.posts,[])
            self.page.keyboard.press('Escape')
            expect(panel).to_be_hidden();expect(toggle).to_be_focused()
            toggle.press('Space');expect(panel).to_be_visible()
            toggle.press('Space');expect(panel).to_be_hidden()
            self.assertEqual(self.posts,[])
        expect(self.page.locator('#chatWindow')).to_be_visible()
        self.page.keyboard.press('Escape');expect(self.page.locator('#chatWindow')).to_be_hidden()

    def test_23_submission_collapses_suggestions_and_retains_focus(self):
        self.goto()
        toggle=self.page.locator('#heroSuggestionToggle');panel=self.page.locator('#heroSuggestionPanel')
        toggle.click();self.page.locator('#heroChatInput').press('Enter')
        expect(panel).to_be_visible();self.assertEqual(self.posts,[])
        self.submit('Typed with suggestions open')
        expect(panel).to_be_hidden();expect(toggle).to_have_attribute('aria-expanded','false')
        expect(self.page.locator('#heroChatBody')).to_contain_text('A grounded answer')
        toggle.click();chip=self.page.locator('#heroSuggestions [data-question]').first
        intended=chip.get_attribute('data-question');chip.click()
        expect(panel).to_be_hidden();expect(self.page.locator('#heroChatInput')).to_be_focused()
        expect(self.page.locator('#heroChatBody .msg.bot')).to_have_count(3)
        self.assertEqual([post['question'] for post in self.posts],['Typed with suggestions open',intended])
        self.open_floating();self.page.locator('#floatingSuggestionToggle').click()
        self.mode=503
        self.page.locator('#floatingSuggestions [data-question]').first.click()
        expect(self.page.locator('#floatingSuggestionPanel')).to_be_hidden()
        expect(self.page.locator('#chatInput')).to_be_focused()
        expect(self.page.locator('#chatBody .chat-error')).to_be_visible()
        self.page.locator('#floatingSuggestionToggle').click();self.mode='success'
        self.page.locator('#chatBody .chat-error button').click()
        expect(self.page.locator('#floatingSuggestionPanel')).to_be_hidden()
        expect(self.page.locator('#chatBody .msg.bot')).to_have_count(4)
        self.assertEqual(len(self.posts),4)
        self.assertEqual(self.posts[-1],self.posts[-2])
        expect(self.page.locator('#chatBody .msg.user')).to_have_count(3)

    def test_24_reopening_during_request_keeps_lock_and_drafts(self):
        self.goto();self.open_floating()
        self.page.locator('#chatInput').fill('Preserved draft');self.page.locator('#chatClose').click()
        self.mode='hold';self.submit('A pending request')
        toggle=self.page.locator('#heroSuggestionToggle');toggle.click()
        expect(toggle).to_be_enabled();expect(self.page.locator('#heroSuggestionPanel')).to_be_visible()
        for chip in self.page.locator('#heroSuggestions [data-question]').all():expect(chip).to_be_disabled()
        self.page.locator('[data-chat-view=hero] [data-more-questions]').click()
        for chip in self.page.locator('#heroSuggestions [data-question]').all():expect(chip).to_be_disabled()
        self.page.locator('#heroChatInput').fill('Next draft');self.page.locator('#heroChatInput').press('Enter')
        expect(self.page.locator('#heroSuggestionPanel')).to_be_visible()
        self.assertEqual(len(self.posts),1)
        self.open_floating();expect(self.page.locator('#chatInput')).to_have_value('Preserved draft')
        self.page.locator('#floatingSuggestionToggle').click()
        expect(self.page.locator('#floatingSuggestionPanel')).to_be_visible()
        self.held[-1].fulfill(status=200,headers=HEADERS,json={'answer':'Completed once'})
        expect(self.page.locator('#chatBody')).to_contain_text('Completed once')
        expect(self.page.locator('#heroChatInput')).to_have_value('Next draft')
        expect(self.page.locator('#chatInput')).to_have_value('Preserved draft')
        expect(self.page.locator('#floatingSuggestions [data-question]').first).to_be_enabled()
        self.assertEqual(len(self.posts),1)

    def test_25_bounded_suggestions_and_visible_composer_at_all_sizes(self):
        for width,height in [(320,480),(320,812),(375,812),(768,900),(1440,1000)]:
            with self.subTest(width=width,height=height):
                self.page.set_viewport_size({'width':width,'height':height})
                self.goto('contact/');self.open_floating()
                toggle=self.page.locator('#floatingSuggestionToggle')
                for expanded in [False,True]:
                    if expanded:toggle.click()
                    panel=self.page.locator('#chatWindow').bounding_box()
                    for selector in ['#chatInput','#chatWindow .send-button','#floatingSuggestionToggle']:
                        box=self.page.locator(selector).bounding_box()
                        self.assertGreaterEqual(box['y'],panel['y']-1,selector)
                        self.assertLessEqual(box['y']+box['height'],min(panel['y']+panel['height'],height)+1,selector)
                        self.assertGreaterEqual(box['height'],44,selector)
                    self.assertGreaterEqual(self.page.locator('#chatBody').bounding_box()['height'],70)
                    transcript=self.page.locator('#chatBody').bounding_box()
                    suggestions=self.page.locator('#chatWindow .chat-suggestions').bounding_box()
                    form=self.page.locator('#chatWindow .chat-form').bounding_box()
                    self.assertLessEqual(transcript['y']+transcript['height'],suggestions['y']+1)
                    self.assertLessEqual(suggestions['y']+suggestions['height'],form['y']+1)
                    if expanded:
                        disclosure=self.page.locator('#floatingSuggestionPanel')
                        self.assertLessEqual(disclosure.bounding_box()['height'],151)
                        self.assertIn(disclosure.evaluate('(el)=>getComputedStyle(el).overflowY'),['auto','scroll'])
                    self.assertFalse(self.page.evaluate('document.documentElement.scrollWidth > innerWidth'))
                if width==320 and height==480:
                    self.page.screenshot(path=str(SCREENSHOTS/'floating-chat-320x480-expanded.png'))

    def test_26_refinement_review_screenshots(self):
        # Start each review route with a fresh transcript; persistence is tested above.
        self.page.add_init_script("sessionStorage.removeItem('navnit_portfolio_chat_v2')")
        for width,height,label in [(1440,1000,'desktop'),(375,812,'mobile')]:
            self.page.set_viewport_size({'width':width,'height':height});self.goto()
            self.capture_component('#heroChatConsole',f'chat-{label}-collapsed.png')
            self.page.locator('#heroSuggestionToggle').click()
            self.capture_component('#heroChatConsole',f'chat-{label}-expanded.png')
            self.page.locator('#heroSuggestions [data-question]').first.click()
            expect(self.page.locator('#heroChatBody .msg.bot')).to_have_count(2)
            self.capture_component('#heroChatConsole',f'chat-{label}-answer.png')
            self.capture_component('.featured-section',f'featured-projects-{label}.png')
            self.open_floating()
            self.page.locator('#chatWindow').screenshot(path=str(SCREENSHOTS/f'floating-chat-{label}-collapsed.png'))
            self.page.locator('#floatingSuggestionToggle').click()
            self.page.locator('#chatWindow').screenshot(path=str(SCREENSHOTS/f'floating-chat-{label}-expanded.png'))
            self.page.locator('#floatingSuggestions [data-question]').first.click()
            expect(self.page.locator('#chatBody .msg.bot')).to_have_count(3)
            self.page.locator('#chatWindow').screenshot(path=str(SCREENSHOTS/f'floating-chat-{label}-answer.png'))
            self.goto('skills/?skill=langgraph')
            self.page.screenshot(path=str(SCREENSHOTS/f'skills-{label}.png'),full_page=True)
            selected=self.page.locator('.skill-card[aria-pressed=true]')
            self.assertIn('Selected',selected.evaluate('(el)=>getComputedStyle(el,"::after").content'))
            self.goto('projects/self-corrective-rag/')
            self.capture_component('.case-overview >> nth=0',f'case-study-reading-{label}.png')
            self.assertEqual(self.page.locator('.decision-card').first.evaluate('(el)=>getComputedStyle(el).boxShadow'),'none')

    def test_21_reduced_motion_and_representative_text_contrast(self):
        self.goto('projects/neuroscan-ai/')
        self.open_floating();self.page.locator('#floatingSuggestionToggle').click()
        self.assertEqual(self.page.locator('#mri-panel-axial').evaluate('(el)=>getComputedStyle(el).animationName'),'none')
        self.assertEqual(self.page.locator('.project-card').first.evaluate('(el)=>getComputedStyle(el).transitionDuration'),'0s')
        checks=self.page.evaluate("""() => {
          const parse = value => value.match(/[0-9.]+/g).map(Number);
          const composite = (front,back) => { const alpha=front[3]??1; return [0,1,2].map(i=>front[i]*alpha+back[i]*(1-alpha)); };
          const luminance = rgb => rgb.map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((sum,x,i)=>sum+x*[.2126,.7152,.0722][i],0);
          return ['body','.case-hero p:not(.eyebrow)','.mri-panel figcaption','.mri-tabs button[aria-selected=true]','.sample-scope','.button.primary','.suggestion-toggle','.chat-chips .chip','.msg.bot','.chat-disclaimer'].map(selector=>{
            const el=document.querySelector(selector); let chain=[];for(let node=el;node;node=node.parentElement)chain.unshift(node);
            let bg=[8,13,16];for(const node of chain)bg=composite(parse(getComputedStyle(node).backgroundColor),bg);
            const foreground=parse(getComputedStyle(el).color);const [light,dark]=[luminance(foreground),luminance(bg)].sort((a,b)=>b-a);
            return {selector,ratio:(light+.05)/(dark+.05)};
          });
        }""")
        for check in checks:self.assertGreaterEqual(check['ratio'],4.5,str(check))


    def test_22_fullscreen_chat_desktop_keyboard_and_long_answer(self):
        self.goto()
        self.page.locator('#heroChatExpand').click()
        panel=self.page.locator('#chatWindow')
        expect(panel).to_be_visible()
        self.assertIn('is-fullscreen',panel.get_attribute('class'))
        self.assertEqual(panel.get_attribute('aria-modal'),'true')
        self.assertEqual(self.page.locator('#chatExpand').get_attribute('aria-pressed'),'true')
        self.assertEqual(self.page.locator('body').evaluate('(el)=>getComputedStyle(el).overflow'),'hidden')
        self.page.locator('#chatBody').evaluate("""el => {
          const long=document.createElement('div');
          long.className='msg bot';
          long.textContent='Documented technical explanation. '.repeat(500);
          el.append(long);
        }""")
        transcript=self.page.locator('#chatBody')
        self.assertTrue(transcript.evaluate('(el)=>el.scrollHeight>el.clientHeight'),
                        'Long answers must scroll independently')
        self.assertTrue(self.page.locator('#chatWindow .chat-form').is_visible())
        self.assertEqual(self.posts,[], 'Expanding must not make a chat POST')
        self.page.keyboard.press('Escape')
        self.assertNotIn('is-fullscreen',panel.get_attribute('class'))
        expect(panel).to_be_visible()
        self.assertNotEqual(self.page.locator('body').evaluate('(el)=>getComputedStyle(el).overflow'),'hidden')
        self.page.keyboard.press('Escape')
        expect(panel).to_be_hidden()
        self.assertEqual(self.posts,[])

    def test_23_fullscreen_mobile_header_and_close(self):
        self.page.set_viewport_size({'width':375,'height':640})
        self.goto('projects/neuroscan-ai/')
        self.open_floating()
        self.page.locator('#chatExpand').click()
        panel=self.page.locator('#chatWindow')
        self.assertIn('is-fullscreen',panel.get_attribute('class'))
        geometry=panel.bounding_box()
        self.assertLess(abs(geometry['x']),2)
        self.assertGreaterEqual(geometry['width'],374)
        self.assertGreaterEqual(geometry['height'],500)
        self.assertTrue(self.page.locator('#chatInput').is_visible())
        self.assertTrue(self.page.locator('#chatClose').is_visible())
        self.page.locator('#chatInput').fill('A draft remains intact')
        self.page.locator('#chatClose').click()
        expect(panel).to_be_hidden()
        self.assertFalse(self.page.locator('main').evaluate('(el)=>el.inert'))
        self.assertEqual(self.posts,[])

if __name__=='__main__':unittest.main(verbosity=2)
