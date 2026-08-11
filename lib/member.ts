export type MemberSubscription = {
  id:string;
  learningPath:string|null;
  setup:string|null;
  schedule:string[];
  sessionsPerWeek:number;
  startDate:string|null;
  endDate:string|null;
  numberOfWeeks:number|null;
  active:boolean;
};
export type MemberStudent = { id:string; name:string; avatar:string|null; subscription:MemberSubscription|null; availablePassCount:number };
export type MemberPass = { id:string; studentId:string; name:string; type:string|null; scope:string|null; cycleStart:string|null; validUntil:string|null; status:string|null; grantType:string|null };
export type MemberBooking = { id:string; status:string|null; studentId:string|null; sessionId:string|null; sessionTopic:string|null; sessionDate:string|null };
export type MemberProfile = { id:string; name:string; phone:string|null; students:MemberStudent[]; passes:MemberPass[]; bookings:MemberBooking[] };

const normalizePhone=(value:string)=>{let digits=value.replace(/\D/g,"");if(digits.startsWith("84"))digits=digits.slice(2);if(digits.startsWith("0"))digits=digits.slice(1);return digits;};
const notionHeaders=(env:any)=>({Authorization:`Bearer ${env.NOTION_TOKEN}`,"Content-Type":"application/json","Notion-Version":"2026-03-11"});

async function query(env:any,dataSourceId:string,filter:unknown){
  const response=await fetch(`https://api.notion.com/v1/data_sources/${dataSourceId}/query`,{method:"POST",headers:notionHeaders(env),body:JSON.stringify({filter})});
  if(response.ok)return response;
  if(dataSourceId===env.NOTION_PARENT_DATA_SOURCE_ID&&env.NOTION_PARENT_DATABASE_ID)return fetch(`https://api.notion.com/v1/databases/${env.NOTION_PARENT_DATABASE_ID}/query`,{method:"POST",headers:{...notionHeaders(env),"Notion-Version":"2022-06-28"},body:JSON.stringify({filter})});
  return response;
}

async function getPage(env:any,pageId:string){
  return fetch(`https://api.notion.com/v1/pages/${pageId}`,{method:"GET",headers:notionHeaders(env)});
}

const text=(p:any)=>p?.title?.[0]?.plain_text||p?.rich_text?.[0]?.plain_text||p?.select?.name||"";
const propertyText=(properties:any,preferred:string[])=>{for(const key of preferred){const value=text(properties?.[key]);if(value)return value;}for(const value of Object.values(properties||{}) as any[]){if(value?.type==="title"||value?.title){const result=text(value);if(result)return result;}}return "";};
const date=(p:any)=>p?.date?.start||null;
const relationIds=(p:any):string[]=>p?.relation?.map((r:any)=>r.id).filter(Boolean)||[];
const files=(p:any)=>p?.files?.map((f:any)=>f.file?.url||f.external?.url).filter(Boolean)||[];
const multiSelect=(p:any):string[]=>p?.multi_select?.map((v:any)=>v.name).filter(Boolean)||[];
const number=(p:any)=>typeof p?.number==="number"?p.number:typeof p?.formula?.number==="number"?p.formula.number:typeof p?.rollup?.number==="number"?p.rollup.number:null;
const localDate=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Ho_Chi_Minh",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());

async function getLearningPath(env:any,properties:any){
  const pathId=relationIds(properties?.["Learning Path"])[0];
  if(!pathId)return null;
  const response=await getPage(env,pathId);
  if(!response.ok)return null;
  const page=await response.json() as {properties?:any};
  return propertyText(page.properties,["Master Path","Name"])||null;
}

async function getSubscription(env:any,studentPage:any):Promise<MemberSubscription|null>{
  const subscriptionId=relationIds(studentPage.properties?.["Subscription Plan"])[0];
  if(!subscriptionId)return null;
  const response=await getPage(env,subscriptionId);
  if(!response.ok)return null;
  const page=await response.json() as {properties?:any};
  const properties=page.properties||{};
  const startDate=date(properties?.["Start Date"]);
  const endDate=date(properties?.["End Date"]);
  const today=localDate();
  const active=(!startDate||startDate<=today)&&(!endDate||endDate>=today);
  const schedule=multiSelect(properties?.Schedule);
  const learningPath=await getLearningPath(env,properties);
  return {
    id:subscriptionId,
    learningPath,
    setup:propertyText(properties,["Setup"])||null,
    schedule,
    sessionsPerWeek:schedule.length,
    startDate,
    endDate,
    numberOfWeeks:number(properties?.["Number of Weeks"]),
    active,
  };
}

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
  const students:MemberStudent[]=[];
  const passes:MemberPass[]=[];
  const bookings:MemberBooking[]=[];
  await Promise.all((studentsData.results||[]).map(async page=>{
    const subscription=await getSubscription(env,page);
    const studentPasses:MemberPass[]=[];
    const passResponse=await query(env,env.NOTION_OS_PASS_DATA_SOURCE_ID,{property:"Student",relation:{contains:page.id}});
    if(passResponse.ok){const data=await passResponse.json() as {results?:any[]};for(const passPage of data.results||[]){studentPasses.push({id:passPage.id,studentId:page.id,name:propertyText(passPage.properties,["Name","Pass Name"]),type:passPage.properties?.["Pass Type"]?.select?.name||null,scope:passPage.properties?.["Access Scope"]?.select?.name||null,cycleStart:date(passPage.properties?.["Cycle Start"])||date(passPage.properties?.Month),validUntil:date(passPage.properties?.["Valid Until"]),status:passPage.properties?.Status?.select?.name||null,grantType:passPage.properties?.["Grant Type"]?.select?.name||null});}}
    const bookingResponse=await query(env,env.NOTION_OS_BOOKING_DATA_SOURCE_ID,{property:"Student",relation:{contains:page.id}});
    if(bookingResponse.ok){const data=await bookingResponse.json() as {results?:any[]};for(const bookingPage of data.results||[]){const sessionIds=relationIds(bookingPage.properties?.["OS Session"]);bookings.push({id:bookingPage.id,status:bookingPage.properties?.Status?.select?.name||null,studentId:page.id,sessionId:sessionIds[0]||null,sessionTopic:null,sessionDate:null});}}
    passes.push(...studentPasses);
    students.push({id:page.id,name:propertyText(page.properties,["Student Name","Name"])||"Unnamed",avatar:files(page.properties?.Avatar)[0]||null,subscription,availablePassCount:studentPasses.filter(pass=>pass.status==="Available").length});
  }));
  if(bookings.length&&env.NOTION_OS_SESSION_DATA_SOURCE_ID){
    const uniqueSessionIds=[...new Set(bookings.map(b=>b.sessionId).filter((id):id is string=>Boolean(id)))];
    const sessions=new Map<string,{topic:string|null;date:string|null}>();
    await Promise.all(uniqueSessionIds.map(async sessionId=>{const response=await getPage(env,sessionId);if(!response.ok)return;const page=await response.json() as {id?:string;properties?:any};sessions.set(sessionId,{topic:propertyText(page.properties,["Topic","Name"])||null,date:date(page.properties?.Date)});}));
    for(const booking of bookings){if(!booking.sessionId)continue;const session=sessions.get(booking.sessionId);if(session){booking.sessionTopic=session.topic;booking.sessionDate=session.date;}}
  }
  students.sort((a,b)=>a.name.localeCompare(b.name,"vi"));
  const memberPhone=parent.properties?.Mobile?.phone_number||null;
  return {ok:true,member:{id:parent.id,name:propertyText(parent.properties,["Name"])||"Member",phone:memberPhone,students,passes,bookings}};
}
