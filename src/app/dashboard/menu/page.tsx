
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  isAvailable: boolean;
};

type Cafe = {
  id: string;
  name: string;
  slug: string;
};

type MenuForm = {
  name: string;
  description: string;
  price: string;
  category: string;
  imageUrl: string;
};

const emptyForm: MenuForm = {
  name: "",
  description: "",
  price: "",
  category: "Coffee",
  imageUrl: "",
};

const categories = [
  "Coffee",
  "Tea",
  "Cold Drinks",
  "Breakfast",
  "Main Course",
  "Snacks",
  "Desserts",
  "Other",
];

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [form, setForm] = useState<MenuForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadMenu = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/menu", {
        credentials: "same-origin",
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        throw new Error(data.message || "Unable to load your menu.");
      }

      setCafe(data.cafe ?? null);
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMenu();
  }, [loadMenu]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === "All" ||
        item.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [items, search, categoryFilter]);

  const availableCount = items.filter((item) => item.isAvailable).length;
  const categoryNames = Array.from(
    new Set(items.map((item) => item.category))
  ).sort();

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setNotice("");
    setShowForm(true);
  }

  function openEditForm(item: MenuItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description,
      price: String(item.price),
      category: item.category,
      imageUrl: item.imageUrl || "",
    });
    setError("");
    setNotice("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    const price = Number(form.price);

    if (!form.name.trim()) {
      setError("Please enter the dish name.");
      return;
    }

    if (form.price.trim() === "" || !Number.isFinite(price) || price < 0 || price > 1000000) {
      setError("Enter a valid price between ₹0 and ₹10,00,000.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price,
        category: form.category.trim() || "Other",
        imageUrl: form.imageUrl.trim(),
      };

      const response = await fetch(
        editingId ? `/api/menu/${editingId}` : "/api/menu",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save this menu item.");
      }

      await loadMenu();
      closeForm();
      setNotice(editingId ? "Menu item updated." : "Menu item added.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save this item."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailability(item: MenuItem) {
    setError("");
    setNotice("");
    setBusyId(item.id);

    try {
      const response = await fetch(`/api/menu/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update availability.");
      }

      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? { ...entry, isAvailable: !item.isAvailable }
            : entry
        )
      );

      setNotice(
        `${item.name} is now ${item.isAvailable ? "unavailable" : "available"}.`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update availability."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function deleteItem(item: MenuItem) {
    const confirmed = window.confirm(
      `Delete "${item.name}" from your menu? This cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");
    setBusyId(item.id);

    try {
      const response = await fetch(`/api/menu/${item.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete this item.");
      }

      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setNotice(`${item.name} was deleted.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete this item."
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#faf8f4] text-[#29251f]">
      <header className="border-b border-[#e8e1d7] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/dashboard" className="text-2xl font-bold tracking-tight">
            My<span className="text-[#a65d3b]">Qr</span>
          </Link>

          <Link
            href="/dashboard"
            className="rounded-xl border border-[#e8e1d7] px-4 py-2 text-sm font-medium transition hover:bg-[#faf8f4]"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#a65d3b]">
              Your workspace
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Menu management
            </h1>
            <p className="mt-2 text-sm text-[#766c60]">
              {cafe?.name || "Your café"} · Manage dishes, prices, and availability.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            className="rounded-xl bg-[#a65d3b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8e4d30]"
          >
            + Add menu item
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          >
            {notice}
          </div>
        )}

        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#e8e1d7] bg-white p-5">
            <p className="text-sm text-[#766c60]">Total menu items</p>
            <p className="mt-2 text-3xl font-bold">{items.length}</p>
          </div>
          <div className="rounded-2xl border border-[#e8e1d7] bg-white p-5">
            <p className="text-sm text-[#766c60]">Available now</p>
            <p className="mt-2 text-3xl font-bold text-green-700">
              {availableCount}
            </p>
          </div>
          <div className="rounded-2xl border border-[#e8e1d7] bg-white p-5">
            <p className="text-sm text-[#766c60]">Categories</p>
            <p className="mt-2 text-3xl font-bold">{categoryNames.length}</p>
          </div>
        </section>

        {showForm && (
          <section className="mt-8 rounded-2xl border border-[#e8e1d7] bg-white p-5 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">
                  {editingId ? "Edit menu item" : "Add a menu item"}
                </h2>
                <p className="mt-1 text-sm text-[#766c60]">
                  Enter the details your customers will see.
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg px-3 py-1 text-xl text-[#766c60] hover:bg-[#faf8f4]"
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">Item name *</span>
                  <input
                    required
                    maxLength={100}
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                    placeholder="e.g. Cappuccino"
                    className="input-field w-full"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium">Price (₹) *</span>
                  <input
                    required
                    type="number"
                    min="0"
                    max="1000000"
                    step="0.01"
                    value={form.price}
                    onChange={(event) =>
                      setForm({ ...form, price: event.target.value })
                    }
                    placeholder="e.g. 149"
                    className="input-field w-full"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium">Category *</span>
                  <input
                    required
                    maxLength={60}
                    list="menu-categories"
                    value={form.category}
                    onChange={(event) =>
                      setForm({ ...form, category: event.target.value })
                    }
                    placeholder="e.g. Coffee"
                    className="input-field w-full"
                  />
                  <datalist id="menu-categories">
                    {categories.map((category) => (
                      <option key={category} value={category} />
                    ))}
                    {categoryNames.map((category) => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium">Image URL (optional)</span>
                  <input
                    type="url"
                    maxLength={2048}
                    value={form.imageUrl}
                    onChange={(event) =>
                      setForm({ ...form, imageUrl: event.target.value })
                    }
                    placeholder="https://example.com/dish.jpg"
                    className="input-field w-full"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium">Description</span>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  placeholder="Describe the ingredients or what makes this dish special..."
                  className="input-field w-full resize-y"
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#a65d3b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8e4d30] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save changes"
                      : "Add item"}
                </button>

                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-xl border border-[#e8e1d7] px-5 py-3 text-sm font-semibold hover:bg-[#faf8f4]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="mt-8">
          <div className="flex flex-col gap-4 sm:flex-row">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search menu items..."
              aria-label="Search menu items"
              className="input-field w-full bg-white sm:max-w-sm"
            />

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              aria-label="Filter by category"
              className="input-field w-full bg-white sm:max-w-xs"
            >
              <option value="All">All categories</option>
              {categoryNames.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Your items</h2>
            <span className="text-sm text-[#766c60]">
              {filteredItems.length} shown
            </span>
          </div>

          {loading ? (
            <div className="mt-5 rounded-2xl border border-[#e8e1d7] bg-white p-10 text-center text-sm text-[#766c60]">
              Loading your menu...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-[#d9cdbf] bg-white px-6 py-14 text-center">
              <div className="text-4xl">☕</div>
              <h3 className="mt-4 text-lg font-bold">
                {items.length === 0 ? "Your menu is empty" : "No items found"}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#766c60]">
                {items.length === 0
                  ? "Add your first dish or drink to start building your digital menu."
                  : "Try another search term or select a different category."}
              </p>
              {items.length === 0 && (
                <button
                  type="button"
                  onClick={openAddForm}
                  className="mt-5 rounded-xl bg-[#a65d3b] px-5 py-3 text-sm font-semibold text-white hover:bg-[#8e4d30]"
                >
                  + Add your first item
                </button>
              )}
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-[#e8e1d7] bg-white"
                >
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      loading="lazy"
                      className="h-44 w-full bg-[#f0e9df] object-cover"
                    />
                  ) : (
                    <div className="flex h-32 items-center justify-center bg-[#f2ece3] text-4xl">
                      ☕
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="inline-block rounded-full bg-[#f7eee8] px-3 py-1 text-xs font-semibold text-[#a65d3b]">
                          {item.category}
                        </span>
                        <h3 className="mt-3 break-words text-lg font-bold">
                          {item.name}
                        </h3>
                      </div>
                      <p className="shrink-0 text-lg font-bold">
                        ₹{Number(item.price).toLocaleString("en-IN", {
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>

                    {item.description && (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#766c60]">
                        {item.description}
                      </p>
                    )}

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.isAvailable
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {item.isAvailable ? "Available" : "Unavailable"}
                      </span>

                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => void toggleAvailability(item)}
                        className="text-sm font-medium text-[#a65d3b] hover:underline disabled:opacity-50"
                      >
                        {busyId === item.id
                          ? "Please wait..."
                          : item.isAvailable
                            ? "Mark unavailable"
                            : "Make available"}
                      </button>
                    </div>

                    <div className="mt-5 flex gap-3 border-t border-[#eee7df] pt-4">
                      <button
                        type="button"
                        onClick={() => openEditForm(item)}
                        className="flex-1 rounded-xl border border-[#e8e1d7] px-3 py-2.5 text-sm font-semibold hover:bg-[#faf8f4]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => void deleteItem(item)}
                        className="flex-1 rounded-xl border border-red-200 px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
