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
  await page.locator("[data-bazi-date]").fill("1990-05-20");
  await page.locator("[data-bazi-time]").fill("14:35");
  await expect(page.locator('[data-election-person="0"]')).toContainText("直接沿用");
  await page.getByRole("button", { name: "开始筛选" }).click();
  await expect(page.locator("[data-election-output]")).toContainText("出行 · 2026-08-09 至 2026-08-13");
  await expect(page.locator("[data-election-output]")).toContainText("推荐时辰");
  await expect(page.locator("[data-election-output]")).toContainText("事主：");

  await page.getByRole("button", { name: "双人婚姻" }).click();
  await page.locator("[data-election-event]").selectOption("结婚");
  await page.locator("[data-election-start]").fill("2026-08-09");
  await page.locator("[data-election-end]").fill("2026-08-13");
  const 乙方 = page.locator('[data-election-person="1"]');
  await 乙方.locator("[data-person-date]").fill("1992-09-12");
  await 乙方.locator("[data-person-time]").fill("08:10");
  await page.getByRole("button", { name: "开始筛选" }).click();
  const 双人输出 = page.locator("[data-election-output]");
  await expect(双人输出).toContainText("结婚 · 2026-08-09 至 2026-08-13");
  await expect(双人输出).toContainText("甲方：");
  await expect(双人输出).toContainText("乙方：");
  await expect(双人输出).toContainText(/双方均有有利关系|至少一方有需要注意|对.+存在重要不利关系/u);
});

test("十一个现代入口均可真实运行并显示正式铺注状态", async ({ page }) => {
  await page.goto("/");
  for (const 事项 of ["订婚", "结婚", "搬家", "搬家＋安床", "入宅", "归火", "安床", "开业", "签约", "出行", "祈福"]) {
    await page.locator("[data-election-event]").selectOption(事项);
    await page.locator("[data-election-start]").fill("2026-08-09");
    await page.locator("[data-election-end]").fill("2026-08-20");
    await page.getByRole("button", { name: "开始筛选" }).click();
    const 输出 = page.locator("[data-election-output]");
    await expect(输出).toContainText(`${事项} · 2026-08-09 至 2026-08-20`);
    if (await 输出.locator(".election-day").count()) {
      await expect(输出.locator(".verdict-row").first()).toContainText(/注宜|注忌|宜忌并注|宜忌皆不注|诸事皆忌|资料未全/u);
      await expect(输出.locator(".recommended-hours").first()).toContainText("推荐时辰");
    }
  }
});

test("PC 扩展模块位于日历主体下方并左右双栏，调候正文无额外缩进", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const 布局 = await page.evaluate(() => {
    const 主体 = document.querySelector<HTMLElement>(".calendar-layout")!.getBoundingClientRect();
    const 扩展 = document.querySelector<HTMLElement>(".calendar-extensions")!.getBoundingClientRect();
    const 八字 = document.querySelector<HTMLElement>('[aria-label="生辰八字查询"]')!.getBoundingClientRect();
    const 择日 = document.querySelector<HTMLElement>('[aria-label="个性化择日"]')!.getBoundingClientRect();
    const 正文 = [...document.querySelectorAll<HTMLElement>(".use-grid article > p")];
    return {
      主体底: 主体.bottom,
      扩展顶: 扩展.top,
      同边界: Math.abs(主体.left - 扩展.left) < 1 && Math.abs(主体.right - 扩展.right) < 1,
      双栏: Math.abs(八字.top - 择日.top) < 1 && 八字.right <= 择日.left + 1,
      正文左界: 正文.map((元素) => 元素.getBoundingClientRect().left),
      正文内边距: 正文.map((元素) => getComputedStyle(元素).paddingLeft),
    };
  });
  expect(布局.扩展顶).toBeGreaterThan(布局.主体底);
  expect(布局.同边界).toBe(true);
  expect(布局.双栏).toBe(true);
  expect(new Set(布局.正文左界.map(Math.round)).size).toBe(3);
  expect(布局.正文内边距).toEqual(["0px", "0px", "0px"]);
});

test("PC 日期总览与月历同段，时辰独占第二段且扩展卡片不再等高拉伸", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");

  const 初始布局 = await page.evaluate(() => {
    const 矩形 = (选择器: string) => document.querySelector<HTMLElement>(选择器)!.getBoundingClientRect();
    const 主体 = 矩形(".calendar-layout");
    const 概要 = 矩形(".detail-card");
    const 月历 = 矩形(".calendar-right");
    const 时辰 = 矩形(".hour-section");
    const 扩展 = 矩形(".calendar-extensions");
    return {
      概要月历同段: Math.abs(概要.top - 月历.top) < 1,
      时辰在首段后: 时辰.top >= Math.max(概要.bottom, 月历.bottom) - 1,
      时辰全宽: Math.abs(时辰.left - 主体.left) < 2 && Math.abs(时辰.right - 主体.right) < 2,
      扩展在时辰后: 扩展.top >= 时辰.bottom,
      月历未被时辰撑高: 月历.bottom < 时辰.top - 1,
    };
  });
  expect(初始布局).toEqual({
    概要月历同段: true,
    时辰在首段后: true,
    时辰全宽: true,
    扩展在时辰后: true,
    月历未被时辰撑高: true,
  });

  await page.locator("[data-election-event]").selectOption("出行");
  await page.locator("[data-election-start]").fill("2026-08-01");
  await page.locator("[data-election-end]").fill("2026-08-31");
  await page.getByRole("button", { name: "开始筛选" }).click();
  await expect(page.locator("[data-election-output]")).toContainText("出行 · 2026-08-01 至 2026-08-31");

  const 扩展布局 = await page.evaluate(() => {
    const 矩形 = (选择器: string) => document.querySelector<HTMLElement>(选择器)!.getBoundingClientRect();
    const 扩展 = 矩形(".calendar-extensions");
    const 八字 = 矩形('[aria-label="生辰八字查询"]');
    const 择日 = 矩形('[aria-label="个性化择日"]');
    return {
      择日更长: 择日.bottom > 八字.bottom + 1,
      短栏未被拉伸: 八字.bottom < 扩展.bottom - 1,
      容器随长栏结束: Math.abs(扩展.bottom - 择日.bottom) <= 2,
    };
  });
  expect(扩展布局).toEqual({ 择日更长: true, 短栏未被拉伸: true, 容器随长栏结束: true });
});

for (const width of [768, 390, 320]) {
  test(`${width}px 窄屏严格按概要、时辰、月历、八字、择日显示`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    const 顺序 = await page.evaluate(() => {
      const 矩形 = (选择器: string) => document.querySelector<HTMLElement>(选择器)!.getBoundingClientRect();
      const 概要 = 矩形(".detail-card");
      const 时辰 = 矩形(".hour-section");
      const 月历 = 矩形(".calendar-right");
      const 八字 = 矩形('[aria-label="生辰八字查询"]');
      const 择日 = 矩形('[aria-label="个性化择日"]');
      return {
        概要后时辰: 时辰.top >= 概要.bottom - 1,
        时辰后月历: 月历.top >= 时辰.bottom - 1,
        月历后八字: 八字.top >= 月历.bottom - 1,
        八字后择日: 择日.top >= 八字.bottom - 1,
        无横向滚动: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      };
    });
    expect(顺序).toEqual({
      概要后时辰: true,
      时辰后月历: true,
      月历后八字: true,
      八字后择日: true,
      无横向滚动: true,
    });
  });
}

test("主推荐不超过五项并展示实际筛选数量", async ({ page }) => {
  await page.goto("/");
  await page.locator("[data-election-event]").selectOption("出行");
  await page.locator("[data-election-start]").fill("2026-08-01");
  await page.locator("[data-election-end]").fill("2026-08-31");
  await page.getByRole("button", { name: "开始筛选" }).click();
  const 推荐 = page.locator(".election-day");
  expect(await 推荐.count()).toBeLessThanOrEqual(5);
  await expect(page.locator(".election-results > header")).toContainText(/选出 \d+ 个相对最优结果|候选不足/u);
});

test("X63 普通月、两个闰月及交节前后均可真实运行且无资料缺口", async ({ page }) => {
  const 控制台错误: string[] = [];
  const 资源404: string[] = [];
  page.on("console", (消息) => { if (消息.type() === "error") 控制台错误.push(消息.text()); });
  page.on("response", (响应) => { if (响应.status() === 404) 资源404.push(响应.url()); });
  await page.goto("/");
  for (const [事项, 开始, 结束] of [
    ["开业", "2026-02-20", "2026-02-28"],
    ["开业", "2023-03-22", "2023-04-08"],
    ["签约", "2025-08-01", "2025-08-18"],
    ["开业", "2025-08-06", "2025-08-08"],
  ] as const) {
    await page.locator("[data-election-event]").selectOption(事项);
    await page.locator("[data-election-start]").fill(开始);
    await page.locator("[data-election-end]").fill(结束);
    await page.getByRole("button", { name: "开始筛选" }).click();
    const 输出 = page.locator("[data-election-output]");
    await expect(输出).toContainText(`${事项} · ${开始} 至 ${结束}`);
    await expect(输出).not.toContainText("资料未全");
  }
  expect(控制台错误).toEqual([]);
  expect(资源404).toEqual([]);
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

for (const width of [768, 390, 320]) {
  test(`${width}px 八字与择日扩展区为纵向单栏`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const 位置 = await page.evaluate(() => {
      const 八字 = document.querySelector<HTMLElement>('[aria-label="生辰八字查询"]')!.getBoundingClientRect();
      const 择日 = document.querySelector<HTMLElement>('[aria-label="个性化择日"]')!.getBoundingClientRect();
      return { 八字顶: 八字.top, 八字左: 八字.left, 择日顶: 择日.top, 择日左: 择日.left };
    });
    expect(位置.择日顶).toBeGreaterThan(位置.八字顶);
    expect(Math.abs(位置.八字左 - 位置.择日左)).toBeLessThan(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  });
}
