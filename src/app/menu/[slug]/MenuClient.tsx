
"use client";

import { useEffect, useState } from "react";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  isAvailable: boolean;
};

type PublicOffer = {
  id: string;
  title: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startAt: string;
  endAt: string;
};

type PublicMenu = {
  cafe: {
    id: string;
    name: string;
    slug: string;
    description: string;
  };
  items: MenuItem[];
  offers: PublicOffer[];
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(price);
}

export default function MenuClient({ slug }: { slug: string }) {
  const [menu, setMenu] = useState<PublicMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    let cancelled = false;

    async function loadMenu() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/public/menu/${encodeURIComponent(slug)}`,
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load this menu.");
        }

        if (!cancelled) {
          setMenu(data);
          setSelectedCategory("all");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load this menu."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadMenu();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf7f2] px-4">
        <p className="text-[#766c60]">Preparing your menu...</p>
      </main>
    );
  }

  if (error || !menu) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf7f2] px-4">
        <div className="max-w-md rounded-2xl border border-[#e8e1d7] bg-white p-8 text-center">
          <h1 className="text-2xl font-bold text-[#38291f]">
            Menu unavailable
          </h1>
          <p className="mt-3 text-[#766c60]">
            {error || "We couldn't find this cafe."}
          </p>
        </div>
      </main>
    );
  }

  const categories = Array.from(
    new Set(
      menu.items
        .map((item) => item.category.trim())
        .filter(Boolean)
    )
  );

  const visibleCategories =
    selectedCategory === "all"
      ? categories
      : categories.filter(
          (category) => category === selectedCategory
        );

  return (
    <main className="min-h-screen bg-[#faf7f2] text-[#38291f]">
      <header className="border-b border-[#e8e1d7] bg-white">
        <div className="mx-auto max-w-5xl px-4 py-10 text-center sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#a65337]">
            Welcome to
          </p>

          <h1 className="mt-3 text-3xl font-bold sm:text-5xl">
            {menu.cafe.name || "My Cafe"}
          </h1>

          {menu.cafe.description && (
            <p className="mx-auto mt-3 max-w-xl text-[#766c60]">
              {menu.cafe.description}
            </p>
          )}

          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#f4eee5] px-4 py-2 text-sm text-[#766c60]">
            <span aria-hidden="true">●</span>
            Freshly prepared, just for you
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        {menu.offers.length > 0 && (
          <section aria-labelledby="offers-heading" className="mb-10">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a65337]">
                Something special
              </p>

              <h2 id="offers-heading" className="mt-1 text-2xl font-bold">
                Today&apos;s offers
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {menu.offers.map((offer) => (
                <article
                  key={offer.id}
                  className="relative overflow-hidden rounded-2xl bg-[#a65337] p-5 text-white sm:p-6"
                >
                  <div
                    aria-hidden="true"
                    className="absolute -right-8 -top-10 h-36 w-36 rounded-full border-[20px] border-white/10"
                  />

                  <p className="text-sm font-medium text-white/80">
                    Limited-time offer
                  </p>

                  <h3 className="relative mt-2 text-xl font-bold">
                    {offer.title}
                  </h3>

                  <p className="relative mt-3 text-3xl font-bold">
                    {offer.discountType === "percentage"
                      ? `${offer.discountValue}% OFF`
                      : `${formatPrice(offer.discountValue)} OFF`}
                  </p>

                  {offer.description && (
                    <p className="relative mt-2 text-sm text-white/85">
                      {offer.description}
                    </p>
                  )}

                  <p className="relative mt-4 text-xs text-white/75">
                    Offer ends{" "}
                    {new Date(offer.endAt).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="menu-heading">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a65337]">
              Made with care
            </p>

            <h2 id="menu-heading" className="mt-1 text-3xl font-bold">
              Our menu
            </h2>

            <p className="mt-2 text-sm text-[#766c60]">
              Explore our selection and find your favourite.
            </p>
          </div>

          {categories.length > 0 && (
            <div className="mb-6 sm:hidden">
              <label
                htmlFor="categoryFilter"
                className="mb-2 block text-sm font-semibold"
              >
                Browse by category
              </label>

              <select
                id="categoryFilter"
                value={selectedCategory}
                onChange={(event) =>
                  setSelectedCategory(event.target.value)
                }
                className="block w-full appearance-auto rounded-xl border border-[#e8e1d7] bg-white px-4 py-3 text-base text-[#38291f] outline-none focus:border-[#a65337] focus:ring-2 focus:ring-[#a65337]/20"
              >
                <option value="all">All categories</option>

                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          )}

          {menu.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d8cfc3] bg-white p-10 text-center">
              <p className="text-lg font-semibold">
                The menu is being prepared
              </p>

              <p className="mt-2 text-sm text-[#766c60]">
                Please check back soon.
              </p>
            </div>
          ) : (
            <div className="space-y-9">
              {visibleCategories.map((category) => {
                const items = menu.items.filter(
                  (item) => item.category.trim() === category
                );

                return (
                  <section key={category}>
                    <h3 className="mb-4 border-b border-[#e8e1d7] pb-3 text-xl font-bold">
                      {category}
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {items.map((item) => (
                        <article
                          key={item.id}
                          className="flex gap-4 rounded-2xl border border-[#e8e1d7] bg-white p-4 transition hover:shadow-sm"
                        >
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              loading="lazy"
                              className="h-24 w-24 shrink-0 rounded-xl object-cover sm:h-28 sm:w-28"
                            />
                          ) : (
                            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-[#f4eee5] text-3xl sm:h-28 sm:w-28">
                              🍽️
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold">{item.name}</h4>

                            {item.description && (
                              <p className="mt-1 line-clamp-3 text-sm text-[#766c60]">
                                {item.description}
                              </p>
                            )}

                            <p className="mt-3 font-bold text-[#a65337]">
                              {formatPrice(item.price)}
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </section>

        <footer className="mt-12 border-t border-[#e8e1d7] py-6 text-center">
          <p className="text-sm font-semibold text-[#766c60]">
            Digital menu powered by MyQr
          </p>
        </footer>
      </div>
    </main>
  );
}
