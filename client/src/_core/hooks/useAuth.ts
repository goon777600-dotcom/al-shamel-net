import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";
import { COOKIE_NAME } from "@shared/const";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  // Login is started via startLogin() in the effect below, only when we actually
  // navigate — never during render. startLogin() mints a one-time nonce + writes
  // the state cookie, so calling it per render would overwrite the cookie and
  // desync it from an in-flight login's `state`.
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        // already unauthenticated
      } else {
        console.warn("[Auth] Logout remote error:", error);
      }
    } finally {
      // Clear all tokens mirrored into storage so header-based and cookie sessions are both destroyed
      try {
        sessionStorage.removeItem("auth_token");
        localStorage.removeItem("auth_token");
        sessionStorage.removeItem("manus-cookie");
        localStorage.removeItem("manus-cookie");
        localStorage.removeItem("manus-runtime-user-info");
        sessionStorage.clear();
        document.cookie = `${COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
        document.cookie = `${COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax;`;
        document.cookie = `${COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=None; Secure;`;
      } catch {}
      utils.auth.me.setData(undefined, null);
      try {
        utils.wallet.getBalance.setData(undefined, { balance: "0", totalSpent: "0", totalTopUp: "0" } as any);
        utils.purchases.getUserPurchases.setData(undefined, []);
      } catch {}
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(meQuery.data)
    );
    return {
      user: meQuery.data ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (redirectPath && window.location.pathname === redirectPath) return;

    // Navigate at this moment only. startLogin() mints the nonce + cookie itself.
    if (redirectPath) {
      window.location.href = redirectPath;
    } else {
      startLogin();
    }
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
