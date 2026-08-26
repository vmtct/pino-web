import { expect, test, type Page } from "@playwright/test";

async function expectLittlePiner(page: Page) {
  await expect(page.getByRole("heading", { name: "Little Piner", level: 1 })).toBeVisible();
  await expect(page.getByText("Little hands. Big discoveries.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Two ways to explore." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Inside Little Piner" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Made by little hands" })).toBeVisible();

  const r2Images = page.locator('img[src*="assets.pinohouse.art/site/littlePiner/"]');
  await expect(r2Images).toHaveCount(28);

  const broken = await r2Images.evaluateAll((images) =>
    images
      .filter((image) => image instanceof HTMLImageElement && (!image.complete || image.naturalWidth === 0))
      .map((image) => image.getAttribute("src")),
  );

  expect(broken, `Broken Little Piner R2 assets: ${broken.join(", ")}`).toEqual([]);
}

test("Little Piner renders its landing page and R2 media on the Worker service", async ({ page }) => {
  await page.goto("/little-piner");
  await expectLittlePiner(page);
});

test("Little Piner production custom domain renders on desktop and mobile", async ({ browser }, testInfo) => {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const desktopResponse = await desktop.goto("https://pinohouse.art/little-piner", { waitUntil: "networkidle" });
  expect(desktopResponse?.status()).toBe(200);
  await expectLittlePiner(desktop);
  await testInfo.attach("little-piner-prod-desktop", {
    body: await desktop.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
  await desktop.close();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  const mobileResponse = await mobile.goto("https://pinohouse.art/little-piner", { waitUntil: "networkidle" });
  expect(mobileResponse?.status()).toBe(200);
  await expect(mobile.getByRole("heading", { name: "Little Piner", level: 1 })).toBeVisible();
  await expect(mobile.getByRole("heading", { name: "Two ways to explore." })).toBeVisible();
  await testInfo.attach("little-piner-prod-mobile", {
    body: await mobile.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
  await mobile.close();

  const www = await browser.newPage();
  const wwwResponse = await www.goto("https://www.pinohouse.art/little-piner", { waitUntil: "domcontentloaded" });
  expect(wwwResponse?.status()).toBe(200);
  await expect(www.getByRole("heading", { name: "Little Piner", level: 1 })).toBeVisible();
  await www.close();
});
