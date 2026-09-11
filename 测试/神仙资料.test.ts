import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  人物有前台内容,
  纪念有前台内容,
  获取全部神圣纪念,
  获取神圣纪念日,
  匹配神圣纪念人物,
  查找神仙人物,
  解析神圣纪念与神仙资料,
} from "../src/规则/神圣纪念与神仙资料";

const 配置文本 = readFileSync(resolve(process.cwd(), "配置/神圣纪念与神仙资料.txt"), "utf8");
const 配置 = 解析神圣纪念与神仙资料("神圣纪念与神仙资料.txt", 配置文本);

function 命中主名称(文本: string): string[] {
  return 匹配神圣纪念人物(文本, 配置.人物).map((命中) => 命中.人物.主名称);
}

describe("神仙资料正式配置", () => {
  it("完整解析全部人物块且主名称与别名均唯一", () => {
    expect(配置.错误).toEqual([]);
    expect(配置.人物).toHaveLength(152);
    expect(new Set(配置.人物.map((人物) => 人物.主名称)).size).toBe(152);
  });

  it("统一配置完整承载人物、纪念事件与全部已选定宝诰", () => {
    const 人物事件数 = 配置.人物.reduce((总数, 人物) => 总数 + 人物.纪念事件.length, 0);
    expect(人物事件数).toBe(161);
    expect(配置.独立纪念事件).toHaveLength(21);
    expect(配置.人物.filter((人物) => 人物.宝诰)).toHaveLength(91);
    expect(配置.人物.filter((人物) => 人物.宝诰标题 && !人物.宝诰)).toEqual([]);
    expect(配置.人物.filter((人物) => 人物.简介)).toHaveLength(65);
    expect(配置.人物.filter((人物) => !人物.神像 && !人物.宝诰 && !人物.简介)).toHaveLength(0);
  });

  it("锁定已确定宝诰版本的关键异文", () => {
    const 正文 = (人物: string) => 查找神仙人物(配置.人物, 人物)?.宝诰 ?? "";
    expect(正文("祖天师张道陵")).toContain("泰玄上相，扶教三天");
    expect(正文("玄天上帝")).toContain("九天游奕使。佐天罡北极");
    expect(正文("太乙救苦天尊")).toMatch(/青玄九阳上帝。$/u);
    expect(正文("王灵官")).toMatch(/太乙雷神应化天尊。$/u);
    expect(正文("九天应元雷声普化天尊")).toEqual(expect.stringContaining("以智慧力，而伏诸魔"));
    expect(正文("九天应元雷声普化天尊")).toEqual(expect.stringContaining("运行三界"));
    expect(正文("九天应元雷声普化天尊")).toEqual(expect.stringContaining("趺九凤"));
    expect(正文("元始天尊")).toEqual(expect.stringContaining("开明三景，化生诸天"));
    expect(正文("炳灵公")).toContain("降福降祥降福祉");
    expect(正文("玉阳真人王处一")).toContain("道力监凝");
    expect(正文("长真真人谭处端")).toContain("忍辱炼无明之火");
    expect(正文("大成至圣先师孔子")).toContain("系易执礼");
    expect(正文("大成至圣先师孔子")).toContain("孝义之经");
    expect(正文("大成至圣先师孔子")).not.toMatch(/繁易执礼|孝父之经/u);
    expect(正文("太阳星君")).toMatch(/太阳.*天尊。$/u);
    expect(正文("太阴星君")).toMatch(/太阴.*天尊。$/u);
    expect(正文("北斗九皇")).toContain("北斗九皇赐福星君");
    expect(正文("南斗六司延寿星君")).toContain("南斗六司，延寿星君");
    expect(正文("许天师")).toContain("混元始祖，一炁分真");
    expect(正文("许天师")).toContain("救灾拔难");
    expect(正文("许天师")).toContain("神功妙济");
    expect(正文("许天师")).toContain("掌九天司籍");
    expect(正文("许天师")).toContain("太乙定命");
    expect(正文("许天师")).toContain("九州都仙太使");
    expect(正文("许天师")).not.toMatch(/掌九天司职|太一定命|天机伏魔上相|九州都仙太史/u);
  });

  it("91篇宝诰均有中文句读、完整结句和具体出处", () => {
    const 宝诰人物 = 配置.人物.filter((人物) => 人物.宝诰);
    const 异常 = 宝诰人物.filter((人物) => {
      const 标点数 = 人物.宝诰.match(/[，。；：！？]/gu)?.length ?? 0;
      return 标点数 < 3 || !人物.宝诰.endsWith("。") || !人物.宝诰出处 || /^(?:通行本|道门通行本|现行功课体系)$/u.test(人物.宝诰出处);
    }).map((人物) => 人物.主名称);
    expect(异常, `宝诰句读或出处异常：${异常.join("、")}`).toEqual([]);
    expect(配置文本).not.toMatch(/九州岛都仙太史|金鞭银闲|配位与于|鼓明庻|德惠龎弘|开明幽壌|行健于成干/u);
  });

  it("同一人物直接拥有多条纪念事件且运行时保留明确人物关系", () => {
    const 紫微 = 查找神仙人物(配置.人物, "中天紫微北极大帝");
    const 燃灯 = 查找神仙人物(配置.人物, "燃灯古佛");
    expect(紫微?.纪念事件.map((事件) => 事件.名称)).toEqual(expect.arrayContaining(["紫微大帝圣诞", "中天紫微北极大帝下降"]));
    expect(燃灯?.纪念事件.map((事件) => 事件.名称)).toEqual(expect.arrayContaining(["定光佛圣诞", "燃灯佛圣诞"]));
    expect(获取神圣纪念日(配置, { 年: 2026, 月: 8, 日: 5, 月名: "八月", 日名: "初五", 是否闰月: false, 显示: "八月初五" }))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ 名称: "北方雷祖圣诞", 人物: expect.objectContaining({ 主名称: "北方雷祖" }) }),
        expect.objectContaining({ 名称: "雷声天帝下降", 人物: expect.objectContaining({ 主名称: "雷声天帝" }) }),
      ]));
  });

  it("独立纪念不创建假人物并使用事件级详情", () => {
    const 事件 = 获取神圣纪念日(配置, { 年: 2026, 月: 5, 日: 5, 月名: "五月", 日名: "初五", 是否闰月: false, 显示: "五月初五" })
      .find((项目) => 项目.名称 === "地腊之辰");
    expect(事件).toEqual(expect.objectContaining({ 人物: null }));
    expect(事件?.事件.纪念简介).toContain("五腊");
    expect(纪念有前台内容(事件!)).toBe(true);
  });

  it("全部182条神圣纪念详情覆盖率为100%", () => {
    const 全部 = 获取全部神圣纪念(配置);
    const 缺失 = 全部
      .filter((纪念) => !纪念有前台内容(纪念))
      .map((纪念) => `${纪念.事件.日期.原文} ${纪念.名称}`);
    expect(全部).toHaveLength(182);
    expect(缺失, `缺少详情的神圣纪念：\n${缺失.join("\n")}`).toEqual([]);
  });

  it("人物型、跨人物绑定和纯事件型详情均能解析", () => {
    const 全部 = 获取全部神圣纪念(配置);
    expect(全部.find((纪念) => 纪念.名称 === "太阴朝元之辰"))
      .toEqual(expect.objectContaining({ 人物: expect.objectContaining({ 主名称: "太阴星君" }) }));
    expect(全部.find((纪念) => 纪念.名称 === "南斗下降"))
      .toEqual(expect.objectContaining({ 人物: expect.objectContaining({ 主名称: "南斗六司延寿星君" }) }));
    expect(全部.find((纪念) => 纪念.名称 === "诸佛下界探访善恶"))
      .toEqual(expect.objectContaining({ 人物: null, 事件: expect.objectContaining({ 纪念简介: expect.any(String) }) }));
  });

  it("许天师的正月圣诞与八月飞升日分别关联同一正式人物", () => {
    const 许天师 = 查找神仙人物(配置.人物, "许天师");
    const 八月初一 = 获取神圣纪念日(配置, { 年: 2026, 月: 8, 日: 1, 月名: "八月", 日名: "初一", 是否闰月: false, 显示: "八月初一" });
    const 正月廿八 = 获取神圣纪念日(配置, { 年: 2026, 月: 1, 日: 28, 月名: "正月", 日名: "廿八", 是否闰月: false, 显示: "正月廿八" });
    expect(许天师).toEqual(expect.objectContaining({ 宝诰标题: "许天师宝诰" }));
    expect(八月初一).toEqual(expect.arrayContaining([
      expect.objectContaining({ 名称: "许天师得道飞升日", 人物: expect.objectContaining({ 主名称: "许天师" }) }),
    ]));
    expect(八月初一.map((纪念) => 纪念.名称)).not.toContain("神功妙济真君圣诞");
    expect(正月廿八).toEqual(expect.arrayContaining([
      expect.objectContaining({ 名称: "许天师圣诞", 人物: expect.objectContaining({ 主名称: "许天师" }) }),
    ]));
  });

  it("所有“之辰”与重点修持纪日均留在神圣纪念并有详情", () => {
    const 全部 = 获取全部神圣纪念(配置);
    const 之辰 = 全部.filter((纪念) => 纪念.名称.includes("之辰"));
    expect(之辰.length).toBeGreaterThanOrEqual(10);
    expect(之辰.every(纪念有前台内容)).toBe(true);
    for (const 名称 of [
      "诸佛下界探访善恶", "显大神通降魔", "天地主炁及造化万物之辰",
      "南瞻部洲转大法轮", "念经一卷胜常日",
    ]) {
      expect(全部.find((纪念) => 纪念.名称 === 名称)?.事件.纪念简介, 名称).toBeTruthy();
    }
  });

  it("迁移后旧配置已移除且不存在传统节日数据", () => {
    expect(existsSync(resolve(process.cwd(), "配置/神圣纪念日.txt"))).toBe(false);
    expect(existsSync(resolve(process.cwd(), "配置/神仙资料.txt"))).toBe(false);
    expect(配置文本).not.toContain("民俗涅槃日（放生日）");
    expect(配置文本).not.toMatch(/名称：(春节|端午节|中秋节)$/mu);
  });

  it("保留多行宝诰、简介、中文标点和原始段落", () => {
    const 样例 = `【人物：测试人物】\n匹配名称：测试；长测试名\n神像：\n宝诰标题：测试宝诰\n宝诰出处：测试底本\n宝诰版本说明：测试版本\n【宝诰开始】\n第一行，中文标点。\n第二行。\n\n第二段。\n【宝诰结束】\n【简介开始】\n简介第一行。\n简介第二行。\n【简介结束】\n【人物结束】`;
    const 结果 = 解析神圣纪念与神仙资料("样例.txt", 样例);
    expect(结果.错误).toEqual([]);
    expect(结果.人物[0].宝诰).toBe("第一行，中文标点。\n第二行。\n\n第二段。");
    expect(结果.人物[0].简介).toBe("简介第一行。\n简介第二行。");
  });

  it("允许空字段；人物补入简介后自动获得前台内容", () => {
    const 佛教人物 = 查找神仙人物(配置.人物, "弥勒菩萨");
    const 简介人物 = 查找神仙人物(配置.人物, "湛然天师张彦頨");
    expect(佛教人物).toBeDefined();
    expect(简介人物).toBeDefined();
    expect(人物有前台内容(佛教人物!)).toBe(true);
    expect(人物有前台内容(简介人物!)).toBe(true);
  });

  it("事件详情人物必须引用正式人物主名称", () => {
    const 样例 = `【人物：甲】\n匹配名称：甲\n神像：\n宝诰标题：\n宝诰出处：\n宝诰版本说明：\n【宝诰开始】\n\n【宝诰结束】\n【简介开始】\n甲简介\n【简介结束】\n【人物结束】\n\n【独立纪念事件】\n日期：农历正月初一\n名称：测试纪念\n类型：宗教纪念\n详情人物：不存在人物\n【纪念简介开始】\n事件简介\n【纪念简介结束】\n【独立纪念结束】`;
    const 结果 = 解析神圣纪念与神仙资料("引用.txt", 样例);
    expect(结果.错误).toEqual(expect.arrayContaining([
      expect.objectContaining({ 信息: expect.stringContaining("引用了不存在的人物") }),
    ]));
  });

  it("注释不参与解析，并明确报告跨人物重复别名", () => {
    const 块 = (人物: string, 别名: string) => `【人物：${人物}】\n匹配名称：${别名}\n神像：\n宝诰标题：\n宝诰出处：\n宝诰版本说明：\n【宝诰开始】\n\n【宝诰结束】\n【简介开始】\n\n【简介结束】\n【人物结束】`;
    const 结果 = 解析神圣纪念与神仙资料("重复.txt", `# 注释\n${块("甲", "同名")}\n${块("乙", "同名")}`);
    expect(结果.人物).toHaveLength(2);
    expect(结果.错误).toEqual([expect.objectContaining({ 信息: expect.stringContaining("匹配名称“同名”同时属于") })]);
  });

  it("明确报告不可解析日期、重复人物与重复正式纪念事件", () => {
    const 人物块 = (名称: string, 日期: string) => `【人物：${名称}】\n匹配名称：${名称}\n【纪念事件】\n日期：${日期}\n名称：同名圣诞\n类型：圣诞\n【纪念结束】\n神像：\n宝诰标题：\n宝诰出处：\n宝诰版本说明：\n【宝诰开始】\n\n【宝诰结束】\n【简介开始】\n\n【简介结束】\n【人物结束】`;
    const 错误日期 = 解析神圣纪念与神仙资料("错误日期.txt", 人物块("甲", "公历2026年1月1日"));
    expect(错误日期.错误).toEqual(expect.arrayContaining([expect.objectContaining({ 信息: expect.stringContaining("日期格式无法解析") })]));

    const 重复人物 = 解析神圣纪念与神仙资料("重复人物.txt", `${人物块("甲", "农历正月初一")}\n${人物块("甲", "农历正月初二")}`);
    expect(重复人物.错误).toEqual(expect.arrayContaining([expect.objectContaining({ 信息: expect.stringContaining("人物主名称“甲”重复") })]));

    const 重复事件 = 解析神圣纪念与神仙资料("重复事件.txt", `${人物块("甲", "农历正月初一")}\n${人物块("乙", "农历正月初一")}`);
    expect(重复事件.错误).toEqual(expect.arrayContaining([expect.objectContaining({ 信息: expect.stringContaining("纪念事件“同名圣诞”重复") })]));
  });
});

describe("神圣纪念人物最长匹配与同神异名", () => {
  it("井泉龙王优先于短名龙王", () => {
    const 命中 = 匹配神圣纪念人物("井泉龙王圣诞", 配置.人物);
    expect(命中[0].匹配文本).toBe("井泉龙王");
    expect(命中[0].人物.主名称).toBe("井泉龙王");
  });

  it.each([
    ["马元帅圣诞", "五显华光大帝马元帅"],
    ["华光大帝圣诞", "五显华光大帝马元帅"],
    ["五显灵官圣诞", "五显华光大帝马元帅"],
    ["玄天上帝飞升", "玄天上帝"],
    ["真武大帝圣诞", "玄天上帝"],
    ["佑圣真君圣诞", "玄天上帝"],
    ["正一靖应真君圣诞", "祖天师张道陵"],
    ["混元皇帝圣诞", "太上老君"],
    ["西子帝君圣诞", "太上老君"],
    ["刘真人圣诞", "长春真人刘渊然"],
    ["昌福真君圣诞", "祠山大帝张渤"],
    ["顶上娘娘圣诞", "碧霞元君"],
    ["定光佛圣诞", "燃灯古佛"],
    ["眼光娘娘圣诞", "眼光圣母惠照明目元君"],
  ])("%s 映射为 %s", (文本, 主名称) => {
    expect(命中主名称(文本)).toContain(主名称);
  });

  it("孙真人语境与药王孙真人严格分开", () => {
    expect(命中主名称("苏门真人孙登圣诞")).toEqual(expect.arrayContaining(["苏门真人孙登"]));
    expect(命中主名称("药王孙真人圣诞")).toEqual(["药王孙思邈"]);
  });

  it("葛雍、葛玄、谭处端与刘处玄严格分开", () => {
    expect(new Set(命中主名称("中元护正丹辉妙道真君葛雍圣诞"))).toEqual(new Set(["中元护正丹辉妙道真君"]));
    expect(new Set(命中主名称("葛孝先真人葛玄圣诞"))).toEqual(new Set(["葛仙翁葛玄"]));
    expect(new Set(命中主名称("长真真人谭处端圣诞"))).toEqual(new Set(["长真真人谭处端"]));
    expect(new Set(命中主名称("长生真人刘处玄圣诞"))).toEqual(new Set(["长生真人刘处玄"]));
  });

  it("本轮确认人物以唯一正式名称、身份与原纪念日期进入展示数据", () => {
    const 孙不二 = 查找神仙人物(配置.人物, "清静真人孙不二");
    const 水草马明王 = 查找神仙人物(配置.人物, "水草马明王");
    expect(孙不二).toMatchObject({
      主名称: "清静真人孙不二",
      纪念事件: [expect.objectContaining({ 日期: expect.objectContaining({ 月: 12, 起始日: 29 }) })],
    });
    expect(孙不二?.简介).toContain("清静散人姓孙，名寓春。");
    expect(孙不二?.简介).toContain("遂开创了道教全真道之清静派。");
    expect(水草马明王).toMatchObject({
      主名称: "水草马明王",
      纪念事件: [expect.objectContaining({ 日期: expect.objectContaining({ 月: 6, 起始日: 23 }) })],
    });
    expect(水草马明王?.主名称).not.toBe("五显华光大帝马元帅");
    expect(查找神仙人物(配置.人物, "五显华光大帝马元帅")?.纪念事件)
      .toEqual(expect.arrayContaining([expect.objectContaining({ 日期: expect.objectContaining({ 月: 9, 起始日: 28 }) })]));

    expect(查找神仙人物(配置.人物, "上元道化明曜妙感真君")).toMatchObject({ 主名称: "上元道化明曜妙感真君" });
    expect(查找神仙人物(配置.人物, "中元护正丹辉妙道真君")).toMatchObject({ 主名称: "中元护正丹辉妙道真君" });
    expect(查找神仙人物(配置.人物, "下元定志符应妙道真君")).toMatchObject({ 主名称: "下元定志符应妙道真君" });
  });

  it("雷祖、北方雷祖与雷声天帝严格分开", () => {
    expect(new Set(命中主名称("九天应元雷声普化天尊雷祖圣诞"))).toEqual(new Set(["九天应元雷声普化天尊"]));
    expect(命中主名称("北方雷祖圣诞")).toEqual(["北方雷祖"]);
    expect(命中主名称("雷声天帝下降")).toEqual(["雷声天帝"]);
  });

  it("同一纪念文本中的不同人物分别命中", () => {
    expect(命中主名称("关圣帝君与九天应元雷声普化天尊同日圣诞"))
      .toEqual(expect.arrayContaining(["关圣帝君", "九天应元雷声普化天尊"]));
  });
});
