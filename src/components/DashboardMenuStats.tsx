
"use client";

import { useEffect, useState } from "react";

type MenuResponse = {
  items?: {
    id: string;
    category: string;
    isAvailable: boolean;
  }[];
  message?: string;
};

export default function DashboardMenuStats() {
  const [items, setItems] = useState<MenuResponse["items"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await fetch("/api/menu", {
          credentials: "same-origin",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load menu statistics");
        }

        const data: MenuResponse = await response.json();
        setItems(data.items ?? []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    void loadStats();
  }, []);

  const menuItems = items ?? [];
  const available = menuItems.filter((item) => item.isAvailable).length;
  const categories = new Set(
    menuItems.map((item) => item.category)
  ).size;

  const stats = [
    {
      label: "Total menu items",
      value: menuItems.length,
      icon: "🍽️",
    },
    {
      label: "Available items",
      value: available,
      icon: "✓",
    },
    {
      label: "Categories",
      value: categories,
      icon: "▦",
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-[#e8e1d7] bg-white p-5"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#766c60]">{stat.label}</p>
            <span className="text-xl">{stat.icon}</span>
          </div>

          <p className="mt-3 text-3xl font-bold">
            {loading ? "—" : error ? "—" : stat.value}
          </p>
        </div>
      ))}
    </section>
  );
}
