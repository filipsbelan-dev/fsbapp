import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyData,validateData,migrateShopping,shoppingLines,financeSummary,installmentInfo} from '../core.js';
test('Old shopping records migrate into named lists without loss and migration is idempotent',()=>{
 const d=emptyData();delete d.shoppingLists;d.shopping=[{id:'a',title:'Chlieb',category:'Lidl',quantity:'2',done:true},{id:'b',title:'Mlieko',category:'Lidl'},{id:'c',title:'Voda'}];
 const migrated=validateData(d);assert.equal(migrated.shoppingLists.length,2);assert.equal(migrated.shopping[0].listId,migrated.shopping[1].listId);assert.notEqual(migrated.shopping[0].listId,migrated.shopping[2].listId);assert.equal(migrated.shopping[0].quantity,'2');assert.equal(migrated.shopping[0].done,true);
 const snapshot=structuredClone(migrated);assert.deepEqual(migrateShopping(migrated),snapshot);
});
test('Bulk shopping preserves each line and ignores blank entries',()=>{assert.deepEqual(shoppingLines(' Chlieb\r\n\r\nMlieko 2 ks\n Jablká '),['Chlieb','Mlieko 2 ks','Jablká']);});
test('Undoing a payment restores both month reserve and installment debt',()=>{
 const d=emptyData();d.income=[{amount:1000,date:'2026-10-01'}];d.recurring=[{id:'phone',kind:'Splátka',amount:50,balance:200,start:'2026-10'}];d.payments=[{id:'paid',recurringId:'phone',amount:50,month:'2026-10',date:'2026-10-01'}];
 assert.equal(financeSummary(d,'2026-10').spent,50);assert.equal(installmentInfo(d.recurring[0],d.payments).remaining,150);
 d.payments=d.payments.filter(p=>p.id!=='paid');assert.equal(financeSummary(d,'2026-10').spent,0);assert.equal(financeSummary(d,'2026-10').due,50);assert.equal(financeSummary(d,'2026-10').afterBills,950);assert.equal(installmentInfo(d.recurring[0],d.payments).remaining,200);
});
