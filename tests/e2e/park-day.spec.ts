import { expect, test } from "@playwright/test";

test("private route unlocks into the two-day setup", async ({ page }) => {
  await page.goto("/park-day-8x4m/?simulate=true");
  await expect(page.getByRole("heading", { name: "Park Day Optimizer" })).toBeVisible();
  await page.getByLabel("Passphrase").fill("rope-drop-2026");
  await page.getByRole("button", { name: "Unlock" }).click();
  await expect(page.getByText("Trip setup · Disneyland")).toBeVisible();
  await expect(page.getByRole("button", { name: /MUST DO/ })).toHaveCSS("min-height", "56px");
  await page.getByRole("button", { name: /MUST DO/ }).click();
  await page.getByRole("button", { name: /NICE TO HAVE/ }).click();
  await page.getByRole("button", { name: /NICE TO HAVE/ }).click();
  await page.getByRole("button", { name: "Mark remaining Don't Care" }).click();
  await page.getByRole("button", { name: "Start optimizing" }).click();
  await expect(page.getByRole("heading", { name: "Queues", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Held Lightning Lanes" })).toBeVisible();
  await page.getByRole("button", { name: "Refresh crowd" }).click();
  await page.getByRole("button", { name: "Now", exact: true }).evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.getByLabel("Current position")).toBeVisible();
  await page.getByLabel("Current position").selectOption({ label: "Adventureland" });
  await expect(page.getByText("Other good options")).toBeVisible();
  await page.getByRole("button", { name: /^Choose / }).first().click();
  await expect(page.getByText("Your selected action")).toBeVisible();
  await expect(page.getByText("Estimated time to finish priorities")).toBeVisible();
  await page.getByRole("button", { name: "Adjust countdown" }).click();
  await page.getByLabel("Countdown hours").fill("0");
  await page.getByLabel("Countdown minutes").fill("45");
  await page.getByRole("button", { name: "Save countdown" }).click();
  await expect(page.getByText(/00:4[45]:\d{2}/)).toBeVisible();
  await page.getByRole("button", { name: "Map", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Interactive park map" })).toBeVisible();
  await expect(page.getByText("Live geographic view")).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.reload();
  await expect(page.getByRole("heading", { name: "Park Day Optimizer" })).toBeVisible();
});

test("refreshes live queues and persists a manual mobile wait", async ({ page }) => {
  await page.addInitScript((payload) => {
    const nativeFetch = window.fetch.bind(window);
    window.fetch = (input, init) => String(input).includes("/api/parks/disneyland/queues")
      ? Promise.resolve(new Response(JSON.stringify(payload), { status: 200, headers: { "content-type": "application/json" } }))
      : nativeFetch(input, init);
  }, {
      parkId: "disneyland",
      source: "themeparks-wiki",
      fetchedAt: new Date().toISOString(),
      items: [{
        sourceEntityId: "9167db1d-e5e7-46da-a07f-ae30a87bc4c4",
        name: "Space Mountain",
        operatingStatus: "operating",
        standbyMinutes: 25,
        returnTime: { state: "available", start: "2026-08-18T12:00:00-07:00", end: "2026-08-18T13:00:00-07:00" },
        lastUpdatedAt: new Date().toISOString(),
      }],
  });
  await page.goto("/park-day-8x4m/");
  await page.getByLabel("Passphrase").fill("rope-drop-2026");
  await page.getByRole("button", { name: "Unlock" }).click();
  await page.getByRole("button", { name: "Mark remaining Don't Care" }).click();
  await page.getByRole("button", { name: "Start optimizing" }).click();
  await page.getByRole("button", { name: "Refresh live" }).click();
  await expect(page.getByText("Updated 1 attractions")).toBeVisible();
  await page.getByText(/Other rides/).click();
  const space = page.locator("section").filter({ has: page.getByRole("heading", { name: "Space Mountain" }) }).first();
  await expect(space.getByText("25m")).toBeVisible();
  await page.getByLabel("Wait minutes for Space Mountain").fill("13");
  await page.getByRole("button", { name: "Save wait for Space Mountain" }).click();
  await expect(space.getByText("NO LINE", { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Queues", exact: true }).click();
  await page.getByText(/Other rides/).click();
  const savedSpace = page.locator("section").filter({ has: page.getByRole("heading", { name: "Space Mountain" }) }).first();
  await expect(savedSpace.getByText("13m")).toBeVisible();
  await expect(savedSpace.getByText("NO LINE", { exact: true })).toBeVisible();
});
