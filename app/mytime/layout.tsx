import {Playfair_Display, Be_Vietnam_Pro} from "next/font/google";
import type {ReactNode} from "react";
import {MyTimeShell} from "./v3";
import "./v3.css";
const display=Playfair_Display({subsets:["latin","vietnamese"],style:["normal","italic"],weight:"variable",display:"swap",variable:"--mt-display"});
const body=Be_Vietnam_Pro({subsets:["latin","vietnamese"],weight:["400","500","600","700"],display:"swap",variable:"--mt-body"});
export default function Layout({children}:{children:ReactNode}){
 return <MyTimeShell fontClasses={display.variable+" "+body.variable}>{children}</MyTimeShell>
}
