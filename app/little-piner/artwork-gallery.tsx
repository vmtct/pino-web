"use client";
import {useEffect,useRef,useState} from "react";
import s from "./page.module.css";
const base="https://assets.pinohouse.art/site/littlePiner/231126/Artwork/";
const music="https://assets.pinohouse.art/site/pianohouse/221126/";
type Work={kind:"image"|"video";src:string;title:string;detail:string};
const artworks:Work[]=[
["Rainbow Scoop Crayon Ice Cream-1.png","SỰ CỐ Ở TIỆM KEM CẦU VỒNG","Kỹ năng pha màu trực tiếp bằng ngón tay"],
["Colorful Textured Shape Stamps-2.png","LỌ MUỐI MA THUẬT BỊ ĐỔ","Kỹ thuật hội họa rắc muối"],
["Colorful Fingerprint Cloud Confetti-3.png","NHỮNG ĐÁM MÂY KẸO BAY MẤT","Làm quen chất liệu Bubble wrap và tạo hình 3D"],
["Rainbow Crowned Girl’s Crayon Kingdom-4.png","LỜI NGUYỀN BÓNG TỐI","Kỹ thuật Cào xé (Scratch Art)"],
["Colorful Crayon Birthday Cake-5.png","CHIẾC BÁNH KEM XẾP LỚP","Kỹ năng tạo hình 3D bằng Puffy Paint"],
["Crayon Portrait with Bold Orange Hair-6.png","GƯƠNG MẶT LỘN XỘN","Tiếp xúc trường phái Lập thể của Picasso"]
].map(([file,title,detail]):Work=>({kind:"image",src:base+encodeURIComponent(file),title,detail}));
const pianoClips:Work[]=[
 {kind:"video",src:music+"Nhan%20JingleBell.mp4",title:"Jingle Bell",detail:"Hồng Nhẫn · 9 tuổi"},
 {kind:"video",src:music+"Cherry%20Terravia.mp4",title:"Hành Trình Terravia",detail:"Cherry · 5 tuổi"},
 {kind:"video",src:music+"ABC%20Song.mp4",title:"ABC Song",detail:"Lạc · 5 tuổi"}
];
const works:Work[]=[artworks[0],pianoClips[0],artworks[1],pianoClips[1],artworks[2],artworks[3],artworks[4],pianoClips[2],artworks[5]];
export default function ArtworkGallery(){
 const [active,setActive]=useState<number|null>(null);
 const closeRef=useRef<HTMLButtonElement>(null);
 const item=active===null?null:works[active];
 const isOpen=active!==null;
 const move=(delta:number)=>setActive(i=>i===null?null:(i+delta+works.length)%works.length);
 useEffect(()=>{
   if(!isOpen)return;
   const previous=document.activeElement as HTMLElement|null;
   const overflow=document.body.style.overflow;
   document.body.style.overflow="hidden";
   closeRef.current?.focus();
   const key=(e:KeyboardEvent)=>{
     if(e.key==="Escape")setActive(null);
     if((e.target as HTMLElement)?.tagName==="VIDEO")return;
     if(e.key==="ArrowRight")move(1);
     if(e.key==="ArrowLeft")move(-1);
   };
   window.addEventListener("keydown",key);
   return()=>{window.removeEventListener("keydown",key);document.body.style.overflow=overflow;previous?.focus()};
 },[isOpen]);
 return <>
  <div className={s.gallery}>{works.map((work,i)=>
   <article className={s.artworkCard} key={work.src}>
    <button type="button" onClick={()=>setActive(i)} aria-label={work.kind==="video"?`Phát video: ${work.title} — ${work.detail}`:`Xem tác phẩm ${i+1}: ${work.title}`}>
     {work.kind==="image"?<img src={work.src} alt={work.title} loading="lazy"/>:
      <><video className={s.galleryVideoThumb} src={work.src+"#t=0.5"} preload="metadata" muted playsInline aria-hidden="true"/><span className={s.galleryPlay} aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span></>}
    </button>
   </article>)}</div>
  {item&&active!==null&&<div className={s.lightbox} role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setActive(null)}}>
   <div className={s.lightboxPanel} role="dialog" aria-modal="true" aria-label="Tác phẩm của học viên">
    <button ref={closeRef} className={s.lightboxClose} type="button" onClick={()=>setActive(null)} aria-label="Đóng">×</button>
    <button className={s.lightboxPrev} type="button" onClick={()=>move(-1)} aria-label="Tác phẩm trước">‹</button>
    <figure key={item.src}>
     {item.kind==="video"?<video className={s.lightboxVideo} src={item.src} controls playsInline autoPlay preload="metadata" aria-label={item.title}/>:<img src={item.src} alt={item.title}/>}
     <figcaption><strong>{active+1}. {item.title}</strong><span>{item.detail}</span><small>{active+1} / {works.length}</small></figcaption>
    </figure>
    <button className={s.lightboxNext} type="button" onClick={()=>move(1)} aria-label="Tác phẩm tiếp">›</button>
   </div>
  </div>}
 </>;
}
