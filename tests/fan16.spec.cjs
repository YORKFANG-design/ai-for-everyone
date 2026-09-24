const { test, expect } = require("@playwright/test");

for (const viewport of [{ name:"mobile", width:390, height:844 }, { name:"desktop", width:1440, height:1000 }]) {
  test("FAN-16 result UX - " + viewport.name, async ({ page, context }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("http://127.0.0.1:3000/start");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByRole("button", { name: /Reply to a customer/ }).click();
    const input = page.locator("textarea#context");
    await input.fill("A customer has not replied to our proposal for a week. Help me follow up without sounding pushy.");
    await page.getByRole("button", { name: /Create my result/ }).click();
    await expect(page.getByRole("heading", { name: /ready-to-use version/ })).toBeVisible();
    const editable = page.getByLabel("Editable result");
    await expect(editable).toBeVisible();
    const original = await editable.inputValue();
    await editable.fill(original + " Thanks.");
    await expect(editable).toHaveValue(/Thanks\.$/);
    await page.getByRole("button", { name: "Shorter" }).click();
    await expect(page.getByText("Updated your result.")).toBeVisible();
    await expect(editable).not.toHaveValue(original);
    await page.getByRole("button", { name: /Copy \/ Use this/ }).click();
    await expect(page.getByText("Copied. Ready to use.")).toBeVisible();
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip.length).toBeGreaterThan(10);
    await page.getByRole("button", { name: "Save workflow" }).click();
    await expect(page.getByRole("heading", { name: "Sign in to keep your work" })).toBeVisible();
    await page.getByRole("button", { name: "Undo last change" }).click();
    await expect(page.getByText("Restored the previous version.")).toBeVisible();
    if (viewport.name === "mobile") {
      const dims = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: window.innerWidth }));
      expect(dims.body).toBeLessThanOrEqual(dims.viewport);
    }
  });
}
