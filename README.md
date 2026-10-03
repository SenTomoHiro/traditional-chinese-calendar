# 传统历法日历系统

[English](README_EN.md)

> **Traditional Calendar Web Tool** — A browser-local calendar for the Chinese lunisolar calendar, the 24 solar terms, Ganzhi (Heavenly Stems and Earthly Branches), true solar time, and traditional date selection.

一个面向中国传统历法、干支、节气、真太阳时与传统择日的 Web 日历工具，提供公历、农历、节气、四柱、时辰与神圣纪念等信息。

## 在线体验

GitHub Pages：[打开日历](https://sentomohiro.github.io/traditional-chinese-calendar/)。

## 日历内容

日历以立春交节时刻换年柱、以十二节切换节气月；子时自 23:00 起，日柱于 00:00 更替。可在取得定位后显示真太阳时。

## 核心功能

- **公历与农历**：月历、农历日期、闰月、传统节日与神圣纪念日。
- **二十四节气 / 24 Solar Terms**：显示节气，并使用精确交节时刻处理立春换年与节气月边界。
- **干支 / Ganzhi**：计算年、月、日、时四柱（Heavenly Stems and Earthly Branches），并显示十二值星。
- **子时与时间边界**：23:00 进入子时，夜子与早子分别计算时干和值神；日柱在 00:00 更换。
- **北京时间与真太阳时**：默认以北京时间工作；取得浏览器定位后，以当地经度和均时差计算真太阳时。定位失败或被拒绝时安全回退到北京时间。
- **传统择日**：显示日吉凶、日宜忌、时辰值神、吉凶、神煞与部分风水禁忌速查。
- **八字分析**：列出藏干、十神、月令、通根、透干、干支关系及格局候选，并分别呈现格局用、扶抑与调候。
- **个性化择日**：按婚姻、居宅、商业、日常事务、工程营造、农事、丧葬、官事八类选择具体事项，结合公共日课、个人关系与推荐时辰给出结果。
- **北斗规则**：本命下日使用六十甲子日循环；当天日干支对应同一生年干支的“XX年生人”，本命星官再按该出生年份的地支映射。
- **浏览器本地计算**：无需账号；定位仅用于当前计算。
- **响应式与主题**：适配电脑、iPad 与手机，支持浅色、深色和跟随系统主题。

> **Terminology note:** 农历（Chinese lunisolar calendar）与节气月（solar-term month）是不同的时间体系。

### 北斗规则口径

- **本命下日**使用六十甲子日循环。甲子日对应甲子年生人，庚寅日对应庚寅年生人，庚申日对应庚申年生人；这里的“XX生人”明确表示生年干支为 XX 的人，不是出生日柱。
- **本命星官**按出生年份的地支映射。页面展示时先由当天日干支得到对应的“XX年生人”，再取该生年干支的年支映射星官；例如庚申日对应庚申年生人，其出生年支为申，对应北斗第五丹元廉贞罡星君。它不按出生日支计算，也不把当天日支解释为个人的出生日支。
- **斗降日**见于古籍所载的独立纪日。

## 技术栈

- TypeScript
- Vite
- HTML / CSS
- `lunar-typescript` 1.8.6（农历转换与节气时刻）
- Vitest 与 Playwright / WebKit

## 本地运行

需要 Node.js 20.19 或更高版本。

```bash
npm install
npm run dev
```

## 测试与质量

```bash
npx playwright install webkit
npm test
npm run build
```

`npm test` 会运行历法与规则的自动回归测试，以及 WebKit 下多种窄屏宽度的响应式布局测试。`npm run build` 会执行 TypeScript 检查并生成生产构建。

## 规则、资料与依赖

- [`配置/`](配置/)：传统节日、神圣纪念、时辰吉凶等资料。
- [`资料来源说明.md`](资料来源说明.md) 与 [`资料/`](资料/)：规则与真太阳时的资料来源。
- [`第三方资料/`](第三方资料/)：上游快照和来源说明。
- [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)：第三方软件声明。

## 贡献与许可证

欢迎通过 Issue 或 Pull Request 提交资料出处、测试用例和文档改进；涉及传统规则时，请附上可核对的来源。

项目采用 [MIT License](LICENSE)。传统文献与第三方来源材料的权利边界见 [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)（Traditional and third-party materials notice）。
