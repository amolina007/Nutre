import {normalize} from './domain.js';
export const conditions={diabetes1:'Diabetes tipo 1',diabetes2:'Diabetes tipo 2',gestational:'Diabetes gestacional',other:'Otra necesidad de salud'};
export const sources={diabetes:'https://www.cdc.gov/diabetes/healthy-eating/diabetes-meal-planning.html',infant:'https://www.who.int/publications/b/70981',avoid:'https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/foods-and-drinks-to-avoid-or-limit.html',texture:'https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/choking-hazards.html'};
const synonyms={leche:['leche','queso','yogur','mantequilla','crema','caseina','suero'],huevo:['huevo','mayonesa','albumina'],mani:['mani','cacahuete','peanut'],gluten:['trigo','cebada','centeno','harina','pan','pasta','avena'],soya:['soya','soja','tofu'],pescado:['pescado','atun','salmon','merluza'],mariscos:['marisco','camaron','gamba','mejillon','almeja'],sesamo:['sesamo','ajonjoli','tahini']};
export function ageLabel(p){if(p.ageMonths===null)return 'Edad sin registrar';return p.ageMonths<24?`${p.ageMonths} meses registrados`:`${Math.floor(p.ageMonths/12)} años registrados`}
export function assessment(r,p){const items=[];const add=(level,text,source)=>items.push({level,text,source});const names=(r.ingredients||[]).map(i=>normalize(i.name));
 if(p.ageMonths===null)add('review','Falta registrar la edad. No se puede revisar la etapa de alimentación.');
 else if(p.ageMonths<6)add('block','Menor de 6 meses: Nutre no asigna recetas de alimentación complementaria. Consulta con su equipo de salud.',sources.infant);
 else if(p.ageMonths<24){add('review','Alimentación complementaria: revisar textura, tamaño, postura y supervisión según desarrollo. Una porción reducida de la receta familiar no es una adaptación completa.',sources.texture);add('review','Revisar la variedad del menú y las señales de hambre y saciedad. La alimentación complementaria acompaña la alimentación láctea.',sources.infant);
  if(p.ageMonths<12&&names.some(n=>/\bmiel\b|\bhoney\b/.test(n)))add('block','Se detectó miel: no ofrecer antes de los 12 meses. Elige o crea una receta sin miel.',sources.avoid);
  if(names.some(n=>/azucar|jarabe|sal\b|embutido|salchicha/.test(n)))add('review','Revisa azúcares añadidos y sodio antes de adaptar esta preparación.',sources.avoid);
 }
 if(p.conditions.some(c=>['diabetes1','diabetes2','gestational'].includes(c)))add('review','Diabetes: confirmar porción y carbohidratos con la pauta individual. Nutre aún no dispone de composición nutricional validada: carbohidratos no calculados. No calcula insulina ni modifica tratamientos.',sources.diabetes);
 if(p.conditions.includes('other'))add('review','Revisa la indicación de salud registrada antes de elegir esta preparación.');
 if(p.allergies.length){const hits=[];for(const allergy of p.allergies){const a=normalize(allergy);const terms=synonyms[a]||[a];if(names.some(n=>terms.some(t=>n.includes(t))))hits.push(allergy)}
  if(hits.length)add('block',`Posible ingrediente incompatible con alergia o exclusión: ${hits.join(', ')}. Elige otra receta o revisa una adaptación con tu profesional.`);
  add('review','La búsqueda de alérgenos por nombre no es exhaustiva. Revisa etiquetas, ingredientes compuestos y contaminación cruzada.');
 }
 if(p.preferences)add('review',`Preferencias registradas: ${p.preferences}. Revisa que esta preparación las respete.`);
 if(p.notes)add('review',`Pauta o adaptación registrada por ti: ${p.notes}`);
 return {items,blocked:items.some(i=>i.level==='block')};
}
export function groupSummary(r,people,selections){const selected=selections.map(s=>({person:people.find(p=>p.id===s.personId),portions:Number(s.portions)}));
 if(selected.some(s=>!s.person))return {valid:false,count:0,total:0,blocked:true,reason:'Hay un perfil que ya no está disponible. Vuelve a seleccionar los comensales.',checks:[]};
 const checks=selected.map(s=>({...s,...assessment(r,s.person)}));const total=selected.reduce((sum,s)=>sum+s.portions,0);const valid=selected.length>0&&selected.every(s=>Number.isFinite(s.portions)&&s.portions>0&&s.portions<=50)&&total<=50;
 return {valid,count:selected.length,total:Math.round(total*100)/100,blocked:checks.some(c=>c.blocked),checks};
}
// Copy only recipe fields. Private aliases, diagnoses and assignments never travel with a public plan.
export function publicRecipeSnapshot(r){return {title:r.title,ingredients:r.ingredients,steps:r.steps,allergens:r.allergens,servings:r.servings,author:r.author}}
