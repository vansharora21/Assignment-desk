"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useUser } from "@/lib/auth";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const user = useUser();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) router.replace("/desk");
  }, [user, router]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Enter your username and password.");
      return;
    }
    signIn(username.trim());
  };

  const handleCancel = () => {
    setUsername("");
    setPassword("");
    setError("");
  };

  return (
    <main className={styles.screen}>
      <div className={styles.panel}>
        <div className={styles.brand}>
          <div className={styles.mark} aria-hidden="true">V</div>
          <h1 className={styles.name}>VARTAMAAN</h1>
          <p className={styles.tagline}>Assignment Desk</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.form}>
            <label htmlFor="server">Server:</label>
            <select id="server" defaultValue="1ST-INDIA">
              <option>1ST-INDIA</option>
            </select>

            <label htmlFor="username">Username:</label>
            <input id="username" autoFocus autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />

            <label htmlFor="password">Password:</label>
            <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />

            {error && <p className={styles.error} role="alert">{error}</p>}
          </div>

          <div className={styles.actions}>
            <button type="submit">Login</button>
            <button type="button" onClick={handleCancel}>Cancel</button>
          </div>
        </form>

        <svg className={styles.wave} viewBox="0 0 440 110" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 40 C60 5 110 5 170 38 S290 80 350 36 S420 20 440 30 V110 H0 Z" fill="#4f9be8" />
          <path d="M0 58 C70 24 120 30 180 58 S300 96 360 56 S425 44 440 52 V110 H0 Z" fill="#1d5fd6" />
        </svg>
        <p className={styles.footer}>VARTAMAAN AI · 1st India News</p>
      </div>
    </main>
  );
}
