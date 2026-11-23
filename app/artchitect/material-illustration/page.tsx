import {Localized as L} from "../../localization";
import {PathHeader,PathFooter} from "../../components/path-chrome";
import styles from "./page.module.css";

const cdn = "https://assets.pinohouse.art/site/Artchitect/Illustration/";
const asset = (name: string) => cdn + encodeURIComponent(name);
const materials = [
  {name:"Màu nước",en:"Watercolor",description:"Nhẹ nhàng, trong trẻo với những lớp màu loang tự nhiên.",image:"Watercolor Mountain Lake Studio Setup.png"},
  {name:"Acrylic",en:"Acrylic",description:"Sắc màu rực rỡ, giàu kết cấu và tự do thể hiện.",image:"Acrylic Sunset Seascape Painting Tools.png"},
  {name:"Gouache",en:"Gouache",description:"Mảng màu mịn, sắc nét để kể những câu chuyện nhỏ.",image:"Gouache Countryside Cottage Meadow.png"},
  {name:"Bút marker",en:"Markers",description:"Nét vẽ sống động, tự tin với bảng màu cá tính.",image:"Anime Girl with Colorful Marker Pens.png"},
  {name:"Chì màu & pastel",en:"Colored pencils & pastel",description:"Chạm vào chất liệu mềm mại, giàu sắc độ và cảm xúc.",image:"Pastel Cat Portrait with Art Supplies.png"},
  {name:"Mixed media",en:"Mixed media",description:"Kết hợp giấy, màu và nhiều chất liệu thành tác phẩm riêng.",image:"Torn Paper Collage with Dried Flowers.png"},
];
const steps=[
  {vi:"Khám phá",en:"Explore",image:"Watercolor Telescope Under Lavender Skies-1.png",description:"Quan sát và tìm cảm hứng."},
  {vi:"Thử nghiệm",en:"Experiment",image:"Watercolor Palette with Paintbrush and Splashes-2.png",description:"Chơi với màu sắc và chất liệu."},
  {vi:"Sáng tạo",en:"Create",image:"Watercolor Test Tube with Bubbles-3.png",description:"Biến ý tưởng thành tác phẩm."},
  {vi:"Chia sẻ",en:"Share",image:"Dreamy Watercolor Landscape Frame-4.png",description:"Kể câu chuyện của riêng mình."},
];
export default function Page(){
  return <main className={styles.page} data-pino-marketing-page data-path-theme="artchitect">
    <PathHeader activeHref="/afterschool"/>
    <div className={styles.wrap}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <a className={styles.back} href="/artchitect">← Artchitect</a>
          <span className={styles.age}>7+ <L vi="tuổi" en="years"/></span>
          <p className={styles.kicker}>ARTCHITECT / SPECIALTY</p>
          <h1><L vi="Minh Họa Chất Liệu" en="Mixed-Media Illustration"/></h1>
          <p className={styles.lead}><L vi="Một ý tưởng. Nhiều cách thể hiện." en="One idea. Many ways to express it."/></p>
          <p className={styles.intro}><L vi="Khám phá thế giới hội họa qua màu sắc, đường nét và những chất liệu đầy bất ngờ." en="Discover a world of art through colors, lines, and surprising materials."/></p>
        </div>
      </header>
      <section className={styles.materialSection} aria-labelledby="materials-title">
        <div className={styles.sectionHeading}><p className={styles.eyebrow}>01 / MATERIALS</p><h2 id="materials-title"><L vi="Mỗi chất liệu, một thế giới" en="A world in every medium"/></h2><p><L vi="Sáu cách khám phá để mỗi bạn nhỏ tìm thấy ngôn ngữ sáng tạo của riêng mình." en="Six creative approaches to discover a personal artistic voice."/></p></div>
        <div className={styles.grid}>{materials.map((item,i)=><article className={styles.card} key={item.name} style={{backgroundImage:`url("${asset(item.image)}")`}}>
          <div className={styles.cardBody}><span className={styles.number}>{String(i+1).padStart(2,"0")} / 06</span><h3><L vi={item.name} en={item.en}/></h3><p>{item.description}</p></div>
        </article>)}</div>
      </section>
      <section className={styles.process} aria-labelledby="process-title">
        <div className={styles.sectionHeading}><p className={styles.eyebrow}>02 / THE JOURNEY</p><h2 id="process-title"><L vi="Từ khám phá đến tác phẩm" en="From discovery to creation"/></h2><p><L vi="Không chỉ học một kỹ thuật — mỗi hành trình mở ra một cách nhìn và một câu chuyện mới." en="More than learning a technique: each journey opens a new perspective and story."/></p></div>
        <div className={styles.steps}>{steps.map((step,i)=><article className={styles.step} key={step.vi}><img src={asset(step.image)} alt="" loading="lazy"/><span className={styles.stepNumber}>0{i+1}</span><h3><L vi={step.vi} en={step.en}/></h3><p>{step.description}</p></article>)}</div>
      </section>
      <section className={styles.cta}>
        <div className={styles.ctaContent}><p className={styles.eyebrow}>YOUR CREATIVE JOURNEY</p><h2><L vi="Để trí tưởng tượng dẫn lối" en="Let imagination lead the way"/></h2><p><L vi="Mỗi tác phẩm bắt đầu bằng một điều tò mò. Cùng PINO nuôi dưỡng điều ấy." en="Every artwork begins with curiosity. Nurture it with PINO."/></p><a href="/afterschool?path=artchitect#register"><L vi="Đăng ký tư vấn" en="Register interest"/> </a><small><L vi="Các hướng khám phá chưa phải lớp học đã mở đăng ký." en="Creative directions shown are not confirmed scheduled classes."/></small></div>
      </section>
    </div>
    <PathFooter/>
  </main>;
}
