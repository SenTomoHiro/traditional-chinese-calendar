import { describe, expect, it } from "vitest";
import { 创建主题控制器, 主题存储键, type 主题环境 } from "../src/界面/主题";

function 创建环境(系统深色: boolean, 已保存?: string) {
  const 数据 = new Map<string, string>();
  if (已保存 !== undefined) 数据.set(主题存储键, 已保存);
  const 监听器 = new Set<() => void>();
  const dataset = {} as DOMStringMap;
  const 媒体查询 = {
    matches: 系统深色,
    addEventListener: (_类型: "change", 监听: () => void) => 监听器.add(监听),
    removeEventListener: (_类型: "change", 监听: () => void) => 监听器.delete(监听),
  };
  const 主题色: string[] = [];
  const 环境: 主题环境 = {
    根元素: { dataset },
    媒体查询,
    存储: {
      getItem: (键) => 数据.get(键) ?? null,
      setItem: (键, 值) => 数据.set(键, 值),
    },
    更新主题色: (主题) => 主题色.push(主题),
  };
  return {
    环境,
    数据,
    dataset,
    监听器,
    主题色,
    设置系统深色(深色: boolean) {
      媒体查询.matches = 深色;
      [...监听器].forEach((监听) => 监听());
    },
  };
}

describe("浅色、自动、深色三状态主题", () => {
  it.each([[false, "light"], [true, "dark"]] as const)("默认自动根据系统主题得到 %s → %s", (系统深色, 期望) => {
    const 模拟 = 创建环境(系统深色);
    const 控制器 = 创建主题控制器(模拟.环境);
    expect(控制器.偏好).toBe("system");
    expect(控制器.实际主题).toBe(期望);
    expect(模拟.dataset.themePreference).toBe("system");
    expect(模拟.dataset.theme).toBe(期望);
    expect(模拟.监听器.size).toBe(1);
  });

  it("自动状态实时响应系统主题变化", () => {
    const 模拟 = 创建环境(false);
    const 控制器 = 创建主题控制器(模拟.环境);
    模拟.设置系统深色(true);
    expect(控制器.实际主题).toBe("dark");
    expect(模拟.dataset.theme).toBe("dark");
    模拟.设置系统深色(false);
    expect(控制器.实际主题).toBe("light");
  });

  it.each(["light", "dark"] as const)("手动 %s 不再监听系统变化", (偏好) => {
    const 模拟 = 创建环境(偏好 === "light");
    const 控制器 = 创建主题控制器(模拟.环境);
    控制器.设置偏好(偏好);
    const 切换前 = 控制器.实际主题;
    expect(模拟.监听器.size).toBe(0);
    模拟.设置系统深色(偏好 !== "dark");
    expect(控制器.实际主题).toBe(切换前);
  });

  it("用户选择保存并在重新创建控制器时恢复", () => {
    const 首次 = 创建环境(false);
    const 首次控制器 = 创建主题控制器(首次.环境);
    首次控制器.设置偏好("dark");
    expect(首次.数据.get(主题存储键)).toBe("dark");
    const 再次 = 创建环境(false, 首次.数据.get(主题存储键));
    const 恢复控制器 = 创建主题控制器(再次.环境);
    expect(恢复控制器.偏好).toBe("dark");
    expect(恢复控制器.实际主题).toBe("dark");
  });

  it("重新选择自动会保存并恢复系统监听", () => {
    const 模拟 = 创建环境(true, "light");
    const 控制器 = 创建主题控制器(模拟.环境);
    控制器.设置偏好("system");
    expect(模拟.数据.get(主题存储键)).toBe("system");
    expect(控制器.实际主题).toBe("dark");
    expect(模拟.监听器.size).toBe(1);
  });
});
