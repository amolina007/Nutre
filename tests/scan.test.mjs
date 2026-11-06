import test from 'node:test';import assert from 'node:assert/strict';
import {cleanItems} from '../public/scan-data.js';
import handler from '../netlify/functions/pantry-scan.mjs';
test('uncertain quantities stay empty; invalid enums normalized',()=>{const [i]=cleanItems([{name:' Arroz ',quantity:'2',unit:'pesos',category:'inventada'}]);assert.equal(i.quantity,null);assert.equal(i.unit,'unidades');assert.equal(i.name,'Arroz');assert.throws(()=>cleanItems(Array(61).fill({name:'a'})));assert.throws(()=>cleanItems([{}]));});
test('scan endpoint rejects anonymous and production requests before provider access',async()=>{global.Netlify={env:{get:()=> 'dev'}};assert.equal((await handler(new Request('https://example.test',{method:'POST'}))).status,401);global.Netlify.env.get=()=> 'main';assert.equal((await handler(new Request('https://example.test',{method:'POST'}))).status,404);});
