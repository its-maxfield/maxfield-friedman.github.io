import { expect, test } from "@playwright/test";

test("private route unlocks into the two-day setup", async ({ page }) => {
  await page.goto("/park-day-8x4m/?simulate=true");
  await expect(page.getByRole("heading", { name: "Park Day Optimizer" })).toBeVisible();
  await page.getByLabel("Passphrase").fill("rope-drop-2026");
  await page.getByRole("button", { name: "Unlock" }).click();
  await expect(page.getByText("Trip setup · Disneyland")).toBeVisible();
  await expect(page.getByRole("button", { name: /MUST DO/ })).toHaveCSS("min-height", "56px");
  await page.getByRole("button", { name: "Mark remaining Don't Care" }).click();
  await page.getByRole("button", { name: "Start optimizing" }).click();
  await page.getByRole("button", { name: "Map", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Interactive park map" })).toBeVisible();
  await expect(page.getByText("Preloaded · works offline")).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.reload();
  await expect(page.getByRole("heading", { name: "Park Day Optimizer" })).toBeVisible();
});
