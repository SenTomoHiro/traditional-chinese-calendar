import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const 页面源码 = readFileSync(resolve(process.cwd(), "src/main.ts"), "utf8");
const 页面样式 = readFileSync(resolve(process.cwd(), "src/style.css"), "utf8");
const 当前历时源码 = readFileSync(resolve(process.cwd(), "src/当前历时.ts"), "utf8");

describe("日期详情展示回归", () => {
  it("以农历、四柱、值星和节气组成核心信息层级", () => {
    expect(页面源码).toContain('class="lunar-title"');
    expect(页面源码).toContain("${历法结果.农历.显示}");
    expect(页面源码).toContain('class="core-fact pillar-core"');
    expect(页面源码).toContain("${四柱}");
    expect(页面源码).toContain('class="core-fact value-star-core"');
    expect(页面源码).toContain("${历法结果.值星}日");
    expect(页面源码).toContain('class="core-fact solar-term-core"');
    expect(页面源码).toContain("${核心节气显示}");
  });

  it("普通日期的节气使用浅色无字而不是破折号", () => {
    expect(页面源码).toContain('const 核心节气显示 = 历法结果.节气?.名称 ?? "无"');
    expect(页面源码).toContain('class="is-empty"');
    expect(页面源码).not.toContain('const 核心节气显示 = 历法结果.节气?.名称 ?? "—"');
    expect(页面样式).toContain(".solar-term-core strong.is-empty");
    expect(页面样式).toContain("color: var(--panel-muted)");
  });

  it("农历标题右侧提供当前时间依据切换按钮", () => {
    const 标题位置 = 页面源码.indexOf('class="lunar-title"');
    const 按钮位置 = 页面源码.indexOf('class="time-basis-button"');
    const 公历位置 = 页面源码.indexOf('class="solar-date"');
    expect(页面源码).toContain('data-action="time-basis"');
    expect(按钮位置).toBeGreaterThan(标题位置);
    expect(按钮位置).toBeLessThan(公历位置);
    expect(页面源码).toContain("当前使用${当前时间依据}，点击切换为${切换目标}");
  });

  it("保留小号公历日期且不再渲染巨型公历日号", () => {
    expect(页面源码).toContain('class="solar-date"');
    expect(页面源码).toContain("${格式化公历日期(所选)}");
    expect(页面源码).not.toContain("selected-day-number");
    expect(页面样式).not.toContain(".selected-day-number");
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

  it("值星和节气合并为同一行且视觉层级一致", () => {
    expect(页面样式).toContain(".core-fact {");
    expect(页面样式).toContain("grid-template-columns: max-content minmax(0, 1fr)");
    expect(页面源码).toContain('class="calendar-meta-row"');
    expect(页面样式).toMatch(/\.calendar-meta-row\s*\{[^}]*grid-template-columns:\s*repeat\(2,/u);
    const 四柱位置 = 页面源码.indexOf('class="core-fact pillar-core"');
    const 合并行位置 = 页面源码.indexOf('class="calendar-meta-row"');
    const 值星位置 = 页面源码.indexOf('class="core-fact value-star-core"');
    const 节气位置 = 页面源码.indexOf('class="core-fact solar-term-core"');
    expect(四柱位置).toBeLessThan(合并行位置);
    expect(合并行位置).toBeLessThan(值星位置);
    expect(值星位置).toBeLessThan(节气位置);
  });

  it("将三项既有时辰规则归入风水禁忌速查", () => {
    expect(页面源码).toContain('<h3>风水禁忌速查</h3>');
    expect(当前历时源码).toContain("判断全部时辰规则");
    expect(页面源码).not.toContain("现有时辰规则");
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

  it("年月导航与日期导航统一为两行", () => {
    const 年份切换位置 = 页面源码.indexOf('class="period-control" aria-label="年份切换"');
    const 月份切换位置 = 页面源码.indexOf('class="period-control" aria-label="月份切换"');
    const 日期切换位置 = 页面源码.indexOf('class="date-navigation"');
    const 返回今天位置 = 页面源码.indexOf('class="icon-button today-button"');
    expect(页面源码).toContain('class="period-navigation"');
    expect(年份切换位置).toBeLessThan(月份切换位置);
    expect(月份切换位置).toBeLessThan(日期切换位置);
    expect(日期切换位置).toBeLessThan(返回今天位置);
    expect(页面源码).toContain('data-action="previous-day"');
    expect(页面源码).toContain('data-action="next-day"');
    expect(页面源码).not.toContain("−年");
    expect(页面源码).not.toContain("+年");
    expect(页面源码).toContain('${String(状态.月 + 1).padStart(2, "0")}</strong>');
    expect(页面源码).not.toContain('${String(状态.月 + 1).padStart(2, "0")}月</strong>');
    expect(页面源码).toContain('data-action="today">今天</button>');
    expect(页面源码).not.toContain('data-action="today">返回今天</button>');
  });

  it("今天按钮复用通用导航样式并保持紧凑", () => {
    expect(页面源码).toContain('class="icon-button today-button"');
    expect(页面样式).toMatch(/\.today-button\s*\{[^}]*width:\s*auto;/u);
    expect(页面样式).toMatch(/\.today-button\s*\{[^}]*font-size:\s*11px;/u);
    expect(页面样式).toContain("--gold:");
    expect(页面样式).toContain("--panel:");
    expect(页面样式).not.toContain("--green:");
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

  it("神圣纪念与传统节日双栏、风水规则自适应多列", () => {
    expect(页面源码).toContain('class="date-events"');
    expect(页面源码).toContain('class="rule-results-grid"');
    expect(页面源码).toContain("时辰规则.map(规则标记).join");
    expect(页面样式).toMatch(/\.date-events\s*\{[^}]*grid-template-columns:\s*repeat\(2,/u);
    expect(页面样式).toContain("repeat(auto-fit, minmax(148px, 1fr))");
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

  it("十二时辰位于风水禁忌速查之后并使用响应式多列布局", () => {
    const 风水位置 = 页面源码.indexOf('aria-label="风水禁忌速查"');
    const 时辰位置 = 页面源码.indexOf('class="hour-overview"');
    expect(时辰位置).toBeGreaterThan(风水位置);
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
    expect(页面源码).toContain('时辰详情标签("时宜"');
    expect(页面源码).toContain('时辰详情标签("时忌"');
    expect(页面源码).toContain('"无特殊关系"');
    expect(页面源码).toContain('标题 === "日时关系" ? "无特殊关系" : "无"');
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
