import { expect, test } from "@playwright/test";

test("Little Piner renders its landing page and R2 media", async ({ page }) => {
  await page.goto("/little-piner");

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
});
