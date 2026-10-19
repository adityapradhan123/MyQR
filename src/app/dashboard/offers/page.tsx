
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";

type OfferStatus = "scheduled" | "active" | "paused" | "expired";

type Offer = {
  id: string;
  title: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startAt: string;
  endAt: string;
  isEnabled: boolean;
  status: OfferStatus;
};

type OfferForm = {
  title: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: string;
  startAt: string;
  endAt: string;
};

const emptyForm: OfferForm = {
  title: "",
  description: "",
  discountType: "percentage",
  discountValue: "10",
  startAt: "",
  endAt: "",
};

function getStatus(offer: Offer): OfferStatus {
  const now = Date.now();

  if (now >= new Date(offer.endAt).getTime()) return "expired";
  if (!offer.isEnabled) return "paused";
  if (now < new Date(offer.startAt).getTime()) return "scheduled";

  return "active";
}

function formatDate(date: string) {
  return new Date(date).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function toLocalDateTimeValue(date: Date) {
  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );

  return local.toISOString().slice(0, 16);
}

function statusStyle(status: OfferStatus) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "scheduled":
      return "bg-blue-100 text-blue-800";
    case "paused":
      return "bg-amber-100 text-amber-800";
    case "expired":
      return "bg-gray-100 text-gray-600";
  }
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [form, setForm] = useState<OfferForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  const loadOffers = useCallback(async () => {
    try {
      setError("");

      const response = await fetch("/api/offers", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load offers.");
      }

      setOffers(data.offers ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load offers."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOffers();
  }, [loadOffers]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const startAt = new Date(form.startAt);
    const endAt = new Date(form.endAt);

    if (
      !form.startAt ||
      !form.endAt ||
      Number.isNaN(startAt.getTime()) ||
      Number.isNaN(endAt.getTime()) ||
      endAt <= startAt
    ) {
      setError("Please choose a valid start and end time.");
      setSaving(false);
      return;
    }

    const discountValue = Number(form.discountValue);

    if (
      !Number.isFinite(discountValue) ||
      discountValue <= 0 ||
      (form.discountType === "percentage" && discountValue > 100)
    ) {
      setError("Enter a valid discount amount.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/offers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          discountType: form.discountType,
          discountValue,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          isEnabled: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to create offer.");
      }

      setMessage("Offer scheduled successfully.");
      setForm(emptyForm);
      setShowForm(false);
      await loadOffers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create offer."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleOffer(offer: Offer) {
    setBusyId(offer.id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/offers/${offer.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          isEnabled: !offer.isEnabled,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update offer.");
      }

      setMessage("Offer status updated.");
      await loadOffers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update offer."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function deleteOffer(offer: Offer) {
    if (!window.confirm(`Delete "${offer.title}" permanently?`)) return;

    setBusyId(offer.id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/offers/${offer.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete offer.");
      }

      setOffers((current) =>
        current.filter((item) => item.id !== offer.id)
      );
      setMessage("Offer deleted.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete offer."
      );
    } finally {
      setBusyId(null);
    }
  }

  const counts = {
    total: offers.length,
    active: offers.filter((offer) => getStatus(offer) === "active").length,
    scheduled: offers.filter((offer) => getStatus(offer) === "scheduled").length,
    expired: offers.filter((offer) => getStatus(offer) === "expired").length,
  };

  return (
    <main className="min-h-screen bg-[#faf7f2] px-4 py-6 text-[#38291f] sm:px-8 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/dashboard"
          className="text-sm text-[#766c60] hover:text-[#a65337]"
        >
          ← Back to dashboard
        </Link>

        <header className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#a65337]">
              MyQr · Promotions
            </p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Offers management
            </h1>
            <p className="mt-2 text-[#766c60]">
              Schedule promotions and let them expire automatically.
            </p>
          </div>

          <button
            onClick={() => {
              setShowForm((current) => !current);
              setError("");
              setMessage("");
              setForm({
                ...emptyForm,
                startAt: toLocalDateTimeValue(new Date()),
                endAt: toLocalDateTimeValue(
                  new Date(Date.now() + 24 * 60 * 60 * 1000)
                ),
              });
            }}
            className="rounded-xl bg-[#a65337] px-5 py-3 font-semibold text-white transition hover:bg-[#88432d]"
          >
            {showForm ? "Close form" : "+ Create offer"}
          </button>
        </header>

        <section className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Total offers", value: counts.total },
            { label: "Active now", value: counts.active },
            { label: "Scheduled", value: counts.scheduled },
            { label: "Expired", value: counts.expired },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-[#e8e1d7] bg-white p-5"
            >
              <p className="text-sm text-[#766c60]">{stat.label}</p>
              <p className="mt-3 text-3xl font-bold">
                {loading ? "—" : stat.value}
              </p>
            </div>
          ))}
        </section>

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {message && (
          <p
            role="status"
            className="mt-6 rounded-xl bg-green-50 p-4 text-sm text-green-800"
          >
            {message}
          </p>
        )}

        {showForm && (
          <form
            onSubmit={handleCreate}
            className="mt-8 rounded-3xl border border-[#e8e1d7] bg-white p-6 sm:p-8"
          >
            <h2 className="text-xl font-bold">Create a scheduled offer</h2>
            <p className="mt-1 text-sm text-[#766c60]">
              Times are entered in your browser's local time zone.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="offerTitle" className="mb-2 block text-sm font-semibold">
                  Offer title
                </label>
                <input
                  id="offerTitle"
                  required
                  minLength={2}
                  maxLength={100}
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  className="input-field w-full"
                  placeholder="Weekend special"
                />
              </div>

              <div>
                <label htmlFor="discountType" className="mb-2 block text-sm font-semibold">
                  Discount type
                </label>
                <select
                  id="discountType"
                  value={form.discountType}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      discountType: event.target.value as "percentage" | "fixed",
                    })
                  }
                  className="input-field w-full"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed amount (₹)</option>
                </select>
              </div>

              <div>
                <label htmlFor="discountValue" className="mb-2 block text-sm font-semibold">
                  Discount value
                </label>
                <input
                  id="discountValue"
                  required
                  type="number"
                  min="0.01"
                  max={form.discountType === "percentage" ? 100 : 1000000}
                  step="0.01"
                  value={form.discountValue}
                  onChange={(event) =>
                    setForm({ ...form, discountValue: event.target.value })
                  }
                  className="input-field w-full"
                />
              </div>

              <div>
                <label htmlFor="startAt" className="mb-2 block text-sm font-semibold">
                  Start date & time
                </label>
                <input
                  id="startAt"
                  required
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(event) =>
                    setForm({ ...form, startAt: event.target.value })
                  }
                  className="input-field w-full"
                />
              </div>

              <div>
                <label htmlFor="endAt" className="mb-2 block text-sm font-semibold">
                  End date & time
                </label>
                <input
                  id="endAt"
                  required
                  type="datetime-local"
                  min={form.startAt || undefined}
                  value={form.endAt}
                  onChange={(event) =>
                    setForm({ ...form, endAt: event.target.value })
                  }
                  className="input-field w-full"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="offerDescription" className="mb-2 block text-sm font-semibold">
                  Description (optional)
                </label>
                <textarea
                  id="offerDescription"
                  rows={3}
                  maxLength={500}
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  className="input-field w-full"
                  placeholder="Enjoy a special discount this weekend."
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#a65337] px-5 py-3 font-semibold text-white hover:bg-[#88432d] disabled:opacity-60"
              >
                {saving ? "Scheduling..." : "Schedule offer"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-[#e8e1d7] px-5 py-3 font-semibold hover:bg-[#faf7f2]"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <section className="mt-8">
          <h2 className="text-xl font-bold">Your offers</h2>
          <p className="mt-1 text-sm text-[#766c60]">
            Offer status is calculated from its schedule and enabled setting.
          </p>

          {loading ? (
            <p className="mt-6 text-[#766c60]">Loading offers...</p>
          ) : offers.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-[#d8cfc3] bg-white p-10 text-center">
              <p className="text-lg font-semibold">No offers yet</p>
              <p className="mt-2 text-sm text-[#766c60]">
                Create your first promotion to get started.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {offers.map((offer) => {
                const status = getStatus(offer);

                return (
                  <article
                    key={offer.id}
                    className="rounded-2xl border border-[#e8e1d7] bg-white p-5 sm:p-6"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-bold">{offer.title}</h3>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyle(status)}`}>
                            {status}
                          </span>
                        </div>

                        <p className="mt-2 text-2xl font-bold text-[#a65337]">
                          {offer.discountType === "percentage"
                            ? `${offer.discountValue}% OFF`
                            : `₹${offer.discountValue} OFF`}
                        </p>

                        {offer.description && (
                          <p className="mt-2 text-sm text-[#766c60]">
                            {offer.description}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {status !== "expired" && (
                          <button
                            onClick={() => void toggleOffer(offer)}
                            disabled={busyId === offer.id}
                            className="rounded-lg border border-[#e8e1d7] px-3 py-2 text-sm font-semibold hover:bg-[#faf7f2] disabled:opacity-50"
                          >
                            {busyId === offer.id
                              ? "Please wait..."
                              : offer.isEnabled
                                ? "Pause"
                                : "Resume"}
                          </button>
                        )}

                        <button
                          onClick={() => void deleteOffer(offer)}
                          disabled={busyId === offer.id}
                          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 border-t border-[#eee7df] pt-4 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-[#8b7d6d]">Starts</p>
                        <p className="mt-1 font-medium">{formatDate(offer.startAt)}</p>
                      </div>
                      <div>
                        <p className="text-[#8b7d6d]">Expires</p>
                        <p className="mt-1 font-medium">{formatDate(offer.endAt)}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <div className="mt-8">
          <Link
            href="/dashboard/qr"
            className="text-sm font-semibold text-[#a65337] hover:underline"
            >
            Open QR code & public menu →
        </Link>
        </div>
      </div>
    </main>
  );
}
