import { describe, expect, it } from "vitest";
import { 定位失败提示, 获取浏览器定位, type 浏览器定位接口 } from "../src/定位";

const 失败定位 = (code: number): 浏览器定位接口 => ({
  getCurrentPosition(_成功, 失败) {
    失败?.({ code });
  },
});

describe("浏览器定位与安全降级", () => {
  it("定位成功时只返回内存中的必要坐标", async () => {
    const 定位: 浏览器定位接口 = {
      getCurrentPosition(成功) {
        成功({ coords: { longitude: 116.4074, latitude: 39.9042, accuracy: 25 } });
      },
    };
    await expect(获取浏览器定位(定位)).resolves.toEqual({
      成功: true,
      经度: 116.4074,
      纬度: 39.9042,
      精度米: 25,
    });
  });

  it("用户拒绝授权时返回可降级结果", async () => {
    await expect(获取浏览器定位(失败定位(1))).resolves.toEqual({ 成功: false, 原因: "已拒绝" });
  });

  it("定位不可用时返回可降级结果", async () => {
    await expect(获取浏览器定位(失败定位(2))).resolves.toEqual({ 成功: false, 原因: "不可用" });
  });

  it("定位超时时返回可降级结果", async () => {
    await expect(获取浏览器定位(失败定位(3))).resolves.toEqual({ 成功: false, 原因: "超时" });
  });

  it("浏览器不支持定位时返回可降级结果", async () => {
    await expect(获取浏览器定位(undefined)).resolves.toEqual({ 成功: false, 原因: "不支持" });
  });

  it("非安全页面会明确拒绝定位请求", async () => {
    await expect(获取浏览器定位(失败定位(1), false)).resolves.toEqual({ 成功: false, 原因: "非安全连接" });
  });

  it("每次请求直接调用原生定位，并使用一次性定位选项", async () => {
    let 调用次数 = 0;
    let 接收选项: PositionOptions | undefined;
    const 定位: 浏览器定位接口 = {
      getCurrentPosition(成功, _失败, 选项) {
        调用次数 += 1;
        接收选项 = 选项;
        成功({ coords: { longitude: 116.4, latitude: 39.9, accuracy: 20 } });
      },
    };

    await 获取浏览器定位(定位);
    await 获取浏览器定位(定位);
    expect(调用次数).toBe(2);
    expect(接收选项).toEqual({ enableHighAccuracy: false, timeout: 15_000, maximumAge: 0 });
  });

  it("定位失败原因均有面向用户的明确说明", () => {
    expect(定位失败提示("已拒绝")).toContain("Safari网站设置");
    expect(定位失败提示("不可用")).toContain("稍后重试");
    expect(定位失败提示("超时")).toContain("重新获取");
    expect(定位失败提示("不支持")).toContain("不支持定位");
    expect(定位失败提示("非安全连接")).toContain("不是安全连接");
  });

  it("浏览器抛出异常时不会让页面计算中断", async () => {
    const 定位: 浏览器定位接口 = {
      getCurrentPosition() {
        throw new Error("设备错误");
      },
    };
    await expect(获取浏览器定位(定位)).resolves.toEqual({ 成功: false, 原因: "未知错误" });
  });

  it("越界坐标会被拒绝", async () => {
    const 定位: 浏览器定位接口 = {
      getCurrentPosition(成功) {
        成功({ coords: { longitude: 200, latitude: 39, accuracy: 1 } });
      },
    };
    await expect(获取浏览器定位(定位)).resolves.toEqual({ 成功: false, 原因: "坐标无效" });
  });
});
