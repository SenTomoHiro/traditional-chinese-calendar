import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const 根目录 = process.cwd();
const 读取 = (路径: string) => readFileSync(resolve(根目录, 路径), "utf8");
const 配置 = 读取("scripts/pages-deploy.config");
const 发布脚本 = 读取("scripts/deploy-github-pages.sh");
const 一键发布 = 读取("发布测试版.command");
const 首页 = 读取("index.html");
const Vite配置 = 读取("vite.config.ts");

describe("GitHub Pages 测试部署", () => {
  it("使用低辨识度随机仓库名且不含业务关键词", () => {
    const 仓库名 = 配置.match(/PAGES_REPOSITORY="([^"]+)"/u)?.[1] ?? "";
    expect(仓库名).toMatch(/^[a-z0-9]{16,24}$/u);
    expect(仓库名).not.toMatch(/calendar|lunar|huangli|fengshui|bazi|tao|dao|religion|almanac/iu);
  });

  it("仅在 Pages 构建时设置仓库子路径", () => {
    expect(Vite配置).toContain("process.env.PAGES_REPOSITORY");
    expect(Vite配置).toContain("base: pagesRepository ? `/${pagesRepository}/` : \"/\"");
    expect(发布脚本).toContain('PAGES_REPOSITORY="$PAGES_REPOSITORY" npm run build');
  });

  it("Pages 页面禁止搜索收录并使用中性标题", () => {
    expect(首页).toContain('name="robots" content="noindex,nofollow,noarchive,nosnippet"');
    expect(首页).toContain("<title>Web Tool</title>");
    expect(首页).not.toContain('name="description"');
    expect(读取("public/robots.txt").trim()).toBe("User-agent: *\nDisallow: /");
    expect(existsSync(resolve(根目录, "public/.nojekyll"))).toBe(true);
  });

  it("测试和构建通过后才复制 dist 并推送独立仓库", () => {
    const 测试位置 = 发布脚本.indexOf("npm test");
    const 构建位置 = 发布脚本.indexOf("npm run build");
    const 复制位置 = 发布脚本.indexOf("cp -R dist/.");
    const 推送位置 = 发布脚本.indexOf("git -C \"$DEPLOY_DIR\" push");
    expect(测试位置).toBeGreaterThan(-1);
    expect(测试位置).toBeLessThan(构建位置);
    expect(构建位置).toBeLessThan(复制位置);
    expect(复制位置).toBeLessThan(推送位置);
    expect(发布脚本).not.toContain("force");
    expect(发布脚本).not.toContain("reset --hard");
  });

  it("一键发布复用安全发布脚本且不保存凭据", () => {
    expect(一键发布).toContain("./scripts/deploy-github-pages.sh");
    expect(`${配置}\n${一键发布}`).not.toMatch(/github_pat_|gh[opsu]_[A-Za-z0-9_]+/u);
    expect(发布脚本).not.toMatch(/(?:GH_TOKEN|GITHUB_TOKEN)\s*=/u);
    expect(发布脚本).toContain("gh auth status");
  });
});
