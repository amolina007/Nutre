// Compatible con las cookies de sesión compartidas de Convergencia Aura.
export function createAuthCookieStorage(environment){
 const cookies=()=>new Map(environment.read().split(/;\s*/).filter(Boolean).map(entry=>{const i=entry.indexOf('=');return [entry.slice(0,i),entry.slice(i+1)]}));
 const domain=()=>environment.hostname()==='convergenciaaura.cl'||environment.hostname().endsWith('.convergenciaaura.cl')?'; domain=.convergenciaaura.cl':'';
 const write=(name,value,age,scope=domain())=>environment.write(`${name}=${value}${scope}; path=/; max-age=${age}; SameSite=Lax; Secure`);
 const names=key=>[...cookies().keys()].filter(n=>n===key||n===key+'.chunks'||(n.startsWith(key+'.')&&/^\d+$/.test(n.slice(key.length+1))));
 const remove=name=>{write(name,'',0);if(domain())write(name,'',0,'')};
 return {getItem(key){const saved=cookies(),count=saved.get(key+'.chunks');let value;if(count!==undefined){if(!/^[1-9]\d*$/.test(count)||Number(count)>100)return null;const parts=[];for(let i=0;i<Number(count);i++){const p=saved.get(key+'.'+i);if(p===undefined)return null;parts.push(p)}value=parts.join('')}else value=saved.get(key);try{return value===undefined?null:decodeURIComponent(value)}catch{return null}},setItem(key,value){const encoded=encodeURIComponent(value),previous=names(key),next=new Set();if(encoded.length<=3000){write(key,encoded,2592000);next.add(key)}else{for(let s=0,i=0;s<encoded.length;s+=3000,i++){write(key+'.'+i,encoded.slice(s,s+3000),2592000);next.add(key+'.'+i)}write(key+'.chunks',String(Math.ceil(encoded.length/3000)),2592000);next.add(key+'.chunks')}previous.filter(n=>!next.has(n)).forEach(remove)},removeItem(key){names(key).forEach(remove)}};
}
