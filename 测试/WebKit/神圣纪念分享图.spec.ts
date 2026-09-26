import { expect, test, type Page } from "@playwright/test";

async function 打开纪念(page: Page, 日期: string, 名称: string): Promise<void> {
  await page.goto("/");
  await page.locator("[data-calendar-date]").fill(日期);
  const 栏 = page.locator(".calendar-info-item").filter({ has: page.getByRole("heading", { name: "神圣纪念", exact: true }) });
  await 栏.getByRole("button", { name: 名称, exact: true }).click();
}

for (const 场景 of [
  { 名称: "PC", 宽: 1440, 高: 1000 },
  { 名称: "手机", 宽: 390, 高: 844 },
] as const) {
  test(`${场景.名称}可预览并下载 4:5 高清分享图`, async ({ page }) => {
    const 错误: string[] = [];
    const 资源404: string[] = [];
    page.on("pageerror", (项) => 错误.push(项.message));
    page.on("console", (项) => { if (项.type() === "error") 错误.push(项.text()); });
    page.on("response", (项) => { if (项.status() === 404) 资源404.push(项.url()); });
    await page.setViewportSize({ width: 场景.宽, height: 场景.高 });
    await 打开纪念(page, "2026-08-06", "关圣帝君");
    await page.getByRole("button", { name: "生成分享图" }).click();
    const 预览 = page.locator(".deity-share-panel > img");
    await expect(预览).toBeVisible();
    await expect(预览).toHaveJSProperty("complete", true);
    expect(await 预览.evaluate((图片) => ({ 宽: (图片 as HTMLImageElement).naturalWidth, 高: (图片 as HTMLImageElement).naturalHeight }))).toEqual({ 宽: 1080, 高: 1350 });
    const 下载 = page.waitForEvent("download");
    await page.getByRole("link", { name: "下载 PNG" }).click();
    const 文件 = await 下载;
    expect(文件.suggestedFilename()).toMatch(/神圣纪念-关圣帝君-2026年8月6日\.png/u);
    await expect(page.locator(".deity-share-error")).toHaveCount(0);
    expect(错误).toEqual([]);
    expect(资源404).toEqual([]);
  });
}

test("无神像的独立纪念仍可生成分享图", async ({ page }) => {
  await 打开纪念(page, "2026-02-17", "天腊之辰");
  await page.getByRole("button", { name: "生成分享图" }).click();
  await expect(page.getByAltText("天腊之辰朋友圈分享图预览")).toBeVisible();
});

test("短正文保持 4:5，长正文按内容适度加高且完整导出", async ({ page }) => {
  await 打开纪念(page, "2026-07-02", "湛然天师");
  await page.getByRole("button", { name: "生成分享图" }).click();
  const 短图 = page.locator(".deity-share-panel > img");
  await expect(短图).toHaveJSProperty("complete", true);
  expect(await 短图.evaluate((图片) => (图片 as HTMLImageElement).naturalHeight)).toBe(1350);
  await page.getByRole("button", { name: "关闭分享图预览" }).click();
  await page.getByRole("button", { name: "关闭神圣纪念详情" }).click();

  await 打开纪念(page, "2027-02-05", "清静真人孙不二");
  await page.getByRole("button", { name: "生成分享图" }).click();
  const 长图 = page.locator(".deity-share-panel > img");
  await expect(长图).toHaveJSProperty("complete", true);
  const 高 = await 长图.evaluate((图片) => (图片 as HTMLImageElement).naturalHeight);
  expect(高).toBeGreaterThan(1350);
  expect(高).toBeLessThan(1650);
  await expect(page.locator(".deity-share-heading")).toContainText(`1080 × ${高}`);
  const 下载 = page.waitForEvent("download");
  await page.getByRole("link", { name: "下载 PNG" }).click();
  expect((await 下载).suggestedFilename()).toContain("清静真人孙不二");
});
