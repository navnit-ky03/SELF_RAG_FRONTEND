import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, access, mkdir, mkdtemp, cp, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const root = path.resolve(import.meta.dirname,'..');
const json = async file => JSON.parse(await readFile(path.join(root,file),'utf8'));
const projects = await json('data/projects.json');
const skills = await json('data/skills.json');
const htmlFiles = async dir => (await Promise.all((await readdir(dir,{withFileTypes:true})).filter(e=>!['.git','work','tests'].includes(e.name)).map(async e=>e.isDirectory()?htmlFiles(path.join(dir,e.name)):e.name.endsWith('.html')?[path.join(dir,e.name)]:[]))).flat();

test('registry has unique stable IDs, complete cases, valid technologies and safe source URLs', () => {
  assert.equal(new Set(projects.map(p=>p.id)).size,projects.length);
  for(const p of projects){
    assert.match(p.id,/^[a-z0-9-]+$/);
    for(const key of ['title','description','problem','solution','github','readme','source','sourceStatus']) assert.ok(p[key],`${p.id}: missing ${key}`);
    for(const key of ['features','skills','architecture','challenges','limitations','questions']) assert.ok(p[key].length,`${p.id}: empty ${key}`);
    p.skills.forEach(id=>assert.ok(skills.some(s=>s.id===id),`Unknown skill ${id}`));
    assert.equal(new URL(p.github).protocol,'https:');assert.equal(new URL(p.readme).hostname,'raw.githubusercontent.com');
    p.metrics.forEach(m=>{assert.ok(m.label&&m.value&&m.note);});
    if(p.demo){assert.equal(new URL(p.demo.url).protocol,'https:');assert.ok(['unverified','verified','persistent-failure'].includes(p.demo.status));if(p.demo.status==='verified')assert.ok(p.demo.verifiedAt&&p.demo.evidence);}
  }
});

test('all original documented deployments are retained without implying current availability',async()=>{
  const expected=['https://braintumorsegmentationmri.streamlit.app/','https://credit-card-scam-engine.streamlit.app/','https://customer-lifetime-value-ky03.streamlit.app/','https://delivery-analytics-engine.streamlit.app/','https://rag-assistant-model.streamlit.app/'];
  assert.deepEqual(projects.filter(p=>p.demo).map(p=>p.demo.url).sort(),expected.sort());
  for(const p of projects.filter(p=>p.demo)){
    const html=await readFile(path.join(root,'projects',p.id,'index.html'),'utf8');
    assert.ok(html.includes(`href="${p.demo.url}" target="_blank" rel="noopener noreferrer">Live Demo`));
    assert.ok(html.includes('Free-tier hosting may need additional startup time'));
  }
});

test('numeric results retain provenance and explicitly distinguish owner attestation',()=>{
  assert.ok(projects.find(p=>p.id==='neuroscan-ai').metrics.some(m=>m.value==='0.8842'&&m.note.includes('owner/developer')));
  const clv=projects.find(p=>p.id==='customer-value');
  assert.equal(clv.metrics[0].value,'0.9790');assert.equal(clv.metrics[1].value,'0.9462');assert.equal(clv.metrics[2].value,'$447.32 / $912.80');
  assert.equal(projects.find(p=>p.id==='delivery-analytics').metrics.length,0);
  assert.ok(projects.find(p=>p.id==='lecture-rag').limitations.some(s=>s.includes('embedding mismatch')));
});

test('all generated internal links and fragments resolve, including nested static routes',async()=>{
  const files=await htmlFiles(root);
  for(const file of files){
    const html=await readFile(file,'utf8');
    const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
    assert.equal(new Set(ids).size,ids.length,`Duplicate id: ${file}`);
    for(const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){
      const href=match[1].replaceAll('&amp;','&');
      if(/^(https?:|mailto:|data:)/.test(href)||href==='/')continue;
      const [clean,fragment]=href.split('#');
      const filename=clean.split('?')[0];
      const target=filename?path.resolve(path.dirname(file),filename):file;
      const targetFile=target.endsWith('/')||(!path.extname(target)&&filename)?path.join(target,'index.html'):target;
      await assert.doesNotReject(access(targetFile),`${file}: ${href}`);
      if(fragment){const body=await readFile(targetFile,'utf8');assert.ok(body.includes(`id="${fragment}"`),`${file}: missing #${fragment}`);}
    }
    for(const link of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g))assert.ok(link[0].includes('rel="noopener noreferrer"'));
    assert.ok(html.includes('<meta name="description"'));assert.ok(html.includes('<h1>')||html.includes('<h1 '));
  }
});

test('adding an eighth registry entry generates its route and updates counts without template edits',async()=>{
  await mkdir(path.join(root,'work'),{recursive:true});
  const tmp=await mkdtemp(path.join(root,'work','registry-test-'));
  try{
    await cp(path.join(root,'scripts'),path.join(tmp,'scripts'),{recursive:true});await cp(path.join(root,'data'),path.join(tmp,'data'),{recursive:true});
    const next=structuredClone(projects);next.push({...next[0],id:'eighth-project',title:'Eighth project',featured:false});
    await writeFile(path.join(tmp,'data/projects.json'),JSON.stringify(next));
    execFileSync(process.execPath,[path.join(tmp,'scripts/build.mjs')]);
    const home=await readFile(path.join(tmp,'index.html'),'utf8');assert.ok(home.includes('data-count="8"'));
    const gallery=await readFile(path.join(tmp,'projects/index.html'),'utf8');assert.ok(gallery.includes('8 published case studies'));assert.ok(gallery.includes('projects/eighth-project/'));
    await access(path.join(tmp,'projects/eighth-project/index.html'));
  }finally{await rm(tmp,{recursive:true,force:true});}
});
