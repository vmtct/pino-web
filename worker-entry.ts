import memberWorker from "./worker-member";
import { createPublicBooking, getPublicSessions } from "./lib/open-studio-public";

type Env = Record<string, any>;

const handler={async fetch(request:Request,env:Env){
  const url=new URL(request.url);
  if(request.method==="GET"&&url.pathname==="/api/os-sessions")return getPublicSessions(env,url.searchParams);
  if(request.method==="POST"&&url.pathname==="/api/open-studio/book"){
    let body:any;
    try{body=await request.json();}catch{return new Response(JSON.stringify({error:"Invalid request."}),{status:400,headers:{"Content-Type":"application/json"}});}
    // Member Space keeps its existing authenticated/pass-based booking flow.
    if(typeof body?.studentId==="string"&&body.studentId.trim()&&typeof body?.passId==="string"&&body.passId.trim())return memberWorker.fetch(request,env);
    const phone=typeof body?.phone==="string"?body.phone:typeof body?.zaloPhone==="string"?body.zaloPhone:"";
    const sessionId=typeof body?.sessionId==="string"?body.sessionId:typeof body?.session==="string"?body.session:"";
    return createPublicBooking(env,phone.trim(),sessionId.trim());
  }
  return memberWorker.fetch(request,env);
}};

export default handler;
