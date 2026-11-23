import {Localized as L} from "./localization";
import s from "./product-language.module.css";
export const keywords={
 "Little Piner":{vi:"Đa giác quan",en:"Multisensory"},
 "Artchitect":{vi:"Tranh nguyên bản · Thiết kế nhân vật",en:"Original Canvas · Character Design"},
 "PianoHouse":{vi:"Cổ điển · Đương đại",en:"Classical · Contemporary"}
} as const;
export function BranchDescription({branch}:{branch:keyof typeof keywords}){
 const emphasis=(word:string)=><strong data-branch-keyword className={s.keyword}>{word}</strong>;
 const copy={
  "Little Piner":{vi:<>Con khám phá thế giới <>{emphasis("đa giác quan")}</> qua mỹ thuật và âm nhạc, nuôi dưỡng trí tò mò và niềm vui sáng tạo.</>,en:<>Children discover the world through {emphasis("multisensory")} art and music experiences that nurture curiosity and creative joy.</>},
  "Artchitect":{vi:<>Con biến ý tưởng thành tác phẩm mang dấu ấn riêng qua {emphasis("tranh nguyên bản")} và {emphasis("thiết kế nhân vật")}.</>,en:<>Children turn their ideas into works of their own through {emphasis("Original Canvas")} and {emphasis("Character Design")}.</>},
  "PianoHouse":{vi:<>Con khám phá âm nhạc {emphasis("cổ điển")} và {emphasis("đương đại")}, thể hiện cảm xúc qua phím đàn và tự tin biểu diễn.</>,en:<>Children explore {emphasis("classical")} and {emphasis("contemporary")} music, express themselves through the piano and grow into confident performers.</>}
 };
 return <span className={s.description} data-branch-description={branch}><L {...copy[branch]}/></span>
}
const artTitles:Record<string,string>={
 "The Mountain":"Ngọn núi","Forest Spirit":"Linh hồn rừng xanh","Sunday Matcha":"Matcha ngày chủ nhật","Moonlit City":"Thành phố dưới trăng","Pink Hour":"Khoảnh khắc hồng","Blue Porcelain":"Gốm sứ xanh","Cactus & Clay":"Xương rồng và đất nung"
};
export const musicCredits:Record<string,string>={
 "Für Elise":"Ludwig van Beethoven",
 "A Thousand Years":"Christina Perri · David Hodges",
 "My Heart Will Go On":"James Horner · Will Jennings",
 "Kiss The Rain":"Yiruma",
 "Kiss the Rain":"Yiruma",
 "Always With Me":"Youmi Kimura · Wakako Kaku",
 "Comptine d’un autre été":"Yann Tiersen",
 "Song from a Secret Garden":"Rolf Løvland",
 "One Summer Day":"Joe Hisaishi",
 "Merry-Go-Round of Life":"Joe Hisaishi",
 "Path of the Wind":"Joe Hisaishi",
 "River Flows in You":"Yiruma",
 "Nuvole Bianche":"Ludovico Einaudi",
 "Tong Hua":"Michael Wong",
 "Comptine d’un autre été: L’après-midi":"Yann Tiersen"
};
export function WorkTitle({name}:{name:string}){return musicCredits[name]?<>{name}</>:<L vi={artTitles[name]??name} en={name}/>}
export function OriginalTitle({name}:{name:string}){return musicCredits[name]?<span className={s.original} data-music-credit>{musicCredits[name]}</span>:artTitles[name]?<L vi={<span className={s.original}>{name}</span>} en={null}/>:null}
export function WorkList({names}:{names:string[]}){return <span className={s.works}>{names.map(name=><span className={s.work} key={name}><span><WorkTitle name={name}/></span><OriginalTitle name={name}/></span>)}</span>}
