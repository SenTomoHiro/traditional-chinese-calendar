import { expect, test, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";

const 手机宽度 = [440, 430, 390, 375, 320] as const;
const 当前版本 = execFileSync("git", ["rev-parse", "--short=7", "HEAD"], { encoding: "utf8" }).trim();

interface 边界测量 {
  left: number;
  right: number;
  contentLeft: number;
  contentRight: number;
  visualLeftGap: number;
  visualRightGap: number;
  display: string;
  minWidth: string;
  maxWidth: string;
  boxSizing: string;
}

async function 测量父卡片内容边界(page: Page, 控件选择器: string, 卡片选择器: string): Promise<边界测量> {
  return page.locator(控件选择器).evaluate((控件, 父选择器) => {
    const 卡片 = document.querySelector(父选择器);
    if (!卡片) throw new Error(`找不到父卡片：${父选择器}`);
    const 控件矩形 = 控件.getBoundingClientRect();
    const 卡片矩形 = 卡片.getBoundingClientRect();
    const 卡片样式 = getComputedStyle(卡片);
    const 控件样式 = getComputedStyle(控件);
    const 左内边距 = Number.parseFloat(卡片样式.paddingLeft);
    const 右内边距 = Number.parseFloat(卡片样式.paddingRight);
    return {
      left: 控件矩形.left,
      right: 控件矩形.right,
      contentLeft: 卡片矩形.left + 左内边距,
      contentRight: 卡片矩形.right - 右内边距,
      visualLeftGap: 控件矩形.left - 卡片矩形.left,
      visualRightGap: 卡片矩形.right - 控件矩形.right,
      display: 控件样式.display,
      minWidth: 控件样式.minWidth,
      maxWidth: 控件样式.maxWidth,
      boxSizing: 控件样式.boxSizing,
    };
  }, 卡片选择器);
}

function 断言位于父卡片内容区内(测量: 边界测量): void {
  expect(测量.left).toBeGreaterThanOrEqual(测量.contentLeft - 1);
  expect(测量.right).toBeLessThanOrEqual(测量.contentRight + 1);
  expect(Math.abs(测量.left - 测量.contentLeft)).toBeLessThanOrEqual(1);
  expect(Math.abs(测量.right - 测量.contentRight)).toBeLessThanOrEqual(1);
  expect(测量.minWidth).toBe("0px");
  expect(测量.maxWidth).toBe("100%");
  expect(测量.boxSizing).toBe("border-box");
  expect(Math.abs(测量.visualLeftGap - 测量.visualRightGap)).toBeLessThanOrEqual(1);
}

for (const width of 手机宽度) {
  test(`WebKit ${width}px：picker shell与实时output服从父卡片content box且留白对称`, async ({ page }) => {
    await page.setViewportSize({ width, height: 956 });
    await page.goto("/");

    for (const 控件选择器 of ['[data-picker-shell="date"]', '[data-picker-shell="time"]']) {
      断言位于父卡片内容区内(await 测量父卡片内容边界(page, 控件选择器, ".bazi-card"));
    }
    断言位于父卡片内容区内(await 测量父卡片内容边界(page, "[data-time-output]", ".calculation-card"));

    for (const 控件选择器 of ["[data-bazi-date]", "[data-bazi-time]"]) {
      const 原生样式 = await page.locator(控件选择器).evaluate((控件) => {
        const 样式 = getComputedStyle(控件);
        return {
          position: 样式.position,
          opacity: 样式.opacity,
          appearance: 样式.appearance,
          display: 样式.display,
        };
      });
      expect(原生样式.position).toBe("absolute");
      expect(原生样式.opacity).toBe("0");
      expect(原生样式.appearance).toBe("auto");
      expect(原生样式.display).not.toBe("none");
    }

    expect(await page.locator('[data-time-output]').evaluate((元素) => 元素.tagName)).toBe("OUTPUT");
    expect(await page.locator('[data-time-input]').count()).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  });
}

test("手机shell整块点击命中原生picker，日期和时间改变后可见值立即同步", async ({ page }) => {
  await page.setViewportSize({ width: 440, height: 956 });
  await page.goto("/");
  await page.evaluate(() => {
    (window as typeof window & { __pickerClicks: Record<string, number> }).__pickerClicks = { date: 0, time: 0 };
    document.querySelector("[data-bazi-date]")?.addEventListener("click", () => {
      (window as typeof window & { __pickerClicks: Record<string, number> }).__pickerClicks.date += 1;
    });
    document.querySelector("[data-bazi-time]")?.addEventListener("click", () => {
      (window as typeof window & { __pickerClicks: Record<string, number> }).__pickerClicks.time += 1;
    });
  });

  await page.locator('[data-picker-shell="date"]').click();
  await page.locator('[data-picker-shell="time"]').click();
  expect(await page.evaluate(() => (window as typeof window & { __pickerClicks: Record<string, number> }).__pickerClicks)).toEqual({ date: 1, time: 1 });

  await page.locator("[data-bazi-date]").fill("1990-05-20");
  await expect(page.locator('[data-picker-value="date"]')).toHaveText("1990年5月20日");
  await page.locator("[data-bazi-time]").fill("14:35");
  await expect(page.locator('[data-picker-value="time"]')).toHaveText("14:35");
});

for (const width of [1024, 1440] as const) {
  test(`WebKit ${width}px：桌面原生picker保持可见且页面无横向滚动`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");

    for (const 控件选择器 of ["[data-bazi-date]", "[data-bazi-time]"]) {
      const 原生样式 = await page.locator(控件选择器).evaluate((控件) => {
        const 样式 = getComputedStyle(控件);
        return { position: 样式.position, opacity: 样式.opacity, display: 样式.display };
      });
      expect(原生样式.position).toBe("static");
      expect(原生样式.opacity).toBe("1");
      expect(原生样式.display).toBe("block");
    }
    expect(await page.locator('[data-time-output]').evaluate((元素) => 元素.tagName)).toBe("OUTPUT");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  });
}

for (const width of [1024, 768, 390, 320] as const) {
  for (const theme of ["light", "dark"] as const) {
    test(`WebKit ${width}px ${theme}：本命下日明确显示年生人且北斗模块无溢出`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto("/");
      await page.locator(`[data-theme-preference="${theme}"]`).click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await page.locator("[data-calendar-date]").fill("2000-03-03");

      const 本命下日 = page.locator(".beidou-item").filter({ hasText: "本命下日" }).locator("strong");
      await expect(本命下日).toHaveText("庚申年生人");
      await expect(page.locator(".beidou-item").filter({ hasText: "本命星官" }).locator("strong"))
        .toHaveText("北斗第五丹元廉贞罡星君");
      expect(await page.locator(".beidou-panel").evaluate((面板) => {
        const 矩形 = 面板.getBoundingClientRect();
        return 矩形.left >= -1
          && 矩形.right <= document.documentElement.clientWidth + 1
          && 面板.scrollWidth <= 面板.clientWidth + 1
          && document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1;
      })).toBe(true);
    });
  }
}

test("北斗页面加载和日期切换没有控制台错误、脚本错误或资源404", async ({ page }) => {
  const 控制台错误: string[] = [];
  const 页面错误: string[] = [];
  const 资源404: string[] = [];
  page.on("console", (消息) => {
    if (消息.type() === "error") 控制台错误.push(消息.text());
  });
  page.on("pageerror", (错误) => 页面错误.push(错误.message));
  page.on("response", (响应) => {
    if (响应.status() === 404) 资源404.push(响应.url());
  });

  await page.goto("/");
  await page.locator("[data-calendar-date]").fill("2000-03-03");
  await expect(page.locator(".beidou-item").filter({ hasText: "本命下日" }).locator("strong"))
    .toHaveText("庚申年生人");
  expect(控制台错误).toEqual([]);
  expect(页面错误).toEqual([]);
  expect(资源404).toEqual([]);
});

test("用户点击时即使Permissions API报告denied也会直接调用Geolocation并重算真太阳时", async ({ page }) => {
  await page.addInitScript(() => {
    const 测试窗口 = window as typeof window & { __geoCalls: number };
    测试窗口.__geoCalls = 0;
    Object.defineProperty(navigator, "permissions", {
      configurable: true,
      value: { query: async () => ({ state: "denied" }) },
    });
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition(成功: PositionCallback) {
          测试窗口.__geoCalls += 1;
          成功({
            coords: {
              latitude: 39.9042,
              longitude: 116.4074,
              accuracy: 25,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
              toJSON: () => ({}),
            },
            timestamp: Date.now(),
            toJSON: () => ({}),
          });
        },
      },
    });
  });
  await page.goto("/");

  await page.locator('[data-action="locate"]').click();
  await expect(page.locator("[data-location-diagnostic-status]")).toContainText("成功");
  expect(await page.evaluate(() => (window as typeof window & { __geoCalls: number }).__geoCalls)).toBe(1);
  await expect(page.locator(".location-status")).toContainText("真太阳时");
  await expect(page.locator("[data-location-diagnostics]")).toContainText("纬度：39.904200");
  await expect(page.locator("[data-location-diagnostics]")).toContainText("经度：116.407400");
  await expect(page.locator("[data-location-diagnostic-code]")).toContainText("无");
  await expect(page.locator("[data-app-version]")).toHaveText(当前版本);
});

for (const 场景 of [
  { code: 1, 类型: "权限拒绝", 调用次数: 1, 提示: "隐私与安全性" },
  { code: 2, 类型: "位置不可用", 调用次数: 2, 提示: "已自动重试" },
  { code: 3, 类型: "超时", 调用次数: 2, 提示: "已自动重试" },
] as const) {
  test(`Geolocation error.code=${场景.code}准确分类并允许用户再次请求`, async ({ page }) => {
    await page.addInitScript((错误码) => {
      const 测试窗口 = window as typeof window & { __geoCalls: number };
      测试窗口.__geoCalls = 0;
      Object.defineProperty(navigator, "geolocation", {
        configurable: true,
        value: {
          getCurrentPosition(_成功: PositionCallback, 失败: PositionErrorCallback) {
            测试窗口.__geoCalls += 1;
            失败({ code: 错误码, message: `mock ${错误码}`, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
          },
        },
      });
    }, 场景.code);
    await page.goto("/");

    await page.locator('[data-action="locate"]').click();
    await expect(page.locator("[data-location-diagnostic-status]")).toContainText("失败");
    await expect(page.locator("[data-location-diagnostic-error]")).toContainText(场景.类型);
    await expect(page.locator("[data-location-diagnostic-code]")).toContainText(String(场景.code));
    await expect(page.locator(".location-status")).toContainText(场景.提示);
    expect(await page.evaluate(() => (window as typeof window & { __geoCalls: number }).__geoCalls)).toBe(场景.调用次数);

    await page.locator('[data-action="locate"]').click();
    expect(await page.evaluate(() => (window as typeof window & { __geoCalls: number }).__geoCalls)).toBe(场景.调用次数 * 2);
  });
}
