import { test, expect } from "@playwright/test";

test("homepage redirects to a localized home and shows the hero", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/(fr|en)\/?$/);
  await expect(
    page.getByRole("heading", {
      name: /Pilotez toute votre organisation|Run your entire education organization/,
    })
  ).toBeVisible();
});

test("French homepage renders under /fr", async ({ page }) => {
  await page.goto("/fr");
  await expect(
    page.getByRole("heading", { name: "Pilotez toute votre organisation éducative" })
  ).toBeVisible();
});

test("English homepage renders under /en", async ({ page }) => {
  await page.goto("/en");
  await expect(
    page.getByRole("heading", { name: "Run your entire education organization" })
  ).toBeVisible();
});

test("locale cookie persists the chosen language", async ({ context, page }) => {
  await context.addCookies([
    {
      name: "edumanage_lang",
      value: "en",
      domain: "localhost",
      path: "/",
    },
  ]);
  await page.goto("/");
  await expect(page).toHaveURL(/\/en\/?$/);
  await expect(
    page.getByRole("heading", { name: "Run your entire education organization" })
  ).toBeVisible();
});

test("locale switcher keeps the user in the same language subtree", async ({ page }) => {
  await page.goto("/fr/features");
  await expect(
    page.getByRole("heading", { name: "Une suite complète pour votre organisation" })
  ).toBeVisible();
  const switchLink = page.locator("a", { hasText: /EN|English/ }).first();
  await switchLink.click();
  await page.waitForURL(/\/(en|fr)\/features$/);
  await expect(page).toHaveURL(/\/(en|fr)\/features$/);
});

test("localized public pages resolve", async ({ page }) => {
  await page.goto("/en/pricing");
  await expect(
    page.getByRole("heading", { name: "Simple, transparent pricing" })
  ).toBeVisible();
});

test("health endpoint returns ok", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.status).toBe("ok");
});