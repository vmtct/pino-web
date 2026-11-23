"use client";
import {useState} from "react";
import s from "./page.module.css";
const base="https://assets.pinohouse.art/site/Artchitect/";
const items=[
{title:"Minh họa số",en:"Digital Illustration",desc:"Kể chuyện bằng hình ảnh, đường nét và bố cục. Biến một ý tưởng nhỏ thành thế giới riêng.",img:"Digi/Collaborative%20Tablet%20Learning%20in%20a%20Bright%20Classroom.png"},
{title:"Hội họa số",en:"Digital Painting",desc:"Khám phá màu sắc, ánh sáng và chất liệu. Tìm không khí và cảm xúc cho mỗi tác phẩm.",img:"Digi/Collaborative%20Tablet%20Learning%20in%20a%20Bright%20Classroom.png"},
{title:"Nghệ thuật nhân vật",en:"Character Art",desc:"Tạo nên nhân vật nguyên bản: từ biểu cảm, dáng hình đến những chi tiết mang cá tính.",img:"Digi/Collaborative%20Tablet%20Learning%20in%20a%20Bright%20Classroom.png"}];
export default function Showcase(){const [active,setActive]=useState(0);return <div className={s.showcase}><div className={s.showcaseTabs} role="tablist" aria-label="Hướng sáng tạo">{items.map((item,i)=><button key={item.en} type="button" role="tab" id={"direction-tab-"+i} aria-selected={active===i} aria-controls="direction-panel" onClick={()=>setActive(i)} className={active===i?s.selected:""}><span>0{i+1}</span><strong>{item.title}</strong><small>{item.en}</small></button>)}</div><div className={s.showcaseVisual} data-active-direction={active} id="direction-panel" role="tabpanel" aria-labelledby={"direction-tab-"+active}><img src={base+items[active].img} alt={"Minh họa cho "+items[active].title}/><div className={s.showcaseCaption}><span>0{active+1} / 03</span><h3>{items[active].title}</h3><p>{items[active].desc}</p></div></div></div>}
