import { and, asc, count, desc, eq, gte, or, sum } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { ENV } from './_core/env';
import {
  Announcement,
  InsertAnnouncement,
  InsertPurchase,
  InsertTransaction,
  InsertUser,
  NetworkRouter,
  InsertNetworkRouter,
  adminAuditLogs,
  announcements,
  packages,
  purchases,
  transactions,
  users,
  wallets,
  networkRouters,
  notifications,
  InsertNotification,
  topUpRequests,
  InsertTopUpRequest,
  paymentMethods,
  PaymentMethod,
  InsertPaymentMethod,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId || user.openId === 'admin-nabel-7720079495') {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export function normalizeIdentifier(val: string): string {
  if (!val) return "";
  let clean = val.trim().toLowerCase().replace(/[\s\-\(\)]/g, "");
  if (clean.includes("@")) return clean;
  // Handle Yemeni phone prefixes (+967, 00967, 967, leading 0)
  if (clean.startsWith("+967")) clean = clean.slice(4);
  else if (clean.startsWith("00967")) clean = clean.slice(5);
  else if (clean.startsWith("967") && clean.length >= 11) clean = clean.slice(3);
  else if (clean.startsWith("0") && clean.length === 10) clean = clean.slice(1);
  return clean;
}

export async function getUserByIdentifier(identifier: string) {
  const db = await getDb();
  if (!db) return undefined;

  const raw = identifier.trim().toLowerCase();
  const normalized = normalizeIdentifier(raw);

  // Search by exact match or normalized phone
  const allUsers = await db.select().from(users);
  return allUsers.find(u => {
    if (u.email) {
      const uEmail = u.email.toLowerCase().trim();
      const uNorm = normalizeIdentifier(uEmail);
      if (uEmail === raw || uNorm === normalized || uEmail === normalized) return true;
    }
    if (u.openId && (u.openId.toLowerCase() === raw || u.openId.toLowerCase() === normalized)) return true;
    if (u.name && u.name.toLowerCase().trim() === raw) return true;
    return false;
  });
}

export async function createUserWithPassword(params: {
  name: string;
  phoneOrEmail: string;
  password?: string;
  role?: 'user' | 'admin';
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const openId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const clean = normalizeIdentifier(params.phoneOrEmail);
  const isEmail = clean.includes('@');
  await db.insert(users).values({
    openId,
    name: params.name,
    email: clean, // Always store normalized phone or email!
    password: params.password ?? null,
    loginMethod: isEmail ? 'email' : 'phone',
    role: params.role ?? 'user',
    lastSignedIn: new Date(),
  });
  return await getUserByOpenId(openId);
}

// Get all active packages
export async function getActivePackages() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get packages: database not available");
    return [];
  }

  return await db.select().from(packages).where(eq(packages.isActive, 1));
}

// Get packages by category
export async function getPackagesByCategory(category: 'card' | 'subscription') {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get packages: database not available");
    return [];
  }

  return await db.select().from(packages).where(and(eq(packages.category, category), eq(packages.isActive, 1)));
}

export async function getAllPackagesForAdmin() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(packages).orderBy(desc(packages.updatedAt));
}

type PackageAdminUpdate = {
  id: number;
  adminUserId: number;
  name: string;
  description: string;
  price: string;
  category: "card" | "subscription";
  size: "small" | "medium" | "large" | "huge";
  color: "green" | "blue" | "purple" | "gold";
  isActive: boolean;
  routerProfileName?: string | null;
  timeLimit?: string | null;
  dataLimit?: string | null;
};

export async function updatePackageFromAdmin(input: PackageAdminUpdate) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [before] = await db.select().from(packages).where(eq(packages.id, input.id)).limit(1);
  if (!before) throw new Error("Package not found");

  const updateValues = {
    name: input.name,
    description: input.description,
    price: input.price,
    category: input.category,
    size: input.size,
    color: input.color,
    routerProfileName: input.routerProfileName ?? before.routerProfileName,
    timeLimit: input.timeLimit ?? before.timeLimit,
    dataLimit: input.dataLimit ?? before.dataLimit,
    isActive: input.isActive ? 1 : 0,
    updatedAt: new Date(),
  } as const;

  await db.transaction(async (tx) => {
    await tx.update(packages).set(updateValues).where(eq(packages.id, input.id));
    await tx.insert(adminAuditLogs).values({
      adminUserId: input.adminUserId,
      action: "package.updated",
      targetType: "package",
      targetId: input.id,
      details: JSON.stringify({
        before: {
          name: before.name,
          description: before.description,
          price: before.price,
          category: before.category,
          size: before.size,
          color: before.color,
          isActive: before.isActive,
        },
        after: updateValues,
      }),
    });
  });

  const [updated] = await db.select().from(packages).where(eq(packages.id, input.id)).limit(1);
  return updated;
}

type PackageAdminCreate = Omit<PackageAdminUpdate, "id">;

export async function createPackageFromAdmin(input: PackageAdminCreate) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const newPackageId = await db.transaction(async (tx) => {
    const result = await tx.insert(packages).values({
      name: input.name,
      description: input.description,
      price: input.price,
      category: input.category,
      size: input.size,
      color: input.color,
      icon: "Wifi",
      routerProfileName: input.routerProfileName || null,
      timeLimit: input.timeLimit || null,
      dataLimit: input.dataLimit || null,
      isActive: input.isActive ? 1 : 0,
    });
    const id = Number(result[0].insertId);
    await tx.insert(adminAuditLogs).values({
      adminUserId: input.adminUserId,
      action: "package.created",
      targetType: "package",
      targetId: id,
      details: JSON.stringify({ package: { ...input, price: input.price } }),
    });
    return id;
  });

  const [created] = await db.select().from(packages).where(eq(packages.id, newPackageId)).limit(1);
  return created;
}

export async function clonePackageFromAdmin(sourceId: number, adminUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [source] = await db.select().from(packages).where(eq(packages.id, sourceId)).limit(1);
  if (!source) throw new Error("Package not found");

  const newPackageId = await db.transaction(async (tx) => {
    const result = await tx.insert(packages).values({
      name: `${source.name} - نسخة`,
      description: source.description,
      price: source.price,
      category: source.category,
      size: source.size,
      color: source.color,
      icon: source.icon || "Wifi",
      isActive: 0,
    });
    const id = Number(result[0].insertId);
    await tx.insert(adminAuditLogs).values({
      adminUserId,
      action: "package.cloned",
      targetType: "package",
      targetId: id,
      details: JSON.stringify({ sourcePackageId: sourceId, sourcePackageName: source.name }),
    });
    return id;
  });

  const [created] = await db.select().from(packages).where(eq(packages.id, newPackageId)).limit(1);
  return created;
}

export async function getActiveAnnouncements() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(announcements)
    .where(eq(announcements.isActive, 1))
    .orderBy(asc(announcements.sortOrder), desc(announcements.createdAt));
}

export async function getAllAnnouncements() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(announcements).orderBy(asc(announcements.sortOrder), desc(announcements.updatedAt));
}

export async function createAnnouncement(announcement: InsertAnnouncement) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(announcements).values(announcement);
}

export async function setAnnouncementActive(id: number, isActive: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(announcements).set({ isActive: isActive ? 1 : 0 }).where(eq(announcements.id, id));
}

export async function updateAnnouncement(id: number, data: Partial<InsertAnnouncement>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(announcements).set(data).where(eq(announcements.id, id));
}

export async function deleteAnnouncement(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(announcements).where(eq(announcements.id, id));
}

// Get user wallet
export async function getUserWallet(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get wallet: database not available");
    return null;
  }

  const result = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// Create or get user wallet
export async function getOrCreateWallet(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create wallet: database not available");
    return null;
  }

  let wallet = await getUserWallet(userId);
  if (!wallet) {
    await db.insert(wallets).values({
      userId,
      balance: '0',
      totalSpent: '0',
      totalTopUp: '0',
    });
    wallet = await getUserWallet(userId);
  }
  return wallet;
}

// Get user purchases
export async function getUserPurchases(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get purchases: database not available");
    return [];
  }

  return await db
    .select({
      id: purchases.id,
      userId: purchases.userId,
      packageId: purchases.packageId,
      pinCode: purchases.pinCode,
      cardPassword: purchases.cardPassword,
      amount: purchases.amount,
      status: purchases.status,
      routerResponse: purchases.routerResponse,
      createdAt: purchases.createdAt,
      packageName: packages.name,
      packageCategory: packages.category,
      packageSize: packages.size,
      timeLimit: packages.timeLimit,
      dataLimit: packages.dataLimit,
    })
    .from(purchases)
    .innerJoin(packages, eq(purchases.packageId, packages.id))
    .where(eq(purchases.userId, userId))
    .orderBy(desc(purchases.createdAt));
}

// Get user transactions
export async function getUserTransactions(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get transactions: database not available");
    return [];
  }

  return await db.select().from(transactions).where(eq(transactions.userId, userId)).limit(limit);
}

// Create purchase
export async function createPurchase(purchase: InsertPurchase) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create purchase: database not available");
    return null;
  }

  const result = await db.insert(purchases).values(purchase);
  return result;
}

// Create transaction
export async function createTransaction(transaction: InsertTransaction) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create transaction: database not available");
    return null;
  }

  return await db.insert(transactions).values(transaction);
}

// Update wallet balance
export async function updateWalletBalance(userId: number, newBalance: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update wallet: database not available");
    return null;
  }

  return await db.update(wallets).set({ balance: newBalance }).where(eq(wallets.userId, userId));
}

export type AdminOverviewPeriod = "today" | "week" | "month" | "all";

export function getOverviewStart(period: AdminOverviewPeriod, now = new Date()): Date | undefined {
  if (period === "all") return undefined;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === "week") start.setDate(start.getDate() - 6);
  if (period === "month") start.setDate(1);
  return start;
}

// Administrative overview from real application data; access is enforced in the router.
export async function getAdminOverview(period: AdminOverviewPeriod = "today") {
  const db = await getDb();
  if (!db) {
    return {
      totalPackages: 0,
      totalUsers: 0,
      totalOrders: 0,
      totalSales: "0",
      recentOrders: [],
    };
  }

  const purchaseStart = getOverviewStart(period);
  const purchaseFilter = purchaseStart ? gte(purchases.createdAt, purchaseStart) : undefined;
  const [packageCount] = await db.select({ value: count() }).from(packages);
  const [userCount] = await db.select({ value: count() }).from(users);
  const [orderCount] = await db.select({ value: count() }).from(purchases).where(purchaseFilter);
  const [salesTotal] = await db.select({ value: sum(purchases.amount) }).from(purchases).where(purchaseFilter);
  const recentOrders = await db
    .select({
      id: purchases.id,
      amount: purchases.amount,
      status: purchases.status,
      createdAt: purchases.createdAt,
      packageName: packages.name,
    })
    .from(purchases)
    .innerJoin(packages, eq(purchases.packageId, packages.id))
    .where(purchaseFilter)
    .orderBy(desc(purchases.createdAt))
    .limit(5);

  return {
    totalPackages: Number(packageCount?.value ?? 0),
    totalUsers: Number(userCount?.value ?? 0),
    totalOrders: Number(orderCount?.value ?? 0),
    totalSales: salesTotal?.value ?? "0",
    recentOrders,
  };
}

// ==================== Router & UserManager Helpers ====================

export async function getDefaultRouter(): Promise<NetworkRouter | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const [res] = await db.select().from(networkRouters).where(eq(networkRouters.isDefault, true)).limit(1);
  if (res) return res;
  const [fallback] = await db.select().from(networkRouters).limit(1);
  return fallback;
}

export async function saveRouterSettings(input: {
  id?: number;
  name?: string;
  host: string;
  apiPort?: number;
  username: string;
  password?: string;
  customerPassword?: string;
  useTls?: boolean;
  mode?: "usermanager_v6" | "usermanager_v7" | "hotspot" | "web_api";
  customer?: string;
  loginUrl?: string;
}): Promise<NetworkRouter> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const port = input.apiPort || 8728;
  const mode = input.mode || "usermanager_v6";
  const customer = input.customer || "admin";
  const name = input.name || "خادم اليوزرمانجر الرئيسي";
  const loginUrl = input.loginUrl || "http://100.100.100.1";
  const customerPassword = input.customerPassword ?? "";

  if (input.id) {
    await db
      .update(networkRouters)
      .set({
        name,
        host: input.host,
        apiPort: port,
        username: input.username,
        password: input.password ?? "",
        customerPassword,
        useTls: input.useTls ?? false,
        mode,
        customer,
        loginUrl,
        updatedAt: new Date(),
      })
      .where(eq(networkRouters.id, input.id));

    const [updated] = await db.select().from(networkRouters).where(eq(networkRouters.id, input.id));
    return updated;
  } else {
    const existing = await getDefaultRouter();
    if (existing) {
      await db
        .update(networkRouters)
        .set({
          name,
          host: input.host,
          apiPort: port,
          username: input.username,
          password: input.password ?? "",
          customerPassword,
          useTls: input.useTls ?? false,
          mode,
          customer,
          loginUrl,
          updatedAt: new Date(),
        })
        .where(eq(networkRouters.id, existing.id));

      const [updated] = await db.select().from(networkRouters).where(eq(networkRouters.id, existing.id));
      return updated;
    }

    const result = await db.insert(networkRouters).values({
      name,
      host: input.host,
      apiPort: port,
      username: input.username,
      password: input.password ?? "",
      customerPassword,
      useTls: input.useTls ?? false,
      mode,
      customer,
      loginUrl,
      isDefault: true,
      status: "unknown",
    });

    const newId = Number(result[0].insertId);
    const [created] = await db.select().from(networkRouters).where(eq(networkRouters.id, newId));
    return created;
  }
}

export async function updateRouterStatus(
  id: number,
  data: {
    status: "online" | "offline" | "error" | "unknown";
    lastCheckedAt?: Date;
    lastError?: string | null;
    systemIdentity?: string;
    routerosVersion?: string;
    boardName?: string;
    uptime?: string;
  }
) {
  const db = await getDb();
  if (!db) return;
  await db.update(networkRouters).set(data).where(eq(networkRouters.id, id));
}

// ==========================================
// Notifications & Top-Up Requests Helpers
// ==========================================

export async function createNotification(input: InsertNotification) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(notifications).values(input);
  return result;
}

export async function getAdminNotifications(limit: number = 40) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(notifications)
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsAsRead() {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true });
}

export async function createTopUpRequest(input: InsertTopUpRequest) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(topUpRequests).values(input);
  return result;
}

export async function getTopUpRequests(status?: "pending" | "approved" | "rejected") {
  const db = await getDb();
  if (!db) return [];
  const query = db
    .select({
      id: topUpRequests.id,
      userId: topUpRequests.userId,
      amount: topUpRequests.amount,
      method: topUpRequests.method,
      referenceNumber: topUpRequests.referenceNumber,
      senderName: topUpRequests.senderName,
      notes: topUpRequests.notes,
      status: topUpRequests.status,
      adminNotes: topUpRequests.adminNotes,
      reviewedAt: topUpRequests.reviewedAt,
      createdAt: topUpRequests.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(topUpRequests)
    .innerJoin(users, eq(topUpRequests.userId, users.id))
    .orderBy(desc(topUpRequests.createdAt));

  if (status) {
    return await query.where(eq(topUpRequests.status, status));
  }
  return await query;
}

export async function getUserTopUpRequests(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(topUpRequests)
    .where(eq(topUpRequests.userId, userId))
    .orderBy(desc(topUpRequests.createdAt));
}

export async function approveTopUpRequest(
  requestId: number,
  adminId: number,
  adminNotes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");

  const [request] = await db
    .select()
    .from(topUpRequests)
    .where(eq(topUpRequests.id, requestId))
    .limit(1);

  if (!request) throw new Error("طلب الشحن غير موجود");
  if (request.status !== "pending") throw new Error("تمت معالجة هذا الطلب مسبقاً");

  const amountNum = parseFloat(request.amount);
  const wallet = await getOrCreateWallet(request.userId);
  if (!wallet) throw new Error("تعذر جلب محفظة العميل");

  const currentBalance = parseFloat(wallet.balance);
  const newBalance = (currentBalance + amountNum).toFixed(2);
  const newTotalTopUp = (parseFloat(wallet.totalTopUp) + amountNum).toFixed(2);

  // Update wallet
  await updateWalletBalance(request.userId, newBalance);

  // Create transaction record
  await createTransaction({
    userId: request.userId,
    type: "topup",
    amount: request.amount,
    description: `شحن محفظة عبر ${request.method} (طلب رقم #${requestId})`,
    balanceBefore: wallet.balance,
    balanceAfter: newBalance,
  });

  // Mark request as approved
  await db
    .update(topUpRequests)
    .set({
      status: "approved",
      adminNotes: adminNotes || null,
      reviewedAt: new Date(),
      reviewedByAdminId: adminId,
    })
    .where(eq(topUpRequests.id, requestId));

  // Notify client
  await createNotification({
    userId: request.userId,
    type: "topup_request",
    title: "✅ تم شحن رصيد محفظتك",
    content: `تمت الموافقة على طلب الشحن وإضافة مبلغ ${amountNum} ر.ي إلى محفظتك بنجاح! رصيدك الحالي: ${newBalance} ر.ي`,
    data: JSON.stringify({ requestId, amount: amountNum, newBalance }),
  });

  return { success: true, newBalance };
}

export async function rejectTopUpRequest(
  requestId: number,
  adminId: number,
  reason: string
) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");

  const [request] = await db
    .select()
    .from(topUpRequests)
    .where(eq(topUpRequests.id, requestId))
    .limit(1);

  if (!request) throw new Error("طلب الشحن غير موجود");
  if (request.status !== "pending") throw new Error("تمت معالجة هذا الطلب مسبقاً");

  await db
    .update(topUpRequests)
    .set({
      status: "rejected",
      adminNotes: reason,
      reviewedAt: new Date(),
      reviewedByAdminId: adminId,
    })
    .where(eq(topUpRequests.id, requestId));

  // Notify client
  await createNotification({
    userId: request.userId,
    type: "topup_request",
    title: "❌ اعتذار بخصوص طلب شحن المحفظة",
    content: `تعذر قبول طلب الشحن بمبلغ ${request.amount} ر.ي. السبب: ${reason}`,
    data: JSON.stringify({ requestId, reason }),
  });

  return { success: true };
}

// ==========================================
// Customer / User Management for Admin
// ==========================================

export async function getAllUsersForAdmin() {
  const db = await getDb();
  if (!db) return [];

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  const userList = [];
  for (const u of allUsers) {
    const [w] = await db.select().from(wallets).where(eq(wallets.userId, u.id)).limit(1);
    const [purchaseCount] = await db
      .select({ count: count() })
      .from(purchases)
      .where(eq(purchases.userId, u.id));

    userList.push({
      ...u,
      balance: w?.balance || "0.00",
      totalSpent: w?.totalSpent || "0.00",
      totalPurchases: purchaseCount?.count || 0,
    });
  }

  return userList;
}

export async function deleteUserFromAdmin(userId: number, adminId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");

  const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!target) throw new Error("المستخدم غير موجود");

  // Protect admin accounts from deletion
  if (target.role === "admin" || target.email === "nabel7720079495@gmail.com") {
    throw new Error("لا يمكن حذف حساب المدير الرئيسي لأسباب أمنية.");
  }

  // Delete associated user data
  await db.delete(purchases).where(eq(purchases.userId, userId));
  await db.delete(transactions).where(eq(transactions.userId, userId));
  await db.delete(wallets).where(eq(wallets.userId, userId));
  await db.delete(topUpRequests).where(eq(topUpRequests.userId, userId));
  await db.delete(notifications).where(eq(notifications.userId, userId));
  await db.delete(users).where(eq(users.id, userId));

  // Log notification to admin
  await createNotification({
    type: "system",
    title: "🗑️ تم إزالة حساب عميل",
    content: `قام المدير بإزالة حساب العميل (${target.name || target.email || userId}) نهائياً من النظام.`,
    data: JSON.stringify({ deletedUserId: userId, name: target.name }),
  });

  return {
    success: true,
    message: `تمت إزالة حساب العميل (${target.name || target.email || "المحدد"}) نهائياً بنجاح.`,
  };
}

export async function toggleUserBlockStatus(
  userId: number,
  newStatus: "active" | "blocked",
  adminId: number
) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");

  const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!target) throw new Error("المستخدم غير موجود");

  if (target.role === "admin" || target.email === "nabel7720079495@gmail.com") {
    throw new Error("لا يمكن حظر حساب المدير الرئيسي.");
  }

  await db.update(users).set({ status: newStatus }).where(eq(users.id, userId));

  // Log notification
  await createNotification({
    type: "system",
    title: newStatus === "blocked" ? "🚫 تم حظر حساب عميل" : "✅ تم فك الحظر عن عميل",
    content:
      newStatus === "blocked"
        ? `قام المدير بحظر حساب العميل (${target.name || target.email || userId}) ومنعه من الدخول للمتجر.`
        : `قام المدير بإلغاء الحظر عن حساب العميل (${target.name || target.email || userId}).`,
    data: JSON.stringify({ targetUserId: userId, newStatus }),
  });

  return {
    success: true,
    status: newStatus,
    message:
      newStatus === "blocked"
        ? `تم حظر العميل (${target.name || "المحدد"}) بنجاح ومنعه من تسجيل الدخول.`
        : `تم إلغاء الحظر عن العميل (${target.name || "المحدد"}) بنجاح.`,
  };
}

// ==========================================
// Payment Methods / Bank Accounts
// ==========================================

export async function getAllActivePaymentMethods(): Promise<PaymentMethod[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.isActive, true))
    .orderBy(asc(paymentMethods.sortOrder), asc(paymentMethods.id));
}

export async function getAllPaymentMethodsForAdmin(): Promise<PaymentMethod[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(paymentMethods)
    .orderBy(asc(paymentMethods.sortOrder), asc(paymentMethods.id));
}

export async function createPaymentMethod(data: {
  name: string;
  type?: "bank" | "transfer" | "wallet" | "cash" | "other";
  accountNumber: string;
  accountHolder?: string;
  instructions?: string;
  icon?: string;
  isActive?: boolean;
  sortOrder?: number;
}): Promise<PaymentMethod> {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");

  const [res] = await db.insert(paymentMethods).values({
    name: data.name,
    type: data.type || "bank",
    accountNumber: data.accountNumber,
    accountHolder: data.accountHolder || "",
    instructions: data.instructions || "",
    icon: data.icon || "🏦",
    isActive: data.isActive !== undefined ? data.isActive : true,
    sortOrder: data.sortOrder || 0,
  });

  const [created] = await db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.id, res.insertId))
    .limit(1);

  return created;
}

export async function updatePaymentMethod(
  id: number,
  data: Partial<{
    name: string;
    type: "bank" | "transfer" | "wallet" | "cash" | "other";
    accountNumber: string;
    accountHolder: string;
    instructions: string;
    icon: string;
    isActive: boolean;
    sortOrder: number;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");

  await db
    .update(paymentMethods)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(paymentMethods.id, id));

  const [updated] = await db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.id, id))
    .limit(1);

  return updated;
}

export async function deletePaymentMethod(id: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");

  await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
  return { success: true };
}


