import { expect, test, type Page } from "@playwright/test";

function 安全区测试图(宽: number, 高: number): string {
  const 安全X = 宽 * 0.15;
  const 安全Y = 高 * 0.225;
  const 安全宽 = 宽 * 0.7;
  const 安全高 = 高 * 0.55;
  const 中X = 宽 / 2;
  const 头Y = 高 * 0.34;
  const 法器Y = 高 * 0.66;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${宽}" height="${高}" viewBox="0 0 ${宽} ${高}">
    <rect width="${宽}" height="${高}" fill="#ead8a8"/><rect x="1" y="1" width="${宽 - 2}" height="${高 - 2}" fill="none" stroke="#7b3425" stroke-width="8"/>
    <path d="M${中X} 0V${高}M0 ${高 / 2}H${宽}" stroke="#8d2f26" stroke-width="5" stroke-dasharray="16 12"/>
    <rect x="${安全X}" y="${安全Y}" width="${安全宽}" height="${安全高}" fill="none" stroke="#0f604a" stroke-width="9" stroke-dasharray="20 12"/>
    <ellipse cx="${中X}" cy="${头Y}" rx="${宽 * 0.12}" ry="${高 * 0.1}" fill="#8d2f26"/><path d="M${中X - 宽 * 0.18} ${高 * 0.53}Q${中X} ${高 * 0.39} ${中X + 宽 * 0.18} ${高 * 0.53}V${高 * 0.82}H${中X - 宽 * 0.18}Z" fill="#b97c37"/>
    <path d="M${中X - 宽 * 0.25} ${法器Y}H${中X + 宽 * 0.25}" stroke="#293c72" stroke-width="${Math.max(10, 宽 * 0.028)}"/><circle cx="${中X + 宽 * 0.29}" cy="${法器Y}" r="${宽 * 0.055}" fill="#293c72"/>
    <g fill="#7b3425" font-family="sans-serif" font-size="${Math.max(22, 宽 * 0.035)}"><text x="18" y="45">完整母图边界</text><text x="${安全X + 14}" y="${安全Y + 42}" fill="#0f604a">70% × 55% 候选安全区</text><text x="${中X + 12}" y="${头Y}" fill="#fff">头部</text><text x="${中X + 12}" y="${法器Y - 15}" fill="#fff">手势/法器</text></g>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function 打开并注入安全区测试图(page: Page, 宽: number, 高: number): Promise<void> {
  await page.goto("/");
  await page.locator("[data-calendar-date]").fill("2026-08-06");
  const 神圣纪念 = page.locator(".calendar-info-item").filter({ has: page.getByRole("heading", { name: "神圣纪念", exact: true }) });
  await 神圣纪念.getByRole("button", { name: "关圣帝君", exact: true }).click();
  await page.locator(".deity-dialog-card").evaluate((元素, { 地址 }) => {
    const 卡片 = 元素 as HTMLElement;
    if (!卡片) throw new Error("未找到神圣纪念详情卡片");
    卡片.classList.remove("is-text-only");
    卡片.classList.add("has-portrait");
    const 神像 = document.createElement("figure");
    神像.className = "deity-portrait";
    神像.dataset.safetyAuditPortrait = "true";
    神像.innerHTML = `<img src="${地址}" alt="仅测试环境使用的神像安全区图">`;
    卡片.querySelector(".deity-portrait")?.remove();
    卡片.prepend(神像);
  }, { 地址: 安全区测试图(宽, 高) });
  await expect(page.locator("[data-safety-audit-portrait] img")).toHaveJSProperty("complete", true);
  await expect(page.locator("[data-safety-audit-portrait] img")).toHaveJSProperty("naturalWidth", 宽);
}

const 布局 = [
  { 名称: "桌面 1440", 宽: 1440, 高: 1000 },
  { 名称: "桌面 1024", 宽: 1024, 高: 900 },
  { 名称: "iPad 竖屏", 宽: 768, 高: 1024 },
  { 名称: "iPad 横屏", 宽: 1024, 高: 768 },
  { 名称: "手机 390", 宽: 390, 高: 844 },
  { 名称: "手机 375", 宽: 375, 高: 812 },
  { 名称: "手机 320", 宽: 320, 高: 720 },
] as const;

test("4:5 安全区测试图在真实弹层完整 contain、固定神像与文字独立滚动", async ({ page }) => {
  for (const 场景 of 布局) {
    await page.setViewportSize({ width: 场景.宽, height: 场景.高 });
    await 打开并注入安全区测试图(page, 1600, 2000);
    const 测量 = await page.locator("[data-safety-audit-portrait]").evaluate((神像) => {
      const 图片 = 神像.querySelector<HTMLImageElement>("img")!;
      const 文字滚动区 = document.querySelector<HTMLElement>(".deity-dialog-scroll")!;
      const 神像框 = 图片.getBoundingClientRect();
      const 容器框 = 神像.getBoundingClientRect();
      const 对话框 = document.querySelector<HTMLDialogElement>("[data-deity-dialog]")!;
      文字滚动区.scrollTop = 120;
      return {
        image: { width: 神像框.width, height: 神像框.height },
        portraitTop: 容器框.top,
        afterScrollPortraitTop: 神像.getBoundingClientRect().top,
        objectFit: getComputedStyle(图片).objectFit,
        dialogScrollTop: 对话框.scrollTop,
      };
    });
    expect(测量.objectFit).toBe("contain");
    expect(Math.abs(测量.portraitTop - 测量.afterScrollPortraitTop)).toBeLessThanOrEqual(1);
    expect(测量.dialogScrollTop).toBe(0);
  }
});

test("4:5、3:4、2:3 在所有响应式容器中等比例完整显示，不依赖裁切安全区", async ({ page }) => {
  const 规格 = [
    { 名称: "4:5", 宽: 1600, 高: 2000 },
    { 名称: "3:4", 宽: 1500, 高: 2000 },
    { 名称: "2:3", 宽: 1200, 高: 1800 },
  ];
  for (const 图片 of 规格) {
    for (const 场景 of 布局) {
      await page.setViewportSize({ width: 场景.宽, height: 场景.高 });
      await 打开并注入安全区测试图(page, 图片.宽, 图片.高);
      const 尺寸 = await page.locator("[data-safety-audit-portrait] img").evaluate((元素) => {
        const 框 = 元素.getBoundingClientRect();
        const 容器 = 元素.parentElement!.getBoundingClientRect();
        return {
          宽: 框.width,
          高: 框.height,
          容器宽: 容器.width,
          容器高: 容器.height,
          objectFit: getComputedStyle(元素).objectFit,
        };
      });
      expect(尺寸.objectFit).toBe("contain");
      expect(尺寸.宽).toBeLessThanOrEqual(尺寸.容器宽 + 1);
      expect(尺寸.高).toBeLessThanOrEqual(尺寸.容器高 + 1);
    }
  }
});
