
"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";

type Cafe = {
  name: string;
  slug: string;
  description: string;
};

export default function CafeSettingsPage() {
  const [cafe, setCafe] = useState<Cafe>({
    name: "",
    slug: "",
    description: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCafe() {
      try {
        const response = await fetch("/api/cafe", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not load café profile.");
        }

        setCafe(data.cafe);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadCafe();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/cafe", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          name: cafe.name,
          description: cafe.description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not save changes.");
      }

      setCafe(data.cafe);
      setMessage("Your café profile has been saved.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#faf7f2] p-8">
        <p className="text-[#766c60]">Loading café settings...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf7f2] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/dashboard"
          className="text-sm text-[#766c60] hover:text-[#a65337]"
        >
          ← Back to dashboard
        </Link>

        <div className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#a65337]">
            MyQr · Settings
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[#38291f]">
            Café profile
          </h1>
          <p className="mt-2 text-[#766c60]">
            Personalize the digital menu your customers see.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 rounded-3xl border border-[#e8e1d7] bg-white p-6 sm:p-8"
        >
          <div>
            <label
              htmlFor="cafeName"
              className="mb-2 block text-sm font-semibold text-[#38291f]"
            >
              Café name
            </label>
            <input
              id="cafeName"
              type="text"
              required
              minLength={2}
              maxLength={100}
              value={cafe.name}
              onChange={(event) =>
                setCafe({ ...cafe, name: event.target.value })
              }
              className="input-field w-full"
              placeholder="e.g. The Coffee Corner"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-semibold text-[#38291f]"
            >
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              maxLength={500}
              value={cafe.description}
              onChange={(event) =>
                setCafe({ ...cafe, description: event.target.value })
              }
              className="input-field w-full resize-y"
              placeholder="Tell customers about your café, food, and atmosphere..."
            />
            <p className="mt-1 text-right text-xs text-[#766c60]">
              {cafe.description.length}/500 characters
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#38291f]">
              Permanent menu URL
            </label>
            <div className="break-all rounded-xl bg-[#faf7f2] p-4 text-sm text-[#766c60]">
              /menu/{cafe.slug}
            </div>
            <p className="mt-2 text-xs text-[#766c60]">
              Your URL stays the same when you change your café name.
            </p>
          </div>

          {message && (
            <p role="status" className="text-sm text-green-700">
              {message}
            </p>
          )}

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>

        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <Link
            href={`/menu/${cafe.slug}`}
            target="_blank"
            className="font-semibold text-[#a65337] hover:underline"
          >
            Preview public menu ↗
          </Link>
          <Link
            href="/dashboard/qr"
            className="font-semibold text-[#a65337] hover:underline"
          >
            View QR code →
          </Link>
        </div>
      </div>
    </main>
  );
}
