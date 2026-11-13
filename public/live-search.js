// Invalidate responses immediately on input, including while the next query is debouncing.
export function liveSearch({search,render,isActive=()=>true,delay=300}){
 let version=0,timer;
 return (raw,immediate=false)=>{
  const query=raw.trim(),request=++version;clearTimeout(timer);
  if(!isActive())return;
  if(query.length<2){render({status:'short',items:[]});return}
  render({status:'waiting',items:[]});
  const run=async()=>{
   if(request!==version||!isActive())return;
   render({status:'loading',items:[]});
   try{const items=await search(query);if(request===version&&isActive())render({status:'ready',items})}
   catch(error){if(request===version&&isActive())render({status:'error',items:[],message:error.message})}
  };
  if(immediate)return run();timer=setTimeout(run,delay);
 };
}
