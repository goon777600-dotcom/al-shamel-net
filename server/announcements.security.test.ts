import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("announcements.create", () => {
  it("rejects a regular customer", async () => {
    const ctx: TrpcContext = {
      user: {
        id: 22,
        openId: "regular-customer",
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
      appRouter.createCaller(ctx).announcements.create({
        label: "عرض",
        title: "رسالة غير مصرح بها",
        description: "لا ينبغي للعميل أن يستطيع نشرها.",
        ctaText: "استكشف",
        tone: "gold",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    await expect(
      appRouter.createCaller(ctx).announcements.uploadImage({
        fileName: "image.png",
        dataUrl: "data:image/png;base64,iVBORw0KGgo=",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
