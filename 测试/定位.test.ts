import { describe, expect, it } from "vitest";
import { 获取浏览器定位, type 浏览器定位接口 } from "../src/定位";

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
