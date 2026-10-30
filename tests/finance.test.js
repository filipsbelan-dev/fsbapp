import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyData,financeSummary,installmentInfo,recurringDue} from '../core.js';
const loan={id:'phone',kind:'Splátka',amount:'40',balance:'95',start:'2026-10',title:'Telefón'};
const pay=(month,amount)=>({recurringId:'phone',amount,month,date:month+'-15'});
test('Installments use recorded payments and cap the final payment',()=>{
 const p=[];assert.equal(recurringDue(loan,p,'2026-09'),0);assert.equal(recurringDue(loan,p,'2026-10'),40);
 p.push(pay('2026-10',40));assert.equal(installmentInfo(loan,p,'2026-10').remaining,55);assert.equal(installmentInfo(loan,p,'2026-10').count,2);
 p.push(pay('2026-11',40));assert.equal(recurringDue(loan,p,'2026-12'),15);
 p.push(pay('2026-12',15));assert.equal(installmentInfo(loan,p).remaining,0);assert.equal(installmentInfo(loan,p).count,0);assert.equal(recurringDue(loan,p,'2027-01'),0);
 assert.equal(installmentInfo(loan,p,'2026-10').remaining,55);
});
test('Skipped payment does not silently repay debt; deleting an entry restores balance',()=>{
 const p=[pay('2026-10',40)];assert.equal(installmentInfo(loan,p,'2027-01').remaining,55);assert.equal(recurringDue(loan,p,'2027-01'),40);
 p.pop();assert.equal(installmentInfo(loan,p).remaining,95);
});
test('Existing regular records keep their original behavior and explicit end date',()=>{
 const r={id:'rent',amount:'600',balance:'4000',start:'2026-10',end:'2026-12'};
 assert.equal(recurringDue(r,[],'2026-10'),600);assert.equal(recurringDue(r,[],'2027-01'),0);
});
test('Monthly budget counts bill once and distinguishes cash left from reserved money',()=>{
 const d=emptyData();d.recurring=[loan];d.income=[{amount:1000,date:'2026-10-01'}];d.expenses=[{amount:100,date:'2026-10-02'}];d.service=[{amount:50,date:'2026-10-03'}];
 assert.deepEqual(financeSummary(d,'2026-10'),{income:1000,spent:150,due:40,available:850,afterBills:810});
 d.payments.push(pay('2026-10',40));assert.deepEqual(financeSummary(d,'2026-10'),{income:1000,spent:190,due:0,available:810,afterBills:810});
 assert.deepEqual(financeSummary(d,'2026-11'),{income:0,spent:0,due:40,available:0,afterBills:-40});
});
test('Currency math is exact in cents and final partial installment has one payment left',()=>{
 const r={...loan,balance:0.3,amount:0.1};const p=[pay('2026-10',0.1),pay('2026-11',0.1)];
 assert.equal(installmentInfo(r,p).remaining,0.1);assert.equal(installmentInfo(r,p).count,1);assert.equal(recurringDue(r,p,'2026-12'),0.1);
});
