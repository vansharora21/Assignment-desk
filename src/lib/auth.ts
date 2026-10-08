"use client";

import { useSyncExternalStore } from "react";

// Placeholder session: the signed-in username lives in localStorage until the
// real backend login (JWT) exists. Nothing here verifies a password.
const KEY = "desk_user";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readUser(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function signIn(username: string) {
  localStorage.setItem(KEY, username);
  listeners.forEach((l) => l());
}

export function signOut() {
  localStorage.removeItem(KEY);
  listeners.forEach((l) => l());
}

/** Signed-in username, or null. Always null on the server and during hydration. */
export const useUser = () => useSyncExternalStore(subscribe, readUser, () => null);

const noop = () => () => {};

/** False on the server and during hydration, true afterwards. */
export const useHydrated = () => useSyncExternalStore(noop, () => true, () => false);
