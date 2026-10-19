import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("wallet.addBalance", () => {
  it("rejects a balance adjustment from a non-admin user", async () => {
    const ctx: TrpcContext = {
      user: {
        id: 11,
        openId: "regular-user",
        name: "Regular User",
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

    const caller = appRouter.createCaller(ctx);

    await expect(caller.wallet.addBalance({ amount: 1000 })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
