import { devices, expect, test, type Page } from "@playwright/test";

async function 选择择日事项(page: Page, 大类: string, 事项: string): Promise<void> {
  await page.locator("[data-election-category]").selectOption(大类);
  await page.locator("[data-election-event]").selectOption(事项);
}

test("择日四档均可真实显示且徽标颜色互异", async ({ page }) => {
  await page.goto("/");
  await 选择择日事项(page, "日常事务", "出行");
  await page.locator("[data-bazi-date]").fill("1990-05-20");
  await page.locator("[data-bazi-time]").fill("14:35");
  await page.locator("[data-election-start]").fill("2026-08-01");
  await page.locator("[data-election-end]").fill("2026-08-31");
  await page.getByRole("button", { name: "开始筛选" }).click();
  const 徽标 = page.locator(".election-grade");
  await expect(徽标.first()).toHaveText("优先推荐");
  await expect(徽标.nth(1)).toHaveText("推荐");
  await expect(徽标.nth(2)).toHaveText("可以考虑");
  const 颜色 = await 徽标.evaluateAll((元素) => 元素.slice(0, 3).map((项) => {
    const 样式 = getComputedStyle(项);
    return `${样式.backgroundColor}|${样式.backgroundImage}`;
  }));
  await page.locator("[data-election-start]").fill("2026-08-10");
  await page.locator("[data-election-end]").fill("2026-08-10");
  await page.getByRole("button", { name: "开始筛选" }).click();
  await expect(徽标.first()).toHaveText("谨慎选择");
  颜色.push(await 徽标.first().evaluate((项) => {
    const 样式 = getComputedStyle(项);
    return `${样式.backgroundColor}|${样式.backgroundImage}`;
  }));
  expect(new Set(颜色).size).toBe(4);
});

test("八字分析默认展示通俗说明，详细证据统一折叠后可展开", async ({ page }) => {
  await page.goto("/");
  await page.locator("[data-bazi-date]").fill("2026-08-09");
  await page.locator("[data-bazi-time]").fill("12:00");
  await page.locator("[data-bazi-gender]").selectOption("女");
  const 输出 = page.locator("[data-bazi-output]");
  await expect(输出).toContainText("丙午年　丙申月　乙卯日　壬午时");
  await expect(输出.getByText("整体类型")).toBeVisible();
  await expect(输出.getByText("做事风格")).toBeVisible();
  const 详细分析 = 输出.locator(".bazi-analysis-details");
  await expect(详细分析).not.toHaveAttribute("open", "");
  await expect(输出.locator(".analysis-grid").first()).toBeHidden();
  await 详细分析.locator(":scope > summary").click();
  await expect(详细分析).toHaveAttribute("open", "");
  await expect(输出).toContainText("得令、得地、得势");
  await expect(输出).toContainText("正官格候选");
  await expect(输出).toContainText("格局用");
  await expect(输出).toContainText("扶抑");
  await expect(输出).toContainText("调候");
  await expect(输出).not.toContainText(/\d+%/u);
});

test("事项大类与具体事项两级联动且八类内容完整", async ({ page }) => {
  await page.goto("/");
  const 分类 = {
    婚姻类: ["订婚", "结婚"],
    居宅类: ["搬家", "移徙", "入宅", "安床", "归火", "搬家全套"],
    商业类: ["开市/开业", "立券/签约", "纳财", "开仓库", "出货财"],
    日常事务: ["出行", "祭祀", "祈福", "求嗣", "入学", "会亲友", "进人口", "疗病", "裁衣"],
    工程营造: ["修造", "动土", "竖柱上梁", "开渠穿井"],
    农事: ["栽种", "牧养"],
    丧葬: ["破土", "安葬"],
    官事: ["上官赴任"],
  } as const;
  await expect(page.locator("[data-election-category] option")).toHaveText(Object.keys(分类));
  for (const [大类, 事项] of Object.entries(分类)) {
    await page.locator("[data-election-category]").selectOption(大类);
    await expect(page.locator("[data-election-event] option")).toHaveText([...事项]);
    await expect(page.locator("[data-election-event]")).toHaveValue(事项[0]);
  }
});

test("单人及双人婚姻择日均可完成并分别展示个人关系", async ({ page }) => {
  await page.goto("/");
  await 选择择日事项(page, "日常事务", "出行");
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
  await 选择择日事项(page, "婚姻类", "结婚");
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

test("八类代表事项均可真实运行并显示正式铺注状态", async ({ page }) => {
  await page.goto("/");
  for (const [大类, 事项] of [
    ["婚姻类", "订婚"], ["居宅类", "搬家全套"], ["商业类", "纳财"], ["日常事务", "疗病"],
    ["工程营造", "竖柱上梁"], ["农事", "栽种"], ["丧葬", "安葬"], ["官事", "上官赴任"],
  ]) {
    await 选择择日事项(page, 大类, 事项);
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

test("PC 时辰为独立圆角卡片，扩展模块位于其后并保持左右双栏", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const 布局 = await page.evaluate(() => {
    const 主体 = document.querySelector<HTMLElement>(".calendar-layout")!.getBoundingClientRect();
    const 时辰 = document.querySelector<HTMLElement>(".hour-section")!.getBoundingClientRect();
    const 扩展 = document.querySelector<HTMLElement>(".calendar-extensions")!.getBoundingClientRect();
    const 八字 = document.querySelector<HTMLElement>('[aria-label="生辰八字查询"]')!.getBoundingClientRect();
    const 择日 = document.querySelector<HTMLElement>('[aria-label="个性化择日"]')!.getBoundingClientRect();
    const 正文 = [...document.querySelectorAll<HTMLElement>(".use-grid article > p")];
    return {
      主体底: 主体.bottom,
      时辰顶: 时辰.top,
      时辰底: 时辰.bottom,
      扩展顶: 扩展.top,
      同边界: Math.abs(主体.left - 扩展.left) < 1 && Math.abs(主体.right - 扩展.right) < 1,
      双栏: Math.abs(八字.top - 择日.top) < 1 && 八字.right <= 择日.left + 1,
      时辰在主体后: 时辰.top > 主体.bottom,
      扩展在时辰后: 扩展.top > 时辰.bottom,
      时辰圆角: getComputedStyle(document.querySelector<HTMLElement>(".hour-section")!).borderRadius === "24px",
      时辰列数: getComputedStyle(document.querySelector<HTMLElement>(".hour-grid")!).gridTemplateColumns.split(" ").length,
      时辰无溢出: [...document.querySelectorAll<HTMLElement>(".hour-card")].every((卡片) => 卡片.scrollWidth <= 卡片.clientWidth + 1),
      查询时间在月历: document.querySelector(".calendar-right")!.contains(document.querySelector(".calculation-card")),
      左侧没有查询时间: !document.querySelector(".detail-card .calculation-card"),
      左侧没有红线: !document.querySelector(".detail-accent")
        && getComputedStyle(document.querySelector<HTMLElement>(".calculation-card")!, "::before").content === "none",
      正文左界: 正文.map((元素) => 元素.getBoundingClientRect().left),
      正文内边距: 正文.map((元素) => getComputedStyle(元素).paddingLeft),
    };
  });
  expect(布局.扩展顶).toBeGreaterThan(布局.时辰底);
  expect(布局.同边界).toBe(true);
  expect(布局.双栏).toBe(true);
  expect(布局.时辰在主体后).toBe(true);
  expect(布局.扩展在时辰后).toBe(true);
  expect(布局.时辰圆角).toBe(true);
  expect(布局.时辰列数).toBe(6);
  expect(布局.时辰无溢出).toBe(true);
  expect(布局.查询时间在月历).toBe(true);
  expect(布局.左侧没有查询时间).toBe(true);
  expect(布局.左侧没有红线).toBe(true);
  expect(new Set(布局.正文左界.map(Math.round)).size).toBe(3);
  expect(布局.正文内边距).toEqual(["0px", "0px", "0px"]);
});

test("常见 PC 宽度自动降为四列且时辰文字不重叠", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/");
  const 结果 = await page.evaluate(() => {
    const 卡片 = [...document.querySelectorAll<HTMLElement>(".hour-card")];
    return {
      列数: getComputedStyle(document.querySelector<HTMLElement>(".hour-grid")!).gridTemplateColumns.split(" ").length,
      无溢出: 卡片.every((元素) => 元素.scrollWidth <= 元素.clientWidth + 1),
      行内不重叠: [...document.querySelectorAll<HTMLElement>(".hour-time, .hour-meta")].every((行) =>
        [...行.children].every((子项, 索引, 子项们) => 索引 === 0 || 子项.getBoundingClientRect().left >= 子项们[索引 - 1].getBoundingClientRect().right - 1),
      ),
    };
  });
  expect(结果).toEqual({ 列数: 4, 无溢出: true, 行内不重叠: true });
});

test("PC 日期总览与月历同段，时辰独立成卡且择日背景铺满右列", async ({ page }) => {
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
      时辰在首段后: 时辰.top >= 主体.bottom,
      时辰全宽: Math.abs(时辰.left - 主体.left) < 2 && Math.abs(时辰.right - 主体.right) < 2,
      扩展在时辰后: 扩展.top >= 时辰.bottom,
      时辰独立于主日历: 时辰.top > 主体.bottom,
    };
  });
  expect(初始布局).toEqual({
    概要月历同段: true,
    时辰在首段后: true,
    时辰全宽: true,
    扩展在时辰后: true,
    时辰独立于主日历: true,
  });

  await 选择择日事项(page, "日常事务", "出行");
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
      择日背景铺满右列: getComputedStyle(document.querySelector<HTMLElement>('[aria-label="个性化择日"]')!).alignSelf === "stretch",
    };
  });
  expect(扩展布局).toEqual({ 择日更长: true, 短栏未被拉伸: true, 容器随长栏结束: true, 择日背景铺满右列: true });
});

for (const width of [768, 390, 320]) {
  test(`${width}px 窄屏按概要、月历、时辰、八字、择日显示`, async ({ page }) => {
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
        概要后月历: 月历.top >= 概要.bottom - 1,
        月历后时辰: 时辰.top >= 月历.bottom - 1,
        时辰后八字: 八字.top >= 时辰.bottom - 1,
        八字后择日: 择日.top >= 八字.bottom - 1,
        无横向滚动: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      };
    });
    expect(顺序).toEqual({
      概要后月历: true,
      月历后时辰: true,
      时辰后八字: true,
      八字后择日: true,
      无横向滚动: true,
    });
  });
}

test("主推荐不超过五项并展示实际筛选数量", async ({ page }) => {
  await page.goto("/");
  await 选择择日事项(page, "日常事务", "出行");
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
    ["开市/开业", "2026-02-20", "2026-02-28"],
    ["开市/开业", "2023-03-22", "2023-04-08"],
    ["立券/签约", "2025-08-01", "2025-08-18"],
    ["开市/开业", "2025-08-06", "2025-08-08"],
  ] as const) {
    await 选择择日事项(page, "商业类", 事项);
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

for (const width of [440, 430, 390, 320]) {
  test(`${width}px 择日表单为单列且日期shell不重叠、不裁边`, async ({ page }) => {
    const 控制台错误: string[] = [];
    page.on("console", (消息) => { if (消息.type() === "error") 控制台错误.push(消息.text()); });
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");

    const 布局 = await page.locator(".election-form").evaluate((表单) => {
      const 矩形 = (选择器: string) => 表单.querySelector<HTMLElement>(选择器)!.getBoundingClientRect();
      const 开始 = 矩形('[data-picker-shell="election-start"]');
      const 结束 = 矩形('[data-picker-shell="election-end"]');
      const 开始标签 = 表单.querySelector<HTMLElement>('[data-picker-shell="election-start"]')!.parentElement!.getBoundingClientRect();
      const 结束标签 = 表单.querySelector<HTMLElement>('[data-picker-shell="election-end"]')!.parentElement!.getBoundingClientRect();
      const 表单框 = 表单.getBoundingClientRect();
      const 控件 = [...表单.querySelectorAll<HTMLElement>(".mobile-picker-shell, select, input[type=number]")].map((元素) => {
        const 框 = 元素.getBoundingClientRect();
        const 样式 = getComputedStyle(元素);
        return {
          类型: 元素.matches(".mobile-picker-shell") ? "picker-shell" : 元素.getAttribute("type") ?? 元素.tagName.toLowerCase(),
          左侧在内: 框.left >= 表单框.left - 0.5,
          右侧在内: 框.right <= 表单框.right + 0.5,
          宽度吻合: Math.abs(框.width - 元素.parentElement!.getBoundingClientRect().width) <= 0.5,
          boxSizing: 样式.boxSizing,
          minWidth: 样式.minWidth,
          maxWidth: 样式.maxWidth,
          上边框: 样式.borderTopWidth,
        };
      });
      return {
        单列: getComputedStyle(表单).gridTemplateColumns.split(" ").length === 1,
        日期上下排列: 结束标签.top >= 开始标签.bottom + 11,
        日期不重叠: 结束.top >= 开始.bottom + 11,
        标签输入有留白: 开始.top > 开始标签.top && 结束.top > 结束标签.top,
        控件,
        无横向滚动: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      };
    });

    expect(布局.单列).toBe(true);
    expect(布局.日期上下排列).toBe(true);
    expect(布局.日期不重叠).toBe(true);
    expect(布局.标签输入有留白).toBe(true);
    expect(布局.控件.every((控件) => 控件.左侧在内 && 控件.右侧在内 && 控件.宽度吻合)).toBe(true);
    expect(布局.控件.every((控件) => 控件.boxSizing === "border-box" && 控件.minWidth === "0px" && 控件.maxWidth !== "none")).toBe(true);
    expect(布局.控件.filter((控件) => 控件.类型 === "picker-shell").every((控件) => 控件.上边框 === "1px")).toBe(true);
    expect(布局.无横向滚动).toBe(true);
    expect(控制台错误).toEqual([]);
  });
}

test("iPhone Safari 移动环境下择日日期shell保持单列和完整边框", async ({ browser }) => {
  const context = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await context.newPage();
  const 控制台错误: string[] = [];
  page.on("console", (消息) => { if (消息.type() === "error") 控制台错误.push(消息.text()); });
  await page.goto("/");
  const 结果 = await page.locator(".election-form").evaluate((表单) => {
    const 开始 = 表单.querySelector<HTMLElement>('[data-picker-shell="election-start"]')!;
    const 结束 = 表单.querySelector<HTMLElement>('[data-picker-shell="election-end"]')!;
    const 开始框 = 开始.getBoundingClientRect();
    const 结束框 = 结束.getBoundingClientRect();
    const 表单框 = 表单.getBoundingClientRect();
    return {
      单列: 结束框.top > 开始框.bottom,
      等宽: Math.abs(开始框.width - 表单框.width) <= 0.5 && Math.abs(结束框.width - 表单框.width) <= 0.5,
      完整边框: [开始, 结束].every((shell) => {
        const 样式 = getComputedStyle(shell);
        return 样式.borderTopWidth === "1px" && 样式.borderRightWidth === "1px"
          && 样式.borderBottomWidth === "1px" && 样式.borderLeftWidth === "1px";
      }),
      无横向滚动: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    };
  });
  expect(结果).toEqual({ 单列: true, 等宽: true, 完整边框: true, 无横向滚动: true });
  expect(控制台错误).toEqual([]);
  await context.close();
});

for (const width of [1440, 1024, 768]) {
  test(`${width}px 择日表单在宽屏保持双列且控件完整`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const 布局 = await page.locator(".election-form").evaluate((表单) => {
      const 表单框 = 表单.getBoundingClientRect();
      const 开始 = 表单.querySelector<HTMLElement>("[data-election-start]")!.getBoundingClientRect();
      const 结束 = 表单.querySelector<HTMLElement>("[data-election-end]")!.getBoundingClientRect();
      return {
        双列: Math.abs(开始.top - 结束.top) < 1 && 开始.right <= 结束.left,
        控件在内: [...表单.querySelectorAll<HTMLElement>("input, select")].every((元素) => {
          const 框 = 元素.getBoundingClientRect();
          return 框.left >= 表单框.left - 0.5 && 框.right <= 表单框.right + 0.5;
        }),
        无横向滚动: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      };
    });
    expect(布局).toEqual({ 双列: true, 控件在内: true, 无横向滚动: true });
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
