import { defineConfig } from "vite";

const pagesRepository = process.env.PAGES_REPOSITORY?.trim();

if (pagesRepository && !/^[a-z0-9]{16,24}$/u.test(pagesRepository)) {
  throw new Error("PAGES_REPOSITORY 必须是 16 至 24 位小写字母或数字");
}

export default defineConfig({
  base: pagesRepository ? `/${pagesRepository}/` : "/",
  server: {
    host: "127.0.0.1",
  },
  test: {
    include: ["测试/**/*.test.ts"],
  },
});
