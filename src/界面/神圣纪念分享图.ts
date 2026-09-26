import QRCode from "qrcode";
import { 合成完整神像, 读取神像图片 } from "./神像合成";

export const 分享图尺寸 = { 宽: 1080, 高: 1350 } as const;
export const 分享图二维码地址 = "https://sentomohiro.github.io/0f25bcf2bbb8a869e712/";

export interface 分享图内容 {
  神名: string;
  纪念类型: string;
  农历日期: string;
  公历日期: string;
  神像地址: string;
  背景地址: string;
  祥云地址: string;
  段落: Array<{ 标题: string; 正文: string }>;
}

function 圆角矩形(画笔: CanvasRenderingContext2D, x: number, y: number, 宽: number, 高: number, 半径: number): void {
  画笔.beginPath();
  画笔.roundRect(x, y, 宽, 高, 半径);
}

function 换行(画笔: CanvasRenderingContext2D, 文本: string, 最宽: number): string[] {
  const 行: string[] = [];
  for (const 原行 of 文本.split(/\r?\n/u)) {
    if (!原行) { 行.push(""); continue; }
    let 当前 = "";
    for (const 字 of 原行) {
      if (当前 && 画笔.measureText(当前 + 字).width > 最宽) {
        行.push(当前);
        当前 = 字;
      } else 当前 += 字;
    }
    if (当前) 行.push(当前);
  }
  return 行;
}

interface 排版行 { 列: number; y: number; 文本: string; 标题: boolean }

function 计算信息排版(画笔: CanvasRenderingContext2D, 内容: 分享图内容, 字号: number): 排版行[] | null {
  const 行高 = 字号 * 1.52;
  const 标题高 = 字号 * 1.7;
  const 列宽 = 444;
  const 最大纵坐标 = 1233;
  画笔.font = `${字号}px "Songti SC", "STSong", "Noto Serif CJK SC", serif`;
  const 段 = 内容.段落.filter((项) => 项.正文.trim()).map((项) => ({ 标题: 项.标题, 行: 换行(画笔, 项.正文.trim(), 列宽) }));
  const 排版: 排版行[] = [];
  let 当前列 = 0;
  let y = 868;
  for (const 项 of 段) {
    if (y + 标题高 + 行高 > 最大纵坐标 && 当前列 === 0) { 当前列 = 1; y = 868; }
    if (y + 标题高 + 行高 > 最大纵坐标) return null;
    排版.push({ 列: 当前列, y, 文本: 项.标题, 标题: true });
    y += 标题高 + 8;
    for (const 行 of 项.行) {
      if (y + 行高 > 最大纵坐标) {
        if (当前列 === 1) return null;
        当前列 = 1;
        y = 868;
        排版.push({ 列: 当前列, y, 文本: `${项.标题}（续）`, 标题: true });
        y += 标题高 + 8;
        if (y + 行高 > 最大纵坐标) return null;
      }
      排版.push({ 列: 当前列, y, 文本: 行, 标题: false });
      y += 行高;
    }
    y += 10;
  }
  return 排版;
}

function 绘制信息(画笔: CanvasRenderingContext2D, 内容: 分享图内容): void {
  const 最优 = [21, 19, 17, 15, 13].map((字号) => ({ 字号, 排版: 计算信息排版(画笔, 内容, 字号) })).find((项) => 项.排版);
  if (!最优?.排版) throw new Error("本条纪念内容超出单张分享图容量");
  const { 字号, 排版 } = 最优;
  const 起点 = [76, 558];
  for (const 行 of 排版) {
    画笔.fillStyle = 行.标题 ? "#704713" : "#3d2d22";
    画笔.font = 行.标题
      ? `600 ${字号 + 4}px "Songti SC", "STSong", serif`
      : `${字号}px "Songti SC", "STSong", "Noto Serif CJK SC", serif`;
    画笔.fillText(行.文本, 起点[行.列], 行.y);
  }
}

export async function 生成神圣纪念分享图(内容: 分享图内容): Promise<HTMLCanvasElement> {
  const 画布 = document.createElement("canvas");
  画布.width = 分享图尺寸.宽;
  画布.height = 分享图尺寸.高;
  const 画笔 = 画布.getContext("2d");
  if (!画笔) throw new Error("浏览器无法创建分享图画布");

  if (内容.神像地址) {
    const 神像 = await 合成完整神像(内容.神像地址, 内容.背景地址, 内容.祥云地址, {
      宽: 1080, 高: 1350,
      主体区域: { x: 145, y: 24, 宽: 790, 高: 708 },
      祥云区域: { x: 0, y: 0, 宽: 1080, 高: 1350 },
    });
    画笔.drawImage(神像, 0, 0);
  } else {
    const 背景 = await 读取神像图片(内容.背景地址);
    画笔.drawImage(背景, 0, 0, 1080, 1350);
  }

  画笔.fillStyle = "rgba(255, 248, 235, 0.92)";
  圆角矩形(画笔, 42, 704, 996, 540, 24);
  画笔.fill();
  画笔.strokeStyle = "rgba(170, 120, 44, 0.68)";
  画笔.lineWidth = 2;
  画笔.stroke();
  画笔.textAlign = "center";
  画笔.fillStyle = "#93362c";
  画笔.font = '600 27px "Songti SC", "STSong", serif';
  画笔.fillText(内容.纪念类型, 540, 750, 900);
  画笔.fillStyle = "#704713";
  画笔.font = '600 46px "Songti SC", "STSong", serif';
  画笔.fillText(内容.神名, 540, 808, 900);
  画笔.font = '23px "Songti SC", "STSong", serif';
  画笔.fillText(`${内容.农历日期}  ·  ${内容.公历日期}`, 540, 842, 900);
  画笔.textAlign = "left";
  画笔.fillStyle = "rgba(170, 120, 44, 0.55)";
  画笔.fillRect(540, 866, 1, 360);
  绘制信息(画笔, 内容);

  画笔.fillStyle = "rgba(255, 248, 235, 0.96)";
  画笔.fillRect(0, 1248, 1080, 102);
  画笔.fillStyle = "#aa782c";
  画笔.fillRect(48, 1280, 4, 36);
  画笔.fillStyle = "#704713";
  画笔.font = '600 25px "Songti SC", "STSong", serif';
  画笔.fillText("传统历法日历系统", 68, 1308);
  画笔.font = '18px "Songti SC", "STSong", serif';
  画笔.fillText("扫码查看日历", 816, 1308);
  const 二维码 = await QRCode.toDataURL(分享图二维码地址, { margin: 0, width: 120, color: { dark: "#5d3026", light: "#fff8eb" } });
  const 二维码图片 = await 读取神像图片(二维码);
  画笔.drawImage(二维码图片, 958, 1252, 92, 92);
  return 画布;
}
