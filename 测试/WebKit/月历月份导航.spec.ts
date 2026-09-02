import { expect, test, type Page } from "@playwright/test";

async function 设置日期(page: Page, 日期: string): Promise<void> {
  await page.locator("[data-calendar-date]").fill(日期);
  await expect(page.locator("[data-calendar-date]")).toHaveValue(日期);
}

async function 触发触摸滑动(page: Page, 起点X: number, 起点Y: number, 终点X: number, 终点Y: number): Promise<void> {
  const 月历 = page.locator("[data-month-calendar]");
  await 月历.dispatchEvent("pointerdown", { pointerId: 41, pointerType: "touch", button: 0, clientX: 起点X, clientY: 起点Y });
  await 月历.dispatchEvent("pointermove", { pointerId: 41, pointerType: "touch", button: 0, clientX: 终点X, clientY: 终点Y });
  await 月历.dispatchEvent("pointerup", { pointerId: 41, pointerType: "touch", button: 0, clientX: 终点X, clientY: 终点Y });
}

test("月份按钮使用正式日期状态：月底钳制、跨年与返回今天均正确", async ({ page }) => {
  await page.goto("/");
  await 设置日期(page, "2026-03-31");
  await page.getByRole("button", { name: "下一月" }).click();
  await expect(page.locator("[data-calendar-date]")).toHaveValue("2026-04-30");
  await page.getByRole("button", { name: "上一月" }).click();
  await expect(page.locator("[data-calendar-date]")).toHaveValue("2026-03-30");

  await 设置日期(page, "2024-01-31");
  await page.getByRole("button", { name: "下一月" }).click();
  await expect(page.locator("[data-calendar-date]")).toHaveValue("2024-02-29");
  await 设置日期(page, "2026-01-15");
  await page.getByRole("button", { name: "上一月" }).click();
  await expect(page.locator("[data-calendar-date]")).toHaveValue("2025-12-15");
  await 设置日期(page, "2026-12-15");
  await page.getByRole("button", { name: "下一月" }).click();
  await expect(page.locator("[data-calendar-date]")).toHaveValue("2027-01-15");

  const 北京今天 = await page.evaluate(() => {
    const 现在 = new Date(Date.now() + 8 * 60 * 60 * 1000);
    return `${现在.getUTCFullYear()}-${String(现在.getUTCMonth() + 1).padStart(2, "0")}-${String(现在.getUTCDate()).padStart(2, "0")}`;
  });
  await page.getByRole("button", { name: "返回今天" }).click();
  await expect(page.locator("[data-calendar-date]")).toHaveValue(北京今天);
  await expect(page.locator("[data-time-output]")).toBeVisible();
});

test("PC 鼠标拖动、触摸左滑和右滑均仅切换一个月", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/");
  await 设置日期(page, "2026-03-15");
  const 月历框 = await page.locator("[data-month-calendar]").boundingBox();
  if (!月历框) throw new Error("未找到月历日期列表区域");
  const y = 月历框.y + Math.min(50, 月历框.height / 2);
  await page.mouse.move(月历框.x + 月历框.width * 0.72, y);
  await page.mouse.down();
  await page.mouse.move(月历框.x + 月历框.width * 0.25, y, { steps: 4 });
  await page.mouse.up();
  await expect(page.locator("[data-calendar-date]")).toHaveValue("2026-04-15");

  await 触发触摸滑动(page, 260, 100, 80, 100);
  await expect(page.locator("[data-calendar-date]")).toHaveValue("2026-05-15");
  await 触发触摸滑动(page, 80, 100, 260, 100);
  await expect(page.locator("[data-calendar-date]")).toHaveValue("2026-04-15");
});

test("小幅移动、纵向滚动和轻点日期不会误触月份切换", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await 设置日期(page, "2026-03-15");
  await 触发触摸滑动(page, 180, 120, 210, 121);
  await expect(page.locator("[data-calendar-date]")).toHaveValue("2026-03-15");
  await 触发触摸滑动(page, 180, 100, 188, 230);
  await expect(page.locator("[data-calendar-date]")).toHaveValue("2026-03-15");

  await page.locator("[data-month-calendar] [data-day='16']").click();
  await expect(page.locator("[data-calendar-date]")).toHaveValue("2026-03-16");
});

for (const 宽度 of [1440, 1024, 768, 390, 375, 320] as const) {
  test(`${宽度}px：月份与日期导航紧凑、无横向溢出`, async ({ page }) => {
    await page.setViewportSize({ width: 宽度, height: 宽度 <= 768 ? 900 : 1000 });
    await page.goto("/");
    await expect(page.getByRole("group", { name: "月份快捷操作" })).toBeVisible();
    await expect(page.getByRole("group", { name: "日期快捷操作" })).toBeVisible();
    expect(await page.locator(".main-date-navigation").evaluate((导航) => {
      const 框 = 导航.getBoundingClientRect();
      const 按钮 = [...导航.querySelectorAll<HTMLElement>(".date-shortcut-button")].map((元素) => 元素.getBoundingClientRect());
      const 相邻不重叠 = 按钮.every((当前, 索引) => 按钮.slice(索引 + 1).every((其他) => (
        当前.right <= 其他.left || 其他.right <= 当前.left || 当前.bottom <= 其他.top || 其他.bottom <= 当前.top
      )));
      return {
        withinViewport: 框.left >= -1 && 框.right <= document.documentElement.clientWidth + 1,
        noHorizontalOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
        相邻不重叠,
      };
    })).toEqual({ withinViewport: true, noHorizontalOverflow: true, 相邻不重叠: true });
  });
}
