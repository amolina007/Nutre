export const categories=['Frutas y verduras','Cereales y legumbres','Lácteos y huevos','Carnes y pescados','Aceites y condimentos','Otros alimentos'];
export const scanUnits=['unidades','g','kg','ml','l'];
export function cleanItems(value){
 if(!Array.isArray(value)||value.length>60)throw Error('Respuesta inválida. Prueba una foto con menos productos.');
 return value.map(i=>{if(!i||typeof i.name!=='string'||!i.name.trim())throw Error('Producto ilegible.');return {name:i.name.trim().slice(0,100),quantity:typeof i.quantity==='number'&&Number.isFinite(i.quantity)&&i.quantity>=0.01&&i.quantity<=100000?i.quantity:null,unit:scanUnits.includes(i.unit)?i.unit:'unidades',category:categories.includes(i.category)?i.category:'Otros alimentos',note:typeof i.note==='string'?i.note.slice(0,300):''}});
}
