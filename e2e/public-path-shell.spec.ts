import { expect, test } from '@playwright/test';

const paths = [
  { route: '/pianohouse', locale: 'vi' },
  { route: '/artchitect', locale: 'en' },
  { route: '/little-piner', locale: 'en' },
  { route: '/open-studio', locale: 'en' },
] as const;

for (const path of paths) {
  test(`${path.route} uses the shared PINO path chrome`, async ({ page }) => {
    await page.goto(`${path.route}?lang=${path.locale}`);

    const header = page.locator('[data-pino-path-header]');
    const footer = page.locator('[data-pino-path-footer]');
    await expect(header).toBeVisible();
    await expect(footer).toBeVisible();

    const expectedNav = ['/afterschool', '/afterschool#paths', '/afterschool/community', '/open-studio'];
    await expect(header.locator('nav a')).toHaveCount(expectedNav.length);
    expect(await header.locator('nav a').evaluateAll((links) => links.map((link) => link.getAttribute('href')))).toEqual(expectedNav);
    await expect(header.locator('nav a[href="/open-studio"]')).toContainText('Open Studio');
    if(path.route !== '/open-studio') await expect(header.locator('a[href="https://app.pinohouse.art"]')).toContainText('Piner App');

    await expect(footer.locator('a[href="/"]').first()).toContainText('PINO House');
    await expect(footer.locator('strong').first()).toContainText('pinohouse.art');
  });
}

test('Open Studio uses a contextual schedule CTA and hides its legacy chrome', async ({ page }) => {
  await page.goto('/open-studio?lang=vi');
  await expect(page.locator('[data-pino-path-header] a[href="#sessions"]')).toContainText('Xem lịch');
  await expect(page.locator('.open-studio-page > .os-site-header')).toBeHidden();
  await expect(page.locator('.open-studio-page > .os-footer')).toBeHidden();
});

for(const width of [320,390,1440]){test("all six PINO marketing navs visible "+width,async({page})=>{test.setTimeout(90000);await page.setViewportSize({width,height:900});for(const route of ["/","/afterschool","/little-piner","/artchitect","/pianohouse","/open-studio"]){await page.goto(route+"?lang=vi");const header=page.locator("[data-pino-path-header]");await expect(header).toBeVisible();const nav=header.locator("nav");await expect(nav).toBeVisible();await expect(nav.locator("a")).toHaveCount(route==="/"?3:4);for(const link of await nav.locator("a").all()){await expect(link).toBeVisible();const box=await link.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width+1);expect(box!.height).toBeGreaterThanOrEqual(44);}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}})}

for(const width of [390,1440]) {
  test("fixed header scroll threshold and reveal "+width,async({page})=>{
    await page.setViewportSize({width,height:844});
    await page.emulateMedia({reducedMotion:"reduce"});
    await page.goto("/afterschool?lang=vi");
    const frame=page.locator("[data-pino-header-state]");
    const header=page.locator("[data-pino-path-header]");
    const slot=frame.locator("..");
    await expect(frame).toHaveAttribute("data-pino-header-state","visible");
    await expect(frame).toHaveCSS("position","fixed");
    const height=(await header.boundingBox())!.height;
    expect(Math.round((await slot.boundingBox())!.height)).toBe(Math.round(height));
    await page.evaluate(()=>window.scrollTo({top:79,behavior:"instant"}));
    await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBe(79);
    await expect(frame).toHaveAttribute("data-pino-header-state","visible");
    await page.evaluate(()=>window.scrollTo({top:80,behavior:"instant"}));
    await expect(frame).toHaveAttribute("data-pino-header-state","hidden");
    await expect.poll(async()=>Math.round((await frame.boundingBox())!.y)).toBe(-Math.round(height));
    await page.evaluate(()=>window.scrollTo({top:240,behavior:"instant"}));
    await expect(frame).toHaveAttribute("data-pino-header-state","hidden");
    await page.evaluate(()=>window.scrollTo({top:160,behavior:"instant"}));
    await expect(frame).toHaveAttribute("data-pino-header-state","visible");
    await expect.poll(async()=>Math.round((await frame.boundingBox())!.y)).toBe(0);
    expect(Math.round((await slot.boundingBox())!.height)).toBe(Math.round(height));
    await page.evaluate(()=>window.scrollTo({top:260,behavior:"instant"}));
    await expect(frame).toHaveAttribute("data-pino-header-state","hidden");
    await header.locator("nav a").first().focus();
    await expect(frame).toHaveAttribute("data-pino-header-state","visible");
    await header.locator("nav a").first().blur();
    await page.evaluate(()=>window.scrollTo({top:0,behavior:"instant"}));
    await expect(frame).toHaveAttribute("data-pino-header-state","visible");
  });
}

for(const width of [320,390,1440])test("MyTime V3 independent chrome and registration "+width,async({page})=>{
 test.setTimeout(90000);await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:"reduce"});
 for(const route of ["/mytime","/mytime/acrylic","/mytime/piano","/mytime/register"]){
  await page.goto(route+"?lang=vi");const header=page.locator("[data-mytime-header]");await expect(header).toBeVisible();await expect(page.locator(".mytime-v3")).toHaveCount(1);await expect(page.locator("[data-pino-path-header]")).toHaveCount(0);
  if(width<=900){await header.getByRole("button",{name:"Open menu"}).click();const nav=page.getByRole("navigation",{name:"MyTime mobile"});await expect(nav.getByRole("link",{name:"PINO Afterschool",exact:true})).toHaveAttribute("href","/afterschool");await expect(nav.getByRole("link",{name:/Workshop tuần này/})).toHaveAttribute("href","/mytime/acrylic#workshop-schedule");await expect(nav.getByRole("link",{name:"PINO House",exact:true})).toHaveCount(0);await expect(nav.getByRole("link",{name:"Acrylic"})).toBeVisible();await expect(nav.getByRole("link",{name:"PINO Afterschool",exact:true})).toHaveCSS("border-top-width","0px");await expect(nav.getByRole("link",{name:"PINO Afterschool",exact:true})).toHaveCSS("border-bottom-width","0px");await expect(nav.getByRole("link",{name:"PINO Afterschool",exact:true})).toHaveCSS("text-decoration-line","underline");await page.keyboard.press("Escape");await expect(nav).toHaveCount(0)}
  else {await expect(header.getByRole("link",{name:"PINO Afterschool",exact:true})).toHaveAttribute("href","/afterschool");await expect(header.getByRole("link",{name:/Workshop tuần này/})).toHaveAttribute("href","/mytime/acrylic#workshop-schedule");await expect(header.locator(".desktop-nav a")).toHaveCount(3);const layout=await header.evaluate(el=>{const rect=(s:Element):{left:number;right:number;center:number}=>{const r=s.getBoundingClientRect();return {left:r.left,right:r.right,center:r.left+r.width/2}};const brand=rect(el.querySelector(".brand")!);const nav=el.querySelector(".desktop-nav")!;const actions=el.querySelector(".header-actions")!;const visible=(parent:Element):ReturnType<typeof rect>[]=>Array.from(parent.children).filter((x:Element)=>getComputedStyle(x).display!=="none"&&x.getBoundingClientRect().width>0).map((x:Element)=>rect(x));const gaps=(items:ReturnType<typeof rect>[])=>items.slice(1).map((x,i)=>x.left-items[i].right);return {brand,nav:rect(nav),actions:rect(actions),navItems:visible(nav),actionItems:visible(actions),navGaps:gaps(visible(nav)),actionGaps:gaps(visible(actions)),width:innerWidth}});expect(Math.abs(layout.brand.center-layout.width/2)).toBeLessThanOrEqual(1);expect(layout.nav.right).toBeLessThan(layout.brand.left);expect(layout.actions.left).toBeGreaterThan(layout.brand.right);expect(layout.navItems).toHaveLength(3);expect(layout.actionItems).toHaveLength(3);expect(Math.max(...layout.navGaps)-Math.min(...layout.navGaps)).toBeLessThanOrEqual(1);expect(Math.max(...layout.actionGaps)-Math.min(...layout.actionGaps)).toBeLessThanOrEqual(1);}await expect(page.locator('[data-contact-brand="mytime"] button')).toHaveCSS("background-color","rgb(105, 118, 61)");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.goto("/mytime/register?program=acrylic&interest=Daydream%20Club&lang=vi");const form=page.locator(".mytime-v3 form");await expect(form.locator("fieldset")).toBeEnabled();await expect(form.locator("[name=program]")).toHaveValue("acrylic");await expect(form.locator("[name=interest]")).toHaveValue("Daydream Club");await form.locator("[name=name]").fill("QA Synthetic");await form.locator("[name=phone]").fill("0900000000");await form.locator("[name=consent]").check();const writes:string[]=[];page.on("request",r=>{if(!["GET","HEAD"].includes(r.method()))writes.push(r.url())});await form.getByRole("button",{name:/Đăng ký quan tâm/}).click();await expect(form.getByRole("status")).toContainText("Chưa gửi đăng ký");expect(writes).toEqual([]);expect(page.url()).not.toContain("0900000000");
});
test("MyTime registration no JavaScript fail closed",async({browser})=>{const ctx=await browser.newContext({javaScriptEnabled:false});try{const page=await ctx.newPage();await page.goto("http://192.168.1.6:8811/mytime/register");await expect(page.locator(".mytime-v3 fieldset")).toHaveAttribute("disabled","");await expect(page.locator(".mytime-v3 input[name=phone]")).toBeDisabled();}finally{await ctx.close()}});

for(const width of [320,390,1440])test("V3 collection dialog parity "+width,async({page})=>{
 await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:"reduce"});
 await page.goto("/mytime/piano?lang=vi");
 const opener=page.locator(".mt-collection-card").filter({has:page.getByRole("heading",{name:"Rainy Piano",exact:true})}).getByRole("button",{name:/Khám phá bộ sưu tập/});
 await opener.click();const modal=page.getByRole("dialog",{name:"Rainy Piano"});await expect(modal).toBeVisible();await expect(modal.locator(".collection-artwork-item")).toHaveCount(4);
 await expect(modal.locator(".collection-artwork-item").filter({hasText:"Kiss The Rain"})).toContainText("Yiruma");
 const box=(await modal.boundingBox())!;expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width+1);
 await expect(modal.getByRole("button",{name:"Play demo Kiss The Rain for Kiss The Rain",exact:true})).toBeVisible();
 await page.keyboard.press("Escape");await expect(modal).toHaveCount(0);await expect(opener).toBeFocused();
 await opener.click();await modal.getByRole("link",{name:"Choose Kiss The Rain",exact:true}).click();await expect(page.locator(".mt-form [name=program]")).toHaveValue("piano");await expect(page.locator(".mt-form [name=interest]")).toHaveValue("Kiss The Rain");
 await page.goto("/mytime/acrylic?lang=vi");const art=page.locator(".mt-collection-card").filter({has:page.getByRole("heading",{name:"Daydream Club",exact:true})}).getByRole("button",{name:/Khám phá bộ sưu tập/});await art.click();const artDialog=page.getByRole("dialog",{name:"Daydream Club"});await expect(artDialog).toBeVisible();await artDialog.getByRole("button",{name:"Close collection"}).click();await expect(artDialog).toHaveCount(0);await expect(art).toBeFocused();
});

for(const width of [320,390,1440])test("IA V2 journeys and event shell "+width,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto("/afterschool?lang=vi");await page.locator("[data-pino-path-header] a[href='/afterschool/community']").click();await expect(page.getByRole("heading",{name:"Không gian cộng đồng đang được chuẩn bị"})).toBeVisible();
 await page.goto("/artchitect?lang=vi");await page.locator("[data-path-consult] a").click();await expect(page.locator("#register [name=branch]")).toHaveValue("artchitect");
 await page.goto("/open-studio?lang=vi");const weekly=page.locator("[data-open-studio-m1]");await expect(weekly).toBeVisible();await weekly.getByRole("button",{name:/Đăng ký buổi mẫu/}).first().click();const modal=page.getByRole("dialog",{name:"Đăng ký trải nghiệm"});await expect(modal).toBeVisible();await modal.locator("[name=contactName]").fill("QA Synthetic");await modal.locator("[name=phone]").fill("0900000000");await modal.locator("[name=childName]").fill("QA child");const writes:string[]=[];page.on("request",r=>{if(!["GET","HEAD"].includes(r.method()))writes.push(r.url())});await modal.getByRole("button",{name:"Kiểm tra đăng ký mẫu"}).click();await expect(modal.getByRole("status")).toContainText("Chưa gửi đăng ký");expect(writes).toEqual([]);await page.keyboard.press("Escape");await expect(modal).toHaveCount(0);
 await page.goto("/mytime/piano?lang=vi");await expect(page.locator("[data-piano-program]")).toBeVisible();await page.goto("/mytime/acrylic?lang=vi");const schedule=page.locator("[data-workshop-schedule]");await expect(schedule.locator("[data-workshop-card]")).toHaveCount(2);await expect(schedule.getByRole("link",{name:/Hỏi về workshop/}).first()).toHaveCSS("background-color","rgb(105, 118, 61)");await schedule.getByRole("button",{name:"Next week"}).click();await expect(schedule.locator("[data-workshop-slide]")).toHaveAttribute("data-workshop-slide","1");await expect(schedule.locator("[data-workshop-card]")).toHaveCount(2);await expect(schedule.getByRole("heading",{name:"Matcha ngày chủ nhật"})).toBeVisible();await schedule.getByRole("button",{name:"Next week"}).click();await expect(schedule.getByRole("button",{name:"Next week"})).toBeDisabled();await schedule.getByRole("button",{name:"Week 1",exact:true}).click();await expect(schedule.getByRole("button",{name:"Previous week"})).toBeDisabled();await schedule.getByRole("link",{name:/Xem workshop/}).click();await expect(page.locator("[data-workshop-instance]")).toBeVisible();await page.locator("[data-workshop-instance]").getByRole("link",{name:/Đăng ký quan tâm/}).click();await expect(page.locator(".mt-form [name=interest]")).toHaveValue("Pink Hour");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

for(const width of [320,390,1440])test("PianoHouse closing banner "+width,async({page})=>{await page.setViewportSize({width,height:900});await page.goto("/pianohouse?lang=vi");const banner=page.locator("[data-piano-start-banner]");await expect(banner.getByRole("heading",{name:"Bắt đầu hành trình PianoHouse"})).toBeVisible();await expect(banner.locator("a")).toHaveCount(2);await expect(banner.locator("img")).toBeVisible();await banner.scrollIntoViewIfNeeded();await expect.poll(()=>banner.locator("img").evaluate((e:HTMLImageElement)=>e.complete&&e.naturalWidth>0)).toBe(true);const box=(await banner.boundingBox())!;expect(Math.abs(box.width-Math.min(940,width-2*(width<=900?16:24)))).toBeLessThanOrEqual(1);expect(await banner.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);await expect(banner.getByRole("link",{name:/Xem lịch Open Studio/})).toHaveAttribute("href","/open-studio");await banner.getByRole("link",{name:/Đăng ký tư vấn/}).click();await expect(page.locator("#register select[name=branch]")).toHaveValue("pianohouse");});


test("PAP-2191 full-width centered desktop header and responsive collapse",async({page})=>{
 const pageErrors:string[]=[],writes:string[]=[]; page.on("pageerror",e=>pageErrors.push(e.message)); page.on("request",r=>{if(!["GET","HEAD"].includes(r.method()))writes.push(r.url())}); const widths=[320,390,768,900,1024,1100,1101,1190,1280,1440,1920];
 for(const width of widths){
  await page.setViewportSize({width,height:900});
  await page.goto("/mytime?lang=vi");
  const header=page.locator("[data-mytime-header]");
  await expect(header).toBeVisible();
  await page.screenshot({path:"D:/pino-e2e-evidence/PAP-2191-mytime-"+width+".png",fullPage:false});
  if(width<=1100){
   await expect(header.locator(".desktop-nav")).toBeHidden();
   const menu=header.getByRole("button",{name:"Open menu"});
   await expect(menu).toBeVisible();
   await menu.click();
   const mobile=page.getByRole("navigation",{name:"MyTime mobile"});
   await expect(mobile.getByRole("link",{name:"Acrylic",exact:true})).toHaveAttribute("href","/mytime/acrylic");
   await expect(mobile.getByRole("link",{name:"Piano",exact:true})).toHaveAttribute("href","/mytime/piano");
   await expect(mobile.getByRole("link",{name:/Workshop tuần này/})).toHaveAttribute("href","/mytime/acrylic#workshop-schedule");
   await page.keyboard.press("Escape");
  }else{
   const nav=header.locator(".desktop-nav");
   const actions=header.locator(".header-actions");
   const brand=header.locator(".brand");
   await expect(nav.locator("a")).toHaveCount(3);
   expect(await nav.locator("a").evaluateAll(xs=>xs.map(x=>x.getAttribute("href")))).toEqual(["/mytime/acrylic","/mytime/piano","/mytime/acrylic#workshop-schedule"]);
   await expect(actions.getByRole("link",{name:"PINO Afterschool",exact:true})).toHaveAttribute("href","/afterschool");
   await expect(actions.getByRole("link",{name:/Piner App/})).toHaveAttribute("href","https://app.pinohouse.art");
   const geometry=await header.evaluate(el=>{
    const rect=(x:Element)=>{const r=x.getBoundingClientRect();return {left:r.left,right:r.right,center:r.left+r.width/2,width:r.width,height:r.height}};
    const visible=(x:Element)=>Array.from(x.children).filter(y=>getComputedStyle(y).display!=="none"&&y.getBoundingClientRect().width>0);
    const gaps=(xs:Element[])=>xs.slice(1).map((x,i)=>x.getBoundingClientRect().left-xs[i].getBoundingClientRect().right);
    const b=el.querySelector(".brand")!,n=el.querySelector(".desktop-nav")!,a=el.querySelector(".header-actions")!,br=rect(b),nr=rect(n),ar=rect(a),hr=rect(el);
    return {brand:br,nav:nr,actions:ar,header:hr,paddingLeft:parseFloat(getComputedStyle(el).paddingLeft),navGaps:gaps(visible(n)),actionGaps:gaps(visible(a)),sigil:rect(el.querySelector(".brand-sigil")!),words:getComputedStyle(el.querySelector(".brand-words")!).flexDirection,navGap:getComputedStyle(n).columnGap,actionGap:getComputedStyle(a).columnGap};
   });
   expect(geometry.header.width).toBe(width);
   expect(Math.abs(geometry.brand.center-width/2)).toBeLessThanOrEqual(1);
   expect(Math.abs(geometry.nav.center-(geometry.header.left+geometry.paddingLeft+geometry.brand.left)/2)).toBeLessThanOrEqual(1);
   expect(Math.abs(geometry.actions.center-(geometry.brand.right+geometry.header.right-geometry.paddingLeft)/2)).toBeLessThanOrEqual(1);
   expect(geometry.navGap).toBe("20px");
   expect(geometry.actionGap).toBe("20px");
   expect(geometry.navGaps.every(x=>Math.abs(x-20)<=1)).toBe(true);
   expect(geometry.actionGaps.every(x=>Math.abs(x-20)<=1)).toBe(true);
   expect(geometry.sigil.height).toBe(80);
   expect(geometry.words).toBe("column");
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
 }
 expect(pageErrors).toEqual([]); expect(writes).toEqual([]); });
