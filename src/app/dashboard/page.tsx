
import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import DashboardMenuStats from "@/components/DashboardMenuStats";

async function DashboardContent() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-[#faf7f2] text-[#38291f]">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[#e8e1d7] bg-white p-6 md:flex">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#a65d3b] text-lg font-bold text-white">
            M
          </span>
          <span className="text-2xl font-bold">MyQr</span>
        </Link>

        <p className="mb-3 mt-12 text-xs font-semibold uppercase tracking-[0.18em] text-[#a0968b]">
          Workspace
        </p>

        <nav className="space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-xl bg-[#f5eee7] px-4 py-3 text-sm font-semibold text-[#8d5034]"
          >
            <span>▦</span> Overview
          </Link>

          <Link
            href="/dashboard/menu"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#766c60] transition hover:bg-[#faf8f4]"
          >
            <span>♨</span> Menu management
          </Link>

          <Link
            href="/dashboard/offers"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#766c60] transition hover:bg-[#faf8f4]"
          >
            <span>◇</span> Offers
          </Link>

          <Link
            href="/dashboard/qr"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#766c60] transition hover:bg-[#faf8f4]"
          >
            <span>▦</span> QR code
          </Link>

          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#766c60] transition hover:bg-[#faf8f4]"
          >
            <span>⚙</span> Settings
          </Link>
        </nav>

        <div className="mt-auto rounded-2xl bg-[#f7f3ec] p-4">
          <p className="text-sm font-semibold">Need a hand?</p>
          <p className="mt-2 text-xs leading-5 text-[#766c60]">
            Your digital menu journey starts here.
          </p>
        </div>
      </aside>

      {/* Main dashboard */}
      <main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-[#8b7d6d]">Workspace / Overview</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-[#766c60]">
              Welcome back, {user.name}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/menu"
              className="rounded-xl bg-[#a65337] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#88432d]"
            >
              + Add menu item
            </Link>
            <LogoutButton />
          </div>
        </header>

        {/* Live summary cards */}
        <section className="mt-8">
          <DashboardMenuStats />
        </section>

        {/* Quick actions */}
        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Quick actions</h2>
              <p className="mt-1 text-sm text-[#766c60]">
                Manage your café's digital presence.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Link
              href="/dashboard/menu"
              className="rounded-2xl border border-[#e8e1d7] bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="text-2xl">🍽️</span>
              <h3 className="mt-4 font-bold">Menu management</h3>
              <p className="mt-2 text-sm leading-6 text-[#766c60]">
                Add dishes, update prices, and control item availability.
              </p>
              <span className="mt-4 inline-block text-sm font-semibold text-[#a65337]">
                Manage menu →
              </span>
            </Link>

            <Link
              href="/dashboard/qr"
              className="rounded-2xl border border-[#e8e1d7] bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="text-2xl">▦</span>
              <h3 className="mt-4 font-bold">QR code</h3>
              <p className="mt-2 text-sm leading-6 text-[#766c60]">
                View and download the QR code for your digital menu.
              </p>
              <span className="mt-4 inline-block text-sm font-semibold text-[#a65337]">
                Open QR studio →
              </span>
            </Link>

            <Link
              href="/dashboard/settings"
              className="rounded-2xl border border-[#e8e1d7] bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="text-2xl">⚙️</span>
              <h3 className="mt-4 font-bold">Café settings</h3>
              <p className="mt-2 text-sm leading-6 text-[#766c60]">
                Update your café name and the description customers see.
              </p>
              <span className="mt-4 inline-block text-sm font-semibold text-[#a65337]">
                Edit profile →
              </span>
            </Link>
          </div>
        </section>

        {/* Setup checklist */}
        <section className="mt-10 rounded-2xl border border-[#e8e1d7] bg-white p-6 sm:p-8">
          <h2 className="text-xl font-bold">Get your café online</h2>
          <p className="mt-2 text-sm text-[#766c60]">
            Follow these steps to prepare your digital menu for customers.
          </p>

          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f5eee7] text-sm font-bold text-[#a65337]">
                1
              </span>
              <div>
                <p className="font-semibold">Customize your café profile</p>
                <p className="mt-1 text-sm text-[#766c60]">
                  Add your café name and description.
                </p>
                <Link
                  href="/dashboard/settings"
                  className="mt-2 inline-block text-sm font-semibold text-[#a65337] hover:underline"
                >
                  Open settings →
                </Link>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f5eee7] text-sm font-bold text-[#a65337]">
                2
              </span>
              <div>
                <p className="font-semibold">Add your menu items</p>
                <p className="mt-1 text-sm text-[#766c60]">
                  Add dishes, descriptions, prices, and images.
                </p>
                <Link
                  href="/dashboard/menu"
                  className="mt-2 inline-block text-sm font-semibold text-[#a65337] hover:underline"
                >
                  Manage menu →
                </Link>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f5eee7] text-sm font-bold text-[#a65337]">
                3
              </span>
              <div>
                <p className="font-semibold">Get your QR code</p>
                <p className="mt-1 text-sm text-[#766c60]">
                  Download the code to print for your tables.
                </p>
                <Link
                  href="/dashboard/qr"
                  className="mt-2 inline-block text-sm font-semibold text-[#a65337] hover:underline"
                >
                  Open QR studio →
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-10 border-t border-[#e8e1d7] pt-5 text-sm text-[#8b7d6d]">
          MyQr · Your café, digitally connected.
        </footer>
      </main>
    </div>
  );
}

function DashboardLoading() {
  return (
    <main className="min-h-screen bg-[#faf7f2] p-8">
      <p className="text-[#766c60]">Loading your dashboard...</p>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
