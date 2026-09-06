import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("help opens on hover without moving the workbench and stays readable", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Hover is a mouse interaction");
  const trigger = page
    .getByRole("button", { name: "Explain Rotor order", exact: true })
    .first();
  const keyboard = page.getByRole("button", { name: "Type A", exact: true });
  const before = await keyboard.boundingBox();
  await trigger.hover();
  const tip = page.getByRole("tooltip");
  await expect(tip).toContainText("A rotor is a wheel");
  expect(await keyboard.boundingBox()).toEqual(before);
  await tip.hover();
  await expect(tip).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(tip).toBeHidden();
});

test("keyboard focus describes help and Escape dismisses it", async ({
  page,
}) => {
  const trigger = page
    .getByRole("button", { name: "Explain Rotor order", exact: true })
    .first();
  await trigger.focus();
  await expect(page.getByRole("tooltip")).toBeVisible();
  await expect(trigger).toHaveAccessibleDescription(/A rotor is a wheel/);
  await trigger.press("Escape");
  await expect(page.getByRole("tooltip")).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.press("Tab");
  await expect(page.getByRole("tooltip")).toContainText(
    "The three letters showing",
  );
});

test("tap help fits the viewport and an outside tap dismisses it", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Touch interaction");
  const trigger = page
    .getByRole("button", { name: "Explain Ring settings", exact: true })
    .first();
  await trigger.tap();
  const tip = page.getByRole("tooltip");
  await expect(tip).toContainText("The alphabet ring");
  const bounds = await tip.boundingBox();
  const viewport = page.viewportSize();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport!.width);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport!.height);
  await page.getByRole("heading", { level: 1 }).tap();
  await expect(tip).toBeHidden();
});

test("historical notation help keeps its icon beside its label", async ({
  page,
}, testInfo) => {
  await page.getByRole("button", { name: "Bombe", exact: true }).click();
  await page
    .getByRole("button", { name: "Historical notation", exact: true })
    .click();
  const trigger = page.getByRole("button", {
    name: "Explain ZZZ, ZZA and the numbered lines",
    exact: true,
  });
  await trigger.scrollIntoViewIfNeeded();
  const icon = await trigger.locator("svg").boundingBox();
  const label = await trigger.locator("span").boundingBox();
  expect(icon!.width).toBe(20);
  expect(label!.x - (icon!.x + icon!.width)).toBeLessThanOrEqual(8);
  await trigger.click();
  const tip = page.getByRole("tooltip");
  await expect(tip).toContainText("ZZZ is the reference");
  const bounds = await tip.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  );
  await page.screenshot({ path: testInfo.outputPath("historical-help.png") });
});

test("touch-opened help survives a delayed compatibility mouseleave", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Touch interaction");
  await page.clock.install();
  const trigger = page
    .getByRole("button", { name: "Explain Ring settings", exact: true })
    .first();
  await trigger.tap();
  const tip = page.getByRole("tooltip");
  await expect(tip).toBeVisible();
  // Touch browsers can deliver compatibility mouse events after the click.
  await trigger.dispatchEvent("mouseleave", { relatedTarget: null });
  // Advance past the provider's delayed hover close, including its animation.
  await page.clock.runFor(500);
  await expect(tip).toContainText("The alphabet ring");
  await page.getByRole("heading", { level: 1 }).tap();
  await expect(tip).toBeHidden();
});
