import { expect, test, type Page, type TestInfo } from "@playwright/test";
import axe from "axe-core";

async function expectNoSeriousA11yViolations(page: Page, contextSelector?: string) {
  await page.addScriptTag({ content: axe.source });
  const results = await page.evaluate(async (selector) => {
    const context = selector ? document.querySelector(selector) : document;

    if (!context) {
      throw new Error(`Missing accessibility check context: ${selector}`);
    }

    // @ts-expect-error axe is injected into the page
    return window.axe.run(context, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa"],
      },
    });
  }, contextSelector ?? null);

  const seriousViolations = results.violations.filter(
    (violation: { impact?: string | null }) => violation.impact === "serious" || violation.impact === "critical",
  );

  expect(seriousViolations, JSON.stringify(seriousViolations, null, 2)).toEqual([]);
}

async function signInAs(page: Page, identity: { name: string; email: string }) {
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

function contrastTestIdentities(testInfo: TestInfo) {
  const suffix = `${testInfo.project.name}-${testInfo.workerIndex}-${testInfo.retry}-${Date.now()}`.replace(/[^a-z0-9-]+/gi, "-");

  return {
    requester: {
      name: `Asha ${suffix}`,
      email: `asha-${suffix}@example.com`,
      role: "student",
    },
    signer: {
      name: `Ravi ${suffix}`,
      email: `ravi-${suffix}@example.com`,
      role: "teacher",
    },
  } as const;
}

async function saveProfile(page: Page, profile: { name: string; email: string; role: "student" | "teacher" }) {
  await signInAs(page, profile);

  const response = await page.request.put("/api/autographs/profiles", {
    data: {
      displayName: profile.name,
      role: profile.role,
    },
  });

  expect(response.ok()).toBeTruthy();
}

async function seedComboboxProfiles(page: Page, testInfo: TestInfo) {
  const identities = contrastTestIdentities(testInfo);

  await saveProfile(page, identities.signer);
  await saveProfile(page, identities.requester);

  return identities;
}

async function expectReadableComboboxContrast(page: Page) {
  const results = await page.evaluate(() => {
    type Rgba = { r: number; g: number; b: number; a: number };

    const parseColor = (value: string): Rgba | null => {
      const match = value.match(/rgba?\(([^)]+)\)/);
      if (!match) {
        return null;
      }

      const parts = match[1].split(",").map((part) => part.trim());
      const [r, g, b] = parts.slice(0, 3).map((part) => Number.parseFloat(part));
      const a = parts[3] === undefined ? 1 : Number.parseFloat(parts[3]);

      if (![r, g, b, a].every(Number.isFinite)) {
        return null;
      }

      return { r, g, b, a };
    };

    const channelToLinear = (channel: number) => {
      const normalized = channel / 255;
      return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    };

    const luminance = (color: Rgba) =>
      0.2126 * channelToLinear(color.r) + 0.7152 * channelToLinear(color.g) + 0.0722 * channelToLinear(color.b);

    const contrastRatio = (foreground: Rgba, background: Rgba) => {
      const lighter = Math.max(luminance(foreground), luminance(background));
      const darker = Math.min(luminance(foreground), luminance(background));
      return (lighter + 0.05) / (darker + 0.05);
    };

    const effectiveBackground = (element: Element): Rgba => {
      let cursor: Element | null = element;

      while (cursor) {
        const parsed = parseColor(window.getComputedStyle(cursor).backgroundColor);
        if (parsed && parsed.a > 0.05) {
          return parsed;
        }

        cursor = cursor.parentElement;
      }

      return { r: 255, g: 255, b: 255, a: 1 };
    };

    return Array.from(
      document.querySelectorAll(".autograph-combobox-input, .autograph-combobox-option-name, .autograph-combobox-option-role"),
    ).map((node) => {
      const styles = window.getComputedStyle(node);
      const foreground = parseColor(styles.color) ?? { r: 0, g: 0, b: 0, a: 1 };
      const background = effectiveBackground(node);

      return {
        className: node.getAttribute("class") ?? node.tagName,
        color: styles.color,
        background: `rgb(${background.r}, ${background.g}, ${background.b})`,
        ratio: contrastRatio(foreground, background),
      };
    });
  });

  expect(results.length).toBeGreaterThanOrEqual(3);
  expect(results, JSON.stringify(results, null, 2)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ className: expect.stringContaining("autograph-combobox-input") }),
      expect.objectContaining({ className: expect.stringContaining("autograph-combobox-option-name") }),
      expect.objectContaining({ className: expect.stringContaining("autograph-combobox-option-role") }),
    ]),
  );

  for (const result of results) {
    expect(result.ratio, JSON.stringify(result, null, 2)).toBeGreaterThanOrEqual(4.5);
  }
}

async function expectReadableSignInContrast(page: Page) {
  const results = await page.evaluate(() => {
    type Rgba = { r: number; g: number; b: number; a: number };

    const parseColor = (value: string): Rgba | null => {
      const match = value.match(/rgba?\(([^)]+)\)/);
      if (!match) {
        return null;
      }

      const parts = match[1].split(",").map((part) => part.trim());
      const [r, g, b] = parts.slice(0, 3).map((part) => Number.parseFloat(part));
      const a = parts[3] === undefined ? 1 : Number.parseFloat(parts[3]);

      if (![r, g, b, a].every(Number.isFinite)) {
        return null;
      }

      return { r, g, b, a };
    };

    const blend = (foreground: Rgba, background: Rgba): Rgba => ({
      r: foreground.r * foreground.a + background.r * (1 - foreground.a),
      g: foreground.g * foreground.a + background.g * (1 - foreground.a),
      b: foreground.b * foreground.a + background.b * (1 - foreground.a),
      a: 1,
    });

    const channelToLinear = (channel: number) => {
      const normalized = channel / 255;
      return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    };

    const luminance = (color: Rgba) =>
      0.2126 * channelToLinear(color.r) + 0.7152 * channelToLinear(color.g) + 0.0722 * channelToLinear(color.b);

    const contrastRatio = (foreground: Rgba, background: Rgba) => {
      const lighter = Math.max(luminance(foreground), luminance(background));
      const darker = Math.min(luminance(foreground), luminance(background));
      return (lighter + 0.05) / (darker + 0.05);
    };

    const effectiveBackground = (element: Element): Rgba => {
      const chain: Element[] = [];
      let cursor: Element | null = element;

      while (cursor) {
        chain.push(cursor);
        cursor = cursor.parentElement;
      }

      let background: Rgba = { r: 255, g: 255, b: 255, a: 1 };
      for (const node of chain.reverse()) {
        const parsed = parseColor(window.getComputedStyle(node).backgroundColor);
        if (parsed && parsed.a > 0) {
          background = parsed.a < 1 ? blend(parsed, background) : parsed;
        }
      }

      return background;
    };

    const contrastFor = (node: Element, color: string, label: string) => {
      const foreground = parseColor(color);
      const background = effectiveBackground(node);
      const compositedForeground = foreground && foreground.a < 1 ? blend(foreground, background) : foreground;

      return {
        label,
        color,
        background: `rgb(${Math.round(background.r)}, ${Math.round(background.g)}, ${Math.round(background.b)})`,
        ratio: compositedForeground ? contrastRatio(compositedForeground, background) : 0,
      };
    };

    const checks = [
      [".site-kicker", "kicker"],
      [".site-title", "title"],
      [".site-copy", "copy"],
      [".site-label", "label"],
      [".site-input", "input"],
      [".site-submit", "submit"],
    ] as const;

    const textResults = checks.flatMap(([selector, label]) =>
      Array.from(document.querySelectorAll(selector)).map((node) =>
        contrastFor(node, window.getComputedStyle(node).color, label),
      ),
    );

    const placeholderResults = Array.from(document.querySelectorAll(".site-input")).map((node) =>
      contrastFor(node, window.getComputedStyle(node, "::placeholder").color, "input placeholder"),
    );

    return [...textResults, ...placeholderResults];
  });

  expect(results.length).toBeGreaterThan(0);

  for (const result of results) {
    expect(result.ratio, JSON.stringify(result, null, 2)).toBeGreaterThanOrEqual(4.5);
  }
}

async function expectReadableSignedOutBenefitContrast(page: Page) {
  const results = await page.evaluate(() => {
    type Rgba = { r: number; g: number; b: number; a: number };

    const parseColor = (value: string): Rgba | null => {
      const match = value.match(/rgba?\(([^)]+)\)/);
      if (!match) {
        return null;
      }

      const parts = match[1].split(",").map((part) => part.trim());
      const [r, g, b] = parts.slice(0, 3).map((part) => Number.parseFloat(part));
      const a = parts[3] === undefined ? 1 : Number.parseFloat(parts[3]);

      if (![r, g, b, a].every(Number.isFinite)) {
        return null;
      }

      return { r, g, b, a };
    };

    const channelToLinear = (channel: number) => {
      const normalized = channel / 255;
      return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    };

    const luminance = (color: Rgba) =>
      0.2126 * channelToLinear(color.r) + 0.7152 * channelToLinear(color.g) + 0.0722 * channelToLinear(color.b);

    const contrastRatio = (foreground: Rgba, background: Rgba) => {
      const lighter = Math.max(luminance(foreground), luminance(background));
      const darker = Math.min(luminance(foreground), luminance(background));
      return (lighter + 0.05) / (darker + 0.05);
    };

    return Array.from(
      document.querySelectorAll(".autograph-feature-benefit-title, .autograph-feature-benefit-copy"),
    ).map((node) => {
      const card = node.closest(".autograph-feature-benefit") ?? node;
      const foreground = parseColor(window.getComputedStyle(node).color) ?? { r: 0, g: 0, b: 0, a: 1 };
      const background = parseColor(window.getComputedStyle(card).backgroundColor) ?? { r: 255, g: 255, b: 255, a: 1 };

      return {
        className: node.getAttribute("class") ?? node.tagName,
        color: window.getComputedStyle(node).color,
        background: window.getComputedStyle(card).backgroundColor,
        ratio: contrastRatio(foreground, background),
      };
    });
  });

  expect(results).toHaveLength(6);

  for (const result of results) {
    expect(result.ratio, JSON.stringify(result, null, 2)).toBeGreaterThanOrEqual(4.5);
  }
}

async function openSeededSignerCombobox(page: Page, testInfo: TestInfo) {
  const identities = await seedComboboxProfiles(page, testInfo);

  await page.goto("/");
  const combobox = page.getByRole("combobox", { name: /who should sign/i });
  await expect(combobox).toBeVisible();
  await combobox.fill(identities.signer.name);
  await expect(page.getByRole("option", { name: new RegExp(identities.signer.name) })).toBeVisible();
}

async function selectSeededSigner(page: Page, testInfo: TestInfo) {
  const identities = await seedComboboxProfiles(page, testInfo);

  await page.goto("/");
  const combobox = page.getByRole("combobox", { name: /who should sign/i });
  await expect(combobox).toBeVisible();
  await combobox.fill(identities.signer.name);
  await page.getByRole("option", { name: new RegExp(identities.signer.name) }).click();

  return identities;
}

test("signed-out experience is responsive and accessible", async ({ page }) => {
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme });
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /warm, simple place/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /start exchanging autographs/i })).toBeVisible();

    const featureCard = page.locator(".autograph-feature-card-signed-out");
    await expect(featureCard).toBeVisible();

    const box = await featureCard.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(260);

    await expectReadableSignedOutBenefitContrast(page);
    await expectNoSeriousA11yViolations(page);
  }
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
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme });
    await page.goto("/sign-in");

    await expect(page.getByRole("heading", { name: /join autograph exchange/i })).toBeVisible();
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByRole("button", { name: /continue/i })).toBeVisible();

    await expectReadableSignInContrast(page);
    await expectNoSeriousA11yViolations(page);
  }
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

test("signer combobox popup keeps readable contrast", async ({ page }, testInfo) => {
  await openSeededSignerCombobox(page, testInfo);
  await expectReadableComboboxContrast(page);
  await expectNoSeriousA11yViolations(page, ".autograph-combobox");
  await page.keyboard.press("Escape");
  await expectNoSeriousA11yViolations(page);
});

test("signer combobox popup keeps readable contrast in dark mode", async ({ page }, testInfo) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await openSeededSignerCombobox(page, testInfo);
  await expectReadableComboboxContrast(page);
  await expectNoSeriousA11yViolations(page, ".autograph-combobox");
  await page.keyboard.press("Escape");
  await expectNoSeriousA11yViolations(page);
});

test("request composer confirms sent requests inline and prevents duplicate submits", async ({ page }, testInfo) => {
  const identities = await selectSeededSigner(page, testInfo);
  const composer = page.locator("#autograph-request-composer");

  await composer.getByLabel(/why are you asking/i).fill(`Please sign my book, ${identities.signer.name}.`);
  await composer.getByRole("button", { name: /send request/i }).click();

  await expect(composer.locator(".autograph-request-submit-state").getByText(/^Request sent$/)).toBeVisible();
  await expect(composer.locator(".autograph-request-submit-state .autograph-context-title")).toContainText(identities.signer.name);
  await expect(composer.getByRole("link", { name: /view sent requests/i })).toBeVisible();
  await expect(composer.getByRole("button", { name: /request sent/i })).toBeDisabled();
  await expectNoSeriousA11yViolations(page);

  await composer.getByRole("button", { name: /ask another person/i }).click();
  await expect(composer.locator(".autograph-request-submit-state")).toBeHidden();
  await expect(composer.getByRole("combobox", { name: /who should sign/i })).toHaveValue("");
  await expect(composer.getByLabel(/why are you asking/i)).toHaveValue("");
  await expect(composer.getByRole("button", { name: /send request/i })).toBeDisabled();

  await composer.getByRole("combobox", { name: /who should sign/i }).fill(identities.signer.name);
  await page.getByRole("option", { name: new RegExp(identities.signer.name) }).click();
  await expect(composer.locator(".autograph-request-submit-state").getByText(/^Already pending$/)).toBeVisible();
  await composer.getByRole("button", { name: /dismiss request message/i }).click();
  await expect(composer.locator(".autograph-request-submit-state")).toBeHidden();
  await expect(composer.getByRole("button", { name: /already pending/i })).toBeDisabled();
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
