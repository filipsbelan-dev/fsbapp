import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fuelStats,validateFuelRecord,emptyData,validateData,financeSummary} from '../core.js';
const row=(id,date,km,litres,amount,full,extra={})=>({id,carId:'a',date,km,litres,amount,full,...extra});
test('Full-to-full consumption includes partial fills but excludes the initial tank',()=>{
 const rows=[row('1','2026-10-01',10000,45,70,true),row('2','2026-10-05',10200,10,15,false),row('3','2026-10-10',10500,25,40,true),row('4','2026-10-12',10600,10,15,false)];
 const stats=fuelStats(rows,'a');assert.ok(Math.abs(stats.consumption-7)<1e-10);assert.equal(stats.distance,500);assert.equal(stats.costPer100,11);assert.equal(stats.totalCost,140);assert.equal(stats.intervals.length,1);assert.equal(fuelStats(rows,'b').consumption,null);
});
test('Missing fill resets baseline and never fabricates consumption',()=>{
 const rows=[row('1','2026-10-01',100,20,30,true),row('2','2026-10-03',300,20,30,true,{missed:true}),row('3','2026-10-06',600,18,27,true)];
 assert.equal(fuelStats(rows,'a').consumption,6);assert.equal(fuelStats(rows.slice(0,2),'a').consumption,null);
});
test('Average consumption is distance weighted across intervals',()=>{
 const rows=[row('1','2026-10-01',0,30,45,true),row('2','2026-10-03',100,10,15,true),row('3','2026-10-10',1000,45,67.5,true)];
 assert.equal(fuelStats(rows,'a').consumption,5.5);
});
test('Invalid fuel input and decreasing mileage are rejected; edits exclude themselves',()=>{
 const first=row('1','2026-10-01',1000,30,45,true),second=row('2','2026-10-02',1200,20,30,true),cars=[{id:'a'}];
 assert.throws(()=>validateFuelRecord({...second,km:900},[first],cars));assert.throws(()=>validateFuelRecord({...second,litres:0},[first],cars));assert.throws(()=>validateFuelRecord({...second,amount:-5},[],cars));assert.throws(()=>validateFuelRecord({...second,carId:'other'},[],cars));assert.equal(validateFuelRecord(second,[first,second],cars),second);
});
test('Fuel integrates once in monthly spending and old backups migrate without loss',()=>{
 const d=emptyData();delete d.fuel;d.notes=[{title:'Keep'}];validateData(d);assert.deepEqual(d.fuel,[]);d.fuel.push(row('1','2026-10-01',1000,30,45,true));d.income.push({date:'2026-10-01',amount:100});assert.equal(financeSummary(d,'2026-10').available,55);d.fuel[0].amount=50;assert.equal(financeSummary(d,'2026-10').available,50);d.fuel=[];assert.equal(financeSummary(d,'2026-10').available,100);assert.equal(d.notes[0].title,'Keep');
});
