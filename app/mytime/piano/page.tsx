import type {Metadata} from "next";
import {ProgramPage} from "../v3";
export const metadata:Metadata={title:"Piano | MyTime by PINO"};
export default function Page(){return <ProgramPage program="piano"/>}
