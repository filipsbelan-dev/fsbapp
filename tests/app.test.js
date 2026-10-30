import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import * as core from '../core.js';
function harness(){
 const elements=new Map(),handlers={},queuedClose=[];const element=()=>({innerHTML:'',value:'',style:{},classList:{add(){},remove(){},toggle(){}},listeners:{},open:false,addEventListener(name,fn){this.listeners[name]=fn;},close(){if(this.open){this.open=false;queuedClose.push(()=>this.listeners.close?.());}},showModal(){this.open=true;},querySelector(){return element();}});
 const context=vm.createContext({...core,console,crypto,TextEncoder,TextDecoder,URL,Blob,structuredClone,Date,Intl,setInterval(){},setTimeout(){},clearTimeout(){},document:{querySelector(s){if(!elements.has(s))elements.set(s,element());return elements.get(s);},addEventListener(name,fn){handlers[name]=fn;},body:element()},window:{addEventListener(){}},navigator:{}});
 const source=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/start\(\);\s*$/,'');
 vm.runInContext(source,context);vm.runInContext('data=emptyData();',context);return {run:s=>vm.runInContext(s,context),elements,flushClose:()=>{while(queuedClose.length)queuedClose.shift()();},click:async dataset=>{const el={dataset,disabled:false};return handlers.click({target:{closest:()=>el}});}};
}
test('Finance includes paid bills and car service exactly once, reserves unpaid bills',()=>{const {run}=harness();run(`financeMonth='2026-10';data.income=[{id:'i',title:'Výplata',amount:'1000',date:'2026-10-01'}];data.expenses=[{id:'e',title:'Jedlo',amount:'100',date:'2026-10-02'}];data.service=[{id:'s',title:'Olej',amount:'50',date:'2026-10-03'}];data.recurring=[{id:'r',title:'Úver',amount:'200',day:'15',start:'2026-10',category:'Úver'}];`);assert.equal(run("monthTotal('2026-10')"),150);assert.ok(run('finance()').includes(core.money(650)));run("data.payments.push({id:'p',recurringId:'r',title:'Úver',amount:'200',month:'2026-10',date:'2026-10-15'});");assert.equal(run("monthTotal('2026-10')"),350);assert.ok(run('finance()').includes(core.money(650)));assert.ok(run('finance()').includes('✓ Uhradené'));assert.equal(run("monthTotal('2026-11')"),0);});
test('All sections render; vault screens do not expose private records until unlocked',()=>{const {run,elements}=harness();for(const p of ['home','calendar','notes','expenses','cards','tasks','shopping','cars','identities','files','passwords','settings','more']){run(`page='${p}';render();`);assert.ok(elements.get('#app').innerHTML.length>300,p);}run("data.vault={};page='passwords';render();");assert.ok(elements.get('#app').innerHTML.includes('Trezor je zamknutý'));run("vaultData={passwords:[{id:'1',title:'Bank',password:'never-in-list'}],identities:[],files:[]};render();");assert.ok(!elements.get('#app').innerHTML.includes('never-in-list'));});
test('User text is escaped in records, and calendar preserves labels safely',()=>{const {run}=harness();const html=run(`record('notes',{id:'1',title:'<img src=x onerror=alert(1)>',text:'<script>bad()</script>'})`);assert.ok(!html.includes('<img'));assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<script>'));run("data.events=[{id:'1',title:'<script>',date:today(),category:'Osobné',color:'red;bad'}];");const cal=run('calendar()');assert.ok(!cal.includes('<script>'));assert.ok(!cal.includes('red;bad'));});



test('Undo payment action changes stored records rather than just the label',async()=>{
 const {run,click}=harness();run("data.recurring=[{id:'r',amount:'50',start:'2026-10'}];data.payments=[{id:'p',recurringId:'r',amount:'50',month:'2026-10',date:'2026-10-01'}];persist=async next=>structuredClone(next);page='expenses';");
 await click({action:'unpay',id:'p'});assert.equal(run('data.payments.length'),0);
});
test('Password copy uses the clipboard and does not reveal the password field',async()=>{
 const {run,click,elements}=harness();run("navigator.clipboard={writeText:async value=>{globalThis.copied=value;}};");run("$('#revealedPassword').value='test-secret';$('#revealedPassword').type='password';");
 await click({action:'copyPassword'});assert.equal(run('globalThis.copied'),'test-secret');assert.equal(elements.get('#revealedPassword').type,'password');
});
test('Cards render as logo tiles; private files are grouped; list rows have full-size open buttons',()=>{
 const {run}=harness();run("data.cards=[{id:'c',title:'Obchod',logo:{type:'image/png',data:'data:image/png;base64,AAAA'}}];");const cards=run("visualPage('cards')");assert.ok(cards.includes('loyalty-grid'));assert.ok(cards.includes('loyalty-logo'));
 run("vaultData={identities:[{id:'i',title:'Pas',number:'123456789'}],files:[{id:'f',title:'Zmluva',category:'Byt'}],passwords:[]};");assert.ok(run("visualPage('identities')").includes('•••• 6789'));assert.ok(!run("visualPage('identities')").includes('123456789'));assert.ok(run("visualPage('files')").includes('📂 Byt'));
 assert.ok(run("record('notes',{id:'n',title:'Poznámka'})").includes('class="record-open"'));
});


test('Delayed close event cannot erase a reopened shopping dialog',()=>{
 const {run,elements,flushClose}=harness();run("data.shoppingLists=[{id:'l',title:'Nákup'}];data.shopping=[{id:'i',listId:'l',title:'Mlieko'}];shoppingView('l');closeModal();shoppingView('l');");
 flushClose();assert.equal(elements.get('#modal').open,true);assert.ok(elements.get('#modal').innerHTML.includes('Mlieko'));
});
test('Checking, unchecking and deleting a shopping item keeps its parent list visible',async()=>{
 const {run,elements,click,flushClose}=harness();run("data.shoppingLists=[{id:'l',title:'Nákup'}];data.shopping=[{id:'i',listId:'l',title:'Mlieko',done:false},{id:'j',listId:'l',title:'Chlieb',done:false}];page='shopping';persist=async next=>structuredClone(next);shoppingView('l');");
 await click({action:'toggle',type:'shopping',id:'i'});flushClose();assert.equal(run('data.shopping[0].done'),true);assert.ok(elements.get('#modal').innerHTML.includes('1 z 2 hotových'));
 await click({action:'toggle',type:'shopping',id:'i'});flushClose();assert.equal(run('data.shopping[0].done'),false);assert.ok(elements.get('#modal').innerHTML.includes('0 z 2 hotových'));
 await click({action:'confirmDelete',type:'shopping',id:'i'});flushClose();assert.equal(run('data.shopping.length'),1);assert.ok(elements.get('#modal').innerHTML.includes('Chlieb'));
});
test('Closing a dialog normally still clears its contents',()=>{const {run,elements,flushClose}=harness();run("show('private');closeModal();");flushClose();assert.equal(elements.get('#modal').innerHTML,'');});
