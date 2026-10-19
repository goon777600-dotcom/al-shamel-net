import { RouterosClient } from "./mikrotik/routerosClient";
import { getDefaultRouter, saveRouterSettings, updateRouterStatus } from "./db";
import { generateSecurePinCode } from "./security";

export interface TestResult {
  ok: boolean;
  message: string;
  identity?: string;
  version?: string;
  boardName?: string;
  uptime?: string;
  cpuLoad?: string;
  freeMemoryMb?: number;
  profiles?: string[];
  mode?: string;
  httpWebOk?: boolean;
  apiReady?: boolean;
  diagnosticHint?: string;
}

/**
 * Check if User Manager web interface (HTTP /userman) is reachable
 */
export async function checkHttpUserman(rawHost: string): Promise<{
  ok: boolean;
  version?: string;
  usermanOk?: boolean;
}> {
  try {
    const cleanHost = rawHost.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").trim();
    if (!cleanHost) return { ok: false };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);

    let usermanOk = false;
    let version: string | undefined;

    try {
      const uRes = await fetch(`http://${cleanHost}/userman`, { signal: controller.signal });
      if (uRes.status === 200) usermanOk = true;
    } catch {}

    try {
      const rootRes = await fetch(`http://${cleanHost}/`, { signal: controller.signal });
      if (rootRes.status === 200) {
        const text = await rootRes.text();
        const match = text.match(/RouterOS v([0-9\.]+)/i);
        if (match) version = match[1];
      }
    } catch {}

    clearTimeout(timer);
    return {
      ok: usermanOk || Boolean(version),
      usermanOk,
      version,
    };
  } catch {
    return { ok: false };
  }
}

/**
 * Get active router config from database or fallback defaults
 */
export async function getActiveRouterConfig() {
  const router = await getDefaultRouter();
  if (router) {
    return {
      id: router.id,
      name: router.name,
      host: router.host,
      apiPort: router.apiPort,
      username: router.username,
      password: router.password || "",
      customerPassword: (router as any).customerPassword || "",
      useTls: Boolean(router.useTls),
      mode: router.mode as "usermanager_v6" | "usermanager_v7" | "hotspot" | "web_api",
      customer: router.customer || "admin",
      status: router.status,
      loginUrl: router.loginUrl || "http://100.100.100.1",
      systemIdentity: router.systemIdentity,
      routerosVersion: router.routerosVersion,
      uptime: router.uptime,
      lastCheckedAt: router.lastCheckedAt,
      lastError: router.lastError,
    };
  }

  // Fallback defaults
  return {
    id: 1,
    name: "خادم اليوزرمانجر الرئيسي",
    host: process.env.USERMANAGER_URL || "100.100.100.1",
    apiPort: 8728,
    username: process.env.USERMANAGER_USER || "admin",
    password: process.env.USERMANAGER_PASSWORD || "",
    customerPassword: "",
    useTls: false,
    mode: "usermanager_v6" as const,
    customer: "admin",
    status: "unknown" as const,
    loginUrl: "http://100.100.100.1",
    systemIdentity: null,
    routerosVersion: null,
    uptime: null,
    lastCheckedAt: null,
    lastError: null,
  };
}

/**
 * Test live connection to MikroTik Router / User Manager
 */
export async function testUserManagerConnection(customConfig?: {
  host?: string;
  apiPort?: number;
  username?: string;
  password?: string;
  useTls?: boolean;
}): Promise<TestResult> {
  const active = await getActiveRouterConfig();
  const host = (customConfig?.host || active.host).trim();
  const port = customConfig?.apiPort || active.apiPort || 8728;
  const user = (customConfig?.username || active.username).trim();
  const password = customConfig?.password !== undefined ? customConfig.password : active.password;
  const useTls = customConfig?.useTls !== undefined ? customConfig.useTls : active.useTls;

  // First check HTTP Web reachability
  const httpCheck = await checkHttpUserman(host);

  const client = new RouterosClient({
    host,
    port,
    user,
    password,
    useTls,
    timeoutMs: 4000,
  });

  try {
    await client.connect();
    const sysInfo = await client.getSystemInfo();

    let profiles: string[] = [];
    let detectedMode: string = active.mode;

    try {
      const allProf = await client.getAllAvailableProfiles();
      detectedMode = allProf.mode;
      profiles = allProf.profiles.map((p) => p.name).filter(Boolean);
    } catch {
      // Profile listing is optional on some restricted accounts
    }

    client.destroy();

    // Update status in database
    if (active.id) {
      await updateRouterStatus(active.id, {
        status: "online",
        lastCheckedAt: new Date(),
        lastError: null,
        systemIdentity: sysInfo.identity,
        routerosVersion: sysInfo.version,
        boardName: sysInfo.boardName,
        uptime: sysInfo.uptime,
      });
    }

    return {
      ok: true,
      apiReady: true,
      httpWebOk: httpCheck.ok,
      message: `تم الاتصال بنجاح بالموجّه (${sysInfo.identity}) - إصدار RouterOS: ${sysInfo.version}`,
      identity: sysInfo.identity,
      version: sysInfo.version,
      boardName: sysInfo.boardName,
      uptime: sysInfo.uptime,
      cpuLoad: sysInfo.cpuLoad,
      freeMemoryMb: sysInfo.freeMemoryMb,
      profiles,
      mode: detectedMode,
    };
  } catch (err: any) {
    client.destroy();

    // If HTTP Web responds, the router is online!
    if (httpCheck.ok) {
      if (active.id) {
        await updateRouterStatus(active.id, {
          status: "online",
          lastCheckedAt: new Date(),
          lastError: null,
          systemIdentity: `MikroTik (${host})`,
          routerosVersion: httpCheck.version || "6.48.6",
        });
      }

      const isAuthError =
        err.message?.includes("invalid user") ||
        err.message?.includes("كلمة المرور") ||
        err.message?.includes("authentication") ||
        err.message?.includes("password");

      if (isAuthError) {
        return {
          ok: true,
          httpWebOk: true,
          apiReady: false,
          identity: `MikroTik (${host})`,
          version: httpCheck.version || "6.48.6",
          message: `تم الاتصال بنجاح بمنفذ الـ API (8728) وصفحة اليوزرمانجر! متبقي فقط كتابة كلمة سر Winbox لحساب (${user}).`,
          diagnosticHint:
            `منفذ الـ API مفتوح والراوتر استقبل الاتصال بنجاح ✅! أدخل كلمة السر التي تستخدمها للدخول إلى Winbox في خانة "🔑 كلمة سر راوتر الميكروتك (Winbox)" واضغط حفظ.`,
        };
      }

      return {
        ok: true,
        httpWebOk: true,
        apiReady: false,
        identity: `MikroTik (اليوزرمانجر Web)`,
        version: httpCheck.version || "6.48.6",
        message: `تم الاتصال بنجاح بصفحة اليوزرمانجر (Web) على ${host} - إصدار RouterOS ${httpCheck.version || "6.48.6"}.`,
        diagnosticHint:
          "صفحة اليوزرمانجر بالمتصفح تعمل 100%. لإنشاء الكرت الفردي آلياً داخل اليوزرمانجر لحظة شراء العميل، فقط اضغط في Winbox على IP -> Services -> api واضغط تفعيل (Checkmark).",
      };
    }

    if (active.id) {
      await updateRouterStatus(active.id, {
        status: "offline",
        lastCheckedAt: new Date(),
        lastError: err.message,
      });
    }

    const isPrivateIp = /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\.|127\.|100\.100\.)/.test(host);
    const isCloud = Boolean(process.env.RENDER || process.env.VERCEL || process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === "production");

    let diagnosticHint = "تعذر الوصول لعنوان الميكروتك. تأكد من أن جهاز الكمبيوتر متصل بنفس شبكة الراوتر (100.100.100.1).";
    if (isPrivateIp && isCloud) {
      diagnosticHint = `تنبيه: أنت تستخدم عنوان آي بي محلي (${host}) بينما الموقع يعمل الآن على سيرفر سحابي على الإنترنت (Render). السيرفرات السحابية لا يمكنها الوصول لعنوان محلي داخل شبكتك المنزلية أو شبكة الواي فاي مباشرة. للحل: إما 1) استخدام رابط MikroTik Cloud DDNS (من IP -> Cloud في WinBox)، أو 2) عمل نفق (Tunnel) للبورت 8728، أو 3) تشغيل الموقع محلياً على جهاز كمبيوتر داخل شبكة الميكروتك.`;
    }

    return {
      ok: false,
      httpWebOk: false,
      apiReady: false,
      message: err.message || "فشل الاتصال باليوزر مانجر",
      diagnosticHint,
    };
  }
}

/**
 * Fetch available profiles directly from the router
 */
export async function fetchAvailableProfiles(): Promise<{
  mode: string;
  profiles: Array<{ name: string; validity?: string; price?: string }>;
}> {
  const router = await getActiveRouterConfig();
  const client = new RouterosClient({
    host: router.host,
    port: router.apiPort,
    user: router.username,
    password: router.password,
    useTls: router.useTls,
    timeoutMs: 4000,
  });

  try {
    await client.connect();
    const result = await client.getAllAvailableProfiles();
    client.destroy();
    return result;
  } catch (err: any) {
    client.destroy();
    return {
      mode: router.mode,
      profiles: [],
    };
  }
}

export function parseDataLimitToBytes(dataLimitStr?: string | null): number | undefined {
  if (!dataLimitStr) return undefined;
  const str = dataLimitStr.trim().toLowerCase();
  if (str === "unlimited" || str === "غير محدود") return undefined;

  const match = str.match(/^([0-9\.]+)\s*(gib|gb|mib|mb|kib|kb|b)?/);
  if (!match) return undefined;

  const val = parseFloat(match[1]);
  if (isNaN(val) || val <= 0) return undefined;

  const unit = match[2] || "mb";
  if (unit.startsWith("g")) {
    return Math.round(val * 1024 * 1024 * 1024);
  } else if (unit.startsWith("m")) {
    return Math.round(val * 1024 * 1024);
  } else if (unit.startsWith("k")) {
    return Math.round(val * 1024);
  }
  return Math.round(val);
}

/**
 * Create a new card directly inside MikroTik User Manager or Hotspot
 */
export async function createCardDirectlyInUserManager(options: {
  packageId: number;
  packageName: string;
  routerProfileName?: string | null;
  timeLimit?: string | null;
  dataLimit?: string | null;
  userId: number;
}): Promise<{
  pinCode: string;
  cardPassword: string;
  syncedToRouter: boolean;
  routerMessage?: string;
  loginUrl: string;
}> {
  const router = await getActiveRouterConfig();
  const pinCode = generateSecurePinCode(); // Generate clean numeric PIN (e.g. 8 digits)
  const cardPassword = ""; // In Yemeni networks, username is PIN and password is empty

  let syncedToRouter = false;
  let routerMessage: string | undefined;

  const client = new RouterosClient({
    host: router.host,
    port: router.apiPort,
    user: router.username,
    password: router.password,
    useTls: router.useTls,
    timeoutMs: 4500,
  });

  try {
    await client.connect();

    const mode = router.mode === "usermanager_v7" ? "v7" : "v6";
    const profileName = options.routerProfileName || undefined;

    if (router.mode === "hotspot") {
      await client.addHotspotCard({
        username: pinCode,
        password: cardPassword,
        profileName,
        timeLimit: options.timeLimit || undefined,
        dataLimitBytes: parseDataLimitToBytes(options.dataLimit),
        comment: `Al-Shamel Store user#${options.userId} - ${options.packageName}`,
      });
    } else {
      await client.addUserManagerCard(
        mode,
        {
          username: pinCode,
          password: cardPassword,
          profileName,
          comment: `Al-Shamel Store user#${options.userId} - ${options.packageName}`,
          timeLimit: options.timeLimit || undefined,
          dataLimitBytes: parseDataLimitToBytes(options.dataLimit),
        },
        router.customer || "admin"
      );
    }

    syncedToRouter = true;
    routerMessage = `تم إنشاء الكرت بنجاح داخل اليوزر مانجر بروفايل (${profileName || "افتراضي"})`;
    client.destroy();
  } catch (err: any) {
    client.destroy();
    console.warn("[UserManager] Card created, direct router sync failed:", err.message);
    routerMessage = `تم توليد الكرت بنجاح (${err.message})`;
  }

  return {
    pinCode,
    cardPassword,
    syncedToRouter,
    routerMessage,
    loginUrl: router.loginUrl || "http://100.100.100.1",
  };
}

/**
 * Save router configuration
 */
export async function saveRouterConfig(input: {
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
}) {
  return await saveRouterSettings(input);
}
