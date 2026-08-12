import "./style.css";
import {
  创建月历格,
  格式化公历日期,
  是同一天,
  星期名称,
  星期短名,
  选择日期,
  type 日历状态,
} from "./日历/公历";
import { 创建月历日期信息 } from "./日历/月历信息";
import {
  读取定位环境,
  获取浏览器定位,
  定位失败提示,
  type 定位失败原因,
  type 定位环境诊断,
  type 定位结果,
  type 定位错误码,
} from "./定位";
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
  type 查询时间状态,
} from "./实时历时";
import { 格式化时分 } from "./历法/时间";
import { 八字支持范围, 查询生辰八字, 生辰八字时间说明 } from "./生辰八字";
import { 创建日期事件分栏 } from "./界面/详情布局";
import { 创建每日宜忌展示 } from "./界面/每日宜忌展示";
import { 更新手动查看键, 清除手动查看时辰, 选出查看时辰 } from "./界面/时辰查看";
import { 刷新主日期实时时钟 } from "./界面/主日期实时时钟";
import { 格式化主日期值, 解析主日期值, 移动主日期 } from "./界面/主日期输入";
import { 解析北斗配置 } from "./规则/北斗";
import { 创建浏览器主题控制器, 是主题偏好, type 主题偏好 } from "./界面/主题";
import type { 日级风水禁忌结果 } from "./规则/日级风水禁忌";

declare const __APP_VERSION__: string;

const 应用容器 = document.querySelector<HTMLDivElement>("#app");
if (!应用容器) throw new Error("页面初始化失败：找不到应用容器");
const 根节点: HTMLDivElement = 应用容器;
const 主题控制器 = 创建浏览器主题控制器();

type 定位状态 = "未定位" | "定位中" | "成功" | "失败";
type 定位诊断请求状态 = "未请求" | "请求中" | "成功" | "失败";

interface 定位诊断状态 {
  环境: 定位环境诊断;
  状态: 定位诊断请求状态;
  错误类型: 定位失败原因 | null;
  错误码: 定位错误码;
  纬度: number | null;
  经度: number | null;
  精度米: number | null;
  尝试次数: number;
}

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
let 当前经度: number | null = null;
let 当前定位状态: 定位状态 = "未定位";
let 定位说明 = "尚未定位，当前使用北京时间";
let 定位诊断: 定位诊断状态 = {
  环境: 读取定位环境(),
  状态: "未请求",
  错误类型: null,
  错误码: null,
  纬度: null,
  经度: null,
  精度米: null,
  尝试次数: 0,
};
let 手动查看时辰键: string | null = null;
let 八字日期 = `${初始北京时间.年}-${String(初始北京时间.月).padStart(2, "0")}-${String(初始北京时间.日).padStart(2, "0")}`;
let 八字时间 = 格式化时分(初始北京时间);
let 八字时间依据: 时间依据 = "北京时间";
let 八字经度文本 = "";
let 八字定位中 = false;
let 八字定位说明 = "";
let 主日期草稿: string | null = null;
let 主日期正在编辑 = false;
let 主日期键盘编辑 = false;

const 配置结果 = 读取全部配置();
const 已解析时辰配置 = 初始化时辰配置(配置结果);
const 北斗配置结果 = 解析北斗配置(配置结果);
const 神圣纪念配置 = 配置结果.find((配置) => 配置.文件名 === "神圣纪念日.txt");
const 规则总数 = 配置结果.reduce((总数, 文件) => 总数 + 文件.规则.length, 0);
const 基础配置错误总数 = 配置结果.reduce((总数, 文件) => 总数 + 文件.错误.length, 0);

function 开始定位任务(): Promise<定位结果> {
  定位诊断 = {
    环境: 读取定位环境(),
    状态: "请求中",
    错误类型: null,
    错误码: null,
    纬度: null,
    经度: null,
    精度米: null,
    尝试次数: 0,
  };
  return 获取浏览器定位();
}

function 记录定位结果(结果: 定位结果): void {
  if (结果.成功) {
    定位诊断 = {
      ...定位诊断,
      状态: "成功",
      错误类型: null,
      错误码: null,
      纬度: 结果.纬度,
      经度: 结果.经度,
      精度米: 结果.精度米,
      尝试次数: 结果.尝试次数,
    };
    return;
  }
  定位诊断 = {
    ...定位诊断,
    状态: "失败",
    错误类型: 结果.原因,
    错误码: 结果.错误码,
    纬度: null,
    经度: null,
    精度米: null,
    尝试次数: 结果.尝试次数,
  };
}

function 结束主日期编辑(): void {
  主日期草稿 = null;
  主日期正在编辑 = false;
  主日期键盘编辑 = false;
}

function 设置日期(日期: Date): void {
  const 当前北京时间 = 从时间戳读取北京时间();
  今天 = 北京日期(当前北京时间);
  状态 = 选择日期(状态, 日期);
  时间查询 = 创建实时查询时间(当前北京时间);
  手动查看时辰键 = null;
  结束主日期编辑();
  渲染();
}

function 切换相邻主日期(偏移天数: -1 | 1): void {
  const 日期 = 移动主日期(状态.所选日期, 偏移天数, 八字支持范围.最小日期, 八字支持范围.最大日期);
  if (日期) 设置日期(日期);
}

function 回到今天实时模式(): void {
  const 当前北京时间 = 从时间戳读取北京时间();
  今天 = 北京日期(当前北京时间);
  状态 = 选择日期(状态, 今天);
  时间查询 = 创建实时查询时间(当前北京时间);
  手动查看时辰键 = null;
  结束主日期编辑();
  渲染();
}

function 提交主日期(值: string, 来源: "键盘" | "原生选择"): void {
  if (!值) {
    if (来源 === "原生选择") 回到今天实时模式();
    else {
      结束主日期编辑();
      渲染();
    }
    return;
  }

  const 日期 = 解析主日期值(值, 八字支持范围.最小日期, 八字支持范围.最大日期);
  if (!日期) {
    结束主日期编辑();
    渲染();
    return;
  }
  if (是同一天(日期, 北京日期())) 回到今天实时模式();
  else 设置日期(日期);
}

async function 请求定位(成功后使用真太阳时: boolean): Promise<boolean> {
  if (当前定位状态 === "定位中") return false;
  // 在点击事件仍处于同步执行阶段直接触发原生定位，兼容 Safari 的用户手势限制。
  const 定位任务 = 开始定位任务();
  当前定位状态 = "定位中";
  定位说明 = "正在获取本机位置…";
  渲染();

  const 结果 = await 定位任务;
  记录定位结果(结果);
  if (结果.成功) {
    当前经度 = 结果.经度;
    当前定位状态 = "成功";
    if (成功后使用真太阳时) {
      当前时间依据 = "真太阳时";
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
  定位说明 = 定位失败提示(结果.原因);
  渲染();
  return false;
}

function 格式化修正(分钟: number): string {
  const 总秒数 = Math.round(分钟 * 60);
  const 符号 = 总秒数 >= 0 ? "+" : "−";
  const 绝对秒数 = Math.abs(总秒数);
  return `${符号}${Math.floor(绝对秒数 / 60)}分${String(绝对秒数 % 60).padStart(2, "0")}秒`;
}

function 定位错误类型显示(原因: 定位失败原因 | null): string {
  switch (原因) {
    case "已拒绝": return "权限拒绝";
    case "不可用": return "位置不可用";
    case "超时": return "超时";
    case "不支持": return "浏览器不支持";
    case "非安全连接": return "非安全连接";
    case "坐标无效": return "坐标无效";
    case "未知错误": return "未知错误";
    default: return "无";
  }
}

function 定位诊断详情(): string {
  const 环境 = 定位诊断.环境;
  const 坐标详情 = 定位诊断.状态 === "成功"
    ? `
      <span>纬度：${定位诊断.纬度?.toFixed(6)}</span>
      <span>经度：${定位诊断.经度?.toFixed(6)}</span>
      <span>定位精度：${定位诊断.精度米?.toFixed(0)} 米</span>`
    : "";
  return `
    <div class="location-diagnostics" data-location-diagnostics>
      <span>HTTPS：${环境.HTTPS ? "是" : "否"}</span>
      <span>Geolocation：${环境.支持定位 ? "支持" : "不支持"}</span>
      <span>页面可见：${环境.页面可见 ? "是" : "否"}</span>
      <span data-location-diagnostic-status>定位状态：${定位诊断.状态}</span>
      <span data-location-diagnostic-error>错误类型：${定位错误类型显示(定位诊断.错误类型)}</span>
      <span data-location-diagnostic-code>错误码：${定位诊断.错误码 ?? "无"}</span>
      <span>请求次数：${定位诊断.尝试次数}</span>
      ${坐标详情}
    </div>`;
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

function 日期信息项目(标题: string, 内容: string[]): string {
  return `
    <div class="calendar-info-item">
      <h3>${标题}</h3>
      <div class="calendar-info-values">${(内容.length > 0 ? 内容 : ["无"])
        .map((名称) => `<span${名称 === "无" ? ' class="is-empty"' : ""}>${转义HTML(名称)}</span>`)
        .join("")}</div>
    </div>`;
}

function 每日宜忌栏(标题: "日宜" | "日忌", 内容: string[], 类型: "good" | "bad"): string {
  const 显示内容 = 内容.length > 0 ? 内容 : ["无"];
  return `
    <div class="day-action-group is-${类型}">
      <h3>${标题}</h3>
      <div class="day-action-tags">${显示内容.map((条目) => `<span>${转义HTML(条目)}</span>`).join("")}</div>
    </div>`;
}

function 核心黄历项目(标题: "日吉凶" | "值日" | "风水禁忌", 内容: string | string[], 类型 = "normal"): string {
  const 内容行 = Array.isArray(内容) ? 内容 : [内容];
  return `
    <div class="almanac-core-item is-${类型}">
      <h3>${标题}</h3>
      <strong>${内容行.map((行) => `<span>${转义HTML(行)}</span>`).join("")}</strong>
    </div>`;
}

function 主日期控件(值: string, 星期: string): string {
  const 快捷按钮 = [
    { action: "previous-day", label: "上一天", text: "‹" },
    { action: "today", label: "返回今天", text: "今" },
    { action: "next-day", label: "下一天", text: "›" },
  ];
  return `
    <div class="main-date-navigation">
      <input
        class="calendar-date-control"
        type="date"
        data-calendar-date
        aria-label="选择主日历日期"
        lang="zh-CN"
        min="${八字支持范围.最小日期}"
        max="${八字支持范围.最大日期}"
        value="${值}"
      >
      <span class="date-weekday">${星期}</span>
      <div class="date-shortcuts" role="group" aria-label="日期快捷操作">
        ${快捷按钮.map((按钮) => `<button type="button" class="date-shortcut-button" data-action="${按钮.action}" aria-label="${按钮.label}" title="${按钮.label}">${按钮.text}</button>`).join("")}
      </div>
    </div>`;
}

function 日级风水展示行(结果: 日级风水禁忌结果, 无命中文案: "无" | "当日宜"): string[] {
  if (结果.当日状态 === "规则配置异常") return [结果.当日状态];
  if (结果.命中.length > 0) return 结果.命中.map((规则) => 规则.展示文本);
  return [无命中文案];
}

function 时辰详情依据(依据: string): string {
  const 古籍依据 = 依据.replace(/；项目中文配置保守用时结论$/u, "");
  return `
    <footer class="hour-detail-source" aria-label="时辰详情依据">
      <strong>时辰详情依据：</strong>
      <span>${转义HTML(古籍依据)}；风水禁忌另据项目中文风水规则配置。</span>
    </footer>`;
}

const 主题选项: ReadonlyArray<{ 值: 主题偏好; 标签: string }> = [
  { 值: "light", 标签: "浅色" },
  { 值: "system", 标签: "自动" },
  { 值: "dark", 标签: "深色" },
];

function 主题切换控件(): string {
  return `
    <div class="theme-switch" role="group" aria-label="页面主题">
      ${主题选项.map((选项) => `<button type="button" data-theme-preference="${选项.值}" aria-pressed="${主题控制器.偏好 === 选项.值}"${主题控制器.偏好 === 选项.值 ? ' class="is-active"' : ""}>${选项.标签}</button>`).join("")}
    </div>`;
}

function 更新主题控件状态(): void {
  根节点.querySelectorAll<HTMLButtonElement>("[data-theme-preference]").forEach((按钮) => {
    const 已选中 = 按钮.dataset.themePreference === 主题控制器.偏好;
    按钮.classList.toggle("is-active", 已选中);
    按钮.setAttribute("aria-pressed", String(已选中));
  });
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

function 古籍用事结论(时段: 时辰概览段): string {
  const 结论 = [
    ...时段.详情.时宜.map((事项) => `宜${事项}`),
    ...时段.详情.时忌.map((事项) => `忌${事项}`),
  ];
  return 时辰详情标签("古籍用事", 结论, 时段.详情.时忌.length > 0 ? "bad" : "normal");
}

function 现代时辰宜忌(时段: 时辰概览段): string {
  return `
    <section class="modern-hour-actions" aria-label="现代时辰宜忌">
      <div class="modern-hour-actions-grid">
        ${时辰详情标签("时宜", 时段.详情.现代时宜, "good")}
        ${时辰详情标签("时忌", 时段.详情.现代时忌, "bad")}
      </div>
      <small>${时段.详情.现代来源}</small>
    </section>`;
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
  const 当日风水展示 = 日级风水展示行(时段.当日风水禁忌, "当日宜");
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
        ${古籍用事结论(时段)}
      </dl>
      ${现代时辰宜忌(时段)}
      <section class="hour-rule-results" aria-label="风水禁忌速查">
        <div class="hour-rule-heading">
          <h4>风水禁忌速查</h4>
          <p class="${时段.当日风水禁忌.当日状态 === "当日宜" ? "is-safe" : "is-warning"}">${当日风水展示.map((行) => `<span>${转义HTML(行)}</span>`).join("")}</p>
        </div>
        <div class="rule-results-grid">${时段.风水禁忌.map(规则标记).join("")}</div>
      </section>
      ${时辰详情依据(时段.详情.依据)}
    </section>`;
}

async function 请求八字定位(): Promise<void> {
  if (八字定位中) return;
  const 定位任务 = 开始定位任务();
  八字定位中 = true;
  八字定位说明 = "正在获取当前位置…";
  渲染();
  const 结果 = await 定位任务;
  记录定位结果(结果);
  八字定位中 = false;
  if (结果.成功) {
    八字经度文本 = 结果.经度.toFixed(2);
    八字定位说明 = "定位成功，已填入当前设备经度";
  } else {
    八字定位说明 = 定位失败提示(结果.原因);
  }
  渲染();
}

function 渲染(): void {
  const 月历格 = 创建月历格(状态.年, 状态.月);
  const 月历信息 = 创建月历日期信息(状态.年, 状态.月, 神圣纪念配置, 北斗配置结果.配置);
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
  const 当前历时 = 计算当前历时(
    北京时间,
    当前时间依据,
    当前经度,
    配置结果,
    已解析时辰配置,
    北斗配置结果.配置,
  );
  const { 最终, 历法结果, 四柱, 北斗, 日级风水禁忌, 真太阳时结果, 十二时辰, 时辰配置错误 } = 当前历时;
  const 错误总数 = 基础配置错误总数 + 时辰配置错误.length + 北斗配置结果.错误.length;
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
  const 主日期值 = 格式化主日期值(所选);
  const 每日宜忌显示 = 创建每日宜忌展示(历法结果.每日宜忌);
  if (手动查看时辰键 && 查看时辰?.键 !== 手动查看时辰键) 手动查看时辰键 = null;

  根节点.innerHTML = `
    <main class="page-shell">
      <section class="calendar-layout" aria-label="日期核心详情与公历月历">
        <aside class="detail-card" aria-label="所选日期核心详情" aria-live="polite">
          <div class="detail-accent" aria-hidden="true"></div>
          <div class="detail-topbar">
            <p class="detail-kicker">农历</p>
            ${主题切换控件()}
          </div>
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
          ${主日期控件(主日期值, 星期名称[所选.getDay()])}

          <section class="core-fact pillar-core" aria-label="四柱">
            <span>四柱</span>
            <strong>${四柱}</strong>
          </section>

          <section class="almanac-core-row" aria-label="日吉凶值日与风水禁忌">
            ${核心黄历项目("日吉凶", `${历法结果.日吉凶.天神} · ${历法结果.日吉凶.类型} · ${历法结果.日吉凶.吉凶}`, 历法结果.日吉凶.吉凶)}
            ${核心黄历项目("值日", `${历法结果.值星}日`)}
            ${核心黄历项目("风水禁忌", 日级风水展示行(日级风水禁忌, "无"), 日级风水禁忌.命中.length > 0 ? "凶" : "normal")}
          </section>

          <section class="day-actions" aria-label="日宜与日忌">
            ${每日宜忌栏("日宜", 每日宜忌显示.日宜, "good")}
            ${每日宜忌栏("日忌", 每日宜忌显示.日忌, "bad")}
          </section>

          <section class="calendar-info-grid" aria-label="节气神圣纪念与传统节日">
            ${日期信息项目("节气", [核心节气显示])}
            ${日期事件栏.map((栏) => 日期信息项目(栏.标题, 栏.事件)).join("")}
          </section>

          <section class="beidou-panel" aria-label="北斗">
            <h3>北斗</h3>
            <div class="beidou-grid">
              <div class="beidou-item${北斗.斗降日.命中 ? " is-hit" : ""}">
                <span>斗降日</span>
                <strong>${北斗.斗降日.名称}</strong>
              </div>
              <div class="beidou-item"><span>本命下日</span><strong>${北斗.本命下日}</strong></div>
              <div class="beidou-item"><span>本命星官</span><strong>${转义HTML(北斗.本命星官)}</strong></div>
            </div>
            ${北斗.斗降日.命中 ? `<p class="beidou-source">来源：${转义HTML(北斗.斗降日.来源显示)}</p>` : ""}
          </section>

          <section class="hour-overview" aria-label="十二时辰">
            <div class="hour-overview-heading">
              <h3>十二时辰</h3>
              <button type="button" class="current-hour-button" data-action="current-hour">当前时辰</button>
            </div>
            ${时辰展开详情(查看时辰)}
            <div class="hour-grid">${十二时辰.项目.map(时辰概览卡片).join("")}</div>
          </section>
        </aside>

        <div class="calendar-right">
          <article class="calendar-card">
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
                const 全部事件 = [...日期信息.传统节日, ...日期信息.神圣纪念, ...日期信息.斗降];
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
            <p class="location-status is-${当前定位状态}" aria-live="polite">${定位说明}</p>
          </div>

          <details class="calculation-details">
            <summary>计算详情</summary>
            <dl class="calculation-list">
              <div><dt>北京时间</dt><dd>${格式化日期时间(最终.北京时间)}</dd></div>
              <div><dt>真太阳时</dt><dd>${真太阳时显示}</dd></div>
              <div><dt>计算依据</dt><dd>${当前时间依据}（${时间模式说明}）</dd></div>
              <div><dt>历法日</dt><dd>${最终日期提示}</dd></div>
              <div><dt>节气</dt><dd>${节气显示}</dd></div>
              <div><dt>定位环境</dt><dd>${定位诊断详情()}</dd></div>
              <div><dt>版本</dt><dd data-app-version>${__APP_VERSION__}</dd></div>
            </dl>
            <p class="calculation-note">当前统一按${当前时间依据}计算；23:00进入子时，日柱仍在00:00换日</p>
          </details>

          <p class="config-status${错误总数 > 0 ? " has-error" : ""}">
            规则配置：已读取 ${配置结果.length} 个文件 · ${规则总数} 条规则${错误总数 > 0 ? ` · ${错误总数} 条待修正` : ""}
          </p>
        </section>
      </section>

    </main>
    <button type="button" class="back-to-top" data-action="back-to-top" aria-label="返回顶部" title="返回顶部">↑</button>
  `;
}

根节点.addEventListener("input", (事件) => {
  const 主日期输入 = (事件.target as HTMLElement).closest<HTMLInputElement>("[data-calendar-date]");
  if (主日期输入) {
    主日期草稿 = 主日期输入.value;
    主日期正在编辑 = true;
    return;
  }
  const 输入框 = (事件.target as HTMLElement).closest<HTMLInputElement>("[data-time-input]");
  if (!输入框?.value) return;
  时间查询 = 创建手动查询时间(输入框.value);
  手动查看时辰键 = null;
  渲染();
});

根节点.addEventListener("change", (事件) => {
  const 目标 = 事件.target as HTMLInputElement | HTMLSelectElement;
  if (目标.matches("[data-calendar-date]")) {
    主日期草稿 = 目标.value;
    if (!主日期键盘编辑) 提交主日期(目标.value, "原生选择");
  } else if (目标.matches("[data-bazi-date]")) {
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
  if (目标.matches("[data-calendar-date]")) {
    const 需要提交键盘草稿 = 主日期键盘编辑;
    主日期正在编辑 = false;
    if (需要提交键盘草稿) 提交主日期(主日期草稿 ?? 目标.value, "键盘");
    else 结束主日期编辑();
  } else if (目标.matches("[data-bazi-longitude]")) 更新八字结果区();
});

根节点.addEventListener("focusin", (事件) => {
  const 目标 = 事件.target as HTMLInputElement;
  if (!目标.matches("[data-calendar-date]")) return;
  主日期正在编辑 = true;
  主日期草稿 = 目标.value;
});

根节点.addEventListener("pointerdown", (事件) => {
  const 目标 = 事件.target as HTMLInputElement;
  if (目标.matches("[data-calendar-date]")) 主日期键盘编辑 = false;
});

根节点.addEventListener("keydown", (事件) => {
  const 目标 = 事件.target as HTMLInputElement;
  if (!目标.matches("[data-calendar-date]")) return;
  if (事件.key === "Enter") {
    事件.preventDefault();
    提交主日期(主日期草稿 ?? 目标.value, "键盘");
    return;
  }
  if (事件.key === "Escape") {
    事件.preventDefault();
    结束主日期编辑();
    渲染();
    return;
  }
  if (/^\d$/u.test(事件.key) || ["Backspace", "Delete", "ArrowUp", "ArrowDown"].includes(事件.key)) {
    主日期键盘编辑 = true;
  }
});

根节点.addEventListener("click", async (事件) => {
  const 目标 = (事件.target as HTMLElement).closest<HTMLButtonElement>("button");
  if (!目标) return;

  if (是主题偏好(目标.dataset.themePreference)) {
    主题控制器.设置偏好(目标.dataset.themePreference);
    更新主题控件状态();
    return;
  }

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

  if (目标.dataset.action === "current-hour") {
    const 当前北京时间 = 从时间戳读取北京时间();
    今天 = 北京日期(当前北京时间);
    时间查询 = 创建实时查询时间(当前北京时间);
    手动查看时辰键 = 清除手动查看时辰();
    渲染();
    return;
  }

  const 日期 = 目标.dataset.day;
  if (日期) {
    设置日期(new Date(状态.年, 状态.月, Number(日期)));
    return;
  }

  switch (目标.dataset.action) {
    case "previous-day":
      切换相邻主日期(-1);
      break;
    case "today":
      回到今天实时模式();
      break;
    case "next-day":
      切换相邻主日期(1);
      break;
    case "back-to-top":
      window.scrollTo({ top: 0, behavior: "smooth" });
      break;
    case "time-basis": {
      if (当前时间依据 === "真太阳时") {
        当前时间依据 = "北京时间";
        定位说明 = 当前经度 === null ? "当前使用北京时间" : "定位成功，当前使用北京时间";
        渲染();
      } else if (当前经度 !== null) {
        当前时间依据 = "真太阳时";
        当前定位状态 = "成功";
        定位说明 = "定位成功，当前使用真太阳时";
        渲染();
      } else {
        await 请求定位(true);
      }
      break;
    }
    case "locate":
      await 请求定位(true);
      break;
  }
});

渲染();

const 分钟实时更新器 = 创建分钟实时更新器((当前毫秒) => {
  const 当前北京时间 = 从时间戳读取北京时间(new Date(当前毫秒));
  const 刷新结果 = 刷新主日期实时时钟(状态.所选日期, 今天, 时间查询, 当前北京时间);
  今天 = 刷新结果.今天;
  if (!是同一天(状态.所选日期, 刷新结果.所选日期)) 状态 = 选择日期(状态, 刷新结果.所选日期);
  时间查询 = 刷新结果.时间查询;
  if (刷新结果.需要渲染 && !主日期正在编辑) 渲染();
});

分钟实时更新器.启动();
window.addEventListener("pagehide", () => 分钟实时更新器.停止());
window.addEventListener("pageshow", () => 分钟实时更新器.启动());
