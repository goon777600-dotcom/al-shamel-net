import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("admin.overview", () => {
  it("rejects a non-admin user", async () => {
    const ctx: TrpcContext = {
      user: {
        id: 12,
        openId: "customer-user",
        name: "Customer User",
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

    await expect(appRouter.createCaller(ctx).admin.overview()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
