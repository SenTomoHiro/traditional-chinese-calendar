import { expect, test } from "@playwright/test";

test("英文体验可切换、保留计算结果并在刷新后恢复", async ({ page }) => {
  await page.goto("/");
  const 四柱 = await page.locator(".pillar-core strong").textContent();
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator(".international-guide")).toContainText("Traditional Chinese Calendar");
  await expect(page.locator(".international-guide")).toContainText("not a Western zodiac");
  await expect(page.locator(".pillar-core strong")).toHaveText(四柱 ?? "");
  await expect(page.locator("#sources")).toContainText("About");
  await page.locator("#about").getByText("About", { exact: true }).click();
  await expect(page.locator("#about")).toContainText("calendar and almanac");
  await expect(page.locator("#about")).not.toContainText("GPT and Codex assist");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  await page.getByRole("button", { name: "中文", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(page.locator(".international-guide")).toHaveCount(0);
});
