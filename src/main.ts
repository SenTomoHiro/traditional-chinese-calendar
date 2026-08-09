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
import { 获取历法结果占位 } from "./历法";
import { 读取全部配置 } from "./规则/配置读取";

const 应用容器 = document.querySelector<HTMLDivElement>("#app");
if (!应用容器) throw new Error("页面初始化失败：找不到应用容器");
const 根节点: HTMLDivElement = 应用容器;

const 今天 = new Date();
let 状态: 日历状态 = 选择日期(
  { 年: 今天.getFullYear(), 月: 今天.getMonth(), 所选日期: 今天 },
  今天,
);

const 配置结果 = 读取全部配置();
const 规则总数 = 配置结果.reduce((总数, 文件) => 总数 + 文件.规则.length, 0);
const 错误总数 = 配置结果.reduce((总数, 文件) => 总数 + 文件.错误.length, 0);

function 渲染(): void {
  const 月历格 = 创建月历格(状态.年, 状态.月);
  const 历法结果 = 获取历法结果占位();
  const 所选 = 状态.所选日期;

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
          <p class="detail-kicker">所选日期</p>
          <div class="selected-day-number">${String(所选.getDate()).padStart(2, "0")}</div>
          <h2>${格式化公历日期(所选)}</h2>
          <p class="weekday">${星期名称[所选.getDay()]}</p>

          <div class="detail-rule"></div>
          <dl class="detail-list">
            <div><dt>农历</dt><dd>${历法结果.农历 ?? "开发中"}</dd></div>
            <div><dt>年柱</dt><dd>${历法结果.年柱 ?? "开发中"}</dd></div>
            <div><dt>月柱</dt><dd>${历法结果.月柱 ?? "开发中"}</dd></div>
            <div><dt>日柱</dt><dd>${历法结果.日柱 ?? "开发中"}</dd></div>
            <div><dt>时柱</dt><dd>${历法结果.时柱 ?? "开发中"}</dd></div>
            <div><dt>值星</dt><dd>${历法结果.值星 ?? "开发中"}</dd></div>
          </dl>

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
        <p>第一阶段 · 公历基础版</p>
        <p>复杂历法将在后续阶段接入，当前不提供推算结果。</p>
      </footer>
    </main>
  `;
}

function 更新显示年月(年: number, 月: number): void {
  const 当月日期 = Math.min(状态.所选日期.getDate(), new Date(年, 月 + 1, 0).getDate());
  状态 = 选择日期(状态, new Date(年, 月, 当月日期));
  渲染();
}

根节点.addEventListener("click", (事件) => {
  const 目标 = (事件.target as HTMLElement).closest<HTMLButtonElement>("button");
  if (!目标) return;

  const 日期 = 目标.dataset.day;
  if (日期) {
    状态 = 选择日期(状态, new Date(状态.年, 状态.月, Number(日期)));
    渲染();
    return;
  }

  switch (目标.dataset.action) {
    case "today":
      状态 = 选择日期(状态, 今天);
      渲染();
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
    case "previous-year":
      更新显示年月(状态.年 - 1, 状态.月);
      break;
    case "next-year":
      更新显示年月(状态.年 + 1, 状态.月);
      break;
  }
});

渲染();
