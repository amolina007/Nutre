export const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
export function localDate(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
export function daysUntil(date,today=localDate()){return date?Math.round((Date.parse(date+'T12:00:00Z')-Date.parse(today+'T12:00:00Z'))/86400000):null}
export function baseAmount(q,unit){return {q:Number(q)*(unit==='kg'||unit==='l'?1000:1),unit:unit==='kg'?'g':unit==='l'?'ml':unit}}
export function shoppingNeeds(recipes,pantry,today=localDate()){
 const totals=new Map();
 for(const {ingredients,scale=1} of recipes)for(const i of ingredients){const b=baseAmount(i.quantity*scale,i.unit),key=normalize(i.name)+'|'+b.unit;const item=totals.get(key)||{name:i.name,unit:b.unit,quantity:0};item.quantity+=b.q;totals.set(key,item)}
 for(const p of pantry){if(p.expiry&&daysUntil(p.expiry,today)<0)continue;const b=baseAmount(p.quantity,p.unit),key=normalize(p.name)+'|'+b.unit;if(totals.has(key))totals.get(key).quantity-=b.q}
 return [...totals.values()].filter(i=>i.quantity>0.001).map(i=>({...i,quantity:Math.round(i.quantity*100)/100,checked:false}));
}
export function ingredientCoverage(ingredients,pantry){const missing=shoppingNeeds([{ingredients}],pantry);return {total:ingredients.length,missing,available:ingredients.length-missing.length}}
export const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
