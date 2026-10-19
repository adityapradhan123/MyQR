
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type AuthFormProps = {
  mode: "login" | "register";
};

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isRegister = mode === "register";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        isRegister ? "/api/auth/register" : "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(isRegister ? { name } : {}),
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Something went wrong. Please try again.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#faf8f4] p-3 sm:p-5 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-24px)] max-w-[1400px] overflow-hidden rounded-[28px] border border-[#e8e1d7] bg-white shadow-sm sm:min-h-[calc(100vh-40px)] lg:min-h-[calc(100vh-64px)] lg:grid-cols-2">

        {/* Left branding panel: desktop only */}
        <section className="relative hidden min-h-full flex-col justify-between overflow-hidden bg-[#33251f] p-10 text-[#faf5eb] lg:flex lg:p-12">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-[#a65d3b]/25 blur-3xl" />

          <Link
            href="/"
            className="relative z-10 inline-flex w-fit items-center gap-3"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#c17a53] text-xl font-bold text-white">
              M
            </span>
            <span className="text-2xl font-bold tracking-tight">MyQR</span>
          </Link>

          <div className="relative z-10 my-auto max-w-lg py-16">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.25em] text-[#d9a987]">
              A better menu experience
            </p>

            <h1 className="text-5xl leading-[1.12] tracking-tight xl:text-6xl">
              Your menu.
              <br />
              Your style.
              <br />
              <span className="text-[#d9a987]">One simple QR.</span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-[#d4c8bf]">
              Create a digital menu for your café, share it with a QR code,
              and update your offerings whenever you need to.
            </p>

            <div className="mt-8 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-[#d9a987]">
                ✓
              </span>
              <p className="text-sm text-[#e6dbd2]">
                Simple to manage. Easy for customers.
              </p>
            </div>
          </div>

          <p className="relative z-10 text-xs text-[#b9a99d]">
            Made for cafés, restaurants and the people who love them.
          </p>
        </section>

        {/* Form panel */}
        <section className="flex items-center justify-center px-6 py-10 sm:px-12 lg:px-14 lg:py-12 xl:px-20">
          <div className="w-full max-w-md">

            {/* Centered logo: mobile and tablet only */}
            <div className="mb-10 flex justify-center lg:hidden">
              <Link href="/" className="inline-flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#a65d3b] text-xl font-bold text-white">
                  M
                </span>
                <span className="text-2xl font-bold tracking-tight text-[#29251f]">
                  MyQr
                </span>
              </Link>
            </div>

            <div className="mb-9">
              <p className="mb-3 text-sm font-medium text-[#a65d3b]">
                {isRegister ? "GET STARTED" : "WELCOME BACK"}
              </p>

              <h2 className="text-3xl tracking-tight text-[#29251f] sm:text-4xl">
                {isRegister ? "Create your account" : "Sign in to MyQr"}
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#766c60]">
                {isRegister
                  ? "Start building your café's digital menu."
                  : "Your café dashboard is waiting for you."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isRegister && (
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-medium text-[#393129]"
                  >
                    Your name
                  </label>

                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={80}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter your name"
                    className="input-field"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-[#393129]"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="input-field"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-[#393129]"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="text-xs font-medium text-[#a65d3b] hover:text-[#85472d]"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    isRegister ? "new-password" : "current-password"
                  }
                  required
                  minLength={isRegister ? 12 : 1}
                  maxLength={128}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={
                    isRegister
                      ? "At least 12 characters"
                      : "Enter your password"
                  }
                  className="input-field"
                />

                {isRegister && (
                  <p className="mt-2 text-xs text-[#8a8075]">
                    Use at least 12 characters.
                  </p>
                )}
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Please wait..."
                  : isRegister
                    ? "Create account"
                    : "Sign in"}

                {!loading && <span aria-hidden="true">→</span>}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-[#766c60]">
              {isRegister
                ? "Already have an account?"
                : "New to MyQr?"}{" "}
              <Link
                href={isRegister ? "/login" : "/register"}
                className="font-semibold text-[#a65d3b] hover:text-[#85472d]"
              >
                {isRegister ? "Sign in" : "Create an account"}
              </Link>
            </p>

            <p className="mt-12 text-center text-xs leading-5 text-[#9b9186]">
              By continuing, you agree to use MyQr responsibly.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
