import { defineConfig } from "vite";
import { execFileSync } from "node:child_process";

const pagesBase = "/traditional-chinese-calendar/";

function 读取版本号(): string {
  const 环境版本 = process.env.APP_VERSION?.trim();
  if (环境版本) return 环境版本;
  try {
    return execFileSync("git", ["rev-parse", "--short=7", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return "dev";
  }
}

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? pagesBase : "/",
  define: {
    __APP_VERSION__: JSON.stringify(读取版本号()),
  },
  server: {
    host: "127.0.0.1",
  },
  test: {
    include: ["测试/**/*.test.ts"],
  },
});
