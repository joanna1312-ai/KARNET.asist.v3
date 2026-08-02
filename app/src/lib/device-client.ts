"use client";

// Klient trzyma wyłącznie podpisany token urządzenia (nigdy surowy deviceId) —
// ADR-007. Token jest pobierany raz przez POST /api/device/register i doklejany
// jako nagłówek Authorization do kolejnych żądań.
const STORAGE_KEY = "karnet-asist:device-token";

async function registerDeviceToken(previousToken?: string | null): Promise<string> {
  const response = await fetch("/api/device/register", {
    method: "POST",
    headers: previousToken ? { Authorization: `Device ${previousToken}` } : undefined,
  });
  const body: { token: string } = await response.json();
  window.localStorage.setItem(STORAGE_KEY, body.token);
  return body.token;
}

async function getDeviceToken(): Promise<string> {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored ?? registerDeviceToken();
}

// fetch z automatycznie doklejonym nagłówkiem Authorization: Device <token>. Jeśli
// token okaże się nieważny (401), rejestruje nowy i próbuje raz jeszcze.
export async function deviceFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = await getDeviceToken();
  const response = await fetch(input, {
    ...init,
    headers: { ...init.headers, Authorization: `Device ${token}` },
  });

  if (response.status !== 401) return response;

  const freshToken = await registerDeviceToken();
  return fetch(input, {
    ...init,
    headers: { ...init.headers, Authorization: `Device ${freshToken}` },
  });
}
