import { getConfig } from "./web-config";

type Env = {
  NOTION_TOKEN: string;
  NOTION_PARENT_DATA_SOURCE_ID: string;
  NOTION_OS_BOOKING_DATA_SOURCE_ID: string;
  NOTION_OS_BOOKING_DATABASE_ID?: string;
  NOTION_OS_SESSION_DATA_SOURCE_ID: string;
  NOTION_OS_SESSION_DATABASE_ID?: string;
  NOTION_PATH_PROGRAM_DATA_SOURCE_ID: string;
  NOTION_SYLLABUS_DATA_SOURCE_ID?: string;
  NOTION_WEB_CONFIG_DATA_SOURCE_ID: string;
  RESEND_API_KEY?: string;
  OS_NOTIFY_TO?: string;
  OS_NOTIFY_FROM?: string;
};

const headers=(env:Env,version="2026-03-11")=>({Authorization:`Bearer ${env.NOTION_TOKEN}`,"Content-Type":"application/json","Notion-Version":version});
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store, no-cache, must-revalidate","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Methods":"GET, POST, OPTIONS"}});
const text=(p:any)=>p?.title?.[0]?.plain_text||p?.rich_text?.[0]?.plain_text||p?.select?.name||p?.status?.name||"";
const date=(p:any)=>p?.date?.start||null;
const number=(p:any)=>typeof p?.number==="number"?p.number:typeof p?.formula?.number==="number"?p.formula.number:typeof p?.rollup?.number==="number"?p.rollup.number:null;
const relationIds=(p:any):string[]=>Array.isArray(p?.relation)?p.relation.map((r:any)=>r.id).filter(Boolean):[];
const select=(p:any)=>p?.select?.name||p?.status?.name||null;
const normalizePhone=(value:string)=>value.replace(/\D/g,"").replace(/^84(?=0)/,"0");
const sessionMs=(value:string|null)=>{if(!value)return null;const normalized=value.includes(" ")&&!value.includes("T")?value.replace(" ","T"):value;const parsed=new Date(normalized.length===10?`${normalized}T23:59:59+07:00`:normalized);return Number.isNaN(parsed.getTime())?null:parsed.getTime();};
const path=(value:string|null)=>{const v=(value||"").trim().toLowerCase().replace(/\s+/g," ");if(v==="pianohouse"||v.startsWith("piano"))return "Piano";if(v==="architect"||v.startsWith("architect")||v.startsWith("mỹ thuật")||v.startsWith("my thuat"))return "Mỹ thuật";if(v==="little piner"||v.startsWith("little piner"))return "Little Piner";return null;};
const parseNotifyRecipients=(value:string)=>value.split(";").map((email)=>email.trim()).filter((email)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
const escapeHtml=(value:string)=>value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;");
const renderEmailContent=(template:string,values:Record<string,string>)=>template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,(_,key)=>escapeHtml(values[key]??""));

async function query(env:Env,ds:string,filter?:unknown){
  const response=await fetch(`https://api.notion.com/v1/data_sources/${ds}/query`,{method:"POST",headers:headers(env),body:JSON.stringify(filter?{filter}:{})});
  if(response.ok)return response;
  if(ds===env.NOTION_OS_SESSION_DATA_SOURCE_ID&&env.NOTION_OS_SESSION_DATABASE_ID)return fetch(`https://api.notion.com/v1/databases/${env.NOTION_OS_SESSION_DATABASE_ID}/query`,{method:"POST",headers:headers(env,"2022-06-28"),body:JSON.stringify(filter?{filter}:{})});
  if(ds===env.NOTION_OS_BOOKING_DATA_SOURCE_ID&&env.NOTION_OS_BOOKING_DATABASE_ID)return fetch(`https://api.notion.com/v1/databases/${env.NOTION_OS_BOOKING_DATABASE_ID}/query`,{method:"POST",headers:headers(env,"2022-06-28"),body:JSON.stringify(filter?{filter}:{} )});
  return response;
}

async function createPage(env:Env,ds:string,properties:Record<string,unknown>){return fetch("https://api.notion.com/v1/pages",{method:"POST",headers:headers(env),body:JSON.stringify({parent:{data_source_id:ds},properties})});}

export async function getPublicSessions(env:Env,params:URLSearchParams){
  const type=params.get("type");
  const id=params.get("id");
  const sessionFilter:any=type?{property:"Type",select:{equals:type}}:undefined;
  const [sessionsResponse,programsResponse,syllabusResponse]=await Promise.all([
    query(env,env.NOTION_OS_SESSION_DATA_SOURCE_ID,sessionFilter),
    query(env,env.NOTION_PATH_PROGRAM_DATA_SOURCE_ID),
    env.NOTION_SYLLABUS_DATA_SOURCE_ID?query(env,env.NOTION_SYLLABUS_DATA_SOURCE_ID):Promise.resolve(null)
  ]);
  if(!sessionsResponse.ok)return json({error:"Could not load OS sessions.",notionStatus:sessionsResponse.status},502);
  const sessionsData=await sessionsResponse.json() as any;
  const programMap=new Map<string,string>();
  if(programsResponse.ok){const data=await programsResponse.json() as any;for(const page of data.results||[]){const p=path(select(page.properties?.Path));if(p)programMap.set(page.id,p);}}
  const syllabusMap=new Map<string,any>();
  if(syllabusResponse?.ok){const data=await syllabusResponse.json() as any;for(const page of data.results||[]){syllabusMap.set(page.id,{id:page.id,name:text(page.properties?.Name),keyword:text(page.properties?.Keyword),shortDescription:text(page.properties?.["Short Description"]),skillSummary:text(page.properties?.["Skill Summary"]),skillset:select(page.properties?.Skillset)});}}
  const items:any[]=[];
  for(const page of sessionsData.results||[]){
    if(page.properties?.["Mock Data"]?.checkbox===true)continue;
    if(id&&page.id!==id)continue;
    const paths=relationIds(page.properties?.["Path Program"]).map((id:string)=>programMap.get(id)).filter(Boolean);
    const syllabusIds=relationIds(page.properties?.Syllabus);
    const syllabus=syllabusIds.map((sid:string)=>syllabusMap.get(sid)).find(Boolean)||null;
    const capacity=number(page.properties?.Capacity);
    const confirmedCount=number(page.properties?.["Confirmed Count"]);
    const availableSeats=number(page.properties?.["Available Seats"]);
    items.push({id:page.id,topic:text(page.properties?.Topic)||"Untitled session",type:text(page.properties?.Type),path:paths[0]||null,date:date(page.properties?.Date),availableSeats:availableSeats??(capacity!==null&&confirmedCount!==null?Math.max(0,capacity-confirmedCount):null),capacity,confirmedCount:confirmedCount??0,cover:null,avatar:null,syllabus});
  }
  items.sort((a,b)=>(a.date||"9999").localeCompare(b.date||"9999"));
  const requestedPath=params.get("path");
  return json({sessions:requestedPath?items.filter(item=>item.path===requestedPath):items});
}

async function resolveParent(env:Env,phone:string){
  const normalized=normalizePhone(phone);
  const byNormalized=await query(env,env.NOTION_PARENT_DATA_SOURCE_ID,{property:"Phone Normalized",rich_text:{equals:normalized}});
  if(byNormalized.ok){const data=await byNormalized.json() as any;if(data.results?.length===1)return data.results[0].id;if(data.results?.length>1)return null;}
  const byMobile=await query(env,env.NOTION_PARENT_DATA_SOURCE_ID,{property:"Mobile",phone_number:{equals:phone}});
  if(!byMobile.ok)return {error:true,status:502};
  const data=await byMobile.json() as any;
  if(data.results?.length===1)return data.results[0].id;
  return null;
}

async function sendNotification(env:Env,bookingId:string,session:any,phone:string,parentId:string|null){
  const notifyTo=await getConfig(env,"os_notify_email",env.OS_NOTIFY_TO||"");
  const recipients=parseNotifyRecipients(String(notifyTo));
  const fromName=await getConfig(env,"os_notify_from_name","PINO Open Studio");
  const fromEmail=await getConfig(env,"os_notify_from_email",env.OS_NOTIFY_FROM||"onboarding@resend.dev");
  const contentTemplate=await getConfig(env,"os_notify_email_content","A new Open Studio registration has been received.\n\nSession: {{session_topic}}\nDate: {{session_date}}\nZalo / phone: {{phone}}\nParent: {{parent_status}}\nBooking: {{booking_id}}\n\nStatus: Pending — please follow up with the family via Zalo.");
  if(!env.RESEND_API_KEY||recipients.length===0)return {sent:false,reason:"email_not_configured"};
  const values={session_topic:String(session.topic||""),session_date:String(session.date||"TBD"),phone,parent_status:parentId?"Matched in CRM":"Not matched",booking_id:bookingId};
  const rendered=renderEmailContent(String(contentTemplate),values);
  const html=rendered.split(/\n\s*\n/).map((paragraph)=>`<p>${paragraph.replace(/\n/g,"<br />")}</p>`).join("");
  const from=`${fromName} <${fromEmail}>`;
  const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({from,to:recipients,subject:`Open Studio · New registration · ${session.topic}`,html,text:rendered})});
  if(!response.ok)return {sent:false,reason:"email_send_failed"};
  return {sent:true,recipientCount:recipients.length};
}

export async function createPublicBooking(env:Env,phone:string,sessionId:string){
  const normalized=normalizePhone(phone);
  if(!/^0\d{9,10}$/.test(normalized))return json({error:"Vui lòng nhập số điện thoại Zalo hợp lệ."},400);
  const registrationEnabled=await getConfig(env,"os_registration_enabled",true);
  if(!registrationEnabled)return json({error:"Open Studio registration is temporarily closed."},503);
  const bookingWindowDays=await getConfig(env,"os_booking_window_days",7);
  const sessions=await getPublicSessions(env,new URLSearchParams());
  const sessionData=await sessions.json() as any;
  if(!sessions.ok)return sessions;
  const session=sessionData.sessions?.find((s:any)=>s.id===sessionId);
  if(!session)return json({error:"Session không tồn tại hoặc đã đóng."},404);
  const start=sessionMs(session.date);if(start===null)return json({error:"Session chưa có ngày giờ hợp lệ."},409);
  if(start<Date.now())return json({error:"Session này đã bắt đầu và chỉ còn để xem."},409);
  if(start>Date.now()+bookingWindowDays*24*60*60*1000)return json({error:"Session này chưa mở đăng ký."},409);
  if(session.availableSeats!==null&&session.availableSeats<=0)return json({error:"Session này đã đầy."},409);
  const parent=await resolveParent(env,normalized);if(typeof parent==="object"&&parent.error)return json({error:"Không thể kiểm tra thông tin phụ huynh."},502);
  const duplicateProtection=await getConfig(env,"os_duplicate_registration_protection",true);
  if(duplicateProtection){
    const duplicateFilter:any={and:[{property:"OS Session",relation:{contains:sessionId}},{property:"Note",rich_text:{contains:normalized}},{or:[{property:"Status",select:{equals:"Pending"}},{property:"Status",select:{equals:"Confirmed"}}]}]};
    const existingResponse=await query(env,env.NOTION_OS_BOOKING_DATA_SOURCE_ID,duplicateFilter);
    if(existingResponse.ok){const existing=await existingResponse.json() as any;if((existing.results?.length||0)>0)return json({ok:true,alreadyRegistered:true,bookingId:existing.results[0].id,status:text(existing.results[0].properties?.Status)||"Pending"});}
  }
  const defaultStatus=await getConfig(env,"os_default_booking_status","Pending");
  const note=`Source: public Open Studio\nZalo / phone: ${normalized}\nIdentity: ${parent?"matched parent":"new contact — human follow-up required"}`;
  const properties:any={Name:{title:[{text:{content:`Open Studio · ${session.topic} · ${normalized}`}}]},"OS Session":{relation:[{id:sessionId}]},Status:{select:{name:defaultStatus}},Note:{rich_text:[{text:{content:note}}]},...(parent?{Parent:{relation:[{id:parent}]}}:{})};
  const bookingResponse=await createPage(env,env.NOTION_OS_BOOKING_DATA_SOURCE_ID,properties);
  if(!bookingResponse.ok){const detail=(await bookingResponse.text()).slice(0,500);return json({error:"Không thể tạo đăng ký.",detail},502);}
  const booking=await bookingResponse.json() as any;
  if(!booking.id)return json({error:"Đăng ký được tạo nhưng thiếu Booking ID."},502);
  const email=await sendNotification(env,booking.id,session,normalized,parent||null);
  const successMessage=await getConfig(env,"os_success_message","Đăng ký thành công. PINO sẽ liên hệ bạn qua Zalo để xác nhận.");
  return json({ok:true,bookingId:booking.id,status:defaultStatus,parentId:parent||null,emailNotified:email.sent,message:successMessage});
}
