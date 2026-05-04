import * as SecureStore from "expo-secure-store";

const BASE = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000") + "/api";

if (__DEV__) console.log("[api] base →", BASE);

const getHeaders = async (extra: Record<string, string> = {}) => {
  const token = await SecureStore.getItemAsync("access_token");
  const h: Record<string, string> = { "Content-Type": "application/json", ...extra };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
};

const tryRefresh = async (): Promise<string> => {
  const refresh = await SecureStore.getItemAsync("refresh_token");
  if (!refresh) throw new Error("no refresh token");
  const res = await fetch(`${BASE}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) throw new Error("refresh failed");
  const data = await res.json();
  await SecureStore.setItemAsync("access_token", data.access);
  return data.access;
};

const req = async <T = any>(
  method: string,
  path: string,
  body?: any,
  extra?: Record<string, string>,
  retry = false,
  timeout = 15_000,
): Promise<T> => {
  const headers = await getHeaders(extra);
  const opts: RequestInit = { method, headers };

  if (body !== undefined) {
    if (body instanceof FormData) {
      const { "Content-Type": _, ...rest } = headers;
      opts.headers = rest;
      opts.body = body;
    } else {
      opts.body = JSON.stringify(body);
    }
  }

  const url = path.startsWith("http") ? path : `${BASE}${path}`;

  let res: Response;
  try {
    if (__DEV__) console.log("[api] →", method, url);
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), timeout);
    opts.signal = ctrl.signal;
    res = await fetch(url, opts);
    clearTimeout(tid);
    if (__DEV__) console.log("[api] ←", res.status, url);
  } catch (e: any) {
    const msg = e?.name === "AbortError" ? "Timeout — serveur ne répond pas" : "Connexion impossible";
    if (__DEV__) console.error("[api] NETWORK ERR", method, url, e?.message);
    const err: any = new Error(msg);
    err.response = { status: 0, data: { detail: msg } };
    throw err;
  }

  if (res.status === 401 && !retry) {
    try {
      const t = await tryRefresh();
      return req<T>(method, path, body, { ...extra, Authorization: `Bearer ${t}` }, true, timeout);
    } catch {
      await SecureStore.deleteItemAsync("access_token");
      await SecureStore.deleteItemAsync("refresh_token");
      throw new Error("Unauthorized");
    }
  }

  if (!res.ok) {
    let d: any = {};
    try { d = await res.json(); } catch {}
    const err: any = new Error(d?.detail ?? `HTTP ${res.status}`);
    err.response = { status: res.status, data: d };
    throw err;
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
};

const api = {
  get:    <T = any>(p: string, e?: Record<string, string>) => req<T>("GET", p, undefined, e),
  post:   <T = any>(p: string, b?: any, e?: Record<string, string>, timeout?: number) => req<T>("POST", p, b, e, false, timeout),
  patch:  <T = any>(p: string, b?: any, e?: Record<string, string>) => req<T>("PATCH", p, b, e),
  put:    <T = any>(p: string, b?: any, e?: Record<string, string>) => req<T>("PUT", p, b, e),
  delete: <T = any>(p: string, e?: Record<string, string>) => req<T>("DELETE", p, undefined, e),
};

export default api;
