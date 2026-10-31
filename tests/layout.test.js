import {test} from 'node:test';
import assert from 'node:assert/strict';
import {homeSections,changeHomeLayout,createEnvelope,open,emptyData} from '../core.js';
const ids=['notes','cards','expenses','settings'];
test('Home preferences deduplicate, preserve saved order and include new sections',()=>{
 assert.deepEqual(homeSections({order:['cards','cards','removed'],hidden:['cards','settings','missing']},ids),{order:['cards','notes','expenses','settings'],hidden:['cards']});
 assert.deepEqual(homeSections(undefined,ids),{order:ids,hidden:[]});
});
test('Reorder boundaries and hidden settings cannot make navigation inaccessible',()=>{
 let layout=changeHomeLayout(null,ids,'cards','up');assert.deepEqual(layout.order,['cards','notes','expenses','settings']);
 layout=changeHomeLayout(layout,ids,'cards','up');assert.equal(layout.order[0],'cards');
 layout=changeHomeLayout(layout,ids,'cards','toggle');assert.deepEqual(layout.hidden,['cards']);
 layout=changeHomeLayout(layout,ids,'settings','toggle');assert.deepEqual(layout.hidden,['cards']);
 layout=changeHomeLayout(layout,ids,'cards','toggle');assert.deepEqual(layout.hidden,[]);
});
test('Layout is preserved in encrypted saves and exports without changing records',async()=>{
 const data=emptyData();data.notes=[{id:'n',title:'Keep me'}];data.homeLayout=changeHomeLayout(null,ids,'cards','toggle');
 const {key,envelope}=await createEnvelope(data,'123456');const restored=await open(envelope,key);assert.deepEqual(restored.homeLayout,data.homeLayout);assert.deepEqual(restored.notes,data.notes);
});
