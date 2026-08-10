import "./style.css";
import {
  创建月历格,
  格式化公历日期,
  是同一天,
  星期名称,
  星期短名,
  移动日期,
  移动月份,
  选择日期,
  type 日历状态,
} from "./日历/公历";
import { 创建月历日期信息 } from "./日历/月历信息";
import { 获取浏览器定位 } from "./定位";
import { 读取全部配置 } from "./规则/配置读取";
import { 获取神圣纪念日 } from "./规则/神圣纪念日";
import type { 时辰规则判断 } from "./规则/时辰规则";
import type { 时辰概览段, 时辰概览项 } from "./历法/十二时辰";
import {
  从时间戳读取北京时间,
  格式化日期时间,
  获取传统节日,
  创建北京时间,
} from "./历法";
import { 初始化时辰配置, 计算当前历时, type 时间依据 } from "./当前历时";
import {
  创建分钟实时更新器,
  创建实时查询时间,
  创建手动查询时间,
  刷新实时查询时间,
  type 查询时间状态,
} from "./实时历时";
import { 格式化时分 } from "./历法/时间";
import { 八字支持范围, 查询生辰八字, 生辰八字时间说明 } from "./生辰八字";
import { 创建日期事件分栏 } from "./界面/详情布局";
import { 更新手动查看键, 选出查看时辰 } from "./界面/时辰查看";

const 应用容器 = document.querySelector<HTMLDivElement>("#app");
if (!应用容器) throw new Error("页面初始化失败：找不到应用容器");
const 根节点: HTMLDivElement = 应用容器;

type 定位状态 = "未定位" | "定位中" | "成功" | "失败";

function 北京日期(时间 = 从时间戳读取北京时间()): Date {
  return new Date(时间.年, 时间.月 - 1, 时间.日);
}

const 初始北京时间 = 从时间戳读取北京时间();
let 今天 = 北京日期(初始北京时间);
let 状态: 日历状态 = 选择日期(
  { 年: 今天.getFullYear(), 月: 今天.getMonth(), 所选日期: 今天 },
  今天,
);
let 时间查询: 查询时间状态 = 创建实时查询时间(初始北京时间);
let 当前时间依据: 时间依据 = "北京时间";
let 用户已选择时间依据 = false;
let 当前经度: number | null = null;
let 当前定位状态: 定位状态 = "未定位";
let 定位说明 = "尚未定位，当前使用北京时间";
let 手动查看时辰键: string | null = null;
let 八字日期 = `${初始北京时间.年}-${String(初始北京时间.月).padStart(2, "0")}-${String(初始北京时间.日).padStart(2, "0")}`;
let 八字时间 = 格式化时分(初始北京时间);
let 八字时间依据: 时间依据 = "北京时间";
let 八字经度文本 = "";
let 八字定位中 = false;
let 八字定位说明 = "";

const 配置结果 = 读取全部配置();
const 已解析时辰配置 = 初始化时辰配置(配置结果);
const 神圣纪念配置 = 配置结果.find((配置) => 配置.文件名 === "神圣纪念日.txt");
const 规则总数 = 配置结果.reduce((总数, 文件) => 总数 + 文件.规则.length, 0);
const 基础配置错误总数 = 配置结果.reduce((总数, 文件) => 总数 + 文件.错误.length, 0);

function 设置日期(日期: Date): void {
  const 当前北京时间 = 从时间戳读取北京时间();
  今天 = 北京日期(当前北京时间);
  状态 = 选择日期(状态, 日期);
  时间查询 = 是同一天(日期, 今天)
    ? 创建实时查询时间(当前北京时间)
    : 创建手动查询时间("12:00");
  手动查看时辰键 = null;
  渲染();
}

async function 请求定位(成功后使用真太阳时: boolean, 记录用户选择 = false): Promise<boolean> {
  if (当前定位状态 === "定位中") return false;
  当前定位状态 = "定位中";
  定位说明 = "正在获取本机位置…";
  渲染();

  const 结果 = await 获取浏览器定位();
  if (结果.成功) {
    当前经度 = 结果.经度;
    当前定位状态 = "成功";
    if (成功后使用真太阳时) {
      当前时间依据 = "真太阳时";
      if (记录用户选择) 用户已选择时间依据 = true;
    }
    定位说明 = 当前时间依据 === "真太阳时"
      ? "定位成功，当前使用真太阳时"
      : "定位成功，当前使用北京时间";
    渲染();
    return true;
  }

  当前经度 = null;
  当前时间依据 = "北京时间";
  当前定位状态 = "失败";
  定位说明 = "未取得定位，当前使用北京时间";
  渲染();
  return false;
}

function 格式化修正(分钟: number): string {
  const 总秒数 = Math.round(分钟 * 60);
  const 符号 = 总秒数 >= 0 ? "+" : "−";
  const 绝对秒数 = Math.abs(总秒数);
  return `${符号}${Math.floor(绝对秒数 / 60)}分${String(绝对秒数 % 60).padStart(2, "0")}秒`;
}

function 转义HTML(文本: string): string {
  return 文本.replace(/[&<>"']/gu, (字符) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[字符] ?? 字符);
}

function 事件列表(标题: string, 事件: string[]): string {
  return `
    <div class="event-group">
      <h3>${标题}</h3>
      ${事件.length > 0
        ? `<ul>${事件.map((名称) => `<li>${转义HTML(名称)}</li>`).join("")}</ul>`
        : '<p class="event-empty">无</p>'}
    </div>`;
}

function 规则标记(规则: 时辰规则判断): string {
  return `
    <div class="rule-result is-${规则.状态}">
      <span aria-hidden="true"></span>
      <div>
        <strong>${规则.名称}</strong>
        <p>${规则.说明}</p>
      </div>
    </div>`;
}

function 时辰概览卡片(项目: 时辰概览项): string {
  const 已手动选中 = 项目.时段.some((时段) => 时段.键 === 手动查看时辰键);
  return `
    <article class="hour-card${项目.当前 ? " is-current" : ""}${已手动选中 ? " is-selected" : ""}" aria-label="${项目.名称}${项目.当前 ? "，当前时辰" : ""}${已手动选中 ? "，已选中查看" : ""}">
      <header><strong>${项目.名称}</strong>${项目.当前 || 已手动选中 ? `<span>${项目.当前 ? "当前" : ""}${项目.当前 && 已手动选中 ? " · " : ""}${已手动选中 ? "已选" : ""}</span>` : ""}</header>
      <div class="hour-segments">
        ${项目.时段.map((时段) => `
          <button
            type="button"
            class="hour-segment${时段.当前 ? " is-current" : ""}${手动查看时辰键 === 时段.键 ? " is-selected" : ""}"
            data-hour-key="${时段.键}"
            aria-pressed="${手动查看时辰键 === 时段.键}"
            aria-label="${时段.名称}，${时段.时间范围}，${时段.时柱}时，${时段.值神}${时段.吉凶}，点击查看详情"
          >
            <div class="hour-time">${项目.时段.length > 1 ? `<span>${时段.名称}</span>` : ""}<time>${时段.时间范围}</time></div>
            <div class="hour-meta"><strong>${时段.时柱}时</strong><span>${时段.值神}</span><em class="is-${时段.吉凶}">${时段.吉凶}</em></div>
          </button>`).join("")}
      </div>
    </article>`;
}

function 时辰详情标签(标题: string, 内容: string[], 类型 = "normal"): string {
  const 空提示 = 标题 === "日时关系" ? "无特殊关系" : "无";
  return `
    <div class="hour-detail-group is-${类型}">
      <dt>${标题}</dt>
      <dd>${内容.length > 0 ? 内容.map((条目) => `<span>${转义HTML(条目)}</span>`).join("") : `<em>${空提示}</em>`}</dd>
    </div>`;
}

function 生成八字结果区(): string {
  const 经度数值 = 八字经度文本.trim() === "" ? null : Number(八字经度文本);
  const 有效经度 = 经度数值 !== null && Number.isFinite(经度数值) && 经度数值 >= -180 && 经度数值 <= 180
    ? 经度数值
    : null;
  const 查询结果 = 查询生辰八字(八字日期, 八字时间, 八字时间依据, 有效经度);
  return 查询结果.成功
    ? `<div class="bazi-result" aria-live="polite">
        <p class="bazi-pillars">${查询结果.结果.四柱}</p>
        <p class="bazi-line"><span>八字</span><strong>${查询结果.结果.八字}</strong></p>
        <ul>${生辰八字时间说明(查询结果.结果).map((说明) => `<li>${转义HTML(说明)}</li>`).join("")}</ul>
      </div>`
    : `<p class="bazi-message" aria-live="polite">${转义HTML(查询结果.提示)}</p>`;
}

function 更新八字结果区(): void {
  const 结果容器 = 根节点.querySelector<HTMLElement>("[data-bazi-output]");
  if (结果容器) 结果容器.innerHTML = 生成八字结果区();
}

function 八字查询卡片(): string {
  return `
    <section class="bazi-card" aria-label="生辰八字查询">
      <header><h2>生辰八字查询</h2><p>只查询年月日时四柱</p></header>
      <div class="bazi-form">
        <label>日期<input type="date" data-bazi-date min="${八字支持范围.最小日期}" max="${八字支持范围.最大日期}" value="${八字日期}"></label>
        <label>时间<input type="time" data-bazi-time value="${八字时间}"></label>
        <label>计算依据<select data-bazi-basis>
          <option value="北京时间"${八字时间依据 === "北京时间" ? " selected" : ""}>北京时间</option>
          <option value="真太阳时"${八字时间依据 === "真太阳时" ? " selected" : ""}>真太阳时</option>
        </select></label>
        ${八字时间依据 === "真太阳时" ? `
          <label>出生地经度<input type="number" data-bazi-longitude min="-180" max="180" step="0.01" inputmode="decimal" placeholder="例如 116.40" value="${转义HTML(八字经度文本)}"></label>
          <button type="button" class="bazi-locate" data-action="bazi-locate" ${八字定位中 ? "disabled" : ""}>${八字定位中 ? "定位中…" : "使用当前定位"}</button>
        ` : ""}
      </div>
      ${八字定位说明 ? `<p class="bazi-location-note">${转义HTML(八字定位说明)}</p>` : ""}
      <div class="bazi-output" data-bazi-output>${生成八字结果区()}</div>
    </section>`;
}

function 时辰展开详情(时段: 时辰概览段 | undefined): string {
  if (!时段) return "";
  return `
    <section class="hour-detail" aria-label="${时段.名称}详细时辰信息">
      <header>
        <div><strong>${时段.名称}</strong><span>${时段.时柱}时 · ${时段.时间范围}</span></div>
        <p>${时段.值神} · <em class="is-${时段.吉凶}">${时段.吉凶}</em></p>
      </header>
      <dl>
        ${时辰详情标签("日时关系", 时段.详情.日时关系)}
        ${时辰详情标签("吉神", 时段.详情.吉神, "good")}
        ${时辰详情标签("凶煞", 时段.详情.凶煞, "bad")}
        ${时辰详情标签("时宜", 时段.详情.时宜, "good")}
        ${时辰详情标签("时忌", 时段.详情.时忌, "bad")}
      </dl>
      <section class="hour-rule-results" aria-label="风水禁忌速查">
        <h4>风水禁忌速查</h4>
        <div class="rule-results-grid">${时段.风水禁忌.map(规则标记).join("")}</div>
      </section>
      <small>依据：${时段.详情.依据}</small>
    </section>`;
}

async function 请求八字定位(): Promise<void> {
  if (八字定位中) return;
  if (当前经度 !== null) {
    八字经度文本 = 当前经度.toFixed(2);
    八字定位说明 = "已使用当前设备经度";
    渲染();
    return;
  }
  八字定位中 = true;
  八字定位说明 = "正在获取当前位置…";
  渲染();
  const 结果 = await 获取浏览器定位();
  八字定位中 = false;
  if (结果.成功) {
    八字经度文本 = 结果.经度.toFixed(2);
    八字定位说明 = "定位成功，已填入当前设备经度";
  } else {
    八字定位说明 = "未取得定位，请手工输入出生地经度";
  }
  渲染();
}

function 渲染(): void {
  const 月历格 = 创建月历格(状态.年, 状态.月);
  const 月历信息 = 创建月历日期信息(状态.年, 状态.月, 神圣纪念配置);
  const 所选 = 状态.所选日期;
  const [时文本, 分文本] = 时间查询.时间.split(":");
  const 北京时间 = 创建北京时间(
    所选.getFullYear(),
    所选.getMonth() + 1,
    所选.getDate(),
    Number(时文本),
    Number(分文本),
    0,
  );
  const 当前历时 = 计算当前历时(北京时间, 当前时间依据, 当前经度, 配置结果, 已解析时辰配置);
  const { 最终, 历法结果, 四柱, 真太阳时结果, 十二时辰, 时辰配置错误 } = 当前历时;
  const 错误总数 = 基础配置错误总数 + 时辰配置错误.length;
  当前时间依据 = 当前历时.时间依据;
  const 传统节日 = 获取传统节日(最终.最终时间);
  const 神圣纪念 = 获取神圣纪念日(神圣纪念配置, 历法结果.农历);
  const 日期事件栏 = 创建日期事件分栏(神圣纪念, 传统节日);
  const 节气显示 = 历法结果.节气
    ? `${历法结果.节气.名称} · ${格式化时分(历法结果.节气)}`
    : "当日无节气";
  const 核心节气显示 = 历法结果.节气?.名称 ?? "无";
  const 真太阳时显示 = 真太阳时结果
    ? `${格式化日期时间(真太阳时结果.真太阳时, true)}（修正 ${格式化修正(真太阳时结果.总修正分钟)}）`
    : "未取得定位，暂不计算";
  const 最终日期提示 = `${最终.日柱计算时间.年}年${最终.日柱计算时间.月}月${最终.日柱计算时间.日}日`;
  const 时间模式说明 = 时间查询.模式 === "实时" ? "实时更新" : "手动查询";
  const 切换目标 = 当前时间依据 === "北京时间" ? "真太阳时" : "北京时间";
  const 全部时段 = 十二时辰.项目.flatMap((项目) => 项目.时段);
  const 查看时辰 = 选出查看时辰(全部时段, 手动查看时辰键);
  if (手动查看时辰键 && 查看时辰?.键 !== 手动查看时辰键) 手动查看时辰键 = null;

  根节点.innerHTML = `
    <main class="page-shell">
      <section class="calendar-layout" aria-label="日期核心详情与公历月历">
        <aside class="detail-card" aria-label="所选日期核心详情" aria-live="polite">
          <div class="detail-accent" aria-hidden="true"></div>
          <p class="detail-kicker">农历</p>
          <div class="lunar-title-row">
            <h2 class="lunar-title">${历法结果.农历.显示}</h2>
            <button
              class="time-basis-button"
              type="button"
              data-action="time-basis"
              aria-label="当前使用${当前时间依据}，点击切换为${切换目标}"
              ${当前定位状态 === "定位中" ? "disabled" : ""}
            >${当前定位状态 === "定位中" ? "定位中…" : 当前时间依据}</button>
          </div>
          <p class="solar-date">${格式化公历日期(所选)} · ${星期名称[所选.getDay()]}</p>

          <section class="core-fact pillar-core" aria-label="四柱">
            <span>四柱</span>
            <strong>${四柱}</strong>
          </section>

          <div class="calendar-meta-row">
            <section class="core-fact value-star-core" aria-label="值星">
              <span>值星</span>
              <strong>${历法结果.值星}日</strong>
            </section>

            <section class="core-fact solar-term-core" aria-label="节气">
              <span>节气</span>
              <strong${历法结果.节气 ? "" : ' class="is-empty"'}>${核心节气显示}</strong>
            </section>
          </div>

          ${日期事件栏.length > 0
            ? `<section class="date-events" aria-label="当日神圣纪念与传统节日">
                ${日期事件栏.map((栏) => 事件列表(栏.标题, 栏.事件)).join("")}
              </section>`
            : ""}

          <section class="hour-overview" aria-label="十二时辰">
            <h3>十二时辰</h3>
            ${时辰展开详情(查看时辰)}
            <div class="hour-grid">${十二时辰.项目.map(时辰概览卡片).join("")}</div>
          </section>
        </aside>

        <div class="calendar-right">
          <article class="calendar-card">
          <div class="calendar-toolbar">
            <div class="period-navigation">
              <div class="period-control" aria-label="年份切换">
                <button type="button" class="icon-button" data-action="previous-year" aria-label="上一年">‹</button>
                <strong>${状态.年}</strong>
                <button type="button" class="icon-button" data-action="next-year" aria-label="下一年">›</button>
              </div>
              <div class="period-control" aria-label="月份切换">
                <button type="button" class="icon-button" data-action="previous-month" aria-label="上个月">‹</button>
                <strong>${String(状态.月 + 1).padStart(2, "0")}</strong>
                <button type="button" class="icon-button" data-action="next-month" aria-label="下个月">›</button>
              </div>
            </div>
            <div class="date-navigation" aria-label="日期切换">
              <button type="button" class="icon-button" data-action="previous-day" aria-label="上一日">‹</button>
              <button class="icon-button today-button" type="button" data-action="today">今天</button>
              <button type="button" class="icon-button" data-action="next-day" aria-label="下一日">›</button>
            </div>
          </div>

          <div class="week-row" role="row">
            ${星期短名.map((星期, 索引) => `<span role="columnheader" title="${星期名称[索引]}">${星期}</span>`).join("")}
          </div>

          <div class="days-grid" role="grid" aria-label="${状态.年}年${状态.月 + 1}月">
            ${月历格
              .map((日期) => {
                if (日期 === null) return '<span class="empty-day" aria-hidden="true"></span>';
                const 当前日期 = new Date(状态.年, 状态.月, 日期);
                const 日期信息 = 月历信息[日期 - 1];
                const 是今天 = 是同一天(当前日期, 今天);
                const 已选择 = 是同一天(当前日期, 所选);
                const 全部事件 = [...日期信息.传统节日, ...日期信息.神圣纪念];
                const 事件提示 = 全部事件.length > 0 ? `，${全部事件.join("、")}` : "";
                const 无障碍说明 = 转义HTML(
                  `${格式化公历日期(当前日期)}，${星期名称[当前日期.getDay()]}，农历${日期信息.农历.显示}${事件提示}${是今天 ? "，今天" : ""}`,
                );
                return `
                  <button
                    type="button"
                    class="day-button${是今天 ? " is-today" : ""}${已选择 ? " is-selected" : ""}"
                    data-day="${日期}"
                    role="gridcell"
                    aria-label="${无障碍说明}"
                    ${是今天 ? 'aria-current="date"' : ""}
                    ${已选择 ? 'aria-selected="true"' : 'aria-selected="false"'}
                  >
                    <span class="solar-day">${日期}</span>
                    <span class="lunar-day">${日期信息.农历摘要}</span>
                    <span class="day-events" title="${转义HTML(全部事件.join("、"))}">
                      ${日期信息.显示事件.map((名称) => `<span class="day-event">${转义HTML(名称)}</span>`).join("")}
                      ${日期信息.其余事件数 > 0 ? `<span class="day-event day-event-more">另${日期信息.其余事件数}项</span>` : ""}
                    </span>
                    ${是今天 ? '<small class="today-mark">今</small>' : ""}
                  </button>`;
              })
              .join("")}
          </div>
          </article>
          ${八字查询卡片()}
        </div>

        <section class="calculation-card" aria-label="时间与计算依据">
          <div class="time-controls">
            <label>查询时间 · ${时间模式说明}<input type="time" data-time-input value="${时间查询.时间}" aria-label="查询时间"></label>
            <button type="button" data-action="locate" ${当前定位状态 === "定位中" ? "disabled" : ""}>
              ${当前定位状态 === "定位中" ? "正在定位…" : 当前定位状态 === "成功" ? "重新定位" : "获取定位"}
            </button>
            <p class="location-status is-${当前定位状态}">${定位说明}</p>
          </div>

          <details class="calculation-details">
            <summary>计算详情</summary>
            <dl class="calculation-list">
              <div><dt>北京时间</dt><dd>${格式化日期时间(最终.北京时间)}</dd></div>
              <div><dt>真太阳时</dt><dd>${真太阳时显示}</dd></div>
              <div><dt>计算依据</dt><dd>${当前时间依据}（${时间模式说明}）</dd></div>
              <div><dt>历法日</dt><dd>${最终日期提示}</dd></div>
              <div><dt>节气</dt><dd>${节气显示}</dd></div>
            </dl>
            <p class="calculation-note">当前统一按${当前时间依据}计算；23:00进入子时，日柱仍在00:00换日</p>
          </details>

          <p class="config-status${错误总数 > 0 ? " has-error" : ""}">
            规则配置：已读取 ${配置结果.length} 个文件 · ${规则总数} 条规则${错误总数 > 0 ? ` · ${错误总数} 条待修正` : ""}
          </p>
        </section>
      </section>

    </main>
  `;
}

function 更新显示年月(年: number, 月: number): void {
  const 当月日期 = Math.min(状态.所选日期.getDate(), new Date(年, 月 + 1, 0).getDate());
  设置日期(new Date(年, 月, 当月日期));
}

根节点.addEventListener("input", (事件) => {
  const 输入框 = (事件.target as HTMLElement).closest<HTMLInputElement>("[data-time-input]");
  if (!输入框?.value) return;
  时间查询 = 创建手动查询时间(输入框.value);
  手动查看时辰键 = null;
  渲染();
});

根节点.addEventListener("change", (事件) => {
  const 目标 = 事件.target as HTMLInputElement | HTMLSelectElement;
  if (目标.matches("[data-bazi-date]")) {
    八字日期 = 目标.value;
    更新八字结果区();
  } else if (目标.matches("[data-bazi-time]")) {
    八字时间 = 目标.value;
    更新八字结果区();
  } else if (目标.matches("[data-bazi-basis]")) {
    八字时间依据 = 目标.value === "真太阳时" ? "真太阳时" : "北京时间";
    八字定位说明 = "";
    渲染();
  } else if (目标.matches("[data-bazi-longitude]")) {
    八字经度文本 = 目标.value;
    八字定位说明 = "";
    更新八字结果区();
  } else return;
});

根节点.addEventListener("input", (事件) => {
  const 目标 = 事件.target as HTMLInputElement;
  if (目标.matches("[data-bazi-date]")) 八字日期 = 目标.value;
  else if (目标.matches("[data-bazi-time]")) 八字时间 = 目标.value;
  else if (目标.matches("[data-bazi-longitude]")) 八字经度文本 = 目标.value;
  else return;
  更新八字结果区();
});

根节点.addEventListener("focusout", (事件) => {
  const 目标 = 事件.target as HTMLInputElement;
  if (目标.matches("[data-bazi-longitude]")) 更新八字结果区();
});

根节点.addEventListener("click", async (事件) => {
  const 目标 = (事件.target as HTMLElement).closest<HTMLButtonElement>("button");
  if (!目标) return;

  if (目标.dataset.action === "bazi-locate") {
    await 请求八字定位();
    return;
  }

  const 时辰键 = 目标.dataset.hourKey;
  if (时辰键) {
    手动查看时辰键 = 更新手动查看键(时辰键, 目标.classList.contains("is-current"));
    渲染();
    return;
  }

  const 日期 = 目标.dataset.day;
  if (日期) {
    设置日期(new Date(状态.年, 状态.月, Number(日期)));
    return;
  }

  switch (目标.dataset.action) {
    case "today": {
      const 当前北京时间 = 从时间戳读取北京时间();
      今天 = 北京日期(当前北京时间);
      状态 = 选择日期(状态, 今天);
      时间查询 = 创建实时查询时间(当前北京时间);
      手动查看时辰键 = null;
      渲染();
      break;
    }
    case "time-basis": {
      if (当前时间依据 === "真太阳时") {
        当前时间依据 = "北京时间";
        用户已选择时间依据 = true;
        定位说明 = 当前经度 === null ? "当前使用北京时间" : "定位成功，当前使用北京时间";
        渲染();
      } else if (当前经度 !== null) {
        当前时间依据 = "真太阳时";
        用户已选择时间依据 = true;
        当前定位状态 = "成功";
        定位说明 = "定位成功，当前使用真太阳时";
        渲染();
      } else {
        await 请求定位(true, true);
      }
      break;
    }
    case "locate":
      await 请求定位(当前时间依据 === "真太阳时" || !用户已选择时间依据);
      break;
    case "previous-month": {
      const 目标年月 = 移动月份(状态.年, 状态.月, -1);
      更新显示年月(目标年月.年, 目标年月.月);
      break;
    }
    case "next-month": {
      const 目标年月 = 移动月份(状态.年, 状态.月, 1);
      更新显示年月(目标年月.年, 目标年月.月);
      break;
    }
    case "previous-day":
      设置日期(移动日期(状态.所选日期, -1));
      break;
    case "next-day":
      设置日期(移动日期(状态.所选日期, 1));
      break;
    case "previous-year":
      更新显示年月(状态.年 - 1, 状态.月);
      break;
    case "next-year":
      更新显示年月(状态.年 + 1, 状态.月);
      break;
  }
});

渲染();

const 分钟实时更新器 = 创建分钟实时更新器((当前毫秒) => {
  const 原今天 = 今天;
  const 所选原为今天 = 是同一天(状态.所选日期, 原今天);
  const 当前北京时间 = 从时间戳读取北京时间(new Date(当前毫秒));
  const 新今天 = 北京日期(当前北京时间);
  const 日期已经变化 = !是同一天(原今天, 新今天);
  今天 = 新今天;

  if (时间查询.模式 === "实时" && 所选原为今天) {
    状态 = 选择日期(状态, 新今天);
    时间查询 = 刷新实时查询时间(时间查询, 当前北京时间);
    渲染();
  } else if (日期已经变化) {
    渲染();
  }
});

分钟实时更新器.启动();
window.addEventListener("pagehide", () => 分钟实时更新器.停止());
window.addEventListener("pageshow", () => 分钟实时更新器.启动());
