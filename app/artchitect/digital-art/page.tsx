import type {Metadata} from "next";
import {Localized as L} from "../../localization";
import {PathHeader,PathFooter} from "../../components/path-chrome";
import Showcase from "./showcase";
import s from "./page.module.css";
export const metadata:Metadata={title:"Mỹ thuật số | Artchitect · PINO House",description:"Chuyên đề Mỹ thuật số dành cho học viên Artchitect gói 36 buổi có sẵn tablet hoặc laptop."};
const asset="https://assets.pinohouse.art/site/Artchitect/";
// PAP-2310 media slots: replace transition sketch / digital artwork and eligibility image later.
// Hero intentionally reuses the Digital Art slide image from app/home-hero.tsx.
export default function DigitalArtPage(){return <main className={s.page} data-pino-marketing-page data-path-theme="artchitect"><PathHeader activeHref="/afterschool"/>
<header className={s.hero}><div className={s.heroCopy}><a className={s.back} href="/artchitect">← Artchitect / Mỹ Thuật Sáng Tạo</a><span className={s.kicker}>ARTCHITECT / CHUYÊN ĐỀ 36 BUỔI</span><h1><L vi="Từ nét vẽ đến thế giới số." en="From drawing to digital worlds."/></h1><p><L vi="Khi trí tưởng tượng gặp công nghệ, mỗi ý tưởng có thêm một cách để thành hình." en="Where imagination meets technology, ideas find new ways to take shape."/></p><div className={s.heroActions}><a className={s.button} href="#eligibility">Tìm hiểu điều kiện tham gia </a><span className={s.micro}>Chỉ áp dụng gói Artchitect 36 buổi · Cần có sẵn tablet hoặc laptop</span></div></div><div className={s.heroMedia}><img src={asset+"Digi/Cozy%20Digital%20Art%20Workspace.png"} alt="Không gian sáng tác mỹ thuật số"/><span className={s.mediaLabel}>DIGITAL ART STUDIO · PINO</span></div></header>
<div className={s.wrap}>
<section className={s.transition} aria-labelledby="bridge"><div className={s.sectionIntro}><span className={s.kicker}>01 / NỀN TẢNG</span><h2 id="bridge">Từ mỹ thuật nền tảng<br/><em>đến sáng tạo trên công cụ số.</em></h2><p>Kế thừa tư duy quan sát, hình khối và màu sắc từ mỹ thuật truyền thống, học viên tiếp tục mở rộng khả năng sáng tạo trong môi trường số.</p></div><div className={s.bridgeMedia}><img src={asset+"Digi/From%20Sketch%20to%20Digital%20Adventure.png"} alt="Từ bản phác thảo đến tác phẩm mỹ thuật số trên tablet"/></div></section>
<section className={s.showcaseSection} aria-labelledby="directions"><div className={s.sectionIntro}><span className={s.kicker}>02 / KHÁM PHÁ</span><h2 id="directions">Ba hướng sáng tạo.<br/><em>Vô vàn cách kể chuyện.</em></h2></div><Showcase/></section>

<section className={s.eligibility} id="eligibility" aria-labelledby="eligibility-heading"><div className={s.eligibilityCopy}><span className={s.kicker}>03 / ĐIỀU KIỆN THAM GIA</span><h2 id="eligibility-heading">Dành cho hành trình Artchitect · 36 buổi</h2><p>Mỹ thuật số là chuyên đề mở rộng trong hành trình Artchitect, không phải khóa học đăng ký độc lập.</p><div className={s.conditions}><div><span>01</span><strong>Gói học Artchitect 36 buổi</strong></div><div><span>02</span><strong>Có sẵn tablet hoặc laptop phù hợp</strong></div></div><a className={s.button} href="/afterschool?path=artchitect#register">Tư vấn gói Artchitect 36 buổi </a><a className={s.subLink} href="/artchitect">Quay lại Mỹ Thuật Sáng Tạo →</a></div><img src={asset+"Digi/Banner.png"} alt="" /></section>
</div><PathFooter/></main>}
