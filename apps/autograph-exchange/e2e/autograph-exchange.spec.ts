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

test("signed-out experience keeps readable layout on mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const title = page.getByRole("heading", { name: /warm, simple place/i });
  const cta = page.getByRole("link", { name: /start exchanging autographs/i });
  const featureCard = page.locator(".autograph-feature-card-signed-out");

  await expect(title).toBeVisible();
  await expect(cta).toBeVisible();
  await expect(featureCard).toBeVisible();

  const titleBox = await title.boundingBox();
  const cardBox = await featureCard.boundingBox();
  expect(titleBox).not.toBeNull();
  expect(cardBox).not.toBeNull();
  expect(titleBox!.width).toBeGreaterThan(180);
  expect(cardBox!.width).toBeGreaterThan(280);

  await expectNoSeriousA11yViolations(page);
});

test("signed-out experience keeps readable layout on tablet viewport", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/");

  const featureCard = page.locator(".autograph-feature-card-signed-out");
  const benefits = page.locator(".autograph-feature-benefit");

  await expect(featureCard).toBeVisible();
  await expect(benefits.first()).toBeVisible();
  await expect(benefits).toHaveCount(3);

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

test("authenticated flow keeps key tiles readable on iPhone dark mode", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: "dark" });

  await signInAs(page, { name: "Asha Raman", email: "asha@example.com" });
  await page.goto("/");

  await expect(page.locator(".autograph-momentum-step").first()).toBeVisible();
  await expect(page.locator(".autograph-setup-card").first()).toBeVisible();
  await expect(page.locator(".autograph-lane-archive")).toBeVisible();

  const stepContrast = await page.locator(".autograph-momentum-step").first().evaluate((node) => {
    const label = node.querySelector(".autograph-momentum-step-label");
    if (!label) {
      return { color: "", backgroundImage: "none" };
    }

    const nodeStyle = window.getComputedStyle(node);
    const labelStyle = window.getComputedStyle(label);

    return {
      color: labelStyle.color,
      backgroundImage: nodeStyle.backgroundImage,
    };
  });

  expect(stepContrast.backgroundImage).not.toBe("none");
  expect(stepContrast.color).not.toBe("rgb(255, 255, 255)");

  await expectNoSeriousA11yViolations(page);
});
