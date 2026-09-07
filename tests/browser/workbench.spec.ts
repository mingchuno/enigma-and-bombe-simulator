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
  await expect(
    page.locator("[data-testid='step-explanation'] strong"),
  ).toHaveText("KER → LFS");
  const slider = page.getByRole("slider", {
    name: "Inspect letter",
    exact: true,
  });
  await slider.focus();
  await slider.press("Home");
  await expect(
    page.locator("[data-testid='step-explanation'] strong"),
  ).toHaveText("KDQ → KER");
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
  await expect(page.locator("[data-testid='candidate-tabs']")).toContainText(
    "AAF",
  );
  await expect(page.locator("[data-testid='candidate-detail']")).toContainText(
    "AV BS CG DL",
  );
  await expect(page.locator("[data-testid='candidate-plaintext']")).toHaveText(
    "WETTERVORHERSAGEFUERDIEBISKAYA",
  );
  await expect(page.locator("[data-testid='progress-details']")).toContainText(
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
    .fill("HELLOWORLD");
  await expect(
    page
      .getByRole("table", { name: "Toward the reflector", exact: true })
      .getByRole("rowheader", { name: /^Plugboard/ }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("table", { name: "Back to the lamp", exact: true })
      .getByRole("rowheader", { name: /^Plugboard/ }),
  ).toBeVisible();
});

test("museum example links the supplied parallel edge to a drum column", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Bombe", exact: true }).click();
  await page
    .getByRole("button", { name: "Museum example", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Inspect menu connection 12, G to R",
      exact: true,
    })
    .click();
  await expect(
    page.locator("[data-testid='notation-reading']:visible"),
  ).toContainText("ZZL");
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
  await expect(page.locator("[data-testid='sense-verdict']")).toHaveText(
    "Not sensing during carry.",
  );
  await page
    .getByRole("spinbutton", { name: "Drive point", exact: true })
    .fill("39");
  await expect(page.locator("[data-testid='drive-phase']")).toContainText(
    "Sensing point 1",
  );
  await page
    .getByRole("checkbox", { name: "Show all 676 diagonal-board terminals" })
    .check();
  await expect(
    page.locator("[data-testid='diagonal-scroll'] svg"),
  ).toBeVisible();
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
  await expect(page.locator("[data-testid='paper-result'] strong")).toHaveText(
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
    await expect(
      page.locator("[data-testid='alignment-explorer']"),
    ).not.toContainText("No self-encryption conflicts");
    await expect(
      page.locator("[data-testid='alignment-explorer']"),
    ).toContainText("Choose a whole-number offset");
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
  await expect(page.locator("[data-testid='progress-details']")).toContainText(
    "1,054,560",
  );
  await expect(page.locator("[data-testid='progress-details']")).toContainText(
    "0.0s",
  );
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
  await expect(
    page.getByRole("radio", { name: "Overlaid", exact: true }),
  ).toBeChecked();
  await page.getByRole("radio", { name: "Separate", exact: true }).check();
  await expect(page.locator("[data-testid='paper-result']")).toContainText(
    "each separate sheet",
  );
  await page
    .getByRole("textbox", { name: "First Banbury ciphertext" })
    .fill("");
  await expect(
    page.getByRole("slider", { name: "Shift punched strip" }),
  ).toBeDisabled();
});

test("candidate limit explains partial search coverage", async ({ page }) => {
  await page.getByRole("button", { name: "Bombe", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Intercepted ciphertext", exact: true })
    .fill("ILBDAAMTAZ");
  await page
    .getByRole("textbox", { name: "Plaintext crib", exact: true })
    .fill("HELLOWORLD");
  await page
    .getByRole("combobox", { name: "Maximum plugboard cables", exact: true })
    .selectOption("13");
  await page
    .getByRole("button", { name: "Run Bombe search", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText(
    "Candidate limit reached · partial search",
  );
  await expect(page.locator("[data-testid='results-panel']")).toContainText(
    "Stopped after finding 50 crib-compatible candidates.",
  );
  await expect(page.locator("[data-testid='results-panel']")).toContainText(
    "settings remain untested.",
  );
  await expect(page.locator("[data-testid='results-panel']")).toContainText(
    "The percentage measures search coverage, not confidence.",
  );
  const progress = page.getByRole("progressbar");
  expect(Number(await progress.getAttribute("value"))).toBeLessThan(
    Number(await progress.getAttribute("max")),
  );
});

test("short cribs transfer, search, and stay separate from the museum example", async ({
  page,
}, testInfo) => {
  const transfer = page.getByRole("button", {
    name: "Send to Bombe",
    exact: true,
  });
  await expect(transfer).toBeDisabled();
  await page
    .getByRole("textbox", { name: "Message input", exact: true })
    .fill("A");
  await transfer.click();
  const crib = page.getByRole("textbox", {
    name: "Plaintext crib",
    exact: true,
  });
  await expect(crib).toHaveValue("A");
  await expect(crib).toHaveAccessibleDescription(
    /Short cribs usually produce many possible settings/,
  );
  await page
    .getByRole("button", { name: "Historical notation", exact: true })
    .click();
  await expect(page.getByRole("table")).toHaveAccessibleName(
    "Current crib wiring schedule",
  );
  await expect(
    page.getByRole("button", {
      name: "Inspect menu connection 1, A to B",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: /museum example/ }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Run Bombe search", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText(
    "Candidate limit reached · partial search",
  );
  await page
    .getByRole("button", { name: "Museum example", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Museum example", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("table")).toHaveAccessibleName(
    "Museum example wiring schedule",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("museum-example.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Crib & search", exact: true })
    .click();
  await expect(crib).toHaveValue("A");
  await expect(page.getByRole("status")).toHaveText(
    "Candidate limit reached · partial search",
  );
  await expect(
    page.getByRole("button", {
      name: "Inspect menu connection 1, A to B",
      exact: true,
    }),
  ).toBeVisible();
  await crib.fill("");
  await expect(
    page.getByRole("button", { name: "Run Bombe search", exact: true }),
  ).toBeDisabled();
  await crib.fill("ABCDEFGH");
  await expect(page.locator("#short-crib-hint")).toHaveCount(0);
});

test("changing any search assumption clears candidates and search progress", async ({
  page,
}) => {
  const edits = [
    () =>
      page
        .getByRole("textbox", { name: "Intercepted ciphertext", exact: true })
        .fill("C"),
    () =>
      page
        .getByRole("textbox", { name: "Plaintext crib", exact: true })
        .fill("D"),
    () =>
      page
        .getByRole("spinbutton", { name: "Crib offset", exact: true })
        .fill("1"),
    () =>
      page
        .getByRole("combobox", { name: "Left rotor", exact: true })
        .selectOption("V"),
    () =>
      page
        .getByRole("combobox", { name: "Middle ring setting", exact: true })
        .selectOption("B"),
    () =>
      page
        .getByRole("combobox", { name: "Rotor orders to search" })
        .selectOption("all"),
    () =>
      page.getByRole("combobox", { name: "Bombe reflector" }).selectOption("C"),
    () =>
      page
        .getByRole("combobox", { name: "Maximum plugboard cables" })
        .selectOption("0"),
  ];
  for (const edit of edits) {
    await page.goto("/");
    await page.getByRole("button", { name: "Bombe", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Intercepted ciphertext", exact: true })
      .fill("B");
    await page
      .getByRole("textbox", { name: "Plaintext crib", exact: true })
      .fill("A");
    await page
      .getByRole("button", { name: "Run Bombe search", exact: true })
      .click();
    await expect(page.getByRole("status")).toHaveText(
      "Candidate limit reached · partial search",
    );
    await page.locator("[data-testid='candidate-tabs'] button").nth(1).click();
    await edit();
    await expect(page.getByRole("status")).toHaveText("Ready");
    await expect(page.getByRole("progressbar")).toHaveAttribute("value", "0");
    await expect(page.locator("[data-testid='candidate-detail']")).toHaveCount(
      0,
    );
    await expect(
      page.locator("[data-testid='progress-details']"),
    ).toContainText("0.0s");
  }
});
