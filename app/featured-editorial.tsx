"use client";
import {useEffect,useRef,useState} from "react";
import {Localized as L} from "./localization";
import css from "./featured-editorial.module.css";
const official="https://www.youtube.com/watch?v=wDl4MSJ_1Kc";
const draft="https://assets.pinohouse.art/draft/Kiss%20The%20Rain.mp3";
export function NovemberMusic(){
 const audio=useRef<HTMLAudioElement>(null);
 const [local,setLocal]=useState(false),[playing,setPlaying]=useState(false),[error,setError]=useState(false);
 useEffect(()=>{setLocal(location.hostname==="192.168.1.6"&&location.port==="8811");return()=>audio.current?.pause()},[]);
 async function toggle(){const a=audio.current;if(!a)return;if(!a.paused){a.pause();return}setError(false);try{await a.play()}catch{setError(true)}}
 return <article className={css.feature+" "+css.music} data-november-music>
 <div className={css.musicCover} aria-hidden="true"><span>11</span><span>♪</span></div>
 <div className={css.copy}><span className={css.eyebrow}>PIANO ART · 11 / 2026</span><h3>Kiss The Rain</h3><span className={css.author} data-music-credit>Yiruma</span><p><L vi="Một giai điệu dịu dàng, gợi nhắc những ngày mưa. Cùng con lắng nghe và khám phá cách kể chuyện bằng âm nhạc." en="A gentle melody recalling rainy days. Listen together and discover how music tells a story."/></p>
 {local?<><audio ref={audio} preload="none" src={draft} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>setPlaying(false)} onError={()=>{setError(true);setPlaying(false)}}/><button className={css.play} type="button" aria-label={playing?"Pause Kiss The Rain":"Play Kiss The Rain"} aria-pressed={playing} onClick={()=>void toggle()}><span aria-hidden="true">{playing?"Ⅱ":"▶"}</span><L vi={playing?"Tạm dừng":"Nghe bản nhạc"} en={playing?"Pause":"Play"}/></button><p className={css.note}><L vi="Bản nghe minh họa local; quyền sử dụng công khai chưa xác nhận." en="Local review audio; public usage rights are not yet confirmed."/></p>{error&&<p role="status"><L vi="Chưa phát được bản nghe mẫu. Mở bản chính thức bên dưới." en="Preview unavailable. Open the official recording below."/></p>}</>:null}
 <a className={css.external} href={official} target="_blank" rel="noopener noreferrer"><L vi={local?"Nghe bản chính thức trên YouTube":"▶ Nghe bản nhạc trên YouTube"} en={local?"Official recording on YouTube":"▶ Play on YouTube"}/> </a></div></article>
}
export function DecemberMusic(){return <article className={css.feature+" "+css.music} data-december-music>
 <div className={css.musicCover} aria-hidden="true" style={{backgroundImage:"url(https://mytime.pinohouse.art/acrylic/Aetheria/Moonlit%20City.png)",backgroundSize:"cover",backgroundPosition:"center"}} />
 <div className={css.copy}><span className={css.eyebrow}>PIANO ART · 12 / 2026</span><h3>Cloud Castle Waltz</h3><p><L vi="Một điệu waltz nhẹ nhàng mà cuốn hút, như được sinh ra dành cho tiếng dương cầm. Từng nhịp đàn dìu nhau xoay bước, gợi nên một điệu luân vũ bồng bềnh giữa những tầng mây — khi gần, khi xa, êm ái mà say mê." en="A gentle yet captivating waltz, seemingly made for the piano. Each phrase sways into the next, conjuring a graceful dance among the clouds — drifting close, floating away, tender and enchanting."/></p>
 <audio controls preload="none" style={{display:"block",width:"100%",maxWidth:460,marginTop:20}} src="https://assets.pinohouse.art/site/homepage/Revise%20221126/Cloud%20Castle%20Waltz.mp3">Your browser does not support audio playback.</audio>
 </div></article>}
export function WeeklyWorkshop(){return <article className={css.feature+" "+css.workshop} data-workshop-mock>
 <div className={css.artMock} role="img" aria-label="Pink Hour — conceptual layout illustration"><div className={css.sun}/><div className={css.hill}/><div className={css.water}/></div>
 <div className={css.copy}><span className={css.eyebrow}>DAYDREAM CLUB · ACRYLIC</span><h3><L vi="Khoảnh khắc hồng" en="Pink Hour"/></h3><span className={css.author}><L vi="Pink Hour · Tác phẩm mẫu" en="Sample artwork"/></span><p><L vi="Một buổi hẹn với sắc hồng của hoàng hôn, nơi bạn thư thả pha màu và tạo nên bức tranh của riêng mình." en="A date with the pink of sunset, mixing colors and creating your own painting at a relaxed pace."/></p><div className={css.details}><span>Acrylic</span><span><L vi="Người mới bắt đầu" en="Beginner friendly"/></span><span><L vi="Cuối tuần" en="Weekend"/></span></div><a className={css.play} href="https://m.me/pino.house" target="_blank" rel="noopener noreferrer"><L vi="Hỏi về workshop" en="Ask about the workshop"/> </a><p className={css.note}><L vi="Mẫu duyệt bố cục · Chưa công bố lịch, giá vé hay số chỗ." en="Layout mock · Date, ticket price and availability not announced."/></p></div></article>}
