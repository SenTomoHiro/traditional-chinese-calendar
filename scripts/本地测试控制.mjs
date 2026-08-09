import {
  closeSync,
  existsSync,
  openSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { createConnection } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";

const 项目目录 = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const 状态文件 = resolve(项目目录, ".local-test-server.json");
const 日志文件 = resolve(项目目录, ".local-test-server.log");
const Vite入口 = resolve(项目目录, "node_modules", "vite", "bin", "vite.js");
const 本地端口 = 5173;
const 本地地址 = `http://localhost:${本地端口}`;
const 不打开浏览器 = process.env.LOCAL_TEST_NO_OPEN === "1";

const 等待 = (毫秒) => new Promise((完成) => setTimeout(完成, 毫秒));

function 删除状态文件() {
  if (existsSync(状态文件)) unlinkSync(状态文件);
}

function 读取状态() {
  if (!existsSync(状态文件)) return null;
  try {
    const 状态 = JSON.parse(readFileSync(状态文件, "utf8"));
    return Number.isInteger(状态.pid) ? 状态 : null;
  } catch {
    删除状态文件();
    return null;
  }
}

function 进程存在(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function 标准化路径(路径) {
  return 路径.replaceAll("\\", "/").toLowerCase();
}

function 获取进程命令(pid) {
  if (process.platform === "win32") {
    const 命令 = spawnSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        `(Get-CimInstance Win32_Process -Filter \"ProcessId = ${pid}\").CommandLine`,
      ],
      { encoding: "utf8", windowsHide: true },
    );
    return 命令.status === 0 ? 命令.stdout.trim() : "";
  }

  const 命令 = spawnSync("ps", ["-p", String(pid), "-o", "command="], { encoding: "utf8" });
  return 命令.status === 0 ? 命令.stdout.trim() : "";
}

function 是本项目进程(pid) {
  if (!进程存在(pid)) return false;
  return 标准化路径(获取进程命令(pid)).includes(标准化路径(Vite入口));
}

function 当前项目进程() {
  const 状态 = 读取状态();
  if (!状态) return null;
  if (!是本项目进程(状态.pid)) {
    删除状态文件();
    return null;
  }
  return 状态;
}

function 地址可访问(超时 = 500) {
  return new Promise((完成) => {
    const 连接 = createConnection({ host: "127.0.0.1", port: 本地端口 });
    const 结束 = (结果) => {
      连接.destroy();
      完成(结果);
    };
    连接.setTimeout(超时);
    连接.once("connect", () => 结束(true));
    连接.once("timeout", () => 结束(false));
    连接.once("error", () => 结束(false));
  });
}

async function 等待地址(应可访问, 最长毫秒 = 15000) {
  const 结束时间 = Date.now() + 最长毫秒;
  while (Date.now() < 结束时间) {
    if ((await 地址可访问()) === 应可访问) return true;
    await 等待(200);
  }
  return false;
}

function 准备依赖() {
  if (existsSync(Vite入口)) return true;
  console.log("首次使用，正在准备日历系统，请稍候……");
  const npm命令 = process.platform === "win32" ? "npm.cmd" : "npm";
  const 结果 = spawnSync(npm命令, ["install"], { cwd: 项目目录, stdio: "inherit" });
  return 结果.status === 0 && existsSync(Vite入口);
}

function 打开浏览器() {
  if (不打开浏览器) return;
  let 命令;
  let 参数;
  if (process.platform === "win32") {
    命令 = "cmd.exe";
    参数 = ["/d", "/s", "/c", "start", "", 本地地址];
  } else if (process.platform === "darwin") {
    命令 = "open";
    参数 = [本地地址];
  } else {
    命令 = "xdg-open";
    参数 = [本地地址];
  }
  const 浏览器进程 = spawn(命令, 参数, { detached: true, stdio: "ignore", windowsHide: true });
  浏览器进程.unref();
}

async function 启动() {
  const 已运行 = 当前项目进程();
  if (已运行) {
    if (await 等待地址(true, 3000)) {
      console.log("日历系统已经在运行");
      console.log(`本地地址：${本地地址}`);
      打开浏览器();
      return true;
    }
    await 结束本项目进程(已运行.pid);
    删除状态文件();
  }

  if (!准备依赖()) {
    console.error("日历系统准备失败，请确认已经安装 Node.js 后重试");
    return false;
  }

  if (await 地址可访问()) {
    console.error("本地测试地址正在被其他程序使用，请稍后再试");
    return false;
  }

  const 日志 = openSync(日志文件, "a");
  const 服务进程 = spawn(
    process.execPath,
    [Vite入口, "--host", "127.0.0.1", "--port", String(本地端口), "--strictPort"],
    {
      cwd: 项目目录,
      detached: true,
      stdio: ["ignore", 日志, 日志],
      windowsHide: true,
    },
  );
  服务进程.unref();
  closeSync(日志);
  writeFileSync(
    状态文件,
    JSON.stringify({ pid: 服务进程.pid, port: 本地端口, project: 项目目录 }, null, 2),
    "utf8",
  );

  if (!(await 等待地址(true))) {
    删除状态文件();
    console.error("日历系统启动失败，请关闭窗口后重试");
    return false;
  }

  console.log("日历系统已启动");
  console.log(`本地地址：${本地地址}`);
  打开浏览器();
  return true;
}

async function 结束本项目进程(pid) {
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(pid), "/T"], { stdio: "ignore", windowsHide: true });
  } else {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      return;
    }
  }

  const 已结束 = await 等待地址(false, 8000);
  if (已结束 || !进程存在(pid)) return;

  if (process.platform === "win32") {
    spawnSync("taskkill", ["/F", "/PID", String(pid), "/T"], {
      stdio: "ignore",
      windowsHide: true,
    });
  } else {
    process.kill(pid, "SIGKILL");
  }
  await 等待地址(false, 3000);
}

async function 停止(重启中 = false) {
  const 状态 = 当前项目进程();
  if (!状态) {
    if (!重启中) console.log("日历系统当前未运行");
    return true;
  }

  await 结束本项目进程(状态.pid);
  删除状态文件();
  if (!重启中) console.log("日历系统已停止");
  return true;
}

async function 重启() {
  console.log("正在重新启动日历系统……");
  await 停止(true);
  return 启动();
}

const 操作 = process.argv[2];
let 成功 = false;
if (操作 === "start") 成功 = await 启动();
else if (操作 === "stop") 成功 = await 停止();
else if (操作 === "restart") 成功 = await 重启();
else console.error("无法识别本地测试操作");

process.exitCode = 成功 ? 0 : 1;
