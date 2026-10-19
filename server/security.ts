import { randomInt } from "node:crypto";

/**
 * يُنشئ رمز دخول رقمي من ثماني خانات باستخدام مولد عشوائي تشفيري.
 * لا تستخدم Math.random() للرموز التي تمنح وصولاً للخدمة.
 */
export function generateSecurePinCode(): string {
  return randomInt(10_000_000, 100_000_000).toString();
}
