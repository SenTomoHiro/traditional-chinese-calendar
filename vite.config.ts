import { defineConfig } from "vite";
import { execFileSync } from "node:child_process";

const pagesRepository = process.env.PAGES_REPOSITORY?.trim();

function 读取版本号(): string {
  const 环境版本 = process.env.APP_VERSION?.trim();
  if (环境版本) return 环境版本;
  try {
    return execFileSync("git", ["rev-parse", "--short=7", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return "dev";
  }
}

if (pagesRepository && !/^[a-z0-9]{16,24}$/u.test(pagesRepository)) {
  throw new Error("PAGES_REPOSITORY 必须是 16 至 24 位小写字母或数字");
}

export default defineConfig({
  base: pagesRepository ? `/${pagesRepository}/` : "/",
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
