import { expect, test } from "@playwright/test";

test("provides an installable manifest and icons", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const manifestHref = await page
    .locator('link[rel="manifest"]')
    .getAttribute("href");
  expect(manifestHref).toBeTruthy();
  const manifestUrl = new URL(manifestHref!, page.url()).href;
  const response = await request.get(manifestUrl);
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.start_url).toBe("./");
  expect(manifest.scope).toBe("./");
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ sizes: "192x192", type: "image/png" }),
      expect.objectContaining({ sizes: "512x512", type: "image/png" }),
      expect.objectContaining({ purpose: "maskable" }),
    ]),
  );
  for (const icon of manifest.icons) {
    const image = await request.get(new URL(icon.src, manifestUrl).href);
    expect(image.ok()).toBe(true);
    expect(image.headers()["content-type"]).toContain("image/png");
  }
});

test("reloads offline and runs Enigma and the Bombe worker", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await context.setOffline(true);
  await page.reload();
  await page
    .getByRole("textbox", { name: "Message input", exact: true })
    .fill("AAAAA");
  await expect(
    page.getByRole("textbox", { name: "Message output", exact: true }),
  ).toHaveValue("BDZGO");
  await page.getByRole("button", { name: "Bombe", exact: true }).click();
  await page
    .getByRole("button", { name: "Run Bombe search", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText("Search complete", {
    timeout: 30000,
  });
  await expect(page.locator(".candidate-tabs")).toContainText("AAF");
});
