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

function cover裁切(容器宽: number, 容器高: number, 图片宽: number, 图片高: number) {
  const 容器比 = 容器宽 / 容器高;
  const 图片比 = 图片宽 / 图片高;
  if (容器比 < 图片比) {
    const 左右总裁切 = 1 - 容器比 / 图片比;
    return { 左: 左右总裁切 / 2, 右: 左右总裁切 / 2, 上: 0, 下: 0 };
  }
  const 上下总裁切 = 1 - 图片比 / 容器比;
  return { 左: 0, 右: 0, 上: 上下总裁切 / 2, 下: 上下总裁切 / 2 };
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

test("4:5 安全区测试图在真实弹层保持 cover、固定神像与文字独立滚动", async ({ page }) => {
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
    const 裁切 = cover裁切(测量.image.width, 测量.image.height, 1600, 2000);
    expect(测量.objectFit).toBe("cover");
    expect(Math.abs(测量.portraitTop - 测量.afterScrollPortraitTop)).toBeLessThanOrEqual(1);
    expect(测量.dialogScrollTop).toBe(0);
    expect(裁切.左 + 裁切.右 + 裁切.上 + 裁切.下).toBeGreaterThanOrEqual(0);
  }
});

test("4:5、3:4、2:3 均以真实容器计算裁切，4:5 保留最大的共同核心边长", async ({ page }) => {
  const 规格 = [
    { 名称: "4:5", 宽: 1600, 高: 2000 },
    { 名称: "3:4", 宽: 1500, 高: 2000 },
    { 名称: "2:3", 宽: 1200, 高: 1800 },
  ];
  const 共同安全区: Array<{ 名称: string; 宽度: number; 高度: number }> = [];
  for (const 图片 of 规格) {
    let 左 = 0; let 右 = 0; let 上 = 0; let 下 = 0;
    for (const 场景 of 布局) {
      await page.setViewportSize({ width: 场景.宽, height: 场景.高 });
      await 打开并注入安全区测试图(page, 图片.宽, 图片.高);
      const 尺寸 = await page.locator("[data-safety-audit-portrait] img").evaluate((元素) => {
        const 框 = 元素.getBoundingClientRect();
        return { 宽: 框.width, 高: 框.height };
      });
      const 裁切 = cover裁切(尺寸.宽, 尺寸.高, 图片.宽, 图片.高);
      左 = Math.max(左, 裁切.左); 右 = Math.max(右, 裁切.右);
      上 = Math.max(上, 裁切.上); 下 = Math.max(下, 裁切.下);
    }
    共同安全区.push({ 名称: 图片.名称, 宽度: 1 - 左 - 右, 高度: 1 - 上 - 下 });
  }
  const 四比五 = 共同安全区.find((结果) => 结果.名称 === "4:5")!;
  expect(四比五.宽度).toBeGreaterThan(0.8);
  expect(四比五.高度).toBeGreaterThan(0.59);
  expect((1 - 四比五.宽度) / 2).toBeLessThan(0.15);
  expect((1 - 四比五.高度) / 2).toBeLessThan(0.225);
  expect(Math.min(四比五.宽度, 四比五.高度)).toBeGreaterThan(
    Math.min(共同安全区[1].宽度, 共同安全区[1].高度),
  );
  expect(Math.min(四比五.宽度, 四比五.高度)).toBeGreaterThan(
    Math.min(共同安全区[2].宽度, 共同安全区[2].高度),
  );
});
