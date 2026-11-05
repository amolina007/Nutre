import test from 'node:test';import assert from 'node:assert/strict';
import {shoppingNeeds,daysUntil,normalize,escapeHtml} from '../public/domain.js';
const rice={name:'Arroz',quantity:750,unit:'g'};
test('aggregates repeated meals and subtracts stock once, converts kilograms',()=>{assert.deepEqual(shoppingNeeds([{ingredients:[rice]},{ingredients:[rice]}],[{name:'arroz',quantity:1,unit:'kg'}]),[{name:'Arroz',quantity:500,unit:'g',checked:false}])});
test('does not count expired stock and scales portions',()=>{assert.equal(shoppingNeeds([{ingredients:[rice],scale:2}],[{name:'Arroz',quantity:2,unit:'kg',expiry:'2026-11-04'}],'2026-11-05')[0].quantity,1500)});
test('different units are not silently equated',()=>{assert.equal(shoppingNeeds([{ingredients:[rice]}],[{name:'Arroz',quantity:1,unit:'unidades'}])[0].quantity,750)});
test('normalizes accents and handles expiration across dates',()=>{assert.equal(normalize(' Limón '),'limon');assert.equal(daysUntil('2026-11-06','2026-11-05'),1);assert.equal(daysUntil(null),null)});
test('user text cannot create HTML elements',()=>{assert.equal(escapeHtml('<img onerror="x">'), '&lt;img onerror=&quot;x&quot;&gt;')});
