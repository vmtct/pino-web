import {expect,test} from "@playwright/test";

for(const width of [320,768,1440]){
 test(`storefront routes ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto("/?lang=vi");
  await page.locator('a[href="/afterschool"]').first().click();
  await expect(page).toHaveURL(/\/afterschool$/);
  await expect(page.getByRole("heading",{name:"Hành trình sáng tạo của riêng con."})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Ba nhánh phát triển"})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Bản nhạc tháng 11"})).toBeVisible();await expect(page.locator("[data-november-music] [data-music-credit]")).toHaveText("Yiruma");
  for(const [vi,en] of [["Mầm sáng tạo","Little Piner"],["Mỹ thuật sáng tạo","Artchitect"],["Piano nghệ thuật","PianoHouse"]]){
    const card=page.locator("a[data-branch-card]").filter({has:page.getByRole("heading",{name:vi,exact:true})});
    await expect(card).toHaveAttribute("href",/\/(little-piner|artchitect|pianohouse)$/);await expect(card.locator("a")).toHaveCount(0);
    await expect(card.getByText(en,{exact:true})).toBeVisible();
  }
  await expect(page.getByText("3–6 tuổi",{exact:true})).toHaveCount(1);
  for(const [branch,words] of [["Little Piner",["đa giác quan"]],["Artchitect",["tranh nguyên bản","thiết kế nhân vật"]],["PianoHouse",["cổ điển","đương đại"]]] as const){
    const desc=page.locator('[data-branch-description="'+branch+'"]');
    await expect(desc).toBeVisible();
    await expect(desc).toHaveCSS("font-weight","400");
    for(const word of words){const kw=desc.locator("[data-branch-keyword]").filter({hasText:word});await expect(kw).toBeVisible();await expect(kw).toHaveCSS("font-weight","600");await expect(kw).toHaveCSS("display","inline");}
    expect((await desc.innerText()).length).toBeGreaterThan(40);
  }
  await expect(page.getByRole("heading",{name:"Hai lựa chọn hành trình 12 tuần."})).toBeVisible();
  await expect(page.locator("[data-plan]")).toHaveCount(2);
  await expect(page.locator('[data-plan="12"]')).toHaveCount(0);
  await expect(page.locator('[data-plan="24"]').getByText("GỢI Ý CỦA PINO")).toBeVisible();
  await expect(page.locator('[data-plan="24"]')).toHaveCSS("background-color","rgb(126, 49, 33)");
  await expect(page.getByText("Quà tặng chuyên đề theo năng lực và sở thích của con",{exact:true})).toBeVisible();
  await expect(page.getByText("Chuyên đề nghệ thuật cao cấp (Mỹ Thuật Số, Piano Cổ Điển)",{exact:true})).toBeVisible();
  await expect(page.locator('[data-plan="36"]').getByText("Chuyên sâu Mỹ Thuật hoặc Toàn diện Nhạc Họa",{exact:true})).toBeVisible();
  await expect(page.locator("#register fieldset")).toBeEnabled();
  await expect(page.locator('#register select[name="plan"] option[value="12"]')).toHaveCount(0);
  await page.locator('[data-plan="36"]').getByRole("link",{name:/Đăng ký ngay/}).click();
  await expect(page.locator('#register select[name="plan"]')).toHaveValue("36");
  await page.locator('[data-plan="24"]').getByRole("link",{name:/Đăng ký ngay/}).click();
  const form=page.locator("#register form");
  await expect(form.locator("[name=plan]")).toHaveValue("24");
  await form.locator("[name=name]").fill("QA Synthetic");
  await form.locator("[name=phone]").fill("123");
  await form.locator("[name=branch]").selectOption("advice");
  await form.getByRole("checkbox").check();
  await form.getByRole("button",{name:"Đăng ký ngay"}).click();
  await expect(form.getByRole("alert")).toBeVisible();
  await form.locator("[name=phone]").fill("0900000000");
  const personalWrites:string[]=[];page.on("request",r=>{if(r.method()!=="GET"&&r.method()!=="HEAD")personalWrites.push(r.url())});
  await form.getByRole("button",{name:"Đăng ký ngay"}).click();
  expect(personalWrites).toEqual([]);expect(page.url()).not.toContain("0900000000");
  await expect(form.getByRole("status")).toContainText("chưa gửi đăng ký");
  await page.getByRole("button",{name:"Chat ngay"}).click();
  await expect(page.locator("#pino-chat-options").getByRole("link",{name:"Messenger",exact:true})).toHaveAttribute("href","https://m.me/pino.house");
  await expect(page.locator("#pino-chat-options").getByRole("link",{name:"Zalo",exact:true})).toHaveAttribute("href","https://zalo.me/0374686860");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button",{name:"Chat ngay"})).toHaveAttribute("aria-expanded","false");
  for(const n of ["Ngọn núi","Linh hồn rừng xanh","Für Elise"])await expect(page.getByRole("heading",{name:n,exact:true})).toBeVisible();
  await expect(page.getByText("7+ tuổi",{exact:true})).toHaveCount(2);
  for(const [sessions,description,cadence] of [["24","Phát triển và chuyên đề năng khiếu","2 buổi/tuần"],["36","Đầu tư và chuyên đề cao cấp","3 buổi/tuần"]]){
   const card=page.locator("article").filter({has:page.getByRole("heading",{name:sessions+" buổi",exact:true})});
   await expect(card.getByText(description,{exact:true})).toBeVisible();
   await expect(card.getByText(cadence,{exact:true})).toBeVisible();
  }
  for(const route of ["/little-piner","/artchitect","/pianohouse"]){await expect(page.locator('a[href="'+route+'"]').first()).toBeVisible();}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.evaluate(()=>{if(document.activeElement instanceof HTMLElement)document.activeElement.blur();window.scrollTo({top:0,behavior:"instant"})});
    await expect(page.locator("[data-pino-header-state]")).toHaveAttribute("data-pino-header-state","visible");
    await page.locator("[data-pino-path-footer]").getByRole("link",{name:"MyTime by PINO"}).click();
  await expect(page.getByRole("heading",{name:"Có hẹn với điều mình thích."})).toBeVisible();
  for(const title of ["Matcha ngày chủ nhật","Thành phố dưới trăng","Khoảnh khắc hồng","Gốm sứ xanh"])await expect(page.getByText(title,{exact:true}).first()).toBeVisible();
  for(const title of ["A Thousand Years","My Heart Will Go On","Kiss The Rain","Always With Me"])await expect(page.getByText(title,{exact:true}).first()).toBeVisible();
  for(const collection of ["Everyday Bloom","Blue Stories","Earth & Elsewhere","Daydream Club"]){
   const tab=page.getByRole("tab",{name:new RegExp(collection)});
   await tab.click();await expect(tab).toHaveAttribute("aria-selected","true");await expect(page.getByRole("tabpanel")).toContainText(collection.toUpperCase());
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator(".experience-acrylic").getByRole("link",{name:/Khám phá Acrylic/}).click();
  await expect(page.getByRole("heading",{name:"Vẽ điều làm bạn mỉm cười."})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Bốn Mùa"})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Workshop tuần này"})).toBeVisible();await expect(page.locator("[data-workshop-mock]")).toContainText("Khoảnh khắc hồng");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.goBack();
  await page.locator(".experience-piano").getByRole("link",{name:/Khám phá Piano/}).click();
  await expect(page.getByRole("heading",{name:"Chơi giai điệu mình yêu thích."})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Four Hands"})).toBeVisible();
  await page.evaluate(()=>{if(document.activeElement instanceof HTMLElement)document.activeElement.blur();window.scrollTo({top:0,behavior:"instant"})});
    await expect(page.locator("[data-mt-header-state]")).toHaveAttribute("data-mt-header-state","visible");
    await page.locator(".locale-toggle").getByRole("button",{name:"EN"}).click();
  await expect(page.getByRole("heading",{name:"Play the melodies you love."})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
 });
}

test("registration SSR without JavaScript is fail-closed",async({browser})=>{const ctx=await browser.newContext({javaScriptEnabled:false});try{const page=await ctx.newPage();await page.goto("http://192.168.1.6:8811/afterschool");await expect(page.locator("#register fieldset")).toHaveAttribute("disabled","");await expect(page.locator("#register input[name=phone]")).toBeDisabled();await expect(page.locator("#register button")).toBeDisabled();}finally{await ctx.close()}});
