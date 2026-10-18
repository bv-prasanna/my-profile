// Cloudflare Pages Function. Store RESEND_API_KEY in Pages project Secrets.
// Verify bvprasanna.com in Resend; set ENQUIRY_FROM to enquiries@bvprasanna.com.
const TO='bv.prasannakumar@gmail.com';
const NEEDS=new Set(['Enterprise application','Software platform or marketplace','Mobile app','Web app or portal','Business website','Technical advice or review','Something else']);
const field=(v,n)=>typeof v==='string'?v.trim().slice(0,n):'';
const response=(code,body)=>new Response(JSON.stringify(body),{status:code,headers:{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'}});
export async function onRequestPost({request,env}){
  if(!env.RESEND_API_KEY||!env.ENQUIRY_FROM)return response(503,{error:'Email delivery is not configured yet.'});
  if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return response(415,{error:'JSON required'});
  if(Number(request.headers.get('content-length')||0)>12000)return response(413,{error:'Enquiry too large'});
  let body;
  try{const raw=await request.text();if(raw.length>12000)return response(413,{error:'Enquiry too large'});body=JSON.parse(raw);}
  catch{return response(400,{error:'Invalid enquiry request'});}
  if(!body||typeof body!=='object'||Array.isArray(body))return response(400,{error:'Invalid enquiry request'});
  // Honeypot. Treat bots as accepted without sending or indicating a block.
  if(body.botcheck)return response(200,{ok:true});
  const name=field(body.name,120),contact=field(body.contact,254),need=field(body.need,120),msg=field(body.msg,6000),budget=field(body.budget,100),time=field(body.time,100);
  if(name.length<2||!NEEDS.has(need)||msg.length<5||!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)||/^\+?[0-9\s()\-]{8,20}$/.test(contact)))return response(400,{error:'Please complete the enquiry with a valid contact.'});
  if(env.TURNSTILE_SECRET){
    const token=field(body.turnstileToken,3000);
    if(!token)return response(403,{error:'Verification required'});
    try{
      const v=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret:env.TURNSTILE_SECRET,response:token,remoteip:request.headers.get('CF-Connecting-IP')||''})});
      const data=await v.json();if(!data.success)return response(403,{error:'Verification failed'});
    }catch{return response(502,{error:'Verification unavailable'});}
  }
  const details=[['Name',name],['Contact',contact],['Service',need],['Budget',budget||'Not specified'],['Timeline',time||'Not specified'],['Project details',msg]].map(([k,v])=>k+': '+v).join('\n\n');
  try{
    const sent=await fetch('https://api.resend.com/emails',{method:'POST',headers:{authorization:'Bearer '+env.RESEND_API_KEY,'content-type':'application/json'},body:JSON.stringify({from:env.ENQUIRY_FROM,to:[TO],subject:'Website project enquiry: '+need,text:details})});
    if(!sent.ok){console.error('Enquiry provider HTTP status:',sent.status);return response(502,{error:'Unable to deliver email. Please use WhatsApp.'});}
    const result=await sent.json();if(!result.id)return response(502,{error:'Email provider did not confirm sending.'});
    return response(200,{ok:true});
  }catch(e){console.error('Enquiry provider unavailable:',String(e));return response(502,{error:'Unable to deliver email. Please use WhatsApp.'});}
}
export function onRequestGet(){return new Response('Method not allowed',{status:405});}
