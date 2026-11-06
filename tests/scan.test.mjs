import test from 'node:test';import assert from 'node:assert/strict';
import {cleanItems} from '../public/scan-data.js';
import handler from '../netlify/functions/pantry-scan.mjs';
test('uncertain quantities stay empty; invalid enums normalized',()=>{const [i]=cleanItems([{name:' Arroz ',quantity:'2',unit:'pesos',category:'inventada'}]);assert.equal(i.quantity,null);assert.equal(i.unit,'unidades');assert.equal(i.name,'Arroz');assert.throws(()=>cleanItems(Array(61).fill({name:'a'})));assert.throws(()=>cleanItems([{}]));});
test('scan endpoint rejects anonymous and other sites before provider access',async()=>{const request=()=>new Request('https://example.test',{method:'POST'});assert.equal((await handler(request(),{site:{id:'33e7f247-7635-4516-9147-fd42986d41ce'}})).status,401);assert.equal((await handler(request(),{site:{id:'production'}})).status,404);});
