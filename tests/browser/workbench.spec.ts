import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("enciphers, rejects invalid plugs, and replays on undo", async ({
  page,
}) => {
  const input = page.getByRole("textbox", {
    name: "Message input",
    exact: true,
  });
  const output = page.getByRole("textbox", {
    name: "Message output",
    exact: true,
  });
  await input.fill("Hello, world! 123");
  await expect(input).toHaveValue("HELLOWORLD");
  await expect(output).toHaveValue("ILBDA AMTAZ");
  await page.getByRole("button", { name: "Undo letter", exact: true }).click();
  await expect(input).toHaveValue("HELLOWORL");
  await page
    .getByRole("textbox", { name: "Plugboard pairs", exact: true })
    .fill("AB AC");
  await expect(page.getByRole("alert")).toContainText("already connected");
  await expect(
    page.getByRole("button", { name: "Type A", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("textbox", { name: "Plugboard pairs", exact: true })
    .fill("");
  await page
    .getByRole("button", { name: "Clear message", exact: true })
    .click();
  await page.getByRole("button", { name: "Type A", exact: true }).click();
  await expect(output).toHaveValue("B");
});

test("double stepping and trace inspection show the researched states", async ({
  page,
}) => {
  await page
    .getByRole("combobox", { name: "Left rotor", exact: true })
    .selectOption("III");
  await expect(
    page.getByRole("combobox", { name: "Right rotor", exact: true }),
  ).toHaveValue("I");
  await page
    .getByRole("combobox", { name: "Left starting window", exact: true })
    .selectOption("K");
  await page
    .getByRole("combobox", { name: "Middle starting window", exact: true })
    .selectOption("D");
  await page
    .getByRole("combobox", { name: "Right starting window", exact: true })
    .selectOption("Q");
  await page
    .getByRole("textbox", { name: "Message input", exact: true })
    .fill("AA");
  await expect(page.locator(".step-explanation strong")).toHaveText(
    "KER → LFS",
  );
  const slider = page.getByRole("slider", {
    name: "Inspect letter",
    exact: true,
  });
  await slider.focus();
  await slider.press("Home");
  await expect(page.locator(".step-explanation strong")).toHaveText(
    "KDQ → KER",
  );
});

test("Bombe finishes a complete position sweep and verifies the demo candidate", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Bombe", exact: true }).click();
  await page
    .getByRole("button", { name: "Run Bombe search", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText("Search complete", {
    timeout: 30000,
  });
  await expect(page.locator(".candidate-tabs")).toContainText("AAF");
  await expect(page.locator(".candidate-detail")).toContainText("AV BS CG DL");
  await expect(page.locator(".candidate-plaintext")).toHaveText(
    "WETTERVORHERSAGEFUERDIEBISKAYA",
  );
  await expect(page.locator(".progress-details")).toContainText(
    "17,576 / 17,576",
  );
});

test("transfers a message and cancels a larger worker search", async ({
  page,
}) => {
  await page
    .getByRole("textbox", { name: "Message input", exact: true })
    .fill("WETTERVORHERSAGEFUERDIEBISKAYA");
  const output = (
    await page
      .getByRole("textbox", { name: "Message output", exact: true })
      .inputValue()
  ).replaceAll(" ", "");
  await page
    .getByRole("button", { name: "Send to Bombe", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Intercepted ciphertext", exact: true }),
  ).toHaveValue(output);
  await expect(
    page.getByRole("textbox", { name: "Plaintext crib", exact: true }),
  ).toHaveValue("WETTERVORHERSAGEFUERDIEBISKAYA");
  await page
    .getByRole("combobox", { name: "Rotor orders to search", exact: true })
    .selectOption("all");
  await page
    .getByRole("button", { name: "Run Bombe search", exact: true })
    .click();
  await page.getByRole("button", { name: "Stop search", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Stopped · partial search");
  await page
    .getByRole("spinbutton", { name: "Crib offset", exact: true })
    .fill("1");
  await expect(page.getByRole("alert")).toContainText("fit");
  await expect(
    page.getByRole("button", { name: "Run Bombe search", exact: true }),
  ).toBeDisabled();
});

test("all workspaces fit the viewport without horizontal page scrolling", async ({
  page,
}) => {
  for (const tab of ["Enigma", "Bombe", "Field guide"]) {
    await page.getByRole("button", { name: tab, exact: true }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});

test("help is keyboard accessible and both plugboard passes are visible", async ({
  page,
}) => {
  const help = page.getByText("The complete signal route", { exact: true });
  await help.click();
  await expect(
    page.getByText("The lamp only displays the final letter", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Message input", exact: true })
    .fill("A");
  await expect(
    page.locator(".signal-node").filter({ hasText: "Plugboard →" }),
  ).toBeVisible();
  await expect(
    page.locator(".signal-node").filter({ hasText: "Plugboard ←" }),
  ).toBeVisible();
});

test("historical notation links the supplied parallel edge to a drum column", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Bombe", exact: true }).click();
  await page
    .getByRole("button", { name: "Historical notation", exact: true })
    .click();
  await page
    .getByRole("checkbox", { name: "Use the supplied museum-menu example" })
    .check();
  await page
    .getByRole("button", {
      name: "Inspect menu connection 12, G to R",
      exact: true,
    })
    .click();
  await expect(page.locator(".notation-reading")).toContainText("ZZL");
  await page
    .getByRole("button", { name: "Put the supplied menu on the drums" })
    .click();
  await expect(
    page.getByRole("button", {
      name: /^Select scrambler at position 12, G to R, relative setting ZZL, top core/,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Show carry phase", exact: true })
    .click();
  await expect(page.locator(".sense-verdict")).toHaveText(
    "Not sensing during carry.",
  );
  await page
    .getByRole("spinbutton", { name: "Drive point", exact: true })
    .fill("39");
  await expect(page.locator(".drive-phase")).toContainText("Sensing point 1");
  await page
    .getByRole("checkbox", { name: "Show all 676 diagonal-board terminals" })
    .check();
  await expect(page.locator(".diagonal-scroll svg")).toBeVisible();
});

test("paper strips count actual coincidences under a shift and all modes fit mobile", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Bombe", exact: true }).click();
  await page
    .getByRole("button", { name: "Paper methods", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "First Banbury ciphertext" })
    .fill("ABCDE");
  await page
    .getByRole("textbox", { name: "Second Banbury ciphertext" })
    .fill("BCD");
  const shift = page.getByRole("slider", { name: "Shift punched strip" });
  await shift.focus();
  await shift.press("ArrowRight");
  await expect(page.locator(".paper-result strong")).toHaveText(
    "3 coincidences / 3 overlapping letters",
  );
  for (const mode of ["Paper methods", "Drums & wiring", "Crib & search"]) {
    await page.getByRole("button", { name: mode, exact: true }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("invalid crib placements never claim that the alignment is clear", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Bombe", exact: true }).click();
  await page
    .getByText("Slide the crib against the intercept", { exact: true })
    .click();
  for (const offset of ["-1", "0.5", "31"]) {
    await page
      .getByRole("spinbutton", { name: "Crib offset", exact: true })
      .fill(offset);
    await expect(page.locator(".alignment-explorer")).not.toContainText(
      "No self-encryption conflicts",
    );
    await expect(page.locator(".alignment-explorer")).toContainText(
      "Choose a whole-number offset",
    );
    await expect(
      page.getByRole("button", { name: "Run Bombe search" }),
    ).toBeDisabled();
  }
});

test("editing a search resets its elapsed time and matches the selected search size", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Bombe", exact: true }).click();
  await page.getByRole("button", { name: "Run Bombe search" }).click();
  await expect(page.getByRole("status")).toHaveText("Search complete", {
    timeout: 30000,
  });
  await page
    .getByRole("combobox", { name: "Rotor orders to search" })
    .selectOption("all");
  await expect(page.locator(".progress-details")).toContainText("1,054,560");
  await expect(page.locator(".progress-details")).toContainText("0.0s");
});

test("wide paper diagrams can be scrolled with the keyboard", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Bombe", exact: true }).click();
  await page
    .getByRole("button", { name: "Paper methods", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "First Banbury ciphertext" })
    .fill("A".repeat(60));
  const diagram = page.getByRole("region", {
    name: "Punched sheet diagram",
    exact: true,
  });
  await diagram.focus();
  await expect(diagram).toBeFocused();
  const hasOverflow = await diagram.evaluate(
    (element) => element.scrollWidth > element.clientWidth,
  );
  if (hasOverflow) {
    await diagram.press("ArrowRight");
    await expect
      .poll(() => diagram.evaluate((element) => element.scrollLeft))
      .toBeGreaterThan(0);
  }
  await page.getByRole("checkbox", { name: "Overlay both sheets" }).uncheck();
  await expect(page.locator(".paper-result")).toContainText(
    "each separate sheet",
  );
  await page
    .getByRole("textbox", { name: "First Banbury ciphertext" })
    .fill("");
  await expect(
    page.getByRole("slider", { name: "Shift punched strip" }),
  ).toBeDisabled();
});
