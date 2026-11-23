import {notFound} from "next/navigation";
import {WorkshopDetail} from "../../../ia-v2";
export const dynamicParams=false;
export function generateStaticParams(){return [{slug:"pink-hour-preview"}]}
export const metadata={title:"Pink Hour — Workshop preview | MyTime",robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{slug:string}>}){if((await params).slug!=="pink-hour-preview")notFound();return <WorkshopDetail/>}
