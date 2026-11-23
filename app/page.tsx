import type { Metadata } from "next";
import { Localized as L } from "./localization";
import {PathHeader,PathFooter} from "./components/path-chrome";
import s from "./product-home.module.css";
import HomeHero from "./home-hero";


export const metadata: Metadata = {
  title: "PINO — Afterschool & MyTime | PINO House",
  description: "Khám phá nghệ thuật và âm nhạc tại PINO House. PINO Afterschool dành cho trẻ và MyTime by PINO dành cho người lớn.",
};
const assets = "https://assets.pinohouse.art/site/homepage";
export default function Home() {
  return <main className={s.page} id="pino-home" data-pino-marketing-page>
    <PathHeader inset home/>
    <HomeHero/>
    <section className={s.studioIntro} id="studio" aria-labelledby="studio-title"><img src={"https://assets.pinohouse.art/site/OpenStudio/Revise/Seashell%20Art%20in%20the%20Cozy%20Studio.png"} alt="" loading="lazy"/><div><span className={s.eyebrow}>PINO HOUSE · OPEN STUDIO</span><h2 id="studio-title">Open Studio</h2><p><L vi="Một buổi ghé chơi, một khám phá mới. Cùng con trải nghiệm nghệ thuật và âm nhạc trong không gian sáng tạo của PINO, theo lịch hoạt động mỗi tuần." en="One visit, one new discovery. Explore art and music with your child at PINO’s creative home through weekly experiences."/></p><a className={s.studioAction} href="/open-studio"><L vi="Khám phá lịch Open Studio" en="Explore Open Studio schedule"/> →</a></div></section>
    <section className={s.programIntro} aria-labelledby="program-title"><span className={s.eyebrow}>TWO WAYS TO CREATE</span><h2 id="program-title"><L vi="Một ngôi nhà, hai hành trình." en="One house, two journeys."/></h2></section>
    <span id="paths" aria-hidden="true"/><span id="stories" aria-hidden="true"/><span id="collections" aria-hidden="true"/><span id="journey" aria-hidden="true"/><span id="why-pino" aria-hidden="true"/>
    <section className={s.programs} id="programs" aria-label="PINO programs">
      <a className={s.program} id="afterschool" href="/afterschool"><img src={"https://assets.pinohouse.art/site/homepage/Revise%20221126/Blank%20Watercolor%20Text%20Panel.png"} alt=""/><div><span className={s.eyebrow}><L vi="DÀNH CHO TRẺ" en="FOR CHILDREN"/></span><h2>PINO<br/>Afterschool</h2><p><L vi="Hết giờ học, đến giờ con khám phá." en="After school, it's time to explore."/></p><span className={s.button}><L vi="Khám phá cùng con" en="Explore with your child"/> →</span></div></a>
      <a className={s.program+" "+s.adult} id="mytime" href="/mytime"><img src={"https://mytime.pinohouse.art/acrylic/Cozy%20Studio%20Painting%20with%20Blue%20Skies.png"} alt=""/><div><span className={s.eyebrow}><L vi="DÀNH CHO BẠN" en="FOR YOU"/></span><h2>MyTime<br/><small>by PINO</small></h2><p><L vi="Hết những bận rộn, đến giờ mình tận hưởng." en="Beyond the busy day, make time for yourself."/></p><span className={s.button}><L vi="Tìm thời gian cho mình" en="Find your own time"/> →</span></div></a>
    </section>
    <span id="about" aria-hidden="true"/><section className={s.house} id="house"><img src={assets+"/creative-studio-entrance-hall.png"} alt="PINO House" loading="lazy"/><div><span className={s.eyebrow}>PINO HOUSE · CẦN THƠ</span><h2><L vi="Cùng ghé ngôi nhà của PINO." en="Come visit the PINO House."/></h2><p><L vi="Nghệ thuật, âm nhạc và những khoảnh khắc sáng tạo, ở cùng một nơi." en="Art, music and creative moments, in one place."/></p><a className={s.button} href="/open-studio"><L vi="Khám phá Open Studio" en="Explore Open Studio"/> →</a></div></section>
    <PathFooter inset/>
  </main>;
}
