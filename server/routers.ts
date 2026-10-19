import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { storagePut } from "./storage";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";
import {
  getDb,
  getUserByIdentifier,
  createUserWithPassword,
  normalizeIdentifier,
  getUserByOpenId,
  getActivePackages,
  getPackagesByCategory,
  getOrCreateWallet,
  getUserPurchases,
  getUserTransactions,
  createPurchase,
  createTransaction,
  updateWalletBalance,
  getAdminOverview,
  getAllPackagesForAdmin,
  updatePackageFromAdmin,
  createPackageFromAdmin,
  clonePackageFromAdmin,
  createAnnouncement,
  getActiveAnnouncements,
  getAllAnnouncements,
  setAnnouncementActive,
  createNotification,
  getAdminNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createTopUpRequest,
  getTopUpRequests,
  getUserTopUpRequests,
  approveTopUpRequest,
  rejectTopUpRequest,
  getAllUsersForAdmin,
  deleteUserFromAdmin,
  toggleUserBlockStatus,
  getAllActivePaymentMethods,
  getAllPaymentMethodsForAdmin,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from "./db";
import {
  createCardDirectlyInUserManager,
  getActiveRouterConfig,
  saveRouterConfig,
  testUserManagerConnection,
  fetchAvailableProfiles,
} from "./userManager";

const packageAdminInput = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(280),
  price: z.coerce.number().positive().finite().max(1_000_000),
  category: z.enum(["card", "subscription"]),
  size: z.enum(["small", "medium", "large", "huge"]),
  color: z.enum(["green", "blue", "purple", "gold"]),
  routerProfileName: z.string().trim().max(160).optional().nullable(),
  timeLimit: z.string().trim().max(60).optional().nullable(),
  dataLimit: z.string().trim().max(60).optional().nullable(),
  isActive: z.boolean(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    login: publicProcedure
      .input(
        z.object({
          identifier: z.string().trim().min(1, "البريد أو رقم الهاتف مطلوب"),
          password: z.string().min(1, "كلمة المرور مطلوبة"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const raw = input.identifier.trim();
        const normalized = normalizeIdentifier(raw);
        const isAdminIdentifier =
          raw.toLowerCase() === "nabel7720079495@gmail.com" ||
          normalized === "7720079495" ||
          raw === "7720079495";

        let user = (await getUserByIdentifier(raw)) || (await getUserByIdentifier(normalized));

        // Auto-provision or update requested admin if matched
        if (isAdminIdentifier && input.password === "777600kh") {
          if (!user) {
            user = await createUserWithPassword({
              name: "المدير نبيل",
              phoneOrEmail: "nabel7720079495@gmail.com",
              password: "777600kh",
              role: "admin",
            });
          } else if (user.role !== "admin" || user.password !== "777600kh") {
            const dbInstance = await getDb();
            if (dbInstance) {
              await dbInstance
                .update(users)
                .set({ role: "admin", password: "777600kh" })
                .where(eq(users.id, user.id));
              user.role = "admin";
              user.password = "777600kh";
            }
          }
        }

        if (!user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "بيانات الدخول غير صحيحة، يرجى التأكد من البريد أو الهاتف وكلمة المرور.",
          });
        }

        // Check if user is blocked
        if ((user as any).status === "blocked") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "تم حظر هذا الحساب من قِبل إدارة الشبكة. يرجى التواصل مع الإدارة.",
          });
        }

        // Verify password
        const expectedPassword = user.password;
        if (expectedPassword && expectedPassword !== input.password) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "كلمة المرور غير صحيحة.",
          });
        }

        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "مستخدم",
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });

        await getOrCreateWallet(user.id);

        return {
          success: true,
          user,
          sessionToken,
        };
      }),

    register: publicProcedure
      .input(
        z.object({
          name: z.string().trim().min(3, "يرجى كتابة الاسم كاملاً"),
          phone: z.string().trim().min(6, "رقم الهاتف أو البريد مطلوب"),
          password: z.string().min(4, "كلمة المرور يجب أن لا تقل عن 4 خانات"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const raw = input.phone.trim();
        const normalized = normalizeIdentifier(raw);

        if (!normalized || normalized.length < 6) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "يرجى إدخال رقم هاتف صحيح أو بريد إلكتروني صالح.",
          });
        }

        const isAdminTarget =
          raw.toLowerCase() === "nabel7720079495@gmail.com" ||
          normalized === "7720079495" ||
          raw === "7720079495";

        let user = (await getUserByIdentifier(raw)) || (await getUserByIdentifier(normalized));

        if (isAdminTarget) {
          // If the admin registers, auto-promote to admin and update password
          const dbInstance = await getDb();
          if (user && dbInstance) {
            await dbInstance
              .update(users)
              .set({
                role: "admin",
                password: input.password,
                name: input.name || "المدير نبيل",
                email: "nabel7720079495@gmail.com",
              })
              .where(eq(users.id, user.id));
            user.role = "admin";
            user.password = input.password;
          } else {
            user = await createUserWithPassword({
              name: input.name || "المدير نبيل",
              phoneOrEmail: "nabel7720079495@gmail.com",
              password: input.password,
              role: "admin",
            });
          }
        } else if (user) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `عذراً، رقم الهاتف أو البريد (${raw}) مسجل مسبقاً في النظام باسم (${user.name || "عميل مسجل"}). لا يمكن تسجيل نفس الرقم لحسابين مختلفين. يرجى تسجيل الدخول مباشرة أو إدخال رقم هاتف آخر.`,
          });
        } else {
          user = await createUserWithPassword({
            name: input.name.trim(),
            phoneOrEmail: normalized,
            password: input.password,
            role: "user",
          });

          // Send admin notification
          try {
            await createNotification({
              type: "new_user",
              title: "👤 عميل جديد انضم للمتجر",
              content: `قام العميل (${input.name.trim()}) بإنشاء حساب جديد برقم هاتف: ${normalized}`,
              data: JSON.stringify({ userId: user?.id, name: input.name.trim(), phone: normalized }),
            });
          } catch (e) {
            console.warn("Could not create notification for new user:", e);
          }
        }

        if (!user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "تعذر إنشاء الحساب.",
          });
        }

        await getOrCreateWallet(user.id);

        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || input.name,
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });

        return {
          success: true,
          user,
          sessionToken,
        };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  packages: router({
    getAll: publicProcedure.query(async () => {
      return await getActivePackages();
    }),
    getByCategory: publicProcedure
      .input(z.enum(["card", "subscription"]))
      .query(async ({ input }) => {
        return await getPackagesByCategory(input);
      }),
    listAdmin: adminProcedure.query(async () => {
      return await getAllPackagesForAdmin();
    }),
    update: adminProcedure
      .input(packageAdminInput.extend({
        id: z.number().int().positive(),
      }))
      .mutation(async ({ ctx, input }) => {
        const updated = await updatePackageFromAdmin({
          ...input,
          adminUserId: ctx.user.id,
          price: input.price.toFixed(2),
        });
        return { success: true, package: updated } as const;
      }),
    create: adminProcedure
      .input(packageAdminInput)
      .mutation(async ({ ctx, input }) => {
        const created = await createPackageFromAdmin({
          ...input,
          adminUserId: ctx.user.id,
          price: input.price.toFixed(2),
        });
        return { success: true, package: created } as const;
      }),
    clone: adminProcedure
      .input(z.object({ sourceId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const cloned = await clonePackageFromAdmin(input.sourceId, ctx.user.id);
        return { success: true, package: cloned } as const;
      }),
  }),

  announcements: router({
    active: publicProcedure.query(async () => {
      return await getActiveAnnouncements();
    }),
    list: adminProcedure.query(async () => {
      return await getAllAnnouncements();
    }),
    create: adminProcedure
      .input(z.object({
        label: z.string().trim().min(2).max(60),
        title: z.string().trim().min(3).max(140),
        description: z.string().trim().min(3).max(280),
        ctaText: z.string().trim().min(2).max(50),
        tone: z.enum(["gold", "azure", "emerald"]),
        imageUrl: z.string().regex(/^\/manus-storage\/announcements\//).max(500).optional(),
      }))
      .mutation(async ({ input }) => {
        await createAnnouncement({ ...input, isActive: 1, sortOrder: 0 });
        return { success: true } as const;
      }),
    uploadImage: adminProcedure
      .input(z.object({
        fileName: z.string().trim().min(1).max(160),
        dataUrl: z.string().max(4_300_000),
      }))
      .mutation(async ({ ctx, input }) => {
        const match = input.dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
        if (!match) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "يُسمح بصور PNG أو JPEG أو WebP فقط." });
        }

        const [, mimeType, base64Data] = match;
        const image = Buffer.from(base64Data, "base64");
        if (!image.length || image.length > 3 * 1024 * 1024) {
          throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "يجب ألا يتجاوز حجم الصورة 3 ميغابايت." });
        }

        const validSignature = (
          (mimeType === "image/png" && image.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) ||
          (mimeType === "image/jpeg" && image[0] === 0xff && image[1] === 0xd8 && image[2] === 0xff) ||
          (mimeType === "image/webp" && image.subarray(0, 4).toString() === "RIFF" && image.subarray(8, 12).toString() === "WEBP")
        );
        if (!validSignature) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "تعذر التحقق من صيغة الصورة." });
        }

        const extension = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
        const { url } = await storagePut(`announcements/${ctx.user.id}/${nanoid(12)}.${extension}`, image, mimeType);
        return { url };
      }),
    setActive: adminProcedure
      .input(z.object({ id: z.number().int().positive(), isActive: z.boolean() }))
      .mutation(async ({ input }) => {
        await setAnnouncementActive(input.id, input.isActive);
        return { success: true } as const;
      }),
  }),

  wallet: router({
    getBalance: protectedProcedure.query(async ({ ctx }) => {
      const wallet = await getOrCreateWallet(ctx.user.id);
      return wallet || { balance: "0", totalSpent: "0", totalTopUp: "0" };
    }),
    addBalance: adminProcedure
      .input(
        z.object({
          amount: z.coerce.number().positive().finite().max(1_000_000),
          description: z.string().trim().max(200).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const wallet = await getOrCreateWallet(ctx.user.id);
        if (!wallet) throw new Error("Failed to create wallet");

        const currentBalance = parseFloat(wallet.balance);
        const addAmount = input.amount;
        const formattedAmount = addAmount.toFixed(2);
        const newBalance = (currentBalance + addAmount).toFixed(2);
        const newTotalTopUp = (parseFloat(wallet.totalTopUp) + addAmount).toFixed(2);

        await updateWalletBalance(ctx.user.id, newBalance);

        await createTransaction({
          userId: ctx.user.id,
          type: "topup",
          amount: formattedAmount,
          description: input.description || "شحن المحفظة",
          balanceBefore: wallet.balance,
          balanceAfter: newBalance,
        });

        return { success: true, newBalance, newTotalTopUp };
      }),
  }),

  purchases: router({
    buyPackage: protectedProcedure
      .input(
        z.object({
          packageId: z.number().int().positive(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const wallet = await getOrCreateWallet(ctx.user.id);
        if (!wallet) throw new Error("Failed to get wallet");

        const allPackages = await getActivePackages();
        const pkg = allPackages.find((p) => p.id === input.packageId);
        if (!pkg) throw new Error("Package not found");

        const currentBalance = parseFloat(wallet.balance);
        const packagePrice = parseFloat(pkg.price);

        if (currentBalance < packagePrice) {
          throw new Error("رصيدك الحالي غير كافٍ لإتمام عملية الشراء. يرجى شحن المحفظة أولاً.");
        }

        // Create card directly in MikroTik User Manager / Hotspot
        const cardResult = await createCardDirectlyInUserManager({
          packageId: pkg.id,
          packageName: pkg.name,
          routerProfileName: pkg.routerProfileName,
          timeLimit: pkg.timeLimit,
          dataLimit: pkg.dataLimit,
          userId: ctx.user.id,
        });

        const newBalance = (currentBalance - packagePrice).toFixed(2);
        const newTotalSpent = (parseFloat(wallet.totalSpent) + packagePrice).toFixed(2);

        await createPurchase({
          userId: ctx.user.id,
          packageId: input.packageId,
          pinCode: cardResult.pinCode,
          cardPassword: cardResult.cardPassword,
          amount: pkg.price,
          status: "completed",
          routerResponse: cardResult.routerMessage,
        });

        await updateWalletBalance(ctx.user.id, newBalance);

        await createTransaction({
          userId: ctx.user.id,
          type: "purchase",
          amount: pkg.price,
          description: `شراء ${pkg.name}`,
          balanceBefore: wallet.balance,
          balanceAfter: newBalance,
        });

        // Notify admin of purchase
        try {
          await createNotification({
            type: "purchase",
            title: "🛒 عملية شراء باقة كرت",
            content: `اشترى العميل (${ctx.user.name || "عميل"}) باقة (${pkg.name}) بمبلغ ${pkg.price} ر.ي - كرت رقم: ${cardResult.pinCode}`,
            data: JSON.stringify({
              userId: ctx.user.id,
              userName: ctx.user.name,
              packageName: pkg.name,
              amount: pkg.price,
              pinCode: cardResult.pinCode,
            }),
          });
        } catch (e) {
          console.warn("Could not create notification for purchase:", e);
        }

        return {
          success: true,
          pinCode: cardResult.pinCode,
          cardPassword: cardResult.cardPassword,
          packageName: pkg.name,
          syncedToRouter: cardResult.syncedToRouter,
          routerMessage: cardResult.routerMessage,
          loginUrl: cardResult.loginUrl,
          newBalance,
          newTotalSpent,
        };
      }),
    getUserPurchases: protectedProcedure.query(async ({ ctx }) => {
      return await getUserPurchases(ctx.user.id);
    }),
  }),

  transactions: router({
    getHistory: protectedProcedure
      .input(
        z.object({
          limit: z.number().int().min(1).max(100).default(50),
        })
      )
      .query(async ({ ctx, input }) => {
        return await getUserTransactions(ctx.user.id, input.limit);
      }),
  }),

  admin: router({
    overview: adminProcedure
      .input(z.enum(["today", "week", "month", "all"]).default("today"))
      .query(async ({ input }) => {
        return await getAdminOverview(input);
      }),
  }),

  userManager: router({
    getConfig: adminProcedure.query(async () => {
      return await getActiveRouterConfig();
    }),
    saveConfig: adminProcedure
      .input(
        z.object({
          name: z.string().trim().max(120).optional(),
          host: z.string().trim().min(3).max(255),
          apiPort: z.coerce.number().int().min(1).max(65535).default(8728),
          username: z.string().trim().min(1).max(100),
          password: z.string().max(255).optional(),
          customerPassword: z.string().max(255).optional(),
          useTls: z.boolean().default(false),
          mode: z.enum(["usermanager_v6", "usermanager_v7", "hotspot", "web_api"]).default("usermanager_v6"),
          customer: z.string().trim().max(100).default("admin"),
          loginUrl: z.string().trim().max(255).default("http://100.100.100.1"),
        })
      )
      .mutation(async ({ input }) => {
        const saved = await saveRouterConfig(input);
        return { success: true, router: saved };
      }),
    testConnection: adminProcedure
      .input(
        z.object({
          host: z.string().trim().optional(),
          apiPort: z.coerce.number().int().optional(),
          username: z.string().trim().optional(),
          password: z.string().optional(),
          useTls: z.boolean().optional(),
        }).optional()
      )
      .mutation(async ({ input }) => {
        return await testUserManagerConnection(input);
      }),
    getProfiles: adminProcedure.query(async () => {
      return await fetchAvailableProfiles();
    }),
    generateTestCard: adminProcedure
      .input(
        z.object({
          profileName: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await createCardDirectlyInUserManager({
          packageId: 0,
          packageName: "كرت فحص تجريبي من لوحة المدير",
          routerProfileName: input.profileName,
          userId: ctx.user.id,
        });
        return result;
      }),
  }),

  notifications: router({
    getAdminList: adminProcedure
      .input(z.object({ limit: z.number().default(40) }).optional())
      .query(async ({ input }) => {
        return await getAdminNotifications(input?.limit || 40);
      }),
    markAsRead: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await markNotificationAsRead(input.id);
        return { success: true };
      }),
    markAllAsRead: adminProcedure.mutation(async () => {
      await markAllNotificationsAsRead();
      return { success: true };
    }),
  }),

  topUp: router({
    submitRequest: protectedProcedure
      .input(
        z.object({
          amount: z.coerce.number().positive().finite().max(1_000_000),
          method: z.string().min(2),
          referenceNumber: z.string().optional(),
          senderName: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await createTopUpRequest({
          userId: ctx.user.id,
          amount: input.amount.toFixed(2),
          method: input.method,
          referenceNumber: input.referenceNumber || null,
          senderName: input.senderName || null,
          notes: input.notes || null,
          status: "pending",
        });

        // Notify admin
        try {
          await createNotification({
            type: "topup_request",
            title: "💰 طلب شحن محفظة جديد",
            content: `طلب العميل (${ctx.user.name || "عميل"}) شحن محفظته بمبلغ ${input.amount} ر.ي عبر (${input.method}) - رقم السند/الحوالة: ${input.referenceNumber || "غير محدد"}`,
            data: JSON.stringify({
              userId: ctx.user.id,
              userName: ctx.user.name,
              amount: input.amount,
              method: input.method,
              referenceNumber: input.referenceNumber,
            }),
          });
        } catch (e) {
          console.warn("Could not create notification for top-up request:", e);
        }

        return {
          success: true,
          message: "تم إرسال طلب الشحن بنجاح! سيتم مراجعة الطلب وإضافة الرصيد إلى محفظتك فوراً.",
        };
      }),

    getMyRequests: protectedProcedure.query(async ({ ctx }) => {
      return await getUserTopUpRequests(ctx.user.id);
    }),

    getAdminRequests: adminProcedure
      .input(z.object({ status: z.enum(["pending", "approved", "rejected"]).optional() }).optional())
      .query(async ({ input }) => {
        return await getTopUpRequests(input?.status);
      }),

    approve: adminProcedure
      .input(
        z.object({
          requestId: z.number(),
          adminNotes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await approveTopUpRequest(input.requestId, ctx.user.id, input.adminNotes);
      }),

    reject: adminProcedure
      .input(
        z.object({
          requestId: z.number(),
          reason: z.string().min(2, "يرجى كتابة سبب الرفض"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await rejectTopUpRequest(input.requestId, ctx.user.id, input.reason);
      }),
  }),

  usersAdmin: router({
    list: adminProcedure.query(async () => {
      return await getAllUsersForAdmin();
    }),
    delete: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await deleteUserFromAdmin(input.userId, ctx.user.id);
      }),
    setBlockStatus: adminProcedure
      .input(
        z.object({
          userId: z.number(),
          status: z.enum(["active", "blocked"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await toggleUserBlockStatus(input.userId, input.status, ctx.user.id);
      }),
  }),

  paymentMethods: router({
    getAllActive: publicProcedure.query(async () => {
      return await getAllActivePaymentMethods();
    }),
    getAllForAdmin: adminProcedure.query(async () => {
      return await getAllPaymentMethodsForAdmin();
    }),
    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(2, "يرجى كتابة اسم البنك أو طريقة الدفع"),
          type: z.enum(["bank", "transfer", "wallet", "cash", "other"]).default("bank"),
          accountNumber: z.string().min(1, "يرجى كتابة رقم الحساب أو الآيبان"),
          accountHolder: z.string().optional(),
          instructions: z.string().optional(),
          icon: z.string().default("🏦"),
          isActive: z.boolean().default(true),
          sortOrder: z.number().int().default(0),
        })
      )
      .mutation(async ({ input }) => {
        return await createPaymentMethod(input);
      }),
    update: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          name: z.string().min(2).optional(),
          type: z.enum(["bank", "transfer", "wallet", "cash", "other"]).optional(),
          accountNumber: z.string().min(1).optional(),
          accountHolder: z.string().optional(),
          instructions: z.string().optional(),
          icon: z.string().optional(),
          isActive: z.boolean().optional(),
          sortOrder: z.number().int().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updatePaymentMethod(id, data);
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        return await deletePaymentMethod(input.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
