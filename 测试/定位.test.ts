import { describe, expect, it } from "vitest";
import { 定位失败提示, 获取浏览器定位, type 浏览器定位接口 } from "../src/定位";

const 失败定位 = (code: number): 浏览器定位接口 => ({
  getCurrentPosition(_成功, 失败) {
    失败?.({ code, message: `mock error ${code}` });
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
      尝试次数: 1,
    });
  });

  it("权限拒绝严格按error.code=1分类且不做无意义自动重试", async () => {
    let 调用次数 = 0;
    const 定位: 浏览器定位接口 = {
      getCurrentPosition(_成功, 失败) {
        调用次数 += 1;
        失败?.({ code: 1, message: "permission denied" });
      },
    };
    await expect(获取浏览器定位(定位)).resolves.toEqual({ 成功: false, 原因: "已拒绝", 错误码: 1, 尝试次数: 1 });
    expect(调用次数).toBe(1);
  });

  it("位置不可用严格按error.code=2分类并自动降级重试一次", async () => {
    let 调用次数 = 0;
    await expect(获取浏览器定位({
      getCurrentPosition(_成功, 失败) {
        调用次数 += 1;
        失败?.({ code: 2, message: "position unavailable" });
      },
    })).resolves.toEqual({ 成功: false, 原因: "不可用", 错误码: 2, 尝试次数: 2 });
    expect(调用次数).toBe(2);
  });

  it("超时严格按error.code=3分类并自动降级重试一次", async () => {
    await expect(获取浏览器定位(失败定位(3))).resolves.toEqual({ 成功: false, 原因: "超时", 错误码: 3, 尝试次数: 2 });
  });

  it("第一次位置不可用后可在第二次请求成功", async () => {
    let 调用次数 = 0;
    const 定位: 浏览器定位接口 = {
      getCurrentPosition(成功, 失败) {
        调用次数 += 1;
        if (调用次数 === 1) 失败?.({ code: 2, message: "cold start" });
        else 成功({ coords: { longitude: 121.47, latitude: 31.23, accuracy: 18 } });
      },
    };
    await expect(获取浏览器定位(定位)).resolves.toMatchObject({
      成功: true,
      经度: 121.47,
      纬度: 31.23,
      尝试次数: 2,
    });
  });

  it("浏览器不支持定位时返回无错误码的可降级结果", async () => {
    await expect(获取浏览器定位(undefined)).resolves.toEqual({
      成功: false,
      原因: "不支持",
      错误码: null,
      尝试次数: 0,
    });
  });

  it("非安全页面会在调用原生接口前明确拒绝定位请求", async () => {
    let 调用次数 = 0;
    const 定位: 浏览器定位接口 = { getCurrentPosition() { 调用次数 += 1; } };
    await expect(获取浏览器定位(定位, false)).resolves.toEqual({
      成功: false,
      原因: "非安全连接",
      错误码: null,
      尝试次数: 0,
    });
    expect(调用次数).toBe(0);
  });

  it("首次同步调用使用普通精度，code 2/3时第二次才提高精度", async () => {
    const 接收选项: PositionOptions[] = [];
    const 定位: 浏览器定位接口 = {
      getCurrentPosition(成功, 失败, 选项) {
        if (选项) 接收选项.push(选项);
        if (接收选项.length === 1) 失败?.({ code: 3, message: "timeout" });
        else 成功({ coords: { longitude: 116.4, latitude: 39.9, accuracy: 20 } });
      },
    };
    const 定位任务 = 获取浏览器定位(定位);
    expect(接收选项[0]).toEqual({ enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 });
    await 定位任务;
    expect(接收选项[1]).toEqual({ enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 });
  });

  it("失败完成后用户可再次发起新的原生定位请求", async () => {
    let 调用次数 = 0;
    const 定位: 浏览器定位接口 = {
      getCurrentPosition(_成功, 失败) {
        调用次数 += 1;
        失败?.({ code: 1 });
      },
    };
    await 获取浏览器定位(定位);
    await 获取浏览器定位(定位);
    expect(调用次数).toBe(2);
  });

  it("定位失败原因均有准确且不过度断言的中文说明", () => {
    expect(定位失败提示("已拒绝")).toContain("隐私与安全性");
    expect(定位失败提示("已拒绝")).toContain("当前网站");
    expect(定位失败提示("不可用")).toContain("已自动重试");
    expect(定位失败提示("超时")).toContain("已自动重试");
    expect(定位失败提示("不支持")).toContain("不支持定位");
    expect(定位失败提示("非安全连接")).toContain("不是安全连接");
  });

  it("浏览器抛出异常时不会让页面计算中断", async () => {
    const 定位: 浏览器定位接口 = {
      getCurrentPosition() {
        throw new Error("设备错误");
      },
    };
    await expect(获取浏览器定位(定位)).resolves.toEqual({
      成功: false,
      原因: "未知错误",
      错误码: null,
      尝试次数: 1,
    });
  });

  it("越界坐标会被拒绝", async () => {
    const 定位: 浏览器定位接口 = {
      getCurrentPosition(成功) {
        成功({ coords: { longitude: 200, latitude: 39, accuracy: 1 } });
      },
    };
    await expect(获取浏览器定位(定位)).resolves.toEqual({
      成功: false,
      原因: "坐标无效",
      错误码: null,
      尝试次数: 1,
    });
  });
});
