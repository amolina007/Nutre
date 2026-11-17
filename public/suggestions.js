import {normalize} from './domain.js';
import {assessment} from './diners.js';
// Transparent ingredient heuristics, never a nutrient calculation or clinical clearance.
export function suggestions(recipes,people,{criteria=[],exclude=[]}={}){
 if(!people.length)return [];
 const sodium=criteria.includes('sodium')||people.some(p=>p.conditions.includes('hypertension'));
 const fat=criteria.includes('fat')||people.some(p=>p.conditions.includes('dyslipidemia'));
 return recipes.flatMap(recipe=>{
  const extra=exclude.length?[{...people[0],allergies:exclude}]:[];
  if([...people,...extra].some(p=>assessment(recipe,p).blocked))return [];
  const names=recipe.ingredients.map(i=>normalize(i.name)).join(' '),reasons=[];let score=0;
  if(sodium){if(/\bsal\b|salsa de so[ jy]a|salsa de soja|caldo|cubito|embutido|salchicha|jamon|tocino|aceituna|queso/.test(names)){score-=4;reasons.push('Revisar fuentes posibles de sodio en ingredientes y etiquetas')}else{score+=2;reasons.push('Sin fuentes saladas evidentes en los nombres; sodio sin calcular')}}
  if(fat){if(/mantequilla|crema|nata|tocino|chorizo|coco|palma|leche entera|queso/.test(names)){score-=4;reasons.push('Revisar posibles fuentes de grasas saturadas')}
   if(/lenteja|garbanzo|poroto|frijol|avena|integral/.test(names)){score+=3;reasons.push('Incluye legumbres, avena o cereales integrales')}
   if(/aceite de oliva|palta|aguacate/.test(names)){score++;reasons.push('Incluye aceite de oliva o palta')}
   if(/leche/.test(names)&&!/descremada|desnatada/.test(names))reasons.push('Revisar el tipo de leche según la pauta');
  }
  if(people.some(p=>p.ageMonths<24))reasons.push('Requiere adaptar textura y preparación para alimentación complementaria');
  if(people.some(p=>p.conditions.some(c=>['diabetes1','diabetes2','gestational'].includes(c))))reasons.push('Carbohidratos y porciones pendientes de revisión');
  if(exclude.length)reasons.push('Sin coincidencias detectadas con las exclusiones indicadas; verificar etiquetas');
  if(!reasons.length)reasons.push('Idea del recetario; revisa las necesidades individuales');
  return [{recipe,score,reasons}];
 }).sort((a,b)=>b.score-a.score||a.recipe.title.localeCompare(b.recipe.title));
}
