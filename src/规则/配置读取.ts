export interface 配置规则 {
  条件: string;
  内容: string;
  行号: number;
  原文: string;
}

export interface 配置错误 {
  文件名: string;
  行号: number;
  原文: string;
  信息: string;
}

export interface 配置解析结果 {
  文件名: string;
  规则: 配置规则[];
  错误: 配置错误[];
}

export function 解析配置(文件名: string, 文本: string): 配置解析结果 {
  const 结果: 配置解析结果 = { 文件名, 规则: [], 错误: [] };

  文本.split(/\r?\n/u).forEach((原文, 索引) => {
    const 行号 = 索引 + 1;
    const 行 = 原文.trim();
    if (!行 || 行.startsWith("#")) return;

    const 中文冒号位置 = 行.indexOf("：");
    const 英文冒号位置 = 行.indexOf(":");
    const 可用位置 = [中文冒号位置, 英文冒号位置].filter((位置) => 位置 >= 0);
    const 分隔位置 = 可用位置.length > 0 ? Math.min(...可用位置) : -1;

    if (分隔位置 < 0) {
      结果.错误.push({ 文件名, 行号, 原文, 信息: "缺少冒号分隔符" });
      return;
    }

    const 条件 = 行.slice(0, 分隔位置).trim();
    const 内容 = 行.slice(分隔位置 + 1).trim();
    if (!条件 || !内容) {
      结果.错误.push({ 文件名, 行号, 原文, 信息: "冒号两侧都必须有内容" });
      return;
    }

    结果.规则.push({ 条件, 内容, 行号, 原文 });
  });

  return 结果;
}

export function 读取全部配置(): 配置解析结果[] {
  const 配置文本 = import.meta.glob("../../配置/*.txt", {
    query: "?raw",
    import: "default",
    eager: true,
  }) as Record<string, string>;

  return Object.entries(配置文本)
    .map(([路径, 文本]) => {
      const 文件名 = 路径.split("/").pop() ?? 路径;
      return 解析配置(文件名, 文本);
    })
    .sort((左, 右) => 左.文件名.localeCompare(右.文件名, "zh-CN"));
}
