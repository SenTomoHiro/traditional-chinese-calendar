import QRCode from "qrcode";
import { 合成完整神像, 读取神像图片 } from "./神像合成";

export const 分享图尺寸 = { 宽: 1080, 主视觉高: 1440 } as const;
export const 分享图二维码地址 = "https://sentomohiro.github.io/traditional-chinese-calendar/";

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

interface 正文行 { y: number; 文本: string; 是标题: boolean }
const 正文左边界 = 80;
const 正文右边界 = 1000;

function 换行(画笔: CanvasRenderingContext2D, 文本: string, 最宽: number): string[] {
  const 行: string[] = [];
  for (const 原行 of 文本.split(/\r?\n/u)) {
    if (!原行) { 行.push(""); continue; }
    let 当前 = "";
    for (const 字 of 原行) {
      if (当前 && 画笔.measureText(当前 + 字).width > 最宽) {
        if (/^[，。、；：！？）】”’]/u.test(字)) {
          行.push(当前 + 字);
          当前 = "";
        } else {
          行.push(当前);
          当前 = 字;
        }
      } else 当前 += 字;
    }
    if (当前) 行.push(当前);
  }
  return 行;
}

/** 正文只按实际存在的段落顺序向下排，不预留空栏或空章节。 */
function 计算正文排版(画笔: CanvasRenderingContext2D, 内容: 分享图内容): { 行: 正文行[]; 高: number } {
  const 行: 正文行[] = [];
  let y = 0;
  画笔.font = '20px "Songti SC", "STSong", "Noto Serif CJK SC", serif';
  for (const 段 of 内容.段落.filter((项) => 项.正文.trim())) {
    if (行.length) y += 12;
    行.push({ y: y + 25, 文本: 段.标题, 是标题: true });
    y += 39;
    for (const 文本 of 换行(画笔, 段.正文.trim(), 920)) {
      行.push({ y: y + 21, 文本, 是标题: false });
      y += 30;
    }
  }
  return { 行, 高: y };
}

function 绘制正文(画笔: CanvasRenderingContext2D, 排版: ReturnType<typeof 计算正文排版>, 起点: number): void {
  画笔.textAlign = "left";
  for (const 行 of 排版.行) {
    画笔.fillStyle = 行.是标题 ? "#8f3528" : "#3d2d22";
    画笔.font = 行.是标题
      ? '600 24px "Songti SC", "STSong", serif'
      : '20px "Songti SC", "STSong", "Noto Serif CJK SC", serif';
    画笔.fillText(行.文本, 正文左边界, 起点 + 行.y);
  }
}

/** 从标题延续到页脚的一层暖色纸面，与主视觉直接拼接。 */
function 绘制一体化纸面(画笔: CanvasRenderingContext2D, 顶部: number, 高: number): void {
  画笔.fillStyle = "#fff7ea";
  画笔.fillRect(0, 顶部, 分享图尺寸.宽, 高 - 顶部);
  const 渐变 = 画笔.createLinearGradient(0, 顶部, 0, 顶部 + 260);
  渐变.addColorStop(0, "rgba(255, 243, 224, 0.76)");
  渐变.addColorStop(0.55, "rgba(255, 246, 232, 0.92)");
  渐变.addColorStop(1, "rgba(255, 247, 234, 0.97)");
  画笔.fillStyle = 渐变;
  画笔.fillRect(0, 顶部, 分享图尺寸.宽, 高 - 顶部);
  画笔.beginPath();
  画笔.moveTo(0, 顶部 + 1);
  画笔.lineTo(分享图尺寸.宽, 顶部 + 1);
  画笔.strokeStyle = "rgba(147, 54, 44, 0.61)";
  画笔.lineWidth = 2;
  画笔.stroke();
}

export async function 生成神圣纪念分享图(内容: 分享图内容): Promise<HTMLCanvasElement> {
  const 画布 = document.createElement("canvas");
  const 画笔 = 画布.getContext("2d");
  if (!画笔) throw new Error("浏览器无法创建分享图画布");
  const 正文 = 计算正文排版(画笔, 内容);
  const 纸面顶部 = 分享图尺寸.主视觉高;
  const 正文起点 = 纸面顶部 + 190;
  const 页脚顶部 = 正文起点 + 正文.高 + 48;
  const 二维码顶部 = 页脚顶部 + 30;
  const 高 = 二维码顶部 + 96 + 28;
  画布.width = 分享图尺寸.宽;
  画布.height = 高;

  if (内容.神像地址) {
    const 神像 = await 合成完整神像(内容.神像地址, 内容.背景地址, 内容.祥云地址, {
      宽: 分享图尺寸.宽, 高: 分享图尺寸.主视觉高,
      主体区域: { x: 40, y: 28, 宽: 1000, 高: 1384 },
      祥云区域: { x: 0, y: 0, 宽: 分享图尺寸.宽, 高: 分享图尺寸.主视觉高 },
    });
    画笔.drawImage(神像, 0, 0);
  } else {
    const 背景 = await 读取神像图片(内容.背景地址);
    const 缩放 = Math.max(分享图尺寸.宽 / 背景.naturalWidth, 纸面顶部 / 背景.naturalHeight);
    const 宽 = 背景.naturalWidth * 缩放;
    画笔.drawImage(背景, (分享图尺寸.宽 - 宽) / 2, 0, 宽, 背景.naturalHeight * 缩放);
  }

  绘制一体化纸面(画笔, 纸面顶部, 高);
  画笔.textAlign = "center";
  画笔.fillStyle = "#a7782c";
  画笔.font = '600 26px "Songti SC", "STSong", serif';
  画笔.fillText(内容.纪念类型, 540, 纸面顶部 + 51, 900);
  画笔.fillStyle = "#70251e";
  画笔.font = '600 45px "Songti SC", "STSong", serif';
  画笔.fillText(内容.神名, 540, 纸面顶部 + 106, 900);
  画笔.font = '22px "Songti SC", "STSong", serif';
  画笔.fillStyle = "#704713";
  画笔.fillText(`${内容.农历日期}  ·  ${内容.公历日期}`, 540, 纸面顶部 + 144, 900);
  绘制正文(画笔, 正文, 正文起点);

  画笔.strokeStyle = "rgba(147, 54, 44, 0.31)";
  画笔.lineWidth = 1;
  画笔.beginPath();
  画笔.moveTo(正文左边界, 页脚顶部);
  画笔.lineTo(正文右边界, 页脚顶部);
  画笔.stroke();
  画笔.fillStyle = "#aa782c";
  画笔.fillRect(正文左边界, 二维码顶部 + 31, 4, 33);
  画笔.fillStyle = "#70251e";
  画笔.font = '600 25px "Songti SC", "STSong", serif';
  画笔.fillText("传统历法日历系统", 正文左边界 + 21, 二维码顶部 + 58);
  画笔.textAlign = "right";
  画笔.fillStyle = "#704713";
  画笔.font = '18px "Songti SC", "STSong", serif';
  画笔.fillText("扫码查看日历", 正文右边界 - 112, 二维码顶部 + 58);
  const 二维码 = await QRCode.toDataURL(分享图二维码地址, { margin: 0, width: 120, color: { dark: "#5d3026", light: "#fff8eb" } });
  const 二维码图片 = await 读取神像图片(二维码);
  画笔.drawImage(二维码图片, 正文右边界 - 96, 二维码顶部, 96, 96);
  return 画布;
}
