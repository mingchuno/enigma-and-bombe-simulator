import { expect, test } from "@playwright/test";

test("appearance switches two production themes without losing work and persists", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "manual");
  await page
    .getByRole("textbox", { name: "Message input", exact: true })
    .fill("HELLOWORLD");
  await page.getByRole("button", { name: "Appearance", exact: true }).click();
  await expect(page.getByRole("radio")).toHaveCount(2);
  await page.getByRole("radio", { name: /Intercept Form/ }).check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "intercept");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Appearance", exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole("textbox", { name: "Message output", exact: true }),
  ).toHaveValue("ILBDA AMTAZ");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "intercept");
  await page.getByRole("button", { name: "Appearance", exact: true }).click();
  const manual = page.getByRole("radio", { name: /Service Manual/ });
  await manual.focus();
  await manual.press("Space");
  await expect(manual).toBeChecked();
  await page.keyboard.press("Escape");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "manual");
  await expect(
    page.getByRole("combobox", { name: "Prototype theme" }),
  ).toHaveCount(0);
});

test("blocked preference storage still permits theme changes", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error("Storage blocked");
    };
    Storage.prototype.setItem = () => {
      throw new Error("Storage blocked");
    };
  });
  await page.goto("/?variant=registry");
  await page.getByRole("button", { name: "Appearance", exact: true }).click();
  await page.getByRole("radio", { name: /Intercept Form/ }).check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "intercept");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("keyboard keys remain inside the machine above the phone breakpoint", async ({
  page,
}) => {
  await page.setViewportSize({ width: 601, height: 950 });
  await page.goto("/");
  const machine = await page
    .getByRole("region", { name: "Enigma machine" })
    .boundingBox();
  for (const key of await page
    .getByRole("button", { name: /^Type [A-Z]$/, exact: true })
    .all()) {
    const bounds = await key.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(machine!.x);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(
      machine!.x + machine!.width,
    );
  }
});

test("document themes retain heading typography and search action sizing", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 1000 });
  await page.goto("/");
  const brand = page.getByRole("link", { name: "Enigma and Bombe home" });
  await expect(brand).toHaveCSS("font-size", "24px");
  for (const [theme, accent] of [
    ["Intercept Form", "rgb(124, 53, 42)"],
    ["Service Manual", "rgb(72, 75, 53)"],
  ]) {
    await page.getByRole("button", { name: "Appearance", exact: true }).click();
    await page.getByRole("radio", { name: new RegExp(theme) }).check();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Bombe", exact: true }).click();
    const search = page.getByRole("button", {
      name: "Run Bombe search",
      exact: true,
    });
    await expect(search).toHaveCSS("background-color", accent);
    await expect(search).toHaveCSS("font-size", "13px");
    await expect(search).toHaveCSS("padding", "14px");
    await expect(
      page.getByRole("heading", { name: "Find what the settings allow." }),
    ).toHaveCSS("font-family", /Oswald/);
    await expect(brand).toHaveCSS(
      "font-size",
      theme === "Intercept Form" ? "26px" : "24px",
    );
  }
});
