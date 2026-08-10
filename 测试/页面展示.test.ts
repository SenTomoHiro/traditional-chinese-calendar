import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const 页面源码 = readFileSync(resolve(process.cwd(), "src/main.ts"), "utf8");
const 页面样式 = readFileSync(resolve(process.cwd(), "src/style.css"), "utf8");
const 当前历时源码 = readFileSync(resolve(process.cwd(), "src/当前历时.ts"), "utf8");
const 首页源码 = readFileSync(resolve(process.cwd(), "index.html"), "utf8");

describe("日期详情展示回归", () => {
  it("以农历、四柱和核心黄历信息组成详情层级", () => {
    expect(页面源码).toContain('class="lunar-title"');
    expect(页面源码).toContain("${历法结果.农历.显示}");
    expect(页面源码).toContain('class="core-fact pillar-core"');
    expect(页面源码).toContain("${四柱}");
    expect(页面源码).toContain('class="calendar-info-grid"');
    expect(页面源码).toContain('核心黄历项目("值日", `${历法结果.值星}日`)');
    expect(页面源码).toContain('日期信息项目("节气", [核心节气显示])');
  });

  it("普通日期的节气使用浅色无字而不是破折号", () => {
    expect(页面源码).toContain('const 核心节气显示 = 历法结果.节气?.名称 ?? "无"');
    expect(页面源码).toContain('名称 === "无" ? \' class="is-empty"\' : ""');
    expect(页面源码).not.toContain('const 核心节气显示 = 历法结果.节气?.名称 ?? "—"');
    expect(页面样式).toContain(".calendar-info-values span.is-empty");
    expect(页面样式).toContain("color: var(--panel-muted)");
  });

  it("农历标题右侧提供当前时间依据切换按钮", () => {
    const 标题位置 = 页面源码.indexOf('class="lunar-title"');
    const 按钮位置 = 页面源码.indexOf('class="time-basis-button"');
    const 公历位置 = 页面源码.indexOf('主日期控件(主日期值, "detail")');
    expect(页面源码).toContain('data-action="time-basis"');
    expect(按钮位置).toBeGreaterThan(标题位置);
    expect(按钮位置).toBeLessThan(公历位置);
    expect(页面源码).toContain("当前使用${当前时间依据}，点击切换为${切换目标}");
  });

  it("左侧公历日期改为紧凑可编辑日期输入且不再附带星期", () => {
    expect(页面源码).toContain('主日期控件(主日期值, "detail")');
    expect(页面源码).toContain('class="calendar-date-control${是详情 ? " detail-date-control" : ""}"');
    expect(页面源码).toContain('aria-label="${是详情 ? "左侧选择主日历日期" : "选择主日历日期"}"');
    expect(页面源码).not.toContain('class="solar-date"');
    expect(页面源码).not.toContain("${格式化公历日期(所选)} · ${星期名称[所选.getDay()]}");
    expect(页面源码).not.toContain("selected-day-number");
    expect(页面样式).not.toContain(".selected-day-number");
    expect(页面样式).toMatch(/\.detail-date-control\s*\{[^}]*flex:\s*0 1 180px[^}]*max-width:\s*180px/u);
  });

  it("四柱不再拆分且详情不重复显示月建或时辰字段", () => {
    expect(页面源码).not.toContain("<dt>年柱</dt>");
    expect(页面源码).not.toContain("<dt>月柱</dt>");
    expect(页面源码).not.toContain("<dt>日柱</dt>");
    expect(页面源码).not.toContain("<dt>时辰</dt>");
    expect(页面源码).not.toContain("<dt>时柱</dt>");
    expect(页面源码).not.toContain("<dt>月建</dt>");
    expect(页面样式).toContain("white-space: nowrap");
  });

  it("值日移入核心行且节气、神圣纪念和传统节日组成三列常驻模块", () => {
    expect(页面样式).toMatch(/\.calendar-info-grid\s*\{[^}]*grid-template-columns:\s*var\(--detail-grid-columns\)/u);
    const 四柱位置 = 页面源码.indexOf('class="core-fact pillar-core"');
    const 合并模块位置 = 页面源码.indexOf('class="calendar-info-grid"');
    const 值星位置 = 页面源码.indexOf('核心黄历项目("值日"');
    const 节气位置 = 页面源码.indexOf('日期信息项目("节气"');
    const 节庆位置 = 页面源码.indexOf("日期事件栏.map");
    expect(四柱位置).toBeLessThan(合并模块位置);
    expect(值星位置).toBeLessThan(合并模块位置);
    expect(值星位置).toBeLessThan(节气位置);
    expect(节气位置).toBeLessThan(节庆位置);
    expect(页面源码.match(/核心黄历项目\("值日"/gu)).toHaveLength(1);
    expect(页面源码).not.toContain('日期信息项目("值日"');
    expect(页面源码.match(/日期信息项目\("节气"/gu)).toHaveLength(1);
  });

  it("日吉凶位于四项信息模块之前并独立显示十二天神黄黑道", () => {
    const 四柱位置 = 页面源码.indexOf('class="core-fact pillar-core"');
    const 日吉凶位置 = 页面源码.indexOf('class="almanac-core-row"');
    const 日期事件位置 = 页面源码.indexOf('class="calendar-info-grid"');
    expect(日吉凶位置).toBeGreaterThan(四柱位置);
    expect(日吉凶位置).toBeLessThan(日期事件位置);
    expect(页面源码).toContain("${历法结果.日吉凶.天神} · ${历法结果.日吉凶.类型} · ${历法结果.日吉凶.吉凶}");
    expect(页面源码).toContain('aria-label="日吉凶值日与风水禁忌"');
    expect(页面样式).toMatch(/\.almanac-core-item\.is-凶 strong\s*\{[^}]*color:\s*var\(--danger\)/u);
    expect(页面样式).toMatch(/\.almanac-core-item strong\s*\{[^}]*color:\s*var\(--gold-soft\)/u);
  });

  it("核心三项与节气纪念节日共用完全相同的内容文字规格", () => {
    const 共享内容规格 = 页面样式.match(/\.almanac-core-item strong,\s*\.calendar-info-values span\s*\{[^}]*\}/u)?.[0] ?? "";
    expect(共享内容规格).toContain("font-size: 12px");
    expect(共享内容规格).toContain("font-weight: 400");
    expect(共享内容规格).toContain("line-height: 1.55");
    expect(共享内容规格).toContain("overflow-wrap: anywhere");
    expect(页面样式).toMatch(/\.almanac-core-item h3\s*\{[^}]*font-size:\s*10px/u);
    expect(页面样式).toMatch(/\.calendar-info-item h3\s*\{[^}]*font-size:\s*10px/u);
    expect(页面源码).toContain('结果.命中.map((规则) => 规则.展示文本)');
    expect(页面源码).toContain('内容行.map((行) => `<span>${转义HTML(行)}</span>`)');
    expect(共享内容规格).not.toMatch(/text-overflow|white-space:\s*nowrap|overflow:\s*hidden/u);
  });

  it("日宜日忌紧接日吉凶并在全平台纵向使用整行", () => {
    const 日吉凶位置 = 页面源码.indexOf('class="almanac-core-row"');
    const 每日宜忌位置 = 页面源码.indexOf('class="day-actions"');
    const 日期事件位置 = 页面源码.indexOf('class="calendar-info-grid"');
    expect(日吉凶位置).toBeLessThan(每日宜忌位置);
    expect(每日宜忌位置).toBeLessThan(日期事件位置);
    expect(页面源码).toContain('aria-label="日宜与日忌"');
    expect(页面源码).toContain('每日宜忌栏("日宜", 每日宜忌显示.日宜, "good")');
    expect(页面源码).toContain('每日宜忌栏("日忌", 每日宜忌显示.日忌, "bad")');
    expect(页面源码).toContain('const 显示内容 = 内容.length > 0 ? 内容 : ["无"]');
    expect(页面源码).toContain('显示内容.map');
    expect(页面源码).not.toContain('显示内容.slice');
    expect(页面样式).toMatch(/\.day-actions\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/u);
    expect(页面样式).not.toMatch(/\.day-action-group \+ \.day-action-group\s*\{[^}]*border-(?:top|bottom):/u);
    expect(页面样式).toContain(".day-action-group.is-bad .day-action-tags span");
  });

  it("日吉凶和值日整体下方使用主题分割线并与日宜保持紧凑间距", () => {
    expect(页面样式).toMatch(/\.almanac-core-row\s*\{[^}]*padding-bottom:\s*14px;[^}]*border-bottom:\s*1px solid var\(--panel-line\)/u);
    expect(页面样式).toMatch(/\.day-actions\s*\{[^}]*margin-top:\s*14px/u);
    const 日吉凶位置 = 页面源码.indexOf('class="almanac-core-row"');
    const 日宜忌位置 = 页面源码.indexOf('class="day-actions"');
    expect(日吉凶位置).toBeLessThan(日宜忌位置);
  });

  it("将三项既有规则并入具体时辰详情且删除原独立模块", () => {
    expect(页面源码).toContain('<section class="hour-rule-results" aria-label="风水禁忌速查">');
    expect(页面源码).toContain('<h4>风水禁忌速查</h4>');
    expect(页面源码).toContain("时段.风水禁忌.map(规则标记).join");
    expect(页面源码).not.toContain('<section class="rule-results" aria-label="风水禁忌速查">');
    expect(当前历时源码).toContain("判断全部时辰规则");
    expect(页面源码).not.toContain("现有时辰规则");
  });

  it("日级风水汇总并入日吉凶值日核心行且时辰复用同一结果", () => {
    expect(页面源码).not.toContain('class="day-fengshui"');
    expect(页面源码).not.toContain("日级风水禁忌模块");
    expect(页面样式).not.toContain(".day-fengshui");
    expect(页面源码).toContain('aria-label="日吉凶值日与风水禁忌"');
    expect(页面源码).toContain('核心黄历项目("风水禁忌", 日级风水展示行(日级风水禁忌, "无")');
    expect(页面源码).toContain('日级风水展示行(时段.当日风水禁忌, "当日宜")');
    expect(页面源码).not.toContain("日犯月忌");
    expect(页面样式).toMatch(/\.almanac-core-row\s*\{[^}]*grid-template-columns:\s*var\(--detail-grid-columns\)/u);
    expect(页面源码).toContain('class="hour-rule-heading"');
    expect(页面源码).toContain("时段.当日风水禁忌.当日状态");
    expect(页面源码).toContain('时段.当日风水禁忌.当日状态 === "当日宜"');
    expect(页面样式).toMatch(/\.hour-rule-heading\s*\{[^}]*grid-template-columns:\s*max-content minmax\(0, 1fr\)/u);
    expect(页面样式).toMatch(/\.hour-rule-heading p\s*\{[^}]*font-size:\s*10px;[^}]*text-align:\s*right/u);
    expect(页面样式).toMatch(/\.hour-detail > header span,[\s\S]*?\.hour-detail > header p\s*\{[^}]*font-size:\s*10px/u);
  });

  it("风水禁忌删除右侧重复状态并只强调命中的条件行", () => {
    expect(页面源码).toContain("<strong>${规则.名称}</strong>");
    expect(页面源码).toContain("<p>${规则.说明}</p>");
    expect(页面源码).not.toContain("const 状态文字");
    expect(页面源码).not.toContain("<em>${状态文字}</em>");
    expect(页面样式).not.toContain(".rule-result-heading");
    expect(页面样式).toMatch(/\.rule-result p\s*\{[^}]*color:\s*var\(--panel-muted\)/u);
    expect(页面样式).toMatch(/\.rule-result\.is-命中 p\s*\{[^}]*color:\s*var\(--danger\)/u);
    expect(页面样式).not.toContain(".rule-result.is-未命中 p");
  });

  it("时辰速查同时显示原规则禁忌时辰与当前命中状态", () => {
    expect(页面源码).toContain("<p>${规则.说明}</p>");
    expect(页面样式).toMatch(/\.rule-result\.is-命中 p\s*\{[^}]*color:\s*var\(--danger\)/u);
    expect(页面样式).toMatch(/\.rule-result p\s*\{[^}]*color:\s*var\(--panel-muted\)/u);
  });

  it("日期详情与时辰右侧复用同一日级风水详细结果", () => {
    const 展示函数 = 页面源码.match(/function 日级风水展示行[\s\S]*?\n\}/u)?.[0] ?? "";
    expect(展示函数).toContain("结果.命中.map((规则) => 规则.展示文本)");
    expect(页面源码).toContain('日级风水展示行(日级风水禁忌, "无")');
    expect(页面源码).toContain('日级风水展示行(时段.当日风水禁忌, "当日宜")');
    expect(页面源码).not.toContain("日犯月忌");
  });

  it("古籍依据是整个时辰详情的总脚注并明确区分风水配置", () => {
    expect(页面源码).toContain('class="hour-detail-source" aria-label="时辰详情依据"');
    expect(页面源码).toContain("时辰详情依据：");
    expect(页面源码).toContain("风水禁忌另据项目中文风水规则配置。");
    expect(页面源码).toMatch(/<section class="hour-rule-results"[\s\S]*?<\/section>\s*\$\{时辰详情依据\(时段\.详情\.依据\)\}/u);
    expect(页面源码).toContain("时段.详情.现代来源");
    expect(页面样式).toMatch(/\.hour-detail-source\s*\{[^}]*width:\s*100%[^}]*border-top:/u);
    expect(页面样式).not.toContain(".hour-detail > small");
  });

  it("顶部提供浅色自动深色三状态主题且切换不重算页面状态", () => {
    expect(页面源码).toContain('class="theme-switch"');
    expect(页面源码).toContain('{ 值: "light", 标签: "浅色" }');
    expect(页面源码).toContain('{ 值: "system", 标签: "自动" }');
    expect(页面源码).toContain('{ 值: "dark", 标签: "深色" }');
    const 主题处理 = 页面源码.match(/if \(是主题偏好\(目标\.dataset\.themePreference\)\) \{[\s\S]*?return;\n  \}/u)?.[0] ?? "";
    expect(主题处理).toContain("主题控制器.设置偏好");
    expect(主题处理).not.toMatch(/渲染|设置日期|时间依据|手动查看时辰键/u);
    expect(首页源码.indexOf("traditional-calendar-theme")).toBeLessThan(首页源码.indexOf('src="/src/main.ts"'));
    expect(首页源码).toContain("document.documentElement.dataset.theme");
    expect(页面样式).toContain(':root[data-theme="dark"]');
    expect(页面样式).toMatch(/\.theme-switch\s*\{[^}]*display:\s*inline-flex/u);
  });

  it("移动端源码顺序为核心详情、右栏工具、辅助计算", () => {
    const 详情位置 = 页面源码.indexOf('<aside class="detail-card"');
    const 右栏位置 = 页面源码.indexOf('<div class="calendar-right"');
    const 月历位置 = 页面源码.indexOf('<article class="calendar-card"');
    const 八字位置 = 页面源码.indexOf("${八字查询卡片()}");
    const 计算位置 = 页面源码.indexOf('<section class="calculation-card"');

    expect(详情位置).toBeGreaterThan(-1);
    expect(详情位置).toBeLessThan(右栏位置);
    expect(右栏位置).toBeLessThan(月历位置);
    expect(详情位置).toBeLessThan(月历位置);
    expect(月历位置).toBeLessThan(八字位置);
    expect(八字位置).toBeLessThan(计算位置);
    expect(页面样式).toContain('"detail right"');
    expect(页面样式).toContain('"calculation right"');
    expect(页面样式).toMatch(/"detail"\s+"right"\s+"calculation"/u);
  });

  it("顶部标题和底部说明均已删除", () => {
    expect(页面源码).not.toContain("TRADITIONAL CALENDAR");
    expect(页面源码).not.toContain("传统历法日历</h1>");
    expect(页面源码).not.toContain('class="brand-mark"');
    expect(页面源码).not.toContain("<footer>");
    expect(页面源码).not.toContain("日历信息 · 传统节日与神圣纪念");
    expect(页面源码).not.toContain("定位坐标仅在当前页面内使用，不会上传或保存。");
  });

  it("左右主日期复用同一原生输入组件且不经过中间弹层", () => {
    expect(页面源码).toContain('class="calendar-date-control${是详情 ? " detail-date-control" : ""}"');
    expect(页面源码).toMatch(/function 主日期控件[\s\S]*?type="date"[\s\S]*?data-calendar-date/u);
    expect(页面源码).toContain('主日期控件(主日期值, "detail")');
    expect(页面源码).toContain('主日期控件(主日期值, "calendar")');
    expect(页面源码).not.toContain('data-action="open-calendar-date"');
    expect(页面源码).not.toContain('data-calendar-date-dialog');
    expect(页面源码).not.toContain(".showModal()");
    expect(页面源码).toContain('{ action: "previous-day", label: "上一天", text: "‹" }');
    expect(页面源码).toContain('{ action: "today", label: "返回今天", text: "今" }');
    expect(页面源码).toContain('{ action: "next-day", label: "下一天", text: "›" }');
    expect(页面源码).not.toContain('class="period-navigation"');
  });

  it("两个日期输入共用草稿提交并在编辑时同步可见值", () => {
    expect(页面源码).toContain('closest<HTMLInputElement>("[data-calendar-date]")');
    expect(页面源码).toContain('querySelectorAll<HTMLInputElement>("[data-calendar-date]")');
    expect(页面源码).toContain("if (输入 !== 主日期输入) 输入.value = 主日期输入.value");
    expect(页面源码).toContain("刷新结果.需要渲染 && !主日期正在编辑");
  });

  it("两组快捷按钮共用前一天今天后一天逻辑并保持既有实时模式", () => {
    const 快捷处理 = 页面源码.match(/case "previous-day":[\s\S]*?case "time-basis"/u)?.[0] ?? "";
    expect(快捷处理).toContain("切换相邻主日期(-1)");
    expect(快捷处理).toContain("回到今天实时模式()");
    expect(快捷处理).toContain("切换相邻主日期(1)");
    const 今日处理 = 页面源码.match(/function 回到今天实时模式\(\): void \{[\s\S]*?\n\}/u)?.[0] ?? "";
    expect(今日处理).toContain("时间查询 = 创建实时查询时间(当前北京时间)");
    expect(今日处理).toContain("手动查看时辰键 = null");
    expect(今日处理).not.toMatch(/当前时间依据\s*=|主题控制器/u);
  });

  it("清空或选回今天会恢复实时模式", () => {
    const 日期提交 = 页面源码.match(/function 提交主日期\([\s\S]*?\n\}/u)?.[0] ?? "";
    expect(日期提交).toContain('if (来源 === "原生选择") 回到今天实时模式()');
    expect(日期提交).toContain("是同一天(日期, 北京日期())");
    expect(页面源码).toContain("时间查询 = 创建实时查询时间(当前北京时间)");
  });

  it("键盘编辑日期使用草稿并只在Enter或失焦后提交", () => {
    expect(页面源码).toContain("let 主日期草稿: string | null = null");
    expect(页面源码).toContain("let 主日期键盘编辑 = false");
    expect(页面源码).toContain("主日期草稿 = 主日期输入.value");
    expect(页面源码).toContain("if (!主日期键盘编辑) 提交主日期");
    expect(页面源码).toContain('if (事件.key === "Enter")');
    expect(页面源码).toContain('提交主日期(主日期草稿 ?? 目标.value, "键盘")');
    expect(页面源码).toContain("刷新结果.需要渲染 && !主日期正在编辑");
  });

  it("切换任意日期会清除手动时辰并跟随当前真实时分", () => {
    const 设置日期处理 = 页面源码.match(/function 设置日期\(日期: Date\): void \{[\s\S]*?\n\}/u)?.[0] ?? "";
    expect(设置日期处理).toContain("时间查询 = 创建实时查询时间(当前北京时间)");
    expect(设置日期处理).toContain("手动查看时辰键 = null");
    expect(设置日期处理).not.toContain("12:00");
    expect(页面源码).toContain("刷新主日期实时时钟");
  });

  it("一体日期使用宋体等高表格数字", () => {
    expect(页面样式).toMatch(/:root\s*\{[^}]*--serif-font:/u);
    expect(页面样式).toMatch(/\.lunar-title\s*\{[^}]*font-family:\s*var\(--serif-font\)/u);
    expect(页面样式).toMatch(/\.calendar-date-control\s*\{[^}]*font-family:\s*var\(--serif-font\)/u);
    expect(页面样式).toMatch(/\.calendar-date-control\s*\{[^}]*font-variant-numeric:\s*lining-nums tabular-nums/u);
    expect(页面样式).toMatch(/\.calendar-date-control\s*\{[^}]*font-feature-settings:\s*"lnum" 1, "tnum" 1/u);
    expect(页面源码).toContain('value="${值}"');
    expect(页面源码).not.toContain("digit-");
  });

  it("一体日期选择器在桌面与手机均保持居中且不横溢", () => {
    expect(页面样式).toMatch(/\.calendar-toolbar\s*\{[^}]*justify-content:\s*center/u);
    expect(页面样式).toMatch(/\.calendar-date-control\s*\{[^}]*width:\s*min\(100%, 300px\)/u);
    expect(页面样式).toMatch(/@media \(max-width: 560px\)[\s\S]*?\.calendar-date-control\s*\{[^}]*font-size:/u);
  });

  it("月历与详情都已接入节日和神圣纪念", () => {
    expect(页面源码).toContain("创建月历日期信息");
    expect(页面源码).toContain("创建日期事件分栏");
    expect(页面源码).toContain("日期事件栏.map");
  });

  it("月历固定三条信息区且超出后显示另N项", () => {
    expect(页面源码).toContain('class="day-events"');
    expect(页面源码).toContain("日期信息.显示事件.map");
    expect(页面源码).toContain("另${日期信息.其余事件数}项");
    expect(页面样式).toContain("grid-template-rows: repeat(3, 1.15em)");
    expect(页面样式).toMatch(/\.days-grid\s*\{[^}]*gap:\s*2px;/u);
    expect(页面样式).toMatch(/\.day-event\s*\{[^}]*font-size:\s*8px;/u);
  });

  it("三项辅助信息三栏、详情内风水规则自适应多列", () => {
    expect(页面源码).toContain('class="calendar-info-grid"');
    expect(页面源码).toContain('class="rule-results-grid"');
    expect(页面源码).toContain("时段.风水禁忌.map(规则标记).join");
    expect(页面样式).toMatch(/\.calendar-info-grid\s*\{[^}]*grid-template-columns:\s*var\(--detail-grid-columns\)/u);
    expect(页面样式).toContain("repeat(auto-fit, minmax(148px, 1fr))");
  });

  it("北斗三类信息位于四项信息模块之后、十二时辰之前", () => {
    const 信息位置 = 页面源码.indexOf('class="calendar-info-grid"');
    const 北斗位置 = 页面源码.indexOf('class="beidou-panel"');
    const 时辰位置 = 页面源码.indexOf('class="hour-overview"');
    expect(信息位置).toBeLessThan(北斗位置);
    expect(北斗位置).toBeLessThan(时辰位置);
    expect(页面源码).toContain("北斗.斗降日.来源显示");
    expect(页面源码).toContain('class="beidou-source"');
    expect(页面源码).not.toContain("两书同载");
    expect(页面源码.indexOf('class="beidou-source"')).toBeGreaterThan(页面源码.indexOf('class="beidou-grid"'));
    expect(页面源码).toContain("${北斗.本命下日}");
    expect(页面源码).toContain("${转义HTML(北斗.本命星官)}");
    expect(页面样式).toMatch(/\.beidou-grid\s*\{[^}]*grid-template-columns:\s*var\(--detail-grid-columns\)/u);
    expect(页面样式).toMatch(/\.beidou-source\s*\{[^}]*margin:\s*7px 0 0;[^}]*overflow-wrap:\s*anywhere/u);
  });

  it("手机三组信息共用窄窄宽列定义且桌面保持三等列", () => {
    expect(页面样式).toMatch(/\.detail-card\s*\{[^}]*--detail-grid-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/u);
    for (const 选择器 of ["almanac-core-row", "calendar-info-grid", "beidou-grid"]) {
      expect(页面样式).toMatch(new RegExp(`\\.${选择器}\\s*\\{[^}]*grid-template-columns:\\s*var\\(--detail-grid-columns\\)`, "u"));
    }
    const 手机规则 = 页面样式.match(/@media \(max-width: 560px\) \{[\s\S]*?@media \(max-width: 350px\)/u)?.[0] ?? "";
    expect(手机规则).toContain("--detail-grid-columns: minmax(0, 0.72fr) minmax(0, 0.68fr) minmax(0, 1.6fr)");
    expect(手机规则).not.toMatch(/\.beidou-grid\s*\{[^}]*repeat\(2/u);
    expect(页面样式).not.toMatch(/\.calendar-info-item:last-child\s*\{[^}]*grid-column/u);
  });

  it("左侧快捷按钮仅手机显示而右侧快捷按钮全端保留", () => {
    expect(页面样式).toMatch(/\.main-date-navigation\.is-detail \.date-shortcuts\s*\{[^}]*display:\s*none/u);
    expect(页面样式).toMatch(/@media \(max-width: 560px\)[\s\S]*?\.main-date-navigation\.is-detail \.date-shortcuts\s*\{[^}]*display:\s*flex/u);
    expect(页面样式).not.toMatch(/\.main-date-navigation\.is-calendar \.date-shortcuts\s*\{[^}]*display:\s*none/u);
    expect(页面样式).toMatch(/\.date-shortcut-button\s*\{[^}]*width:\s*30px[^}]*height:\s*30px/u);
  });

  it("生辰八字查询位于月历下方并与主日历状态分离", () => {
    const 月历位置 = 页面源码.indexOf('<article class="calendar-card"');
    const 八字位置 = 页面源码.indexOf("${八字查询卡片()}");
    expect(八字位置).toBeGreaterThan(月历位置);
    expect(页面源码).toContain('aria-label="生辰八字查询"');
    expect(页面源码).toContain('data-bazi-date');
    expect(页面源码).toContain('data-bazi-time');
    expect(页面源码).toContain('data-bazi-longitude');
    expect(页面源码).toContain('data-action="bazi-locate"');
    expect(页面源码).toContain('data-bazi-output');
    expect(页面源码).toContain("结果容器.innerHTML = 生成八字结果区()");
    expect(页面源码).toContain("更新八字结果区()");
  });

  it("实时更新、手动暂停、返回今天与卸载清理均已接入", () => {
    expect(页面源码).toContain("创建分钟实时更新器");
    expect(页面源码).toContain('根节点.addEventListener("input"');
    expect(页面源码).toContain('时间查询 = 创建手动查询时间(输入框.value)');
    expect(页面源码).toContain("时间查询 = 创建实时查询时间(当前北京时间)");
    expect(页面源码).toContain('window.addEventListener("pagehide"');
    expect(页面源码).toContain('window.addEventListener("pageshow"');
    expect(页面源码).toContain("分钟实时更新器.停止()");
  });

  it("月历今天标识继续使用真实北京时间日期", () => {
    expect(页面源码).toContain("const 是今天 = 是同一天(当前日期, 今天)");
    expect(页面源码).not.toContain("const 是今天 = 是同一天(当前日期, 最终.最终时间)");
  });

  it("页面明确区分23点进入子时与午夜换日", () => {
    expect(页面源码).toContain("23:00进入子时，日柱仍在00:00换日");
    expect(页面源码).not.toContain("日柱从子时开始的 23:00 换日");
  });

  it("十二时辰成为唯一外层模块并使用响应式多列布局", () => {
    const 风水位置 = 页面源码.indexOf('aria-label="风水禁忌速查"');
    const 时辰位置 = 页面源码.indexOf('class="hour-overview"');
    expect(时辰位置).toBeGreaterThan(-1);
    expect(风水位置).toBeGreaterThan(-1);
    expect(页面源码).toContain('<h3>十二时辰</h3>');
    expect(页面源码).toContain("十二时辰.项目.map(时辰概览卡片)");
    expect(页面源码).toContain('class="hour-card${项目.当前 ? " is-current" : ""}${已手动选中 ? " is-selected" : ""}"');
    expect(页面源码).toContain("${时段.时间范围}");
    expect(页面源码).toContain("${时段.时柱}时");
    expect(页面源码).toContain("${时段.值神}");
    expect(页面源码).toContain("${时段.吉凶}");
    expect(页面样式).toContain("grid-template-columns: repeat(3, minmax(0, 1fr))");
    expect(页面样式).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
  });

  it("十二时辰详情默认常驻于概览之前且不可收起", () => {
    const 网格位置 = 页面源码.indexOf('class="hour-grid"');
    const 详情位置 = 页面源码.indexOf("${时辰展开详情(查看时辰)}");
    expect(页面源码).toContain('data-hour-key="${时段.键}"');
    expect(页面源码).toContain('aria-pressed="${手动查看时辰键 === 时段.键}"');
    expect(页面源码).not.toContain("点击收起");
    expect(页面源码).not.toContain("展开时辰键 === 时辰键 ? null");
    expect(页面源码).toContain('class="hour-detail"');
    expect(详情位置).toBeGreaterThan(-1);
    expect(详情位置).toBeLessThan(网格位置);
    expect(页面源码).toContain("选出查看时辰(全部时段, 手动查看时辰键)");
    expect(页面源码).toContain('class="hour-card${项目.当前 ? " is-current" : ""}${已手动选中 ? " is-selected" : ""}"');
    expect(页面源码).toContain('时辰详情标签("日时关系"');
    expect(页面源码).toContain('时辰详情标签("吉神"');
    expect(页面源码).toContain('时辰详情标签("凶煞"');
    expect(页面源码).toContain('时辰详情标签("时宜", 时段.详情.现代时宜');
    expect(页面源码).toContain('时辰详情标签("时忌", 时段.详情.现代时忌');
    expect(页面源码).toContain('aria-label="现代时辰宜忌"');
    expect(页面源码).toContain("${时段.详情.现代来源}");
    expect(页面源码).toContain('"无特殊关系"');
    expect(页面源码).toContain('标题 === "日时关系" ? "无特殊关系" : "无"');
  });

  it("现代时宜时忌标签按内容高度顶部排列且不会被等高双栏拉伸", () => {
    expect(页面样式).toMatch(/\.modern-hour-actions \.hour-detail-group dd\s*\{[^}]*align-content:\s*flex-start;[^}]*align-items:\s*flex-start;/u);
    const 标签规则 = 页面样式.match(/\.hour-detail-group dd span,\s*\.hour-detail-group dd em\s*\{([^}]*)\}/u)?.[1] ?? "";
    expect(标签规则).not.toMatch(/height:\s*100%/u);
    expect(标签规则).not.toMatch(/flex-grow:\s*1/u);
    expect(页面源码).toContain('时辰详情标签("时宜", 时段.详情.现代时宜');
    expect(页面源码).toContain('时辰详情标签("时忌", 时段.详情.现代时忌');
  });

  it("现代时宜时忌在全平台纵向使用整行且来源说明仍在下方", () => {
    expect(页面样式).toMatch(/\.modern-hour-actions-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/u);
    expect(页面样式).not.toMatch(/\.modern-hour-actions \.hour-detail-group \+ \.hour-detail-group\s*\{[^}]*border-(?:top|bottom):/u);
    const 网格位置 = 页面源码.indexOf('class="modern-hour-actions-grid"');
    const 来源位置 = 页面源码.indexOf("${时段.详情.现代来源}");
    expect(网格位置).toBeLessThan(来源位置);
  });

  it("月历普通文字使用棕金语义色且保留红色事件与选中态", () => {
    expect(页面样式).toMatch(/--calendar-text:\s*#[0-9a-f]+/u);
    expect(页面样式).toMatch(/--calendar-muted:\s*#[0-9a-f]+/u);
    expect(页面样式).toMatch(/\.day-button\s*\{[^}]*color:\s*var\(--calendar-text\)/u);
    expect(页面样式).toMatch(/\.lunar-day\s*\{[^}]*color:\s*var\(--calendar-muted\)/u);
    expect(页面样式).toMatch(/\.day-event\s*\{[^}]*color:\s*var\(--accent-strong\)/u);
    expect(页面样式).toMatch(/\.day-button\.is-selected\s*\{[^}]*background:\s*var\(--accent\)/u);
  });

  it("顶部日期与八字控件、结果统一使用主题棕金色和可见焦点", () => {
    expect(页面样式).toMatch(/\.calendar-date-control\s*\{[^}]*color:\s*var\(--gold-strong\)/u);
    expect(页面样式).toMatch(/\.calendar-date-control::-webkit-calendar-picker-indicator\s*\{[^}]*filter:\s*var\(--warm-icon-filter\)/u);
    expect(页面样式).toMatch(/\.bazi-form input,[\s\S]*?\.bazi-locate\s*\{[^}]*color:\s*var\(--calendar-text\)/u);
    expect(页面样式).toMatch(/\.bazi-pillars\s*\{[^}]*color:\s*var\(--calendar-text\)/u);
    expect(页面样式).toMatch(/\.bazi-line strong\s*\{[^}]*color:\s*var\(--gold-strong\)/u);
    expect(页面样式).toContain("background-image: var(--select-arrow)");
    expect(页面样式).toMatch(/\.bazi-form input:focus-visible,[\s\S]*?outline:\s*3px solid/u);
    expect(页面样式).not.toMatch(/\.bazi-[^{]*\{[^}]*(?:color:\s*(?:black|#000(?:000)?))/u);
  });

  it("暗色模式为月历和八字语义色提供米金覆盖", () => {
    const 暗色规则 = 页面样式.match(/:root\[data-theme="dark"\] \{[\s\S]*?@media \(prefers-reduced-motion/u)?.[0] ?? "";
    expect(暗色规则).toContain("--calendar-text: #e8d6b1");
    expect(暗色规则).toContain("--calendar-muted: #b9a681");
    expect(暗色规则).toContain("--warm-icon-filter:");
  });

  it("十二时辰标题右侧提供恢复当前查询时辰按钮", () => {
    const 标题行位置 = 页面源码.indexOf('class="hour-overview-heading"');
    const 标题位置 = 页面源码.indexOf("<h3>十二时辰</h3>");
    const 按钮位置 = 页面源码.indexOf('data-action="current-hour"');
    const 详情位置 = 页面源码.indexOf("${时辰展开详情(查看时辰)}");
    expect(标题行位置).toBeLessThan(标题位置);
    expect(标题位置).toBeLessThan(按钮位置);
    expect(按钮位置).toBeLessThan(详情位置);
    expect(页面源码).toContain('class="current-hour-button"');
    expect(页面源码).toContain(">当前时辰</button>");
    expect(页面源码).toContain("手动查看时辰键 = 清除手动查看时辰()");
    expect(页面样式).toMatch(/\.hour-overview-heading\s*\{[^}]*justify-content:\s*space-between/u);
    const 按钮处理 = 页面源码.match(/if \(目标\.dataset\.action === "current-hour"\) \{[\s\S]*?return;\n  \}/u)?.[0] ?? "";
    expect(按钮处理).toContain("手动查看时辰键 = 清除手动查看时辰()");
    expect(按钮处理).not.toContain("设置日期");
    expect(按钮处理).toContain("时间查询 = 创建实时查询时间(当前北京时间)");
  });

  it("双栏采用左宽右窄且移动端仍为单栏", () => {
    expect(页面样式).toContain("grid-template-columns: minmax(0, 1.38fr) minmax(360px, 1fr)");
    expect(页面样式).toMatch(/@media \(max-width: 820px\)[\s\S]*grid-template-columns:\s*1fr/u);
  });

  it("时间依据默认折叠并把规则配置弱化成自动统计行", () => {
    expect(页面源码).toContain('<details class="calculation-details">');
    expect(页面源码).toContain("<summary>计算详情</summary>");
    expect(页面源码).not.toContain('<h2>时间与计算依据</h2>');
    expect(页面源码).toContain("规则配置：已读取 ${配置结果.length} 个文件 · ${规则总数} 条规则");
    expect(页面源码).not.toContain("<strong>传统规则配置</strong>");
  });
});
