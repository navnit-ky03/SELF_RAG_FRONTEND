import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {suggestionsFor} from '../scripts/refinements.mjs';
const root = new URL('../',import.meta.url);
const json = async file => JSON.parse(await readFile(new URL(file,root),'utf8'));
const [prompts,projects,mri,site] = await Promise.all(['data/chat-prompts.json','data/projects.json','data/neuroscan.json','data/site.json'].map(json));

test('recruiter prompts are bounded, unique, and page-specific',()=>{
  assert.equal(prompts.home.length,10);
  for(const [context,items] of Object.entries(prompts)){
    assert.ok(['home','projects','skills','about','contact',...projects.map(p=>p.id)].includes(context));
    assert.equal(new Set(items.map(item=>item.question)).size,items.length);
    for(const item of items){assert.ok(item.label.length<=32);assert.ok(item.question.length<2000&&item.question.endsWith('?'));}
  }
  const neuro=suggestionsFor('projects/neuroscan-ai/index.html','projects',projects,prompts);
  assert.equal(neuro,prompts['neuroscan-ai']);
  assert.ok(neuro.some(item=>item.question.includes('3D MRI')));
  assert.ok(prompts.home.some(item=>item.question.includes('freelance')));
  const other=suggestionsFor('projects/voice-booking/index.html','projects',projects,prompts);
  assert.ok(other.every(item=>item.question.includes('Agentic Voice Booking Assistant')));
});

test('authentic MRI files exactly match the supplied asset bytes and retain attribution',async()=>{
  assert.equal(mri.scan,'BraTS20_Validation_001_flair.nii');
  assert.deepEqual(mri.views.map(v=>[v.id,v.slice]),[['axial',92],['coronal',128],['sagittal',108]]);
  const expected=['431b508345b349b452f053afe6436cbfefc77d83b6dd9964319ca68cab67565e','3ae363c6f30aae7e2b037b3191f4047fd0bc7c153a8384bb88c7b176e3fb6b58','f1442ecf4ffe6c9480c4fe856657409ea6ade743c15b92d15fa1a078dbf65cc3'];
  for(const [index,view] of mri.views.entries()){
    const bytes=await readFile(new URL(view.path,root));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),expected[index]);
    assert.equal(view.sha256,expected[index]);assert.ok(view.alt.includes('model-predicted'));
    assert.equal(bytes.subarray(8,12).toString(),'WEBP');
  }
  const notes=await readFile(new URL(mri.notes,root),'utf8');
  assert.equal(createHash('sha256').update(notes).digest('hex'),'3855fa1b89b1b0a4c39be468f4c0d40abd714df7d1a4e41f5679e2677cbfffec');
  assert.ok(notes.includes('240×240'));assert.ok(notes.includes('not ground truth'));
  assert.equal(mri.sampleOutput.estimatedVolumeCm3,'122.51');
});

test('availability is owner-confirmed, case-specific for ML/DS, and separated from AI evidence',async()=>{
  assert.ok(site.professional.automationStatus.includes('Open to automation'));
  assert.ok(site.professional.contractPolicy.includes('considered individually after an email discussion'));
  for(const page of ['about/index.html','contact/index.html']){
    const html=await readFile(new URL(page,root),'utf8');
    assert.ok(html.includes(site.professional.automationStatus));assert.ok(html.includes(site.professional.contractPolicy));
    assert.ok(html.includes('AI sources may not include recent availability'));
    assert.ok(html.includes('Discuss an automation project'));
  }
  const html=await readFile(new URL('index.html',root),'utf8');
  const initial=html.match(/id="heroSuggestions"[^>]*>(.*?)<\/div>/s)[1];
  assert.equal([...initial.matchAll(/data-question=/g)].length,4);
  assert.ok(html.includes('data-more-questions'));
});
