"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Localized as L } from "./localization";
import {WorkTitle,OriginalTitle} from "./product-language";

const PIANO_ASSET = "https://assets.pinohouse.art/site/pianohouse";
const ART_ASSET = "https://assets.pinohouse.art/site/Artchitect";

export default function PublicEnhancements() {
  const pathname = usePathname();
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const page = pathname === "/" ? "home" : pathname === "/artchitect" ? "artchitect" : pathname === "/pianohouse" ? "pianohouse" : "other";
    document.body.dataset.publicPage = page;
    if (page !== "artchitect" || pathname === "/artchitect") { setHost(null); return; }
    const main = document.querySelector("main");
    const hero = main?.querySelector(":scope > section:first-of-type");
    if (!main || !hero) return;
    const node = document.createElement("div");
    node.dataset.monthlyHost = page;
    hero.insertAdjacentElement("afterend", node);
    setHost(node);
    return () => { node.remove(); setHost(null); };
  }, [pathname]);

  if (!host) return null;
  const piano = pathname === "/pianohouse";
  const cards = piano ? [
    { tagVi:"NHẠC CỔ ĐIỂN", tagEn:"CLASSICAL", title:"Für Elise", titleEn:"Für Elise", image:`${PIANO_ASSET}/grand-piano-in-sunlit-living-room.png`, vi:"Một biểu tượng của piano cổ điển để làm quen phrasing, tương phản và sắc thái.", en:"A classical icon for phrasing, contrast, and musical nuance." },
  ] : [
    { tagVi:"MINH HỌA", tagEn:"ILLUSTRATION", title:"Màu Nước", titleEn:"Watercolor", image:`${ART_ASSET}/watercolor-painting-closeup.png`, vi:"Khám phá loang màu, sắc độ và những lớp trong suốt để tạo nên minh họa giàu cảm xúc.", en:"Wash, value, and transparent layers for expressive illustration." },
    { tagVi:"NHÂN VẬT", tagEn:"CHARACTER", title:"Vẽ Chibi", titleEn:"Chibi Drawing", image:`${ART_ASSET}/character-design-sketchbook.png`, vi:"Khám phá tỉ lệ, biểu cảm và tạo hình để xây dựng một nhân vật chibi có cá tính riêng.", en:"Explore proportion, expression, and playful character design." },
  ];

  return createPortal(<section className={`pino-monthly ${piano ? "pino-monthly--piano" : "pino-monthly--art"}`}><div className="pino-monthly__lead"><span><L vi="Chuyên đề tháng này" en="This month’s themes" /></span><h2><L vi={piano ? "Một bản nhạc nổi bật" : "Hai lối vào thế giới hình ảnh"} en={piano ? "One featured piece" : "Two ways into the visual world"} /></h2><p><L vi={piano ? "Một tác phẩm piano cổ điển để con khám phá kỹ thuật và biểu cảm trong tháng này." : "Mỗi tháng, hai chuyên đề mở ra một chất liệu và một cách tạo hình mới để trẻ khám phá sâu hơn."} en={piano ? "One classical piano piece to explore technique and expression this month." : "Each month, Artchitect opens two focused themes for exploring a new medium or way of making."} /></p></div><div className="pino-monthly__grid">{cards.map(card => <article className="pino-monthly__card" key={card.title}><img src={card.image} alt=""/><div><span><L vi={card.tagVi} en={card.tagEn} /></span><h3>{piano?<WorkTitle name={card.title}/>:<L vi={card.title} en={card.titleEn}/>}</h3>{piano&&<OriginalTitle name={card.title}/>}<p><L vi={card.vi} en={card.en} /></p><a href="/open-studio"><L vi={piano ? "Xem chuyên đề" : "Khám phá chuyên đề"} en="Explore theme" /> →</a></div></article>)}</div></section>, host);
}
