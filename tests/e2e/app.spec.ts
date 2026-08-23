import { test, expect } from "@playwright/test";

test("homepage loads and shows EduManage", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "EduManage" })).toBeVisible();
});

test("health endpoint returns ok", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.status).toBe("ok");
});
