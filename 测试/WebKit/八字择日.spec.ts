import { expect, test } from "@playwright/test";

test("八字分析真实输入后显示命盘、旺衰证据、格局候选与三套取用", async ({ page }) => {
  await page.goto("/");
  await page.locator("[data-bazi-date]").fill("2026-08-09");
  await page.locator("[data-bazi-time]").fill("12:00");
  await page.locator("[data-bazi-gender]").selectOption("女");
  const 输出 = page.locator("[data-bazi-output]");
  await expect(输出).toContainText("丙午年　丙申月　乙卯日　壬午时");
  await expect(输出).toContainText("得令、得地、得势");
  await expect(输出).toContainText("正官格候选");
  await expect(输出).toContainText("格局用");
  await expect(输出).toContainText("扶抑");
  await expect(输出).toContainText("调候");
  await expect(输出).not.toContainText(/\d+%/u);
});

test("单人及双人婚姻择日均可完成并分别展示个人关系", async ({ page }) => {
  await page.goto("/");
  await page.locator("[data-election-event]").selectOption("出行");
  await page.locator("[data-election-start]").fill("2026-08-09");
  await page.locator("[data-election-end]").fill("2026-08-13");
  const 单人 = page.locator('[data-election-person="0"]');
  await 单人.locator("[data-person-date]").fill("1990-05-20");
  await 单人.locator("[data-person-time]").fill("14:35");
  await page.getByRole("button", { name: "开始筛选" }).click();
  await expect(page.locator("[data-election-output]")).toContainText("出行 · 2026-08-09 至 2026-08-13");
  await expect(page.locator("[data-election-output]")).toContainText("推荐时辰");
  await expect(page.locator("[data-election-output]")).toContainText("事主：");

  await page.getByRole("button", { name: "双人婚姻" }).click();
  await page.locator("[data-election-event]").selectOption("结婚");
  await page.locator("[data-election-start]").fill("2026-08-09");
  await page.locator("[data-election-end]").fill("2026-08-13");
  const 甲方 = page.locator('[data-election-person="0"]');
  const 乙方 = page.locator('[data-election-person="1"]');
  await 甲方.locator("[data-person-date]").fill("1990-05-20");
  await 甲方.locator("[data-person-time]").fill("14:35");
  await 乙方.locator("[data-person-date]").fill("1992-09-12");
  await 乙方.locator("[data-person-time]").fill("08:10");
  await page.getByRole("button", { name: "开始筛选" }).click();
  const 双人输出 = page.locator("[data-election-output]");
  await expect(双人输出).toContainText("结婚 · 2026-08-09 至 2026-08-13");
  await expect(双人输出).toContainText("甲方：");
  await expect(双人输出).toContainText("乙方：");
  await expect(双人输出).toContainText(/双方均有有利关系|至少一方有需要注意|对.+存在明显冲突/u);
});

for (const width of [390, 320]) {
  test(`${width}px 八字与择日卡片无横向滚动且深浅主题可用`, async ({ page }) => {
    const 控制台错误: string[] = [];
    const 资源404: string[] = [];
    page.on("console", (消息) => { if (消息.type() === "error") 控制台错误.push(消息.text()); });
    page.on("response", (响应) => { if (响应.status() === 404) 资源404.push(响应.url()); });
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.locator('[data-theme-preference="light"]').click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.locator('[data-theme-preference="dark"]').click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    expect(控制台错误).toEqual([]);
    expect(资源404).toEqual([]);
  });
}
