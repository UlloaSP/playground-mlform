import { expect, test } from "@playwright/test";

const demos = [
  ["formulation-kit", "Materials"],
  ["playground-stacked", "Release controls"],
  ["playground-split", "Release name"],
  ["field-combinations", "Text required bounded"],
  ["wizard-reports", "Core controls"],
  ["tabs-classic", "Basics"],
];

const pageErrors = (page) => {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
};

const clickSubmit = async (page, text) => {
  await page.getByText(text).first().scrollIntoViewIfNeeded();
  await page.getByText(text).first().click();
};

test.describe("MLForm new API browser smoke", () => {
  for (const [hash, expectedText] of demos) {
    test(`renders ${hash}`, async ({ page }) => {
      const errors = pageErrors(page);
      await page.goto(`/#${hash}`);
      await expect(page.getByText(expectedText).first()).toBeVisible();
      await expect(page.locator("body")).not.toContainText("RegistryError");
      await expect(page.locator("body")).not.toContainText("Unknown field kind");
      expect(errors).toEqual([]);
    });
  }

  test("formulation renders its mapped prediction report", async ({ page }) => {
    const errors = pageErrors(page);
    await page.goto("/#formulation-kit");
    await clickSubmit(page, "Complete Prediction");

    await expect(page.locator("mlf-formulation-prediction-report")).toBeVisible();
    await expect(page.getByText("Mechanical characteristics")).toBeVisible();
    await expect(page.getByText("Dissolution over time")).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("playground submits onehot, mappedTo fanout reports, and custom backend plugin", async ({ page }) => {
    const errors = pageErrors(page);
    await page.goto("/#playground-stacked");
    await clickSubmit(page, "Run Multi-backend Inference");
    await expect
      .poll(() =>
        page
          .locator("mlf-kit-disclosure")
          .evaluate((host) => host.view.form.state.status),
      )
      .toBe("success");
    await page.getByRole("button", { name: /Backend reports/ }).click();

    await expect(page.locator("mlf-backend-compare-report")).toBeVisible();
    await expect(page.getByText("Baseline").first()).toBeVisible();
    await expect(page.getByText("Optimistic").first()).toBeVisible();
    await expect(page.getByText("Conservative").first()).toBeVisible();
    await expect
      .poll(() =>
        page
          .locator("mlf-backend-compare-report")
          .evaluateAll((elements) =>
            elements.map((element) => element.shadowRoot?.textContent ?? "").join("\n"),
          ),
      )
      .toContain("Launch score");

    const submission = await page
      .locator("mlf-kit-disclosure")
      .evaluate((host) => ({
        lastResult: host.view.form.state.lastResult,
        reportStates: host.view
          .getSnapshot()
          .reports.map((report) => ({ id: report.id, status: report.state.status })),
      }));
    const reportText = await page
      .locator("mlf-backend-compare-report")
      .evaluateAll((elements) =>
        elements.map((element) => element.shadowRoot?.textContent ?? "").join("\n"),
      );

    expect(submission.lastResult.displayValues["Risk tier"]).toBe("medium");
    expect(submission.lastResult.modelValues.risk_low).toBe(0);
    expect(submission.lastResult.modelValues.risk_medium).toBe(1);
    expect(submission.lastResult.modelValues.risk_high).toBe(0);
    expect(
      submission.lastResult.inputs.find((input) => input.fieldId === "risk-tier")?.value,
    ).toBe("medium");
    expect(submission.lastResult.displayValues["Evaluation date"]).toBeTruthy();
    expect(submission.lastResult.displayValues["Version scores"]).toBeTruthy();
    expect(submission.lastResult.reports).toHaveLength(9);
    expect(submission.reportStates).toEqual(
      expect.arrayContaining([
        { id: "baseline-recommendation", status: "ready" },
        { id: "baseline-latency", status: "ready" },
        { id: "optimistic-recommendation", status: "ready" },
        { id: "optimistic-latency", status: "ready" },
        { id: "conservative-recommendation", status: "ready" },
        { id: "conservative-latency", status: "ready" },
        { id: "backend-compare", status: "ready" },
      ]),
    );
    expect(Object.keys(submission.lastResult.raw.backends)).toEqual([
      "baseline",
      "optimistic",
      "conservative",
    ]);
    expect(reportText).toContain("Launch score");
    expect(errors).toEqual([]);
  });

  test("invalid field-combinations render validation instead of crashing", async ({ page }) => {
    const errors = pageErrors(page);
    await page.goto("/#field-combinations");
    await clickSubmit(page, "Run Multi-backend Inference");

    await expect(page.getByText("Value does not match the expected pattern.").first()).toBeVisible();
    await expect(page.getByText("Minimum length cannot exceed maximum length.").first()).toBeVisible();
    await expect(page.getByText("Date must fall on a step of 7 day(s)").first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText("TypeError");
    expect(errors).toEqual([]);
  });
});
