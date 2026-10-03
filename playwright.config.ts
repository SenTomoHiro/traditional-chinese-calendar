import { defineConfig, devices } from "@playwright/test";

const 外部基础地址 = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./测试/WebKit",
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  use: {
    ...devices["Desktop Safari"],
    baseURL: 外部基础地址 ?? "http://127.0.0.1:4173",
    headless: true,
  },
  projects: [
    {
      name: "webkit",
      use: { browserName: "webkit" },
    },
  ],
  webServer: 外部基础地址 ? undefined : {
    command: "npm run dev -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
