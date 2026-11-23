"use client";
import {useState} from "react";
import s from "./song-levels.module.css";
const levels=[
["Sing","Cất lên giai điệu","Xướng âm đúng tên nốt, cao độ và nhịp của bốn câu đầu.","fa-music"],
["Play","Chạm vào phím đàn","Chơi melody bốn câu đầu, đúng ngón và nhịp cơ bản.","fa-keyboard"],
["Melody","Kết nối câu nhạc","Chơi toàn bộ melody Verse 1 và Chorus, nối các câu nhạc.","fa-wave-square"],
["Two Hands","Hai tay hòa nhịp","Ghép bass đơn và hợp âm hai nốt, chơi hai tay ổn định.","fa-hands"],
["Perform","Biểu diễn bản Core","Chơi hoàn chỉnh Core, ít dừng và giữ tempo ổn định.","fa-star"],
["Arpeggio","Mở rộng kỹ thuật","Chơi Midtro với arpeggio tay phải và broken chord tay trái.","fa-stairs"],
["New Key","Một giọng điệu mới","Chơi giai điệu Chorus+ ở một giọng mới.","fa-arrows-rotate"],
["Harmony","Làm giàu hòa âm","Ghép hai tay Chorus+ với những hợp âm nhiều màu sắc.","fa-layer-group"],
["Expression","Kể chuyện bằng âm nhạc","Kiểm soát pedal, sắc thái và tương phản giữa các đoạn.","fa-heart"],
["Perform+","Biểu diễn bản mở rộng","Trình diễn Expanded Arrangement liền mạch và giàu biểu cảm.","fa-award"]
] as const;
export function SongLevels(){
const [active,setActive]=useState(0);
const handleTrackScroll=(event:React.UIEvent<HTMLDivElement>)=>{
  if(window.matchMedia("(min-width: 761px)").matches)return;
  const track=event.currentTarget;
  const center=track.getBoundingClientRect().left+track.clientWidth/2;
  const cards=Array.from(track.querySelectorAll<HTMLButtonElement>("button[data-level-index]"));
  const nearest=cards.reduce<HTMLButtonElement|null>((best,card)=>!best||Math.abs(card.getBoundingClientRect().left+card.offsetWidth/2-center)<Math.abs(best.getBoundingClientRect().left+best.offsetWidth/2-center)?card:best,null);
  if(nearest)setActive(Number(nearest.dataset.levelIndex));
};
return <section className={s.section} id="song-levels" aria-labelledby="song-levels-heading">
<header className={s.intro}><h2 id="song-levels-heading">Mỗi tác phẩm, mười cấp độ.<br/><em>Một hành trình dài lâu.</em></h2><p>Mỗi tác phẩm là một chương mới. Con bắt đầu từ những nốt nhạc đầu tiên, làm chủ bản nhạc rồi mở rộng kỹ thuật và cảm xúc. Khi một chương khép lại, hành trình vẫn tiếp tục.</p></header>
{([0,1] as const).map(g=><div className={s.group} key={g}><div className={s.groupHeading}><span>0{g+1}</span><div><h3>{g===0?"NỀN TẢNG":"MỞ RỘNG"}</h3><p>{g===0?"Từ những nốt đầu tiên đến bản biểu diễn đầu đời.":"Từ chơi đúng đến diễn giải bằng dấu ấn riêng."}</p></div><small>{g===0?"L1 — L5":"L6 — L10"}</small></div>
<div className={s.track} onScroll={handleTrackScroll} role="group" aria-label={g===0?"Nền tảng":"Mở rộng"}>{levels.slice(g*5,g*5+5).map((l,i)=>{const n=g*5+i;return <button key={l[0]} type="button" data-level-index={n} onClick={(event)=>{setActive(n);if(window.matchMedia("(max-width: 760px)").matches)event.currentTarget.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"});}} aria-pressed={active===n} aria-controls="song-level-detail" className={[s.level,active===n?s.active:"",n===4||n===9?s.milestone:""].join(" ")}><i className={`fa-solid ${l[3]}`} aria-hidden="true"/><small>L{n+1}</small><strong>{l[0]}</strong>{(n===4||n===9)&&<span>Cột mốc biểu diễn</span>}</button>})}</div></div>)}
<div id="song-level-detail" className={s.detail} aria-live="polite"><div><small>{active<5?"NỀN TẢNG":"MỞ RỘNG"} · LEVEL {active+1}</small><h3>{levels[active][1]}</h3><p>{levels[active][2]}</p></div><i className={`fa-solid ${levels[active][3]}`} aria-hidden="true"/></div>
<div className={s.next}><i className="fa-solid fa-infinity" aria-hidden="true"/><div><strong>Hết một tác phẩm, mở ra một chương mới.</strong><p>Con mang theo những gì đã học để khám phá những bản nhạc mới, sâu sắc hơn qua từng năm tháng tại PianoHouse.</p></div></div>
</section>}
