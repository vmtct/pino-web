export type MemberStudent = { id:string; name:string; avatar:string|null };
export type MemberPass = { id:string; name:string; type:string|null; scope:string|null; month:string|null; validUntil:string|null; status:string|null };
export type MemberBooking = { id:string; status:string|null; sessionId:string|null; sessionTopic:string|null; sessionDate:string|null };
export type MemberProfile = { id:string; name:string; phone:string|null; students:MemberStudent[]; passes:MemberPass[]; bookings:MemberBooking[] };

const normalizePhone=(value:string)=>value.replace(/\D/g,"").replace(/^84(?=0)/,"0");
const notionHeaders=(env:any)=>({Authorization:`Bearer ${env.NOTION_TOKEN}`,"Content-Type":"application/json","Notion-Version":"2026-03-11"});

async function query(env:any,dataSourceId:string,filter:unknown){
  const response=await fetch(`https://api.notion.com/v1/data_sources/${dataSourceId}/query`,{method:"POST",headers:notionHeaders(env),body:JSON.stringify({filter})});
  if(response.ok)return response;
  if(dataSourceId===env.NOTION_PARENT_DATA_SOURCE_ID&&env.NOTION_PARENT_DATABASE_ID)return fetch(`https://api.notion.com/v1/databases/${env.NOTION_PARENT_DATABASE_ID}/query`,{method:"POST",headers:{...notionHeaders(env),"Notion-Version":"2022-06-28"},body:JSON.stringify({filter})});
  return response;
}
const text=(p:any)=>p?.title?.[0]?.plain_text||p?.rich_text?.[0]?.plain_text||p?.select?.name||"";
const propertyText=(properties:any,preferred:string[])=>{for(const key of preferred){const value=text(properties?.[key]);if(value)return value;}for(const value of Object.values(properties||{}) as any[]){if(value?.type==="title"||value?.title){const result=text(value);if(result)return result;}}return "";};
const date=(p:any)=>p?.date?.start||null;
const relationIds=(p:any):string[]=>p?.relation?.map((r:any)=>r.id).filter(Boolean)||[];
const files=(p:any)=>p?.files?.map((f:any)=>f.file?.url||f.external?.url).filter(Boolean)||[];

export async function getMember(env:any,phone:string):Promise<{ok:true;member:MemberProfile}|{ok:false;status:number;error:string}>{
  const normalized=normalizePhone(phone);
  if(!normalized)return {ok:false,status:400,error:"A valid Zalo phone number is required."};
  let parentResponse=await query(env,env.NOTION_PARENT_DATA_SOURCE_ID,{property:"Phone Normalized",rich_text:{equals:normalized}});
  if(parentResponse.ok){const parentData=await parentResponse.json() as {results?:any[]};if((parentData.results?.length||0)>0){if((parentData.results?.length||0)>1)return {ok:false,status:409,error:"Multiple members use this phone number."};return buildMember(env,parentData.results![0]);}}
  parentResponse=await query(env,env.NOTION_PARENT_DATA_SOURCE_ID,{property:"Mobile",phone_number:{equals:normalized}});
  if(!parentResponse.ok)return {ok:false,status:502,error:"Could not load member."};
  const parentData=await parentResponse.json() as {results?:any[]};
  if((parentData.results?.length||0)===0)return {ok:false,status:404,error:"Member not found."};
  if((parentData.results?.length||0)>1)return {ok:false,status:409,error:"Multiple members use this phone number."};
  return buildMember(env,parentData.results![0]);
}

async function buildMember(env:any,parent:any):Promise<{ok:true;member:MemberProfile}|{ok:false;status:number;error:string}>{
  const studentsResponse=await query(env,env.NOTION_STUDENT_DATA_SOURCE_ID,{property:"Parents ",relation:{contains:parent.id}});
  if(!studentsResponse.ok)return {ok:false,status:502,error:"Could not load member students."};
  const studentsData=await studentsResponse.json() as {results?:any[]};
  const students=(studentsData.results||[]).map(page=>({id:page.id,name:propertyText(page.properties,["Student Name","Name"])||"Unnamed",avatar:files(page.properties?.Avatar)[0]||null}));
  const studentIds=students.map(s=>s.id);
  const passes:MemberPass[]=[];
  const bookings:MemberBooking[]=[];
  for(const studentId of studentIds){
    const passResponse=await query(env,env.NOTION_OS_PASS_DATA_SOURCE_ID,{property:"Student",relation:{contains:studentId}});
    if(passResponse.ok){const data=await passResponse.json() as {results?:any[]};for(const page of data.results||[]){passes.push({id:page.id,name:propertyText(page.properties,["Name","Pass Name"]),type:page.properties?.["Pass Type"]?.select?.name||null,scope:page.properties?.["Access Scope"]?.select?.name||null,month:date(page.properties?.Month),validUntil:date(page.properties?.["Valid Until"]),status:page.properties?.Status?.select?.name||null});}}
    const bookingResponse=await query(env,env.NOTION_OS_BOOKING_DATA_SOURCE_ID,{property:"Student",relation:{contains:studentId}});
    if(bookingResponse.ok){const data=await bookingResponse.json() as {results?:any[]};for(const page of data.results||[]){const sessionIds=relationIds(page.properties?.["OS Session"]);bookings.push({id:page.id,status:page.properties?.Status?.select?.name||null,sessionId:sessionIds[0]||null,sessionTopic:null,sessionDate:null});}}
  }
  const memberPhone=parent.properties?.Mobile?.phone_number||null;
  return {ok:true,member:{id:parent.id,name:propertyText(parent.properties,["Name"])||"Member",phone:memberPhone,students,passes,bookings}};
}
