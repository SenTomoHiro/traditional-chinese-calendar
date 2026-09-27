import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const 根目录 = process.cwd();
const 读取 = (路径: string) => readFileSync(resolve(根目录, 路径), "utf8");
const 工作流 = 读取(".github/workflows/deploy-pages.yml");
const 首页 = 读取("index.html");
const Vite配置 = 读取("vite.config.ts");

describe("GitHub Pages 正式部署", () => {
  it("由源码仓库的官方 Actions workflow 构建和部署", () => {
    expect(工作流).toContain("actions/upload-pages-artifact@v3");
    expect(工作流).toContain("actions/deploy-pages@v4");
    expect(工作流).toContain("branches: [main]");
    expect(工作流).toContain("pages: write");
    expect(工作流).toContain("id-token: write");
    expect(工作流).toContain("npm run build:pages");
    expect(工作流).not.toMatch(/force|reset --hard/u);
  });
  it("Pages build 使用正式仓库子路径，不保留随机部署仓库", () => {
    expect(Vite配置).toContain('pagesBase = "/traditional-chinese-calendar/"');
    expect(读取("package.json")).toContain('"build:pages": "tsc && vite build --base=/traditional-chinese-calendar/"');
    expect(existsSync(resolve(根目录, "scripts/deploy-github-pages.sh"))).toBe(false);
    expect(existsSync(resolve(根目录, "scripts/pages-deploy.config"))).toBe(false);
  });
  it("页面仍禁止搜索收录并保留基础静态资源", () => {
    expect(首页).toContain('name="robots" content="noindex,nofollow,noarchive,nosnippet"');
    expect(读取("public/robots.txt").trim()).toBe("User-agent: *\nDisallow: /");
    expect(existsSync(resolve(根目录, "public/.nojekyll"))).toBe(true);
    expect(首页).toContain('href="%BASE_URL%favicon.svg"');
  });
});
