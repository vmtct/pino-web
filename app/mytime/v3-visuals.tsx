// PAP-2176: static original V3 illustrations ported to native JSX; no prototype runtime.
export function HeroVisual(){return (<div className="hero-visual" aria-label="Minh họa Acrylic và Piano ở MyTime">
          <div className="visual-backdrop"></div>
          <div className="visual-sun"></div>
          <div className="hero-paint-card">
            <div className="art-label">MYTIME / 01 <span>ACRYLIC</span></div>
            <div className="hero-painting">
              <svg viewBox="0 0 430 465" role="img" aria-label="Bức tranh phong cảnh với núi, hoa và mặt trời" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e5c6a9"/><stop offset=".54" stopColor="#e9d8bb"/><stop offset="1" stopColor="#b8bbb0"/></linearGradient>
                  <linearGradient id="hillGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#718e7b"/><stop offset="1" stopColor="#4b736a"/></linearGradient>
                </defs>
                <rect width="430" height="465" fill="url(#skyGrad)"/>
                <circle cx="316" cy="115" r="73" fill="#f6df9e" opacity=".9"/>
                <path d="M0 260 C90 200 172 220 258 262 S397 282 430 242 L430 465 L0 465 Z" fill="#9ba994"/>
                <path d="M0 312 C72 270 166 275 240 300 S357 344 430 300 L430 465 L0 465 Z" fill="url(#hillGrad)"/>
                <path d="M0 367 Q95 323 192 358 Q311 400 430 336 L430 465 L0 465 Z" fill="#38594e"/>
                <path d="M-20 434 C80 401 142 450 242 409 S378 421 460 395" fill="none" stroke="#c8b388" strokeWidth="12" opacity=".65"/>
                <g stroke="#263f37" strokeWidth="3" fill="none" strokeLinecap="round"><path d="M110 467 Q116 391 89 330"/><path d="M145 467 Q135 411 169 354"/><path d="M347 465 Q356 398 330 355"/><path d="M365 467 Q364 410 392 378"/></g>
                <g fill="#e9b99b"><ellipse cx="81" cy="331" rx="10" ry="24" transform="rotate(-25 81 331)"/><ellipse cx="100" cy="332" rx="10" ry="24" transform="rotate(24 100 332)"/><ellipse cx="89" cy="314" rx="11" ry="23"/></g>
                <g fill="#f0dfc3"><ellipse cx="164" cy="362" rx="11" ry="27" transform="rotate(-35 164 362)"/><ellipse cx="181" cy="361" rx="11" ry="24" transform="rotate(20 181 361)"/><ellipse cx="172" cy="341" rx="11" ry="24"/></g>
                <g fill="#dca28a"><ellipse cx="324" cy="357" rx="9" ry="24" transform="rotate(-30 324 357)"/><ellipse cx="341" cy="356" rx="9" ry="22" transform="rotate(28 341 356)"/></g>
                <g fill="#e2b87e"><circle cx="90" cy="333" r="8"/><circle cx="172" cy="362" r="7"/><circle cx="333" cy="359" r="7"/></g>
              </svg>
            </div>
            <p>Paint your ordinary days.</p>
          </div>
          <div className="hero-piano-card">
            <div className="piano-card-heading"><span>MYTIME / 02</span><span className="piano-spark" aria-hidden="true">✧</span></div>
            <p>Play the song<br/><em>you love.</em></p>
            <div className="keyboard" aria-hidden="true">
              <div className="white-keys"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
              <div className="black-keys"><i></i><i></i><i className="gap"></i><i></i><i></i><i></i><i className="gap"></i><i></i></div>
            </div>
          </div>
          <div className="hero-stamp" aria-hidden="true"><span>MAKE</span><span>✳</span><span>PLAY</span></div>
          <p className="hero-visual-caption">Little things, lovely days. <span>— MyTime</span></p>
        </div>);}
export function ArtVisual(){return (<div className="program-hero-visual" aria-hidden="true"><div className="program-art-halo"></div><div className="program-art-easel"><div className="program-art-work"><span className="program-art-sun"></span><span className="program-art-ridge one"></span><span className="program-art-ridge two"></span><span className="program-art-flower">✿</span></div><span className="program-art-caption">a painting of your own</span></div><span className="program-art-sticker">paint<br/><em>what you love</em> ♡</span></div>);}
export function PianoVisual(){return (<div className="program-hero-visual" aria-hidden="true"><div className="program-music-halo"></div><div className="program-music-sheet"><span>MyTime · your song</span><strong>♪ &#160; ♫ &#160; ♪</strong><em>the next little phrase...</em></div><div className="program-music-piano"><div className="program-music-whites"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div className="program-music-blacks"><i></i><i></i><i></i><i></i><i></i><i></i></div></div><span className="program-music-sticker">one note<br/><em>at a time ♡</em></span></div>);}
export function ArtExperience(){return (<div className="experience-art">
              <div className="art-poster art-poster-main"><div className="mini-art-landscape"><span className="mini-sun"></span><span className="mini-mountain one"></span><span className="mini-mountain two"></span><span className="mini-plant">✳</span></div><small>Little landscapes, big feelings.</small></div>
              <div className="brush-stroke brush-one"></div><div className="brush-stroke brush-two"></div>
              <span className="art-annotation">a canvas for your<br/>everyday wonders </span>
            </div>);}
export function PianoExperience(){return (<div className="experience-art">
              <div className="piano-illustration"><div className="piano-sheet"><span>your song, your pace</span><i>♪ ♩ ♪ ♫</i><b>the next few notes...</b></div><div className="piano-full-keys"><div className="piano-whites"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div className="piano-blacks"><i></i><i></i><i className="key-gap"></i><i></i><i></i><i></i><i className="key-gap"></i><i></i><i></i></div></div></div>
              <span className="music-note note-a" aria-hidden="true">♪</span><span className="music-note note-b" aria-hidden="true">♫</span>
            </div>);}
