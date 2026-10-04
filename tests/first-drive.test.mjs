import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCareer,saveCareer,createCareer,chooseStarter,SAVE_KEY} from '../src/career.js';
import {shouldPlayFirstDrive} from '../src/intro.js';
const storage=()=>{const entries=new Map();return {getItem:key=>entries.get(key)??null,setItem:(key,value)=>entries.set(key,value),removeItem:key=>entries.delete(key)};};
test('missing career starts tutorial even with a stale completion flag',()=>{
  const store=storage();store.setItem('driver-sweet-lover:intro-complete:v1','1');
  assert.equal(loadCareer(store).hasSave,false);
  assert.equal(shouldPlayFirstDrive(loadCareer(store)),true);
  saveCareer(store,chooseStarter(createCareer(),'civic'));
  assert.equal(shouldPlayFirstDrive(loadCareer(store)),false);
  store.removeItem(SAVE_KEY);
  assert.equal(shouldPlayFirstDrive(loadCareer(store)),true);
});
test('valid returning career skips tutorial without a completion flag; unfinished choice resumes onboarding',()=>{
  const store=storage();saveCareer(store,chooseStarter(createCareer(),'eclipse'));
  assert.equal(loadCareer(store).hasSave,true);
  assert.equal(shouldPlayFirstDrive(loadCareer(store)),false);
  saveCareer(store,createCareer());
  assert.equal(shouldPlayFirstDrive(loadCareer(store)),true);
});
test('unreadable saves are preserved for recovery and practice modes bypass first drive',()=>{
  const store=storage();store.setItem(SAVE_KEY,'not JSON');
  assert.equal(shouldPlayFirstDrive(loadCareer(store)),false);
  assert.equal(store.getItem(SAVE_KEY),'not JSON');
  assert.equal(shouldPlayFirstDrive(loadCareer(storage()),{sandbox:true}),false);
  assert.equal(shouldPlayFirstDrive(loadCareer(storage()),{profile:true}),false);
});
