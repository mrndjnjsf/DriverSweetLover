import test from 'node:test';
import assert from 'node:assert/strict';
import { developmentToolsAvailable } from '../src/development-mode.js';
import { createIntro,advanceIntro,introAdvice } from '../src/intro.js';

test('Mustang dev access requires a local host and an enabled release flag',()=>{
  for(const hostname of ['localhost','127.0.0.1','[::1]']){
    assert.equal(developmentToolsAvailable({hostname},{enabled:true}),true);
    assert.equal(developmentToolsAvailable({hostname},{enabled:false}),false);
  }
  for(const hostname of ['carpg.example','localhost.example','192.168.1.10',''])
    assert.equal(developmentToolsAvailable({hostname},{enabled:true}),false);
});
test('dev free drive cannot advance into a tutorial crash, including after resets',()=>{
  let session=createIntro({testDrive:true});
  for(let i=0;i<5000;i++)assert.equal(advanceIntro(session,{speed:60,brake:i%2},.1),null);
  assert.equal(session.phase,'test-drive');assert.equal(introAdvice(session),null);
  session=createIntro({testDrive:session.phase==='test-drive'});
  assert.equal(session.phase,'test-drive');
  assert.equal(advanceIntro(session,{speed:100,brake:1},.1),null);
  const normal=createIntro();for(let i=0;i<10;i++)advanceIntro(normal,{speed:100,brake:0},.1);
  assert.equal(normal.phase,'brake');
});
