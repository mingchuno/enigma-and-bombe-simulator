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
