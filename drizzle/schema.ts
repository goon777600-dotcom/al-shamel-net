import { boolean, decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  password: varchar("password", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  status: mysqlEnum("status", ["active", "blocked"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Network Routers / User Manager connection settings
export const networkRouters = mysqlTable("network_routers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull().default("خادم اليوزرمانجر الرئيسي"),
  host: varchar("host", { length: 255 }).notNull().default("https://shaml.wifimanage.co"),
  apiPort: int("apiPort").notNull().default(8728),
  username: varchar("username", { length: 100 }).notNull().default("admin"),
  password: varchar("password", { length: 255 }).notNull().default(""),
  useTls: boolean("useTls").notNull().default(false),
  mode: mysqlEnum("mode", ["usermanager_v6", "usermanager_v7", "hotspot", "web_api"]).notNull().default("usermanager_v6"),
  customer: varchar("customer", { length: 100 }).notNull().default("admin"),
  isDefault: boolean("isDefault").notNull().default(true),
  status: mysqlEnum("status", ["online", "offline", "error", "unknown"]).notNull().default("unknown"),
  lastCheckedAt: timestamp("lastCheckedAt"),
  lastError: text("lastError"),
  systemIdentity: varchar("systemIdentity", { length: 120 }),
  routerosVersion: varchar("routerosVersion", { length: 60 }),
  boardName: varchar("boardName", { length: 120 }),
  uptime: varchar("uptime", { length: 120 }),
  loginUrl: varchar("loginUrl", { length: 255 }).default("http://100.100.100.1"),
  customerPassword: varchar("customerPassword", { length: 255 }).default(""),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NetworkRouter = typeof networkRouters.$inferSelect;
export type InsertNetworkRouter = typeof networkRouters.$inferInsert;

// Packages table for internet packages (cards and subscriptions)
export const packages = mysqlTable("packages", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: mysqlEnum("category", ["card", "subscription"]).notNull(),
  size: mysqlEnum("size", ["small", "medium", "large", "huge"]).notNull(),
  color: varchar("color", { length: 20 }).notNull(),
  icon: varchar("icon", { length: 50 }),
  routerProfileName: varchar("routerProfileName", { length: 160 }),
  timeLimit: varchar("timeLimit", { length: 60 }),
  dataLimit: varchar("dataLimit", { length: 60 }),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Package = typeof packages.$inferSelect;
export type InsertPackage = typeof packages.$inferInsert;

// Storefront announcements managed by admins and displayed above the packages.
export const announcements = mysqlTable("announcements", {
  id: int("id").autoincrement().primaryKey(),
  label: varchar("label", { length: 60 }).notNull(),
  title: varchar("title", { length: 140 }).notNull(),
  description: varchar("description", { length: 280 }).notNull(),
  ctaText: varchar("ctaText", { length: 50 }).notNull().default("استكشف الباقات"),
  imageUrl: text("imageUrl"),
  tone: mysqlEnum("tone", ["gold", "azure", "emerald"]).default("gold").notNull(),
  isActive: int("isActive").default(1).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

// User wallet for balance management
export const wallets = mysqlTable("wallets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0").notNull(),
  totalSpent: decimal("totalSpent", { precision: 15, scale: 2 }).default("0").notNull(),
  totalTopUp: decimal("totalTopUp", { precision: 15, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = typeof wallets.$inferInsert;

// User purchases (cards bought)
export const purchases = mysqlTable("purchases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  packageId: int("packageId").notNull(),
  pinCode: varchar("pinCode", { length: 50 }).notNull(),
  cardPassword: varchar("cardPassword", { length: 50 }).default(""),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "used", "expired"]).default("completed").notNull(),
  routerResponse: text("routerResponse"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = typeof purchases.$inferInsert;

// Transaction history for wallet operations
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["purchase", "topup", "refund", "admin_adjustment"]).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  balanceBefore: decimal("balanceBefore", { precision: 15, scale: 2 }).notNull(),
  balanceAfter: decimal("balanceAfter", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

// Immutable audit trail for sensitive administrative changes.
export const adminAuditLogs = mysqlTable("adminAuditLogs", {
  id: int("id").autoincrement().primaryKey(),
  adminUserId: int("adminUserId").notNull(),
  action: varchar("action", { length: 80 }).notNull(),
  targetType: varchar("targetType", { length: 50 }).notNull(),
  targetId: int("targetId").notNull(),
  details: text("details").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminAuditLog = typeof adminAuditLogs.$inferSelect;
export type InsertAdminAuditLog = typeof adminAuditLogs.$inferInsert;

// System and admin notifications
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  type: mysqlEnum("type", ["new_user", "purchase", "topup_request", "system"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  data: text("data"),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// Wallet top-up requests from customers
export const topUpRequests = mysqlTable("top_up_requests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  method: varchar("method", { length: 80 }).notNull(),
  referenceNumber: varchar("referenceNumber", { length: 120 }),
  senderName: varchar("senderName", { length: 150 }),
  notes: text("notes"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  adminNotes: text("adminNotes"),
  reviewedAt: timestamp("reviewedAt"),
  reviewedByAdminId: int("reviewedByAdminId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TopUpRequest = typeof topUpRequests.$inferSelect;
export type InsertTopUpRequest = typeof topUpRequests.$inferInsert;

// Dynamic payment methods and bank accounts for top-ups
export const paymentMethods = mysqlTable("payment_methods", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  type: mysqlEnum("type", ["bank", "transfer", "wallet", "cash", "other"]).default("bank").notNull(),
  accountNumber: varchar("accountNumber", { length: 120 }).notNull(),
  accountHolder: varchar("accountHolder", { length: 150 }),
  instructions: text("instructions"),
  icon: varchar("icon", { length: 50 }).default("🏦"),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = typeof paymentMethods.$inferInsert;
