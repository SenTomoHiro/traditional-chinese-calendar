import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { LunarUtil } from "lunar-typescript";

const 天干 = [..."甲乙丙丁戊己庚辛壬癸"];
const 地支 = [..."子丑寅卯辰巳午未申酉戌亥"];
const 六十甲子 = Array.from({ length: 60 }, (_, 索引) => `${天干[索引 % 10]}${地支[索引 % 12]}`);
const 上游版本 = JSON.parse(readFileSync(resolve(process.cwd(), "node_modules", "lunar-typescript", "package.json"), "utf8")).version;
if (上游版本 !== "1.8.6") throw new Error(`迁移源必须是lunar-typescript 1.8.6，当前为${上游版本}`);

function 时柱(日柱, 时支) {
  const 日干索引 = 天干.indexOf(日柱[0]);
  const 时支索引 = 地支.indexOf(时支);
  const 子时天干索引 = (日干索引 % 5) * 2;
  return `${天干[(子时天干索引 + 时支索引) % 10]}${时支}`;
}

function 列表文字(内容) {
  return 内容.length === 0 || (内容.length === 1 && 内容[0] === "无") ? "无" : 内容.join("、");
}

const 表头 = [
  "# 数据名称：现代黄历时辰宜忌",
  "# 数据来源：lunar-typescript 1.8.6 时辰宜忌数据",
  "# 上游说明：数据源自2345历史黄历数据",
  "# 使用范围：仅用于“现代黄历宜忌体系”的时辰宜忌",
  "# 不用于：日宜忌、日吉凶、古籍神煞等",
  "# 上游项目：6tail/lunar-typescript",
  "# 许可：MIT",
  "",
];

const 数据行 = 六十甲子.flatMap((日柱) => 地支.map((时支) => {
  const 当前时柱 = 时柱(日柱, 时支);
  const 宜 = LunarUtil.getTimeYi(日柱, 当前时柱);
  const 忌 = LunarUtil.getTimeJi(日柱, 当前时柱);
  return `${日柱}日 ${时支}时：宜：${列表文字(宜)}；忌：${列表文字(忌)}`;
}));

if (数据行.length !== 720 || new Set(数据行.map((行) => 行.slice(0, 7))).size !== 720) {
  throw new Error("现代时辰宜忌迁移结果不是720个唯一组合");
}

writeFileSync(resolve(process.cwd(), "配置", "现代时辰宜忌.txt"), `${[...表头, ...数据行].join("\n")}\n`, "utf8");
console.log("已生成 配置/现代时辰宜忌.txt：720组");
