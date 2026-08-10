export type 主题偏好 = "system" | "light" | "dark";
export type 实际主题 = "light" | "dark";

export const 主题存储键 = "traditional-calendar-theme";

interface 主题存储 {
  getItem(键: string): string | null;
  setItem(键: string, 值: string): void;
}

interface 主题媒体查询 {
  matches: boolean;
  addEventListener(类型: "change", 监听器: () => void): void;
  removeEventListener(类型: "change", 监听器: () => void): void;
}

export interface 主题环境 {
  根元素: { dataset: DOMStringMap };
  媒体查询: 主题媒体查询;
  存储: 主题存储 | null;
  更新主题色?: (主题: 实际主题) => void;
}

export interface 主题控制器 {
  readonly 偏好: 主题偏好;
  readonly 实际主题: 实际主题;
  设置偏好(偏好: 主题偏好): void;
  销毁(): void;
}

export function 是主题偏好(值: string | undefined): 值 is 主题偏好 {
  return 值 === "system" || 值 === "light" || 值 === "dark";
}

export function 读取主题偏好(存储: 主题存储 | null): 主题偏好 {
  try {
    const 已保存 = 存储?.getItem(主题存储键) ?? null;
    const 候选 = 已保存 ?? undefined;
    return 是主题偏好(候选) ? 候选 : "system";
  } catch {
    return "system";
  }
}

export function 解析实际主题(偏好: 主题偏好, 系统深色: boolean): 实际主题 {
  return 偏好 === "system" ? (系统深色 ? "dark" : "light") : 偏好;
}

export function 创建主题控制器(环境: 主题环境): 主题控制器 {
  let 当前偏好 = 读取主题偏好(环境.存储);
  let 当前实际主题 = 解析实际主题(当前偏好, 环境.媒体查询.matches);
  let 正在监听系统 = false;

  const 应用 = (): void => {
    当前实际主题 = 解析实际主题(当前偏好, 环境.媒体查询.matches);
    环境.根元素.dataset.themePreference = 当前偏好;
    环境.根元素.dataset.theme = 当前实际主题;
    环境.更新主题色?.(当前实际主题);
  };
  const 系统变化 = (): void => {
    if (当前偏好 === "system") 应用();
  };
  const 同步监听 = (): void => {
    if (当前偏好 === "system" && !正在监听系统) {
      环境.媒体查询.addEventListener("change", 系统变化);
      正在监听系统 = true;
    } else if (当前偏好 !== "system" && 正在监听系统) {
      环境.媒体查询.removeEventListener("change", 系统变化);
      正在监听系统 = false;
    }
  };

  同步监听();
  应用();

  return {
    get 偏好() {
      return 当前偏好;
    },
    get 实际主题() {
      return 当前实际主题;
    },
    设置偏好(偏好) {
      当前偏好 = 偏好;
      try {
        环境.存储?.setItem(主题存储键, 偏好);
      } catch {
        // 本地存储不可用时仍允许本次页面切换主题。
      }
      同步监听();
      应用();
    },
    销毁() {
      if (正在监听系统) 环境.媒体查询.removeEventListener("change", 系统变化);
      正在监听系统 = false;
    },
  };
}

export function 创建浏览器主题控制器(): 主题控制器 {
  const 主题色 = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  return 创建主题控制器({
    根元素: document.documentElement,
    媒体查询: window.matchMedia("(prefers-color-scheme: dark)"),
    存储: window.localStorage,
    更新主题色: (主题) => 主题色?.setAttribute("content", 主题 === "dark" ? "#120b08" : "#24140f"),
  });
}
