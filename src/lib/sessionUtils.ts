import { supabase } from "@/integrations/supabase/client";

/**
 * Clear client-side session artifacts and sign out from Supabase.
 * Note: HTTP-only cookies cannot be removed from client JS — calling
 * `supabase.auth.signOut()` attempts to invalidate server-side session.
 *
 * Use carefully: this removes common Supabase keys and clears caches.
 */
export async function clearClientSession(options?: { queryClient?: any; keepLocalKeys?: string[] }) {
  const { queryClient, keepLocalKeys = [] } = options || {};

  try {
    await supabase.auth.signOut();
  } catch (e) {
    // best-effort sign out
    // console.warn('signOut failed', e);
  }

  // Clear React Query cache if provided
  try {
    if (queryClient && typeof queryClient.clear === "function") {
      queryClient.clear();
    }
  } catch (e) {}

  // Remove localStorage keys that are likely to contain auth/session data
  try {
    const keys = Object.keys(localStorage || {});
    keys.forEach((k) => {
      if (keepLocalKeys.includes(k)) return;
      // remove keys that look like supabase/react query or app session
      if (/^(sb:|supabase|supabase.auth|__reactQuery|reactQuery|__sentry__)/i.test(k)) {
        try {
          localStorage.removeItem(k);
        } catch (e) {}
      }
    });
  } catch (e) {}

  // Session storage - clear completely (ephemeral per-tab)
  try {
    sessionStorage.clear();
  } catch (e) {}

  // Delete non-HttpOnly cookies by expiring them
  try {
    const cookies = document.cookie.split(";").map((c) => c.trim()).filter(Boolean);
    cookies.forEach((c) => {
      const eq = c.indexOf("=");
      const name = eq > -1 ? c.substr(0, eq) : c;
      // expire the cookie for the root path
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      // try domain-less variant too
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    });
  } catch (e) {}

  // Clear CacheStorage (service worker caches)
  try {
    if (typeof caches !== "undefined") {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    }
  } catch (e) {}

  // Unregister service workers (best-effort)
  try {
    if (typeof navigator !== "undefined" && 'serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch (e) {}

  // Give browser a moment then reload to ensure cleared state
  try {
    setTimeout(() => {
      // hard reload
      window.location.reload();
    }, 250);
  } catch (e) {}
}

export default clearClientSession;
