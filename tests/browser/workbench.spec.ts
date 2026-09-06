import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('enciphers, rejects invalid plugs, and replays on undo', async ({ page }) => {
  const input = page.getByRole('textbox', { name: 'Message input', exact: true });
  const output = page.getByRole('textbox', { name: 'Message output', exact: true });
  await input.fill('Hello, world! 123');
  await expect(input).toHaveValue('HELLOWORLD');
  await expect(output).toHaveValue('ILBDA AMTAZ');
  await page.getByRole('button', { name: 'Undo letter', exact: true }).click();
  await expect(input).toHaveValue('HELLOWORL');
  await page.getByRole('textbox', { name: 'Plugboard pairs', exact: true }).fill('AB AC');
  await expect(page.getByRole('alert')).toContainText('already connected');
  await expect(page.getByRole('button', { name: 'Type A', exact: true })).toBeDisabled();
  await page.getByRole('textbox', { name: 'Plugboard pairs', exact: true }).fill('');
  await page.getByRole('button', { name: 'Clear message', exact: true }).click();
  await page.getByRole('button', { name: 'Type A', exact: true }).click();
  await expect(output).toHaveValue('B');
});

test('double stepping and trace inspection show the researched states', async ({ page }) => {
  await page.getByRole('combobox', { name: 'Left rotor', exact: true }).selectOption('III');
  await expect(page.getByRole('combobox', { name: 'Right rotor', exact: true })).toHaveValue('I');
  await page.getByRole('combobox', { name: 'Left starting window', exact: true }).selectOption('K');
  await page
    .getByRole('combobox', { name: 'Middle starting window', exact: true })
    .selectOption('D');
  await page
    .getByRole('combobox', { name: 'Right starting window', exact: true })
    .selectOption('Q');
  await page.getByRole('textbox', { name: 'Message input', exact: true }).fill('AA');
  await expect(page.locator('.step-explanation strong')).toHaveText('KER → LFS');
  const slider = page.getByRole('slider', { name: 'Inspect letter', exact: true });
  await slider.focus();
  await slider.press('Home');
  await expect(page.locator('.step-explanation strong')).toHaveText('KDQ → KER');
});

test('Bombe finishes a complete position sweep and verifies the demo candidate', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Bombe', exact: true }).click();
  await page.getByRole('button', { name: 'Run Bombe search', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Search complete', { timeout: 30000 });
  await expect(page.locator('.candidate-tabs')).toContainText('AAF');
  await expect(page.locator('.candidate-detail')).toContainText('AV BS CG DL');
  await expect(page.locator('.candidate-plaintext')).toHaveText('WETTERVORHERSAGEFUERDIEBISKAYA');
  await expect(page.locator('.progress-details')).toContainText('17,576 / 17,576');
});

test('transfers a message and cancels a larger worker search', async ({ page }) => {
  await page
    .getByRole('textbox', { name: 'Message input', exact: true })
    .fill('WETTERVORHERSAGEFUERDIEBISKAYA');
  const output = (
    await page.getByRole('textbox', { name: 'Message output', exact: true }).inputValue()
  ).replaceAll(' ', '');
  await page.getByRole('button', { name: 'Send to Bombe', exact: true }).click();
  await expect(
    page.getByRole('textbox', { name: 'Intercepted ciphertext', exact: true }),
  ).toHaveValue(output);
  await expect(page.getByRole('textbox', { name: 'Plaintext crib', exact: true })).toHaveValue(
    'WETTERVORHERSAGEFUERDIEBISKAYA',
  );
  await page
    .getByRole('combobox', { name: 'Rotor orders to search', exact: true })
    .selectOption('all');
  await page.getByRole('button', { name: 'Run Bombe search', exact: true }).click();
  await page.getByRole('button', { name: 'Stop search', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Stopped · partial search');
  await page.getByRole('spinbutton', { name: 'Crib offset', exact: true }).fill('1');
  await expect(page.getByRole('alert')).toContainText('fit');
  await expect(page.getByRole('button', { name: 'Run Bombe search', exact: true })).toBeDisabled();
});

test('all workspaces fit the viewport without horizontal page scrolling', async ({ page }) => {
  for (const tab of ['Enigma', 'Bombe', 'Field guide']) {
    await page.getByRole('button', { name: tab, exact: true }).click();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
});
