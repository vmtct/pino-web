"use client";
import {useEffect} from "react";
import "./scroll-motion.css";
export default function ScrollMotion(){
 useEffect(()=>{
  const reduce=window.matchMedia("(prefers-reduced-motion: reduce)");
  if(reduce.matches)return;
  const selector="main section:not([data-home-carousel]) img, main article, main [class*='card'], main [class*='Card'], main [class*='program'], main [class*='Program'], main [class*='gallery'] img";
  const seen=new WeakSet<Element>();
  const observer=new IntersectionObserver(entries=>{
   for(const entry of entries)if(entry.isIntersecting){
    const el=entry.target as HTMLElement;
    el.classList.add("pino-motion-visible");
    observer.unobserve(el);
   }
  },{threshold:.12,rootMargin:"0px 0px -35px 0px"});
  const heroSelector="main section[class*='hero' i]:not([data-home-carousel]), main header[class*='hero' i], main div[class*='hero' i][class*='section' i]";
  const scan=()=>{
   document.querySelectorAll<HTMLElement>(heroSelector).forEach((hero)=>{
    const blocks=hero.querySelectorAll<HTMLElement>("[class*='heroCopy' i], [class*='heroContent' i], [class*='concept-copy' i], :scope > div:first-child:not([class*='visual' i]):not([class*='media' i])");
    blocks.forEach(block=>{
     if(block.parentElement?.closest("[class*='heroCopy' i], [class*='heroContent' i], [class*='concept-copy' i]"))return;
     if(seen.has(block)||block.closest("[data-home-carousel]"))return;
     seen.add(block);
     block.classList.add("pino-hero-entry",(block.getBoundingClientRect().left+block.getBoundingClientRect().width/2)>innerWidth*.55?"pino-hero-from-right":"pino-hero-from-left");
     observer.observe(block);
    });
   });
   document.querySelectorAll<HTMLElement>(selector).forEach(el=>{
    if(seen.has(el)||el.closest("[data-home-carousel]"))return;
    seen.add(el);
    el.classList.add("pino-motion-pending");
    observer.observe(el);
   });
  };
  scan();
  const mutations=new MutationObserver(scan);
  mutations.observe(document.body,{childList:true,subtree:true});
  return ()=>{mutations.disconnect();observer.disconnect();};
 },[]);
 return null;
}
