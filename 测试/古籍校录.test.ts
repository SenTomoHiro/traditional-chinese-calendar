import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const 校录 = readFileSync(new URL("../文档/协纪辨方书影印表校录.md", import.meta.url), "utf8");

describe("协纪辨方书宜忌等第表校录", () => {
  it("最后两个疑字已核清且84格不再含待核格", () => {
    expect(校录).toContain("巳亥月 長生 月宮 相煞 辰未月");
    expect(校录).toContain("子午卯酉月 王日 辰戌丑未月 官日 天吏");
    expect(校录).toContain("总格数 84，核清 84，待复核 0，待核 0");
    expect(校录).not.toMatch(/221\/R0[45]\/C0[34].*□/u);
  });
});
