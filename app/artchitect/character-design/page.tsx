import {Localized as L} from "../../localization";
import {PathHeader,PathFooter} from "../../components/path-chrome";
import styles from "./page.module.css";
const cdn="https://assets.pinohouse.art/site/Artchitect/Character/";
const asset=(name:string)=>cdn+encodeURIComponent(name);
const options=[
 {name:"Cartoon",description:"Tạo nhân vật với phong cách hoạt hình gần gũi, sinh động.",image:"Cheerful Boy with Orange Cap Emblem.png"},
 {name:"Anime & Manga",description:"Khám phá phong cách anime/manga với đường nét và biểu cảm đặc trưng.",image:"Blue-Violet Anime Girl Portrait.png"},
 {name:"Chibi",description:"Thiết kế nhân vật phiên bản đáng yêu và dễ thương.",image:"Pink-Haired Catgirl Hugging Kitty Plush.png"},
 {name:"Fantasy",description:"Sáng tạo nhân vật trong thế giới kỳ ảo và phép thuật.",image:"Hopeful Elven Druid Portrait.png"},
 {name:"Mascot",description:"Thiết kế linh vật mang dấu ấn riêng cho ý tưởng của con.",image:"Chibi Robot with Orange Scarf.png"},
 {name:"Nhân vật độc bản (OC)",description:"Phát triển nhân vật original (OC) với câu chuyện, tính cách và thế giới riêng.",image:"Anime Boy with Flowing Ochre Scarf.png"}
];
const steps=[
 {name:"Khám phá",description:"Quan sát, tìm cảm hứng và phong cách.",image:"Watercolor Binoculars of Discovery.png"},
 {name:"Thử nghiệm",description:"Phác thảo, tạo dáng và biểu cảm.",image:"Watercolor Sketchbook and Sprout Drawing.png"},
 {name:"Sáng tạo",description:"Hoàn thiện nhân vật bằng nhiều chất liệu.",image:"Watercolor Palette and Brush Wash.png"},
 {name:"Chia sẻ",description:"Giới thiệu tác phẩm và kể câu chuyện nhân vật.",image:"Watercolor Polaroid Portrait with Golden Sparkle.png"}
];
export default function Page(){return <main className={styles.page} data-pino-marketing-page data-path-theme="artchitect">
 <PathHeader activeHref="/afterschool"/>
 <div className={styles.wrap}>
  <header className={styles.hero}>
   <div className={styles.heroCopy}>
    <a className={styles.back} href="/artchitect">← Artchitect</a>
    <span className={styles.age}>7+ <L vi="tuổi" en="years"/></span>
    <p className={styles.kicker}>ARTCHITECT / SPECIALTY</p>
    <h1><L vi="Thiết Kế Nhân Vật" en="Character Design"/></h1>
    <p className={styles.lead}><L vi="Từ ý tưởng đến nhân vật của riêng con." en="From an idea to a character of your own."/></p>
   </div>
  </header>
  <section className={styles.materialSection} aria-labelledby="character-options"><div className={styles.sectionHeading}><h2 id="character-options"><L vi="Khám phá lựa chọn" en="Explore the options"/></h2></div>
   <div className={styles.grid}>{options.map((item,i)=><article className={styles.card} key={item.name} style={{backgroundImage:`url("${asset(item.image)}")`}}>
    <div className={styles.cardBody}><span className={styles.number}>{String(i+1).padStart(2,"0")}</span><h3>{item.name}</h3><p>{item.description}</p></div>
   </article>)}</div>
  </section>
  <section className={styles.process} aria-labelledby="character-journey"><div className={styles.sectionHeading}><h2 id="character-journey"><L vi="Từ khám phá đến tác phẩm" en="From discovery to creation"/></h2></div>
   <div className={styles.steps}>{steps.map((item,i)=><article className={styles.step} key={item.name}><img src={asset(item.image)} alt="" loading="lazy"/><h3>{item.name}</h3><p>{item.description}</p></article>)}</div>
  </section>
  <section className={styles.cta}><h2><L vi="Bắt đầu hành trình Artchitect" en="Begin the Artchitect journey"/></h2><p><L vi="Đây là các hướng khám phá, chưa phải lớp học đã mở đăng ký." en="These are creative directions, not confirmed scheduled classes."/></p><a href="/afterschool?path=artchitect#register"><L vi="Đăng ký tư vấn" en="Register interest"/> →</a></section>
 </div><PathFooter/>
 </main>}