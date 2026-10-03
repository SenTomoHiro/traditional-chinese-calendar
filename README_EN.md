# Traditional Chinese Calendar

[中文](README.md)

> **Traditional Calendar Web Tool** — A browser-local calendar for the Chinese lunisolar calendar, the 24 solar terms, Ganzhi (Heavenly Stems and Earthly Branches), true solar time, and traditional date selection.

An open-source web calendar for traditional Chinese calendrical work: Gregorian and Chinese lunisolar dates, the sexagenary cycle, solar terms, true solar time, and traditional date selection.

## Live Demo

Try the GitHub Pages deployment: [Open the calendar](https://sentomohiro.github.io/traditional-chinese-calendar/).

## Calendar Content

The year pillar changes at the precise instant of **Li Chun / 立春**; the month pillar follows the twelve sectional solar terms; **Zi hour / 子时** begins at 23:00 while the day pillar changes at midnight. True solar time is available when browser location is provided.

## Core Capabilities

- **Gregorian and Chinese lunisolar calendar**: monthly calendar, lunar dates, leap months, traditional festivals, and sacred commemorations.
- **24 Solar Terms / 二十四节气**: displays solar terms and uses precise transition instants for the **Li Chun / 立春** year boundary and solar-term-month boundaries.
- **Ganzhi / 干支**: calculates the year, month, day, and hour pillars of the Heavenly Stems and Earthly Branches cycle, along with the Twelve Day Officers.
- **Zi hour / 子时 and day boundaries**: Zi hour starts at 23:00; late and early Zi are handled separately for hour-stem and duty-deity calculations, while the day pillar changes at 00:00.
- **Beijing Time and true solar time**: uses Beijing Time by default. With browser geolocation, it calculates true solar time from local longitude and the Equation of Time; unavailable, denied, or invalid location safely falls back to Beijing Time.
- **Traditional date selection**: presents daily auspiciousness, daily suitable/unsuitable activities, hourly duty deities, spiritual influences, and selected feng-shui cautions.
- **BaZi overview**: shows hidden stems, Ten Gods, month command, roots, exposed stems, stem/branch relations, and pattern candidates, with separate pattern use, balancing, and seasonal adjustment.
- **Personalized date selection**: supports marriage, residence, commerce, daily affairs, construction, agriculture, funerary matters, and official appointments, combining public date rules, personal relations, and recommended hours.
- **Beidou rules**: the Benming Xia Ri rule follows the full sexagenary day cycle. Each day's Ganzhi identifies people born in a year with the same Ganzhi, and the corresponding natal star official is then mapped from that birth-year Earthly Branch.
- **Browser-local computation**: no account is needed; location is used only for the current calculation.
- **Responsive layout and themes**: supports desktop, iPad, and phone layouts, with light, dark, and system-following themes.

> **Terminology note:** the Chinese lunisolar calendar (农历) and the solar-term month (节气月) are distinct systems.

### Beidou Rule Semantics

- **Benming Xia Ri / 本命下日** follows the full 60-day Ganzhi cycle. A Jiazi day applies to people born in a Jiazi year, a Gengyin day to people born in a Gengyin year, and a Gengshen day to people born in a Gengshen year. In this context, “XX 生人” means people whose birth-year Ganzhi is XX, not people whose birth-day pillar is XX.
- **Benming Xingguan / 本命星官** is mapped from the Earthly Branch of that birth year. The page first derives the matching “XX-year-born people” from the current day's Ganzhi, then uses the Earthly Branch of that birth-year Ganzhi for the star mapping. For example, a Gengshen day identifies Gengshen-year-born people; their birth-year branch is Shen, which maps to 北斗第五丹元廉贞罡星君. It is not calculated from a person's birth-day branch.
- **Doujiang days / 斗降日** are traditional sacred commemorations recorded in classical sources.

## Technology Stack

- TypeScript
- Vite
- HTML / CSS
- `lunar-typescript` 1.8.6 for lunar conversion and solar-term instants
- Vitest and Playwright / WebKit

## Run Locally

Node.js 20.19 or later is required.

```bash
npm install
npm run dev
```

## Testing and Quality

```bash
npx playwright install webkit
npm test
npm run build
```

`npm test` runs automated regression tests for calendar and rule behavior, plus responsive layout tests in WebKit at several narrow viewport widths. `npm run build` performs TypeScript checking and produces a production build.

## Rules, Sources, and Dependencies

- [`配置/`](配置/) contains traditional festivals, sacred commemorations, hourly auspiciousness, and related materials.
- [`资料来源说明.md`](资料来源说明.md) and [`资料/`](资料/) record sources for selected rules and true solar time.
- [`第三方资料/`](第三方资料/) keeps upstream snapshots and source notes.
- [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) explains third-party software and source-material notices.

## Contributing and License

Issues and pull requests are welcome for source citations, test cases, and documentation. For traditional rules, please provide a verifiable source.

This project uses the [MIT License](LICENSE). Rights and scope for traditional literature and third-party source materials are described in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
