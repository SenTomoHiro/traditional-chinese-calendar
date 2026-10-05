import { expect, test, type Page } from "@playwright/test";

function 监控错误(page: Page): () => void {
  const 错误: string[] = [];
  const 资源错误: string[] = [];
  page.on("pageerror", (错误项) => 错误.push(错误项.message));
  page.on("console", (消息) => { if (消息.type() === "error") 错误.push(消息.text()); });
  page.on("response", (响应) => { if (响应.status() >= 400) 资源错误.push(`${响应.status()} ${响应.url()}`); });
  return () => {
    expect(错误).toEqual([]);
    expect(资源错误).toEqual([]);
  };
}

for (const 宽度 of [1440, 390]) {
  test(`${宽度}px：首页、日期重绘和时辰动画持续可用`, async ({ page }) => {
    const 检查错误 = 监控错误(page);
    await page.setViewportSize({ width: 宽度, height: 900 });
    // 正式时辰范围的末小时仍需高亮，增强层不能按整数小时排除它。
    await page.clock.install({ time: new Date("2026-10-05T22:30:00+08:00") });
    await page.goto("/");
    await expect(page.locator(".lunar-title")).toBeVisible();
    await expect(page.locator(".day-button")).toHaveCount(31);
    await expect(page.locator(".hour-card")).toHaveCount(12);
    await expect(page.locator(".hour-card.is-current")).toHaveCount(1);
    await expect(page.locator(".hour-card.is-current")).toContainText("亥时");
    expect(await page.locator(".hour-card.is-current").evaluate((元素) => getComputedStyle(元素).animationName)).toBe("hour-breathe");
    expect(await page.locator(".day-button.is-today .today-mark").evaluate((元素) => getComputedStyle(元素).animationName)).toBe("today-pulse");

    for (const 日期 of ["2026-10-03", "2026-10-07", "2026-10-03"]) {
      await page.locator(`.day-button[data-date="${日期}"] .solar-day`).click();
      await expect(page.locator("[data-calendar-date]")).toHaveValue(日期);
      const 涟漪 = page.locator(`.day-button[data-date="${日期}"] .ripple`);
      await expect(涟漪).toHaveCount(1);
      expect(await 涟漪.evaluate((元素) => getComputedStyle(元素).animationName)).toBe("ripple-expand");
      await expect(涟漪).toHaveCount(0);
    }
    const 纪念日期 = page.locator('.day-button[data-date="2026-10-03"]');
    await expect(纪念日期).toHaveClass(/has-deity/u);
    expect(await 纪念日期.evaluate((元素) => getComputedStyle(元素, "::before").animationName)).toBe("deity-aura");
    await expect(page.locator(".calendar-info-grid")).toContainText("赤松黄大仙师圣诞");

    await page.locator('[data-action="next-month"]').click();
    await expect(page.locator("[data-month-calendar]")).toHaveAttribute("aria-label", "2026年11月");
    await page.locator('[data-action="previous-month"]').click();
    await expect(page.locator("[data-month-calendar]")).toHaveAttribute("aria-label", "2026年10月");
    await page.locator('.day-button[data-date="2026-10-03"]').click();
    await expect(page.locator('.day-button[data-date="2026-10-03"] .ripple')).toHaveCount(1);
    await page.locator('[data-hour-key="午"]').click();
    await expect(page.locator(".hour-card.is-selected")).toContainText("午时");
    expect(await page.locator(".hour-segment.is-selected").evaluate((元素) => getComputedStyle(元素).animationName)).toBe("segment-glow");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    检查错误();
  });
}

test("神圣纪念弹窗的进入、按钮、背景和 Escape 退出动画", async ({ page }) => {
  const 检查错误 = 监控错误(page);
  await page.goto("/");
  await page.locator("[data-calendar-date]").fill("2026-10-03");
  await page.locator("[data-calendar-date]").press("Enter");
  const 触发 = page.getByRole("button", { name: "赤松黄大仙师", exact: true });
  const 弹窗 = page.locator("[data-deity-dialog]");
  for (const 关闭方式 of ["按钮", "背景", "Escape"]) {
    await 触发.click();
    await expect(弹窗).toBeVisible();
    expect(await 弹窗.evaluate((元素) => getComputedStyle(元素).animationName)).toBe("dialog-scale-in");
    if (关闭方式 === "按钮") await page.getByRole("button", { name: "关闭神圣纪念详情" }).click();
    else if (关闭方式 === "背景") await page.mouse.click(2, 2);
    else await page.keyboard.press("Escape");
    await expect(弹窗).toHaveClass(/is-closing/u);
    expect(await 弹窗.evaluate((元素) => getComputedStyle(元素).animationName)).toBe("dialog-scale-out");
    await expect(弹窗).toBeHidden();
    await expect(page.locator("body")).not.toHaveClass(/deity-dialog-open/u);
    await expect(触发).toBeFocused();
  }
  检查错误();
});

test("减少动态效果时八字保持可读，动态重绘和无纪念日期不依赖动画", async ({ page }) => {
  const 检查错误 = 监控错误(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".bazi-chart-column")).toHaveCount(4);
  for (const 柱 of await page.locator(".bazi-chart-column").all()) {
    expect(await 柱.evaluate((元素) => getComputedStyle(元素).opacity)).toBe("1");
    expect(await 柱.evaluate((元素) => getComputedStyle(元素).animationName)).toBe("none");
  }
  await page.locator("[data-bazi-date]").fill("1990-05-20");
  expect(await page.locator(".bazi-chart-column").evaluateAll((元素) => 元素.every((项) => getComputedStyle(项).opacity === "1"))).toBe(true);
  await page.locator("[data-calendar-date]").fill("2026-10-03");
  await page.locator("[data-calendar-date]").press("Enter");
  await page.getByRole("button", { name: "赤松黄大仙师", exact: true }).click();
  await page.getByRole("button", { name: "关闭神圣纪念详情" }).click();
  await expect(page.locator("[data-deity-dialog]")).toBeHidden();
  await page.locator("[data-calendar-date]").fill("2026-10-05");
  await page.locator("[data-calendar-date]").press("Enter");
  await expect(page.locator(".calendar-info-grid")).toContainText("无");
  await expect(page.locator(".lunar-title")).toBeVisible();
  检查错误();
});


test("八字局部重绘重新观察可见图表，择日渐入后正常显示", async ({ page }) => {
  const 检查错误 = 监控错误(page);
  // 保留真实动画，并记录对象，避免慢速机器上动画已结束后无法再查询到它。
  await page.addInitScript(() => {
    const 已创建动画: Animation[] = [];
    (window as Window & { 日历测试动画?: Animation[] }).日历测试动画 = 已创建动画;
    const 原始动画 = Element.prototype.animate;
    Element.prototype.animate = function (帧, 选项) {
      const 动画 = 原始动画.call(this, 帧, 选项);
      if (this.matches('.election-day')) 已创建动画.push(动画);
      return 动画;
    };
  });
  await page.goto("/");
  await page.locator(".bazi-chart").scrollIntoViewIfNeeded();
  await expect(page.locator(".bazi-chart")).toHaveClass(/is-animating/u);
  await page.locator("[data-bazi-date]").fill("1990-05-20");
  await page.locator("[data-bazi-time]").fill("14:35");
  await expect(page.locator(".bazi-chart")).toHaveClass(/is-animating/u);
  expect(await page.locator(".bazi-chart-column").first().evaluate((元素) => getComputedStyle(元素).animationName)).toBe("pillar-fade-in");
  await page.locator("[data-election-category]").selectOption("日常事务");
  await page.locator("[data-election-event]").selectOption("出行");
  await page.locator("[data-election-start]").fill("2026-08-01");
  await page.locator("[data-election-end]").fill("2026-08-31");
  await page.getByRole("button", { name: "开始筛选" }).click();
  const 动画数 = await page.evaluate(async () => {
    const 动画 = (window as Window & { 日历测试动画?: Animation[] }).日历测试动画 ?? [];
    await Promise.all(动画.map((项) => 项.finished));
    return 动画.length;
  });
  expect(动画数).toBe(await page.locator(".election-day").count());
  expect(动画数).toBeGreaterThan(0);
  await expect(page.locator(".election-day").last()).toHaveCSS("opacity", "1");
  expect(await page.locator(".election-day").last().evaluate((元素) => (元素 as HTMLElement).style.opacity)).toBe("");
  检查错误();
});

test("可选观察器缺失时主体与八字仍可读，退出动画取消后完成关闭", async ({ page }) => {
  const 检查错误 = 监控错误(page);
  await page.addInitScript(() => { Reflect.deleteProperty(window, "IntersectionObserver"); });
  await page.goto("/");
  await expect(page.locator(".lunar-title")).toBeVisible();
  expect(await page.locator(".bazi-chart-column").evaluateAll((元素) => 元素.every((项) => getComputedStyle(项).opacity === "1"))).toBe(true);
  await page.locator("[data-calendar-date]").fill("2026-10-03");
  await page.locator("[data-calendar-date]").press("Enter");
  await page.getByRole("button", { name: "赤松黄大仙师", exact: true }).click();
  await page.getByRole("button", { name: "关闭神圣纪念详情" }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("[data-deity-dialog]")).toBeHidden();
  await expect(page.locator("body")).not.toHaveClass(/deity-dialog-open/u);
  检查错误();
});
