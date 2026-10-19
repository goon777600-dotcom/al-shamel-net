import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("packages.update", () => {
  it("rejects a regular customer before any package data can be changed", async () => {
    const ctx: TrpcContext = {
      user: {
        id: 31,
        openId: "regular-customer-package-test",
        name: "Regular Customer",
        email: null,
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    await expect(
      appRouter.createCaller(ctx).packages.update({
        id: 1,
        name: "محاولة تعديل غير مصرح بها",
        description: "لا يمكن للعميل تغيير سعر أو نص الباقات.",
        price: 1,
        category: "card",
        size: "small",
        color: "green",
        isActive: true,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    await expect(
      appRouter.createCaller(ctx).packages.create({
        name: "باقة غير مصرح بها",
        description: "لا يمكن للعميل إنشاء باقة جديدة.",
        price: 1000,
        category: "card",
        size: "small",
        color: "green",
        isActive: true,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    await expect(
      appRouter.createCaller(ctx).packages.clone({ sourceId: 1 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
