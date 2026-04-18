import { expect, test } from "@playwright/test";
import axe from "axe-core";

async function expectNoSeriousA11yViolations(page: Parameters<typeof test>[0]["page"]) {
  await page.addScriptTag({ content: axe.source });
  const results = await page.evaluate(async () => {
    // @ts-expect-error axe is injected into the page
    return window.axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa"],
      },
    });
  });

  const seriousViolations = results.violations.filter(
    (violation: { impact?: string | null }) => violation.impact === "serious" || violation.impact === "critical",
  );

  expect(seriousViolations, JSON.stringify(seriousViolations, null, 2)).toEqual([]);
}

async function signInAs(page: Parameters<typeof test>[0]["page"], identity: { name: string; email: string }) {
  const csrfResponse = await page.request.get("/api/auth/csrf");
  expect(csrfResponse.ok()).toBeTruthy();
  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };

  const callbackResponse = await page.request.post("/api/auth/callback/credentials", {
    form: {
      csrfToken,
      callbackUrl: "/",
      json: "true",
      name: identity.name,
      email: identity.email,
    },
  });

  expect(callbackResponse.ok()).toBeTruthy();
}

test("signed-out experience is responsive and accessible", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /warm, simple place/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /start exchanging autographs/i })).toBeVisible();

  const featureCard = page.locator(".autograph-feature-card-signed-out");
  await expect(featureCard).toBeVisible();

  const box = await featureCard.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThan(260);

  await expectNoSeriousA11yViolations(page);
});

test("sign-in page is usable and accessible", async ({ page }) => {
  await page.goto("/sign-in");

  await expect(page.getByRole("heading", { name: /join autograph exchange/i })).toBeVisible();
  await expect(page.getByLabel("Name")).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByRole("button", { name: /continue/i })).toBeVisible();

  await expectNoSeriousA11yViolations(page);
});

test("authenticated flow works and key layout regions stay visible", async ({ page }) => {
  await signInAs(page, { name: "Asha Raman", email: "asha@example.com" });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /collect thoughtful autographs/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /your autograph profile/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /ask someone for an autograph/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /requests for you/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /signed autographs/i })).toBeVisible();

  const screen = page.locator(".autograph-screen");
  const lanes = page.locator(".autograph-lanes");
  await expect(screen).toBeVisible();
  await expect(lanes).toBeVisible();

  const screenBox = await screen.boundingBox();
  const lanesBox = await lanes.boundingBox();
  expect(screenBox).not.toBeNull();
  expect(lanesBox).not.toBeNull();
  expect(screenBox!.width).toBeGreaterThan(260);
  expect(lanesBox!.width).toBeGreaterThan(240);

  await expectNoSeriousA11yViolations(page);
});
