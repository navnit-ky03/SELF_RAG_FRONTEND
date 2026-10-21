import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('each chat disclosure starts collapsed and controls its own labelled region',async()=>{
  for(const path of ['index.html','projects/neuroscan-ai/index.html','skills/index.html','404.html']){
    const html=await readFile(new URL(`../${path}`,import.meta.url),'utf8');
    const kinds=path==='index.html'?['hero','floating']:['floating'];
    for(const kind of kinds){
      const id=`${kind}SuggestionPanel`,label=`${kind}SuggestionToggle`;
      assert.ok(html.includes(`id="${label}" data-suggestion-toggle aria-expanded="false" aria-controls="${id}"`),`${path} toggle`);
      assert.ok(html.includes(`id="${id}" data-suggestion-panel role="region" aria-labelledby="${label}" hidden`),`${path} panel`);
      assert.equal(html.split(`id="${id}"`).length-1,1);
    }
  }
});
