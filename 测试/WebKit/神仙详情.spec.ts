import { expect, test, type Page } from "@playwright/test";

function 神圣纪念栏(page: Page) {
  return page.locator(".calendar-info-item").filter({ has: page.getByRole("heading", { name: "神圣纪念", exact: true }) });
}

async function 选择日期(page: Page, 日期: string): Promise<void> {
  await page.locator("[data-calendar-date]").fill(日期);
  await expect(page.locator("[data-calendar-date]")).toHaveValue(日期);
}

async function 打开人物(page: Page, 名称: string): Promise<void> {
  await 神圣纪念栏(page).getByRole("button", { name: 名称, exact: true }).click();
  await expect(page.locator("[data-deity-dialog]")).toBeVisible();
}

async function 注入测试神像(page: Page, 宽: number, 高: number): Promise<void> {
  await page.evaluate(({ 宽, 高 }) => {
    const 卡片 = document.querySelector<HTMLElement>(".deity-dialog-card");
    if (!卡片) throw new Error("测试时未找到人物详情卡片");
    卡片.classList.remove("is-text-only");
    卡片.classList.add("has-portrait");
    const 已有神像 = 卡片.querySelector(".deity-portrait");
    已有神像?.remove();
    const 神像 = document.createElement("figure");
    神像.className = "deity-portrait";
    神像.dataset.testPortrait = `${宽}:${高}`;
    const 图片 = document.createElement("img");
    图片.alt = `测试神像 ${宽}:${高}`;
    图片.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${宽}" height="${高}" viewBox="0 0 ${宽} ${高}"><rect width="100%" height="100%" fill="#ead8a8"/><rect x="${宽 * 0.32}" y="${高 * 0.08}" width="${宽 * 0.36}" height="${高 * 0.84}" rx="${宽 * 0.16}" fill="#8d2f26"/><text x="50%" y="50%" text-anchor="middle" font-size="${Math.max(18, 宽 / 11)}" fill="#fff">测试神像</text></svg>`)}`;
    神像.append(图片);
    卡片.prepend(神像);

    const 滚动区 = 卡片.querySelector<HTMLElement>(".deity-dialog-scroll");
    const 来源 = 滚动区?.querySelector(".deity-source");
    if (!滚动区 || !来源) throw new Error("测试时未找到详情文字区或来源");
    const 简介 = document.createElement("section");
    简介.className = "deity-section deity-introduction";
    简介.innerHTML = `<h3>简介</h3><p>${"这是仅在自动测试环境中注入的长简介，用来验证神像固定与文字独立滚动。".repeat(36)}</p>`;
    来源.before(简介);
    const 宝诰段落 = 滚动区.querySelector<HTMLElement>(".deity-proclamation p");
    if (宝诰段落) 宝诰段落.textContent = `${宝诰段落.textContent ?? ""}${"测试长宝诰滚动内容。".repeat(80)}`;
  }, { 宽, 高 });
  await expect(page.locator("[data-test-portrait] img")).toHaveJSProperty("complete", true);
}

test("正式人物资料交互、同神异名、空详情和民俗栏目边界均正确", async ({ page }) => {
  const 控制台错误: string[] = [];
  const 页面错误: string[] = [];
  const 资源404: string[] = [];
  page.on("console", (消息) => { if (消息.type() === "error") 控制台错误.push(消息.text()); });
  page.on("pageerror", (错误) => 页面错误.push(错误.message));
  page.on("response", (响应) => { if (响应.status() === 404) 资源404.push(响应.url()); });

  await page.goto("/");
  await 选择日期(page, "2026-08-06");
  const 关帝按钮 = 神圣纪念栏(page).getByRole("button", { name: "关圣帝君", exact: true });
  await expect(关帝按钮).toBeVisible();
  expect(await 关帝按钮.evaluate((元素) => {
    const 样式 = getComputedStyle(元素);
    return { 下划线: 样式.textDecorationLine, 下边框: 样式.borderBottomWidth, 鼠标: 样式.cursor, 颜色: 样式.color };
  })).toEqual(expect.objectContaining({ 下划线: "none", 下边框: "0px", 鼠标: "pointer" }));
  await 打开人物(page, "关圣帝君");
  await expect(page.locator("#deity-dialog-title")).toHaveText("关圣帝君");
  await expect(page.locator(".deity-dialog-heading > div > p")).toHaveText("神圣纪念详情");
  await expect(page.locator("body")).not.toContainText("仙真纪念");
  await expect(page.locator("body")).not.toContainText("仙真详情");
  await expect(page.locator(".deity-proclamation")).toContainText("关圣帝君宝诰");
  await expect(page.locator(".deity-source")).toContainText("《宝诰大全·关圣帝君宝诰》");
  await expect(page.locator(".deity-introduction")).toHaveCount(0);
  await expect(page.locator("body")).toHaveClass(/deity-dialog-open/u);
  await page.getByRole("button", { name: "关闭神圣纪念详情" }).click();
  await expect(关帝按钮).toBeFocused();
  await expect(page.locator("body")).not.toHaveClass(/deity-dialog-open/u);

  await 打开人物(page, "九天应元雷声普化天尊");
  await expect(page.locator("#deity-dialog-title")).toHaveText("九天应元雷声普化天尊");
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-deity-dialog]")).not.toBeVisible();

  await 选择日期(page, "2026-03-03");
  await 打开人物(page, "佑圣真君");
  await expect(page.locator("#deity-dialog-title")).toHaveText("玄天上帝");
  await page.getByRole("button", { name: "关闭神圣纪念详情" }).click();

  await 选择日期(page, "2026-07-02");
  await 打开人物(page, "湛然天师");
  await expect(page.locator(".deity-introduction")).toContainText("第四十八代天师");
  await expect(page.locator(".deity-proclamation")).toHaveCount(0);
  await expect(page.locator(".deity-source")).toHaveCount(0);
  await page.getByRole("button", { name: "关闭神圣纪念详情" }).click();

  await 选择日期(page, "2026-08-06");
  await 打开人物(page, "关圣帝君");
  await page.mouse.click(2, 2);
  await expect(page.locator("[data-deity-dialog]")).not.toBeVisible();
  await expect(page.locator("body")).not.toHaveClass(/deity-dialog-open/u);

  await 选择日期(page, "2026-02-17");
  await expect(神圣纪念栏(page)).toContainText("弥勒佛圣诞");
  await 打开人物(page, "弥勒佛");
  await expect(page.locator(".deity-introduction")).toContainText("未来于此世界成佛");
  await expect(page.locator(".deity-proclamation")).toHaveCount(0);
  await page.getByRole("button", { name: "关闭神圣纪念详情" }).click();

  await 选择日期(page, "2026-11-16");
  const 传统节日栏 = page.locator(".calendar-info-item").filter({ has: page.getByRole("heading", { name: "传统节日", exact: true }) });
  await expect(传统节日栏).toContainText("民俗涅槃日（放生日）");
  await expect(神圣纪念栏(page)).not.toContainText("民俗涅槃日（放生日）");
  await expect(page.getByRole("button", { name: "民俗涅槃日（放生日）", exact: true })).toHaveCount(0);

  await 选择日期(page, "2026-05-31");
  await expect(传统节日栏).toContainText("佛吉祥日（卫塞节）");
  await expect(神圣纪念栏(page)).not.toContainText("佛吉祥日（卫塞节）");
  await expect(page.getByRole("button", { name: "佛吉祥日（卫塞节）", exact: true })).toHaveCount(0);

  expect(控制台错误).toEqual([]);
  expect(页面错误).toEqual([]);
  expect(资源404).toEqual([]);
});

test("人物绑定纪念与无人物宗教纪日均可打开非空详情", async ({ page }) => {
  await page.goto("/");

  await 选择日期(page, "2026-09-25");
  await 打开人物(page, "太阴朝元之辰");
  await expect(page.locator("#deity-dialog-title")).toHaveText("太阴星君");
  await expect(page.locator(".deity-proclamation")).toContainText("太阴皇君诰");
  await expect(page.locator(".commemoration-introduction")).toContainText("朝元之辰");
  await page.getByRole("button", { name: "关闭神圣纪念详情" }).click();

  await 选择日期(page, "2026-02-17");
  await 打开人物(page, "天腊之辰");
  await expect(page.locator("#deity-dialog-title")).toHaveText("天腊之辰");
  await expect(page.locator(".commemoration-introduction")).toContainText("五腊之首");
  await expect(page.locator(".deity-proclamation")).toHaveCount(0);
  await page.getByRole("button", { name: "关闭神圣纪念详情" }).click();

  await 选择日期(page, "2030-02-02");
  await 打开人物(page, "诸佛下界探访善恶");
  await expect(page.locator(".commemoration-introduction")).toContainText("岁末诸佛下界");
  await page.getByRole("button", { name: "关闭神圣纪念详情" }).click();

  await 选择日期(page, "2027-01-08");
  await 打开人物(page, "念经一卷胜常日");
  await expect(page.locator(".commemoration-introduction")).toContainText("不应理解为现代可验证的客观功德倍数");
  await page.getByRole("button", { name: "关闭神圣纪念详情" }).click();
});

for (const 场景 of [
  { 偏好: "light", 系统主题: "dark", 实际主题: "light" },
  { 偏好: "dark", 系统主题: "light", 实际主题: "dark" },
  { 偏好: "system", 系统主题: "dark", 实际主题: "dark" },
] as const) {
  test(`人物详情支持${场景.偏好}主题`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: 场景.系统主题 });
    await page.addInitScript((偏好) => localStorage.setItem("traditional-calendar-theme", 偏好), 场景.偏好);
    await page.goto("/");
    await 选择日期(page, "2026-08-06");
    await 打开人物(page, "关圣帝君");
    await expect(page.locator("html")).toHaveAttribute("data-theme", 场景.实际主题);
    await expect(page.locator(".deity-dialog-card")).toBeVisible();
    await expect(page.getByRole("button", { name: "关闭神圣纪念详情" })).toBeVisible();
  });
}

for (const 场景 of [
  { 名称: "PC 2:3", 宽度: 1440, 高度: 1000, 图片宽: 600, 图片高: 900, 移动布局: false },
  { 名称: "iPad 3:4", 宽度: 768, 高度: 1024, 图片宽: 750, 图片高: 1000, 移动布局: false },
  { 名称: "390px 3:4", 宽度: 390, 高度: 844, 图片宽: 750, 图片高: 1000, 移动布局: true },
  { 名称: "375px 2:3", 宽度: 375, 高度: 812, 图片宽: 600, 图片高: 900, 移动布局: true },
  { 名称: "320px 长幅", 宽度: 320, 高度: 720, 图片宽: 400, 图片高: 1000, 移动布局: true },
] as const) {
  test(`${场景.名称}：测试神像固定常驻且仅文字区滚动`, async ({ page }) => {
    await page.setViewportSize({ width: 场景.宽度, height: 场景.高度 });
    await page.goto("/");
    await 选择日期(page, "2026-08-06");
    await 打开人物(page, "关圣帝君");
    await 注入测试神像(page, 场景.图片宽, 场景.图片高);

    const 测量前 = await page.locator(".deity-dialog-card").evaluate((卡片) => {
      const 神像 = 卡片.querySelector<HTMLElement>(".deity-portrait")!;
      const 文字 = 卡片.querySelector<HTMLElement>(".deity-dialog-content")!;
      const 滚动区 = 卡片.querySelector<HTMLElement>(".deity-dialog-scroll")!;
      const 关闭 = 卡片.querySelector<HTMLElement>(".deity-dialog-close")!;
      const 图片 = 神像.querySelector<HTMLElement>("img")!;
      const 卡片框 = 卡片.getBoundingClientRect();
      const 神像框 = 神像.getBoundingClientRect();
      const 文字框 = 文字.getBoundingClientRect();
      const 关闭框 = 关闭.getBoundingClientRect();
      return {
        card: { top: 卡片框.top, left: 卡片框.left, width: 卡片框.width, height: 卡片框.height },
        portrait: { top: 神像框.top, left: 神像框.left, width: 神像框.width, height: 神像框.height },
        content: { top: 文字框.top, left: 文字框.left, width: 文字框.width, height: 文字框.height },
        closeVisible: 关闭框.top >= 卡片框.top && 关闭框.bottom <= 卡片框.bottom && 关闭框.right <= 卡片框.right,
        objectFit: getComputedStyle(图片).objectFit,
        scrollHeight: 滚动区.scrollHeight,
        clientHeight: 滚动区.clientHeight,
        pageNoHorizontalOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      };
    });

    expect(测量前.objectFit).toBe("cover");
    expect(测量前.closeVisible).toBe(true);
    expect(测量前.pageNoHorizontalOverflow).toBe(true);
    expect(测量前.scrollHeight).toBeGreaterThan(测量前.clientHeight);
    if (场景.移动布局) {
      expect(测量前.portrait.height / 测量前.card.height).toBeGreaterThan(0.37);
      expect(测量前.portrait.height / 测量前.card.height).toBeLessThan(0.43);
      expect(测量前.content.height / 测量前.card.height).toBeGreaterThan(0.57);
      expect(Math.abs(测量前.portrait.left - 测量前.card.left)).toBeLessThanOrEqual(1);
    } else {
      expect(测量前.portrait.width / 测量前.card.width).toBeGreaterThan(0.37);
      expect(测量前.portrait.width / 测量前.card.width).toBeLessThan(0.43);
      expect(测量前.content.width / 测量前.card.width).toBeGreaterThan(0.57);
      expect(Math.abs(测量前.portrait.top - 测量前.card.top)).toBeLessThanOrEqual(1);
    }

    await page.locator(".deity-dialog-scroll").evaluate((元素) => { 元素.scrollTop = 元素.scrollHeight; });
    const 测量后 = await page.locator(".deity-dialog-card").evaluate((卡片) => {
      const 神像 = 卡片.querySelector<HTMLElement>(".deity-portrait")!.getBoundingClientRect();
      const 滚动区 = 卡片.querySelector<HTMLElement>(".deity-dialog-scroll")!;
      const 对话框 = 卡片.closest<HTMLDialogElement>("dialog")!;
      return { portraitTop: 神像.top, portraitLeft: 神像.left, scrollTop: 滚动区.scrollTop, dialogScrollTop: 对话框.scrollTop };
    });
    expect(Math.abs(测量后.portraitTop - 测量前.portrait.top)).toBeLessThanOrEqual(1);
    expect(Math.abs(测量后.portraitLeft - 测量前.portrait.left)).toBeLessThanOrEqual(1);
    expect(测量后.scrollTop).toBeGreaterThan(0);
    expect(测量后.dialogScrollTop).toBe(0);
    await expect(page.locator(".deity-source")).toBeAttached();
    expect(await page.locator(".deity-dialog-scroll").evaluate((元素) => {
      const 宝诰 = 元素.querySelector(".deity-proclamation")!;
      const 简介 = 元素.querySelector(".deity-introduction")!;
      const 来源 = 元素.querySelector(".deity-source")!;
      return Boolean(宝诰.compareDocumentPosition(简介) & Node.DOCUMENT_POSITION_FOLLOWING)
        && Boolean(简介.compareDocumentPosition(来源) & Node.DOCUMENT_POSITION_FOLLOWING);
    })).toBe(true);

    await page.getByRole("button", { name: "关闭神圣纪念详情" }).click();
    await 打开人物(page, "关圣帝君");
    expect(await page.locator(".deity-dialog-scroll").evaluate((元素) => 元素.scrollTop)).toBe(0);
  });
}

test("无神像人物取消图片区并由完整宽度文字区独立滚动", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/");
  await 选择日期(page, "2026-08-06");
  await 打开人物(page, "关圣帝君");
  await expect(page.locator(".deity-dialog-card")).toHaveClass(/is-text-only/u);
  await expect(page.locator(".deity-portrait")).toHaveCount(0);
  await page.locator(".deity-proclamation p").evaluate((段落) => { 段落.textContent = `${段落.textContent ?? ""}${"无神像长宝诰。".repeat(180)}`; });
  const 测量 = await page.locator(".deity-dialog-card").evaluate((卡片) => {
    const 卡片框 = 卡片.getBoundingClientRect();
    const 文字框 =卡片.querySelector<HTMLElement>(".deity-dialog-content")!.getBoundingClientRect();
    const 滚动区 = 卡片.querySelector<HTMLElement>(".deity-dialog-scroll")!;
    滚动区.scrollTop = 滚动区.scrollHeight;
    return { widthDiff: Math.abs(卡片框.width - 文字框.width), scrollTop: 滚动区.scrollTop, dialogScrollTop: 卡片.closest<HTMLDialogElement>("dialog")!.scrollTop };
  });
  expect(测量.widthDiff).toBeLessThanOrEqual(1);
  expect(测量.scrollTop).toBeGreaterThan(0);
  expect(测量.dialogScrollTop).toBe(0);
});
