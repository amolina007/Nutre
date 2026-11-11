import {escapeHtml as esc} from './domain.js';
export const valoraURL='https://dev.valora.convergenciaaura.cl';
// The existing Valora RPC only returns finalized summaries shared with the record owner.
// Keep these texts in memory, never in a Nutre document or public recipe snapshot.
export async function listValoraRecords(db,owner){
 const {data,error}=await db.from('valora_pacientes').select('id,alias,es_propia').eq('owner_id',owner).eq('archivado',false).eq('demo',false).order('alias').limit(200);
 if(error)throw Error('No pudimos consultar tus fichas de Valora. Reintenta más tarde.');
 return data||[];
}
async function verifyOwner(db,owner,patientId){
 const {data:patient,error}=await db.from('valora_pacientes').select('id').eq('id',patientId).eq('owner_id',owner).eq('archivado',false).eq('demo',false).maybeSingle();
 if(error)throw Error('No pudimos verificar tu acceso a Valora.');
 if(!patient)throw Error('La ficha ya no está disponible para esta cuenta. Revisa el vínculo en Valora.');
}
export async function listValoraSummaries(db,owner,patientId){
 await verifyOwner(db,owner,patientId);
 const {data,error}=await db.rpc('valora_mis_resumenes',{p_paciente:patientId}).select('id,tipo,finalizada_at,profesional,demo').eq('demo',false).order('finalizada_at',{ascending:false}).limit(50);
 if(error)throw Error('No pudimos consultar los resúmenes compartidos de Valora.');
 return data||[];
}
export async function readValoraNutrition(db,owner,patientId,summaryId){
 if(!summaryId)throw Error('Selecciona en Valora el resumen que contiene la pauta alimentaria.');
 await verifyOwner(db,owner,patientId);
 const {data,error}=await db.rpc('valora_mis_resumenes',{p_paciente:patientId}).select('id,tipo,finalizada_at,profesional,resumen_paciente,proximo_control,demo').eq('id',summaryId).eq('demo',false).limit(1);
 if(error)throw Error('No pudimos consultar el resumen seleccionado en Valora.');
 const rows=(data||[]).filter(r=>r.id===summaryId&&!r.demo&&typeof r.resumen_paciente==='string'&&r.resumen_paciente.trim());
 if(!rows.length)throw Error('El resumen seleccionado ya no está compartido, no tiene contenido o no está disponible.');
 return rows;
}
export const attentionLabel=type=>({nutricion_infantil:'Atención nutricional infantil',empa:'Evaluación preventiva',valoracion_enfermeria:'Valoración de enfermería',seguimiento:'Seguimiento'}[type]||'Atención de Valora');
export function nutritionHTML(state){
 if(!state)return '';
 if(state.error)return `<p class="error" role="alert">${esc(state.error)} No se puede comprobar la pauta vinculada.</p>`;
 const latest=state.rows?.[0];
 return `<section class="notice"><strong>Indicaciones desde Valora</strong>${latest?`<p class="small">${esc(attentionLabel(latest.tipo))} · ${esc(String(latest.finalizada_at).slice(0,10))} · ${esc(latest.profesional||'Profesional de Valora')}</p><p style="white-space:pre-wrap;overflow-wrap:anywhere">${esc(latest.resumen_paciente)}</p><p class="small">Resumen elegido por ti como referencia alimentaria; confirma con tu profesional si sigue vigente.</p>`:'<p>No hay un resumen compartido disponible. Esto no significa que la persona no tenga necesidades alimentarias.</p>'}<p class="small">Esta conexión muestra la pauta escrita que elegiste. No equivale a disponer de requerimientos nutricionales estructurados. Nutre no calcula calorías, nutrientes ni cumplimiento de una pauta a partir de este texto.</p><a href="${valoraURL}" target="_blank" rel="noopener">Revisar en Valora ↗</a></section>`;
}
