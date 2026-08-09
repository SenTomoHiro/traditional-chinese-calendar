import "./style.css";
import {
  创建月历格,
  格式化公历日期,
  是同一天,
  星期名称,
  星期短名,
  移动月份,
  选择日期,
  type 日历状态,
} from "./日历/公历";
import { 获取浏览器定位 } from "./定位";
import { 读取全部配置 } from "./规则/配置读取";
import { 判断全部时辰规则, type 时辰规则判断 } from "./规则/时辰规则";
import { 从时间戳读取北京时间, 格式化日期时间, 计算最终时间, 计算历法, 创建北京时间 } from "./历法";
import { 格式化时分 } from "./历法/时间";

const 应用容器 = document.querySelector<HTMLDivElement>("#app");
if (!应用容器) throw new Error("页面初始化失败：找不到应用容器");
const 根节点: HTMLDivElement = 应用容器;

type 定位状态 = "未定位" | "定位中" | "成功" | "失败";

function 北京日期(时间 = 从时间戳读取北京时间()): Date {
  return new Date(时间.年, 时间.月 - 1, 时间.日);
}

let 今天 = 北京日期();
let 状态: 日历状态 = 选择日期(
  { 年: 今天.getFullYear(), 月: 今天.getMonth(), 所选日期: 今天 },
  今天,
);
let 查询时间 = 格式化时分(从时间戳读取北京时间());
let 当前经度: number | null = null;
let 当前定位状态: 定位状态 = "未定位";
let 定位说明 = "尚未定位，当前按北京时间计算";

const 配置结果 = 读取全部配置();
const 规则总数 = 配置结果.reduce((总数, 文件) => 总数 + 文件.规则.length, 0);
const 错误总数 = 配置结果.reduce((总数, 文件) => 总数 + 文件.错误.length, 0);

function 是当前北京时间日期(日期: Date): boolean {
  今天 = 北京日期();
  return 是同一天(日期, 今天);
}

function 设置日期(日期: Date): void {
  状态 = 选择日期(状态, 日期);
  查询时间 = 是当前北京时间日期(日期) ? 格式化时分(从时间戳读取北京时间()) : "12:00";
  渲染();
}

function 格式化修正(分钟: number): string {
  const 总秒数 = Math.round(分钟 * 60);
  const 符号 = 总秒数 >= 0 ? "+" : "−";
  const 绝对秒数 = Math.abs(总秒数);
  return `${符号}${Math.floor(绝对秒数 / 60)}分${String(绝对秒数 % 60).padStart(2, "0")}秒`;
}

function 规则标记(规则: 时辰规则判断): string {
  const 状态文字 = 规则.状态 === "命中" ? "命中" : 规则.状态 === "无规则" ? "本月无规则" : 规则.状态;
  return `
    <div class="rule-result is-${规则.状态}">
      <span aria-hidden="true"></span>
      <div><strong>${规则.名称}</strong><p>${状态文字} · ${规则.说明}</p></div>
    </div>`;
}

function 渲染(): void {
  const 月历格 = 创建月历格(状态.年, 状态.月);
  const 所选 = 状态.所选日期;
  const [时文本, 分文本] = 查询时间.split(":");
  const 北京时间 = 创建北京时间(
    所选.getFullYear(),
    所选.getMonth() + 1,
    所选.getDate(),
    Number(时文本),
    Number(分文本),
    0,
  );
  const 最终 = 计算最终时间(北京时间, 当前经度);
  const 历法结果 = 计算历法(最终.最终时间);
  const 时辰规则 = 判断全部时辰规则(配置结果, 最终.日支, 最终.时支, 历法结果.农历.月);
  const 节气显示 = 历法结果.节气
    ? `${历法结果.节气.名称} · ${格式化时分(历法结果.节气)}`
    : "当日无节气";
  const 真太阳时显示 = 最终.真太阳时
    ? `${格式化日期时间(最终.真太阳时, true)}（修正 ${格式化修正(最终.总修正分钟 ?? 0)}）`
    : "未取得定位，暂不计算";
  const 最终日期提示 = `${最终.最终时间.年}年${最终.最终时间.月}月${最终.最终时间.日}日`;

  根节点.innerHTML = `
    <main class="page-shell">
      <header class="site-header">
        <div class="brand-mark" aria-hidden="true">历</div>
        <div>
          <p class="eyebrow">TRADITIONAL CALENDAR</p>
          <h1>传统历法日历</h1>
        </div>
        <button class="today-button" type="button" data-action="today">返回今天</button>
      </header>

      <section class="calendar-layout" aria-label="公历月历与日期详情">
        <article class="calendar-card">
          <div class="calendar-toolbar">
            <div class="toolbar-group" aria-label="年份切换">
              <button type="button" class="icon-button" data-action="previous-year" aria-label="上一年">−年</button>
              <button type="button" class="icon-button" data-action="next-year" aria-label="下一年">+年</button>
            </div>
            <div class="month-heading" aria-live="polite">
              <span>${状态.年}</span>
              <strong>${String(状态.月 + 1).padStart(2, "0")}</strong>
              <small>月</small>
            </div>
            <div class="toolbar-group" aria-label="月份切换">
              <button type="button" class="icon-button" data-action="previous-month" aria-label="上个月">‹</button>
              <button type="button" class="icon-button" data-action="next-month" aria-label="下个月">›</button>
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
                const 是今天 = 是同一天(当前日期, 今天);
                const 已选择 = 是同一天(当前日期, 所选);
                return `
                  <button
                    type="button"
                    class="day-button${是今天 ? " is-today" : ""}${已选择 ? " is-selected" : ""}"
                    data-day="${日期}"
                    role="gridcell"
                    aria-label="${格式化公历日期(当前日期)}，${星期名称[当前日期.getDay()]}${是今天 ? "，今天" : ""}"
                    ${是今天 ? 'aria-current="date"' : ""}
                    ${已选择 ? 'aria-selected="true"' : 'aria-selected="false"'}
                  >
                    <span>${日期}</span>
                    ${是今天 ? "<small>今</small>" : ""}
                  </button>`;
              })
              .join("")}
          </div>
        </article>

        <aside class="detail-card" aria-label="所选日期详情" aria-live="polite">
          <div class="detail-accent" aria-hidden="true"></div>
          <p class="detail-kicker">所选北京时间日期</p>
          <div class="selected-day-number">${String(所选.getDate()).padStart(2, "0")}</div>
          <h2>${格式化公历日期(所选)}</h2>
          <p class="weekday">${星期名称[所选.getDay()]}</p>

          <div class="time-controls">
            <label>查询时间<input type="time" data-time-input value="${查询时间}" aria-label="查询时间"></label>
            <button type="button" data-action="locate" ${当前定位状态 === "定位中" ? "disabled" : ""}>
              ${当前定位状态 === "定位中" ? "正在定位…" : 当前定位状态 === "成功" ? "重新定位" : "获取定位"}
            </button>
            <p class="location-status is-${当前定位状态}">${定位说明}</p>
          </div>

          <div class="detail-rule"></div>
          <dl class="detail-list">
            <div><dt>北京时间</dt><dd>${格式化日期时间(最终.北京时间)}</dd></div>
            <div><dt>真太阳时</dt><dd>${真太阳时显示}</dd></div>
            <div><dt>计算依据</dt><dd>${最终.计算依据}</dd></div>
            <div><dt>历法日</dt><dd>${最终日期提示}</dd></div>
            <div><dt>时辰</dt><dd>${最终.时支}时</dd></div>
            <div><dt>时柱</dt><dd>${最终.时柱}</dd></div>
            <div><dt>农历</dt><dd>${历法结果.农历.显示}</dd></div>
            <div><dt>闰月</dt><dd>${历法结果.农历.是否闰月 ? "是" : "否"}</dd></div>
            <div><dt>节气</dt><dd>${节气显示}</dd></div>
            <div><dt>年柱</dt><dd>${历法结果.年柱}</dd></div>
            <div><dt>月柱</dt><dd>${历法结果.月柱}</dd></div>
            <div><dt>日柱</dt><dd>${历法结果.日柱}</dd></div>
            <div><dt>月建</dt><dd>${历法结果.月建}月</dd></div>
            <div><dt>值星</dt><dd>${历法结果.值星}日</dd></div>
          </dl>

          <p class="calculation-note">日柱以最终计算时间 00:00 换日；定位失败自动使用北京时间</p>

          <section class="rule-results" aria-label="时辰规则判断">
            <h3>现有时辰规则</h3>
            ${时辰规则.map(规则标记).join("")}
          </section>

          <div class="config-status${错误总数 > 0 ? " has-error" : ""}">
            <span class="status-dot" aria-hidden="true"></span>
            <div>
              <strong>传统规则配置</strong>
              <p>已读取 ${配置结果.length} 个文件，共 ${规则总数} 条规则${错误总数 > 0 ? `，${错误总数} 条待修正` : ""}</p>
            </div>
          </div>
        </aside>
      </section>

      <footer>
        <p>第三阶段 · 真太阳时与时柱</p>
        <p>定位坐标仅在当前页面内使用，不会上传或保存。</p>
      </footer>
    </main>
  `;
}

function 更新显示年月(年: number, 月: number): void {
  const 当月日期 = Math.min(状态.所选日期.getDate(), new Date(年, 月 + 1, 0).getDate());
  设置日期(new Date(年, 月, 当月日期));
}

根节点.addEventListener("change", (事件) => {
  const 输入框 = (事件.target as HTMLElement).closest<HTMLInputElement>("[data-time-input]");
  if (!输入框?.value) return;
  查询时间 = 输入框.value;
  渲染();
});

根节点.addEventListener("click", async (事件) => {
  const 目标 = (事件.target as HTMLElement).closest<HTMLButtonElement>("button");
  if (!目标) return;

  const 日期 = 目标.dataset.day;
  if (日期) {
    设置日期(new Date(状态.年, 状态.月, Number(日期)));
    return;
  }

  switch (目标.dataset.action) {
    case "today": {
      const 当前北京时间 = 从时间戳读取北京时间();
      设置日期(北京日期(当前北京时间));
      查询时间 = 格式化时分(当前北京时间);
      渲染();
      break;
    }
    case "locate": {
      当前经度 = null;
      当前定位状态 = "定位中";
      定位说明 = "正在获取本机位置…";
      渲染();
      const 结果 = await 获取浏览器定位();
      if (结果.成功) {
        当前经度 = 结果.经度;
        当前定位状态 = "成功";
        定位说明 = "定位成功，已按真太阳时计算";
      } else {
        当前定位状态 = "失败";
        定位说明 = `定位${结果.原因}，已自动改用北京时间`;
      }
      渲染();
      break;
    }
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
    case "previous-year":
      更新显示年月(状态.年 - 1, 状态.月);
      break;
    case "next-year":
      更新显示年月(状态.年 + 1, 状态.月);
      break;
  }
});

渲染();
