"use client";
import {useEffect,useRef,useState} from "react";
import s from "./page.module.css";
const base="https://assets.pinohouse.art/site/littlePiner/231126/Artwork/";
const works=[
["Rainbow Scoop Crayon Ice Cream-1.png","SỰ CỐ Ở TIỆM KEM CẦU VỒNG","Kỹ năng pha màu trực tiếp bằng ngón tay"],
["Colorful Textured Shape Stamps-2.png","LỌ MUỐI MA THUẬT BỊ ĐỔ","Kỹ thuật hội họa rắc muối"],
["Colorful Fingerprint Cloud Confetti-3.png","NHỮNG ĐÁM MÂY KẸO BAY MẤT","Làm quen chất liệu Bubble wrap và tạo hình 3D"],
["Rainbow Crowned Girl’s Crayon Kingdom-4.png","LỜI NGUYỀN BÓNG TỐI","Kỹ thuật Cào xé (Scratch Art)"],
["Colorful Crayon Birthday Cake-5.png","CHIẾC BÁNH KEM XẾP LỚP","Kỹ năng tạo hình 3D bằng Puffy Paint"],
["Crayon Portrait with Bold Orange Hair-6.png","GƯƠNG MẶT LỘN XỘN","Tiếp xúc trường phái Lập thể của Picasso"]
] as const;
export default function ArtworkGallery(){
 const [active,setActive]=useState<number|null>(null);
 const closeRef=useRef<HTMLButtonElement>(null);
 const openers=useRef<(HTMLButtonElement|null)[]>([]);
 useEffect(()=>{if(active===null)return;const previous=document.activeElement as HTMLElement|null;const overflow=document.body.style.overflow;document.body.style.overflow="hidden";closeRef.current?.focus();const key=(e:KeyboardEvent)=>{if(e.key==="Escape")setActive(null);if(e.key==="ArrowRight")setActive(i=>i===null?null:(i+1)%works.length);if(e.key==="ArrowLeft")setActive(i=>i===null?null:(i-1+works.length)%works.length)};window.addEventListener("keydown",key);return()=>{window.removeEventListener("keydown",key);document.body.style.overflow=overflow;previous?.focus()}},[active!==null]);
 return <><div className={s.gallery}>{works.map(([file,title,detail],i)=><article className={s.artworkCard} key={file}><button ref={el=>{openers.current[i]=el}} type="button" onClick={()=>setActive(i)} aria-label={`Xem tác phẩm ${i+1}: ${title}`}><img src={base+encodeURIComponent(file)} alt={title} loading="lazy"/></button></article>)}</div>{active!==null&&<div className={s.lightbox} role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setActive(null)}}><div className={s.lightboxPanel} role="dialog" aria-modal="true" aria-label="Tác phẩm của học viên"><button ref={closeRef} className={s.lightboxClose} type="button" onClick={()=>setActive(null)} aria-label="Đóng">×</button><button className={s.lightboxPrev} type="button" onClick={()=>setActive(i=>i===null?null:(i-1+works.length)%works.length)} aria-label="Ảnh trước">‹</button><figure><img src={base+encodeURIComponent(works[active][0])} alt={works[active][1]}/><figcaption><strong>{active+1}. {works[active][1]}</strong><span>{works[active][2]}</span><small>{active+1} / {works.length}</small></figcaption></figure><button className={s.lightboxNext} type="button" onClick={()=>setActive(i=>i===null?null:(i+1)%works.length)} aria-label="Ảnh tiếp">›</button></div></div>}</>;
}
