import { expect, test } from "@playwright/test";

for (const width of [320, 390, 768, 1024, 1440, 1920]) {
  test(`product home: ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/?lang=vi");
    const header=page.locator("[data-home-header]"), hero=page.locator("[data-home-carousel]");
    await expect(page.locator("[data-home-header-flow]")).toHaveCSS("position","relative");
    expect(Math.abs((await header.boundingBox())!.y+(await header.boundingBox())!.height-(await hero.boundingBox())!.y)).toBeLessThanOrEqual(1);
    for(const y of [79,80,160,90,0]){await page.evaluate(y=>window.scrollTo({top:y,behavior:"instant"}),y);await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBe(y);await expect.poll(async()=>Math.round((await header.boundingBox())!.y)).toBe(y===0?0:-y);await expect(page.locator("[data-pino-header-state]")).toHaveCount(0);}
    await expect(page.getByRole("heading", { name: "PINO Afterschool" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "MyTime by PINO" })).toBeVisible();
    await expect(page.locator("#campaigns")).toBeVisible();
    await expect(page.locator("[data-home-carousel] a")).toHaveCount(1);
    await page.getByRole("button",{name:"Next slide"}).click();await expect(page.getByRole("heading",{name:"Kiss The Rain"})).toBeVisible();await page.getByRole("button",{name:"Previous slide"}).click();await expect(page.getByRole("heading",{name:"Một ngôi nhà cho những điều mình yêu."})).toBeVisible();
    await expect(page.locator("[data-branch-description]")).toHaveCount(0);
    await expect(page.getByText("Hết giờ học, đến giờ con khám phá.", { exact: true })).toBeVisible();
    await expect(page.getByText("Hết những bận rộn, đến giờ mình tận hưởng.", { exact: true })).toBeVisible();
    for (const path of ["/afterschool", "/mytime", "/open-studio", "/policy", "/term"]) {
      await expect(page.locator(`a[href="${path}"]`).first()).toBeVisible();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("navigation", {name:"PINO"}).getByRole("link", {name:"MyTime"}).click();
    await expect(page).toHaveURL(/\/mytime$/);
    await expect(page.locator(".mytime-v3")).toBeVisible();await page.goto("/?lang=vi");
    await page.evaluate(()=>{if(document.activeElement instanceof HTMLElement)document.activeElement.blur();window.scrollTo({top:0,behavior:"instant"})});
    await expect(page.locator("[data-home-header-flow]")).toHaveCSS("position","relative");
    await expect(page.locator("[data-pino-header-state]")).toHaveCount(0);
    await page.locator(".locale-toggle").getByRole("button", {name:"EN"}).click();
    await expect(page.getByRole("heading", {name:"A home for the things we love."})).toBeVisible();
    await expect(page.getByRole("heading",{name:"One house, two journeys."})).toBeVisible();
    expect(errors).toEqual([]);
  });
}
