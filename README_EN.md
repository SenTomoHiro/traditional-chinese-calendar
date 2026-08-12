# Traditional Chinese Calendar

[中文](README.md)

> **Traditional Calendar Web Tool** — A browser-local calendar for the Chinese lunisolar calendar, the 24 solar terms, Ganzhi (Heavenly Stems and Earthly Branches), true solar time, and reviewable traditional date-selection rules.

An open-source web calendar for traditional Chinese calendrical work: Gregorian and Chinese lunisolar dates, the sexagenary cycle, solar terms, true solar time, and traditional date-selection rules. It keeps calendar systems and time boundaries explicit, while making maintainable rule material readable and reviewable.

## Mission

This project aims to use AI-assisted software development to lower the technical barrier to building and maintaining traditional calendrical tools. Its long-term mission is to make open, reviewable, testable, and continuously improved software available to Taoist priests, traditional-culture researchers and enthusiasts, and others who rely on traditional Chinese calendrical knowledge.

> An open-source traditional calendrical project led by a domain practitioner and engineered with substantial assistance from GPT and Codex.

## Live Demo

Try the current GitHub Pages deployment: [Open the calendar](https://sentomohiro.github.io/0f25bcf2bbb8a869e712/).

The project is under active maintenance; the page and its results evolve with releases.

## Project Background

This project is initiated and maintained by a Taoist priest without a formal software engineering background. The maintainer is responsible for calendrical and Taoist source material, product requirements, rule decisions, source review, and final validation. Software implementation, code changes, testing, debugging, refactoring, and iterative maintenance are carried out primarily in collaboration with OpenAI GPT and Codex.

The maintainer retains responsibility for product and domain-rule decisions and does not treat AI as an authority on traditional rules. The project is also an ongoing experiment in whether a practitioner with domain knowledge can sustainably build and maintain reviewable open-source software with AI-assisted engineering.

## Why This Is More Than a Simple Calendar Demo

Most calendars show Gregorian dates, lunar dates, or both. This project explicitly models the calendrical distinctions that affect traditional results: the year pillar changes at the precise instant of **Li Chun / 立春**; the month pillar follows the twelve sectional solar terms rather than lunar months; **Zi hour / 子时** begins at 23:00 while the day pillar changes at midnight; and true solar time combines longitude correction with the Equation of Time when browser location is available.

Traditional date-selection material is not hidden behind an unreviewable online service. The project maintains configurable rules in human-readable Chinese text files and leaves room to record source differences or questions that require further review.

## Core Capabilities

- **Gregorian and Chinese lunisolar calendar**: monthly calendar, lunar dates, leap months, traditional festivals, and sacred commemorations.
- **24 Solar Terms / 二十四节气**: displays solar terms and uses precise transition instants for the **Li Chun / 立春** year boundary and solar-term-month boundaries.
- **Ganzhi / 干支**: calculates the year, month, day, and hour pillars of the Heavenly Stems and Earthly Branches cycle, along with the Twelve Day Officers.
- **Zi hour / 子时 and day boundaries**: Zi hour starts at 23:00; late and early Zi are handled separately for hour-stem and duty-deity calculations, while the day pillar changes at 00:00.
- **Beijing Time and true solar time**: uses Beijing Time by default. With browser geolocation, it calculates true solar time from local longitude and the Equation of Time; unavailable, denied, or invalid location safely falls back to Beijing Time.
- **Traditional date-selection rules**: presents daily auspiciousness, daily suitable/unsuitable activities, hourly duty deities, auspiciousness, spiritual influences, and selected feng-shui-taboo lookups. Configurable materials are in [`配置/`](配置/).
- **Browser-local computation**: normal operation needs no custom backend or account system. Location is used for the current calculation only; no location history is created.
- **Responsive layout and themes**: supports desktop, iPad, and phone layouts, with light, dark, and system-following themes.

> **Terminology note:** the Chinese lunisolar calendar (农历) and the solar-term month (节气月) are distinct systems. This project keeps them separate rather than using lunar months directly for the month pillar.

## Design Principles

- Prefer browser-local calculation and minimize server dependency.
- Keep the implementation direct, stable, and maintainable; avoid unnecessary backends, databases, and frameworks.
- Keep maintainable traditional rules in readable Chinese text. A malformed entry reports its file, line, and original text instead of crashing the site.
- Gradually reduce reliance on opaque third-party almanac outputs. The project uses `lunar-typescript` for lunar conversion and solar-term instants, while independently implementing and testing several day- and hour-level rules.
- Preserve source notes and room for further review where texts, editions, or traditions differ. Results are not presented as a single universal authority.

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

- [`配置/`](配置/) contains UTF-8 Chinese TXT files for configurable traditional festivals, sacred commemorations, hourly auspiciousness, and other rules.
- [`资料来源说明.md`](资料来源说明.md) and [`资料/`](资料/) record sources and review work for selected rules and true solar time.
- [`第三方资料/`](第三方资料/) keeps upstream snapshots and source notes.
- [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) explains third-party software and source-material notices.

Normal operation does not call upstream festival or activity-result APIs. The day pillar, Four Pillars boundaries, Twelve Day Officers, daily auspiciousness, daily suitable/unsuitable activities, hourly duty deities, and spiritual influences are implemented and regression-tested within this project.

## Project Status

The project is under active development and maintenance. Current work focuses on strengthening calculation boundaries, reviewing rule sources, expanding regression coverage, and making traditional materials easier to inspect and maintain.

## Contributing and License

Issues and pull requests are welcome for calculation boundaries, source citations, test cases, and documentation. For traditional rules, please provide a source that can be reviewed and describe relevant edition or tradition differences where possible.

This project uses the [MIT License](LICENSE). Rights and scope for traditional literature and third-party source materials are described in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
