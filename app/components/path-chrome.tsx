"use client";
import {useEffect,useRef,useState} from "react";
import { LocaleToggle, Localized as L, useLocale, type Locale } from "../localization";
import s from "./path-chrome.module.css";

const SIGIL = "https://assets.pinohouse.art/core/Pino%20Sigil.png";
type LegacyProps = { styles?: Record<string,string>; locale?: Locale };
export function PathBrand({compact=false,sigilOnly=false,afterschool=false}:{compact?:boolean;sigilOnly?:boolean;afterschool?:boolean}) {
  return <a className={s.brand+(afterschool?" "+s.afterschoolBrand:"")} href={afterschool?"/afterschool":"/"} aria-label={afterschool?"PINO Afterschool":"PINO House"}><img src={SIGIL} alt=""/>{afterschool?<span className={s.brandWords}><strong>PINO</strong><small>Afterschool</small></span>:!sigilOnly&&<span>{compact?"PINO":"PINO House"}</span>}</a>;
}
export function PathHeader({ariaLabel="PINO",activeHref,ctaHref="https://app.pinohouse.art",ctaLabel,ctaLabelVi,ctaLabelEn,inset=false,home=false}:LegacyProps & {ariaLabel?:string;wrapperClassName?:string;activeHref?:string;activeClassName?:string;ctaHref?:string;ctaLabel?:string;ctaLabelVi?:string;ctaLabelEn?:string;inset?:boolean;home?:boolean}) {
  const {locale}=useLocale();
  const [hidden,setHidden]=useState(false); const [open,setOpen]=useState(false); const toggle=useRef<HTMLButtonElement>(null);
  const frame=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(home)return;
    let last=Math.max(0,window.scrollY), raf=0;
    const update=()=>{
      raf=0;
      const y=Math.max(0,window.scrollY);
      if(y<80||y<last||frame.current?.contains(document.activeElement))setHidden(false);
      else if(y>last&&y>=80)setHidden(true);
      last=y;
    };
    const scroll=()=>{if(!raf)raf=requestAnimationFrame(update)};
    window.addEventListener("scroll",scroll,{passive:true});
    return()=>{window.removeEventListener("scroll",scroll);if(raf)cancelAnimationFrame(raf)};
  },[home]);
  const afterNav=activeHref==="/afterschool"||activeHref==="/open-studio"||activeHref==="/afterschool/community";
  const links=afterNav?[["/afterschool#paths",locale==="vi"?"Nhánh học":"Paths"],["/afterschool/community","Community"],["/open-studio","Open Studio"]]:[["/afterschool","Afterschool"],["/mytime","MyTime"],["/#house","PINO House"]];
  const label=locale==="vi"?(ctaLabelVi??ctaLabel??"Piner App"):(ctaLabelEn??ctaLabel??"Piner App");
  return <div className={home?s.homeFlowSlot:s.headerSlot}><div ref={frame} className={home?s.flowHeader:s.fixedHeader} data-home-header-flow={home?"true":undefined} data-pino-header-state={home?undefined:hidden?"hidden":"visible"} onFocusCapture={home?undefined:()=>setHidden(false)}><header className={s.header+(afterNav?" "+s.afterschoolHeader:"")+(home?" "+s.homeHeader:"")+(open?" "+s.menuOpen:"")} data-pino-path-header data-home-header={home?"true":undefined}><PathBrand compact sigilOnly={home} afterschool={afterNav||activeHref==="/afterschool"||activeHref==="/artchitect"||activeHref==="/little-piner"||activeHref==="/pianohouse"} /><nav className={s.nav} id="path-nav-links" aria-label={ariaLabel}>{links.map(([href,title])=><a key={href} href={href} aria-current={href===activeHref?"page":undefined}>{title}</a>)}{afterNav&&<a className={s.mobileMyTimeLink} href="/mytime">MyTime by PINO</a>}</nav><div className={s.actions} id="path-nav-actions"><LocaleToggle/>{afterNav&&<a className={s.ecosystemLink} href="/mytime">MyTime by PINO</a>}<a className={s.action} href={ctaHref}>{label} {ctaHref.startsWith("https:")?"":"→"}</a></div><button className={s.menuToggle} ref={toggle} type="button" aria-label={open?"Close menu":"Open menu"} aria-expanded={open} aria-controls="path-nav-actions" onClick={()=>setOpen(v=>!v)}><span/><span/></button></header></div></div>;
}
export function PathFooter({inset=false}:LegacyProps & {leadClassName?:string;stayClassName?:string;inset?:boolean}) {
  return <footer className={s.footer+(inset?" "+s.inset:"")} data-pino-path-footer><div><PathBrand/><strong>pinohouse.art</strong><p><L vi="Nghệ thuật. Âm nhạc. Lớn lên sáng tạo." en="Art. Music. Creative Growth."/></p></div><div><h4><L vi="Khám phá" en="Explore"/></h4><a href="/afterschool">PINO Afterschool</a><a href="/mytime">MyTime by PINO</a><a href="/open-studio">Open Studio</a><a href="/#house">PINO House</a></div><div><h4><L vi="Kết nối" en="Connect"/></h4><a href="https://app.pinohouse.art">Piner App</a><a href="https://m.me/pino.house">Messenger</a><a href="https://zalo.me/0374686860">Zalo</a><a href="/policy"><L vi="Bảo mật" en="Privacy"/></a><a href="/term"><L vi="Điều khoản" en="Terms"/></a></div><small>© PINO House · PINO Notifier is the email notification service operated by PINO House.</small></footer>;
}
