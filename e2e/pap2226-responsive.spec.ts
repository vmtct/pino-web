import {test,expect} from '@playwright/test';
test.use({channel:'chrome',video:'off'});
for (const [path,label] of [['/website','pino'],['/website/afterschool','afterschool'],['/website/mytime','mytime']]) {
 for (const width of [320,390,768,900,901,1024,1440,1920]) {
  test(`${label} ${width}`, async ({page}) => {
   await page.setViewportSize({width,height:900});
   const errors:string[]=[]; page.on('pageerror',e=>errors.push(e.message));
   await page.goto(path,{waitUntil:'domcontentloaded'});
   const mytime=label==='mytime';
   const header=page.locator(mytime?'[data-mytime-header]':'[data-pino-path-header]').first();
   await expect(header).toBeVisible();
   const lang=header.locator('.locale-toggle');
   const en=lang.getByRole('button',{name:'EN',exact:true}); const vn=lang.getByRole('button',{name:'VN',exact:true});
   await expect(en).toBeVisible(); await expect(vn).toBeVisible();
   await en.click(); await expect(en).toHaveAttribute('aria-pressed','true'); await vn.click(); await expect(vn).toHaveAttribute('aria-pressed','true');
   const button=header.getByRole('button',{name:'Open menu'});
   if(width<=900){
    await expect(button).toBeVisible(); const brand=header.locator(mytime?'.brand':'a').first();
    const rect=await brand.boundingBox(); expect(rect).not.toBeNull(); expect(rect!.x).toBeLessThan(width/3);
    if(mytime) await expect(brand.locator('.brand-words')).toHaveCSS('flex-direction','column');
    await button.click(); await expect(button).toHaveAttribute('aria-expanded','true');
    await expect(en).toBeVisible(); await expect(vn).toBeVisible();
    await button.click(); await expect(button).toHaveAttribute('aria-expanded','false');
   }else await expect(button).toBeHidden();
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth); expect(overflow).toBeLessThanOrEqual(1);
   expect(errors).toEqual([]);
   await header.screenshot({path:`test-results/pap2226-${label}-${width}.png`});
  });
 }
}
