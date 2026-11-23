import s from "./mytime-illustration.module.css";
export default function MyTimeIllustration({mode}:{mode:"acrylic"|"piano"|"both"}){return <div className={s.stage} data-mode={mode} aria-hidden="true">
{mode!=="piano"&&<div className={s.frame}><span>MYTIME / 01 · ACRYLIC</span><div className={s.canvas}><i/><b/><em/></div><small>make something your own.</small></div>}
{mode!=="acrylic"&&<div className={s.piano}><span>MYTIME / 02 · PIANO</span><strong>Play the song<br/>you love.</strong><div className={s.keys}>{Array.from({length:8},(_,i)=><i data-black={[0,1,3,4,5].includes(i)} key={i}/>)}</div></div>}
<div className={s.seal}>MAKE<br/>✳<br/>PLAY</div>
</div>}
