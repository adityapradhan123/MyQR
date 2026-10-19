
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";

type CafeData = {
  id: string;
  name: string;
  slug: string;
};

export default function QRCodePage() {
  const [cafe, setCafe] = useState<CafeData | null>(null);
  const [qrImage, setQrImage] = useState("");
  const [menuUrl, setMenuUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadQRCode() {
      try {
        const response = await fetch("/api/menu", {
          credentials: "same-origin",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.cafe?.slug) {
          throw new Error(data.message || "Could not load your café.");
        }

        const url = `${window.location.origin}/menu/${data.cafe.slug}`;
        const image = await QRCode.toDataURL(url, {
          width: 500,
          margin: 2,
          errorCorrectionLevel: "H",
          color: {
            dark: "#38291f",
            light: "#ffffff",
          },
        });

        setCafe(data.cafe);
        setMenuUrl(url);
        setQrImage(image);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadQRCode();
  }, []);

  function downloadQRCode() {
    if (!qrImage || !cafe) return;

    const link = document.createElement("a");
    link.href = qrImage;
    link.download = `${cafe.slug}-qr-code.png`;
    link.click();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#faf7f2] p-8">
        <p className="text-[#766c60]">Generating your QR code...</p>
      </main>
    );
  }

  if (error || !cafe || !qrImage) {
    return (
      <main className="min-h-screen bg-[#faf7f2] p-8">
        <p className="text-red-700">{error || "Unable to generate QR code."}</p>
        <Link href="/dashboard" className="mt-4 inline-block underline">
          Back to dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf7f2] p-5 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard"
          className="text-sm text-[#766c60] hover:text-[#a65337]"
        >
          ← Back to dashboard
        </Link>

        <div className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#a65337]">
            MyQr · QR Studio
          </p>

          <h1 className="mt-2 text-3xl font-bold text-[#38291f] sm:text-4xl">
            Your café QR code
          </h1>

          <p className="mt-3 max-w-2xl text-[#766c60]">
            Let customers scan this code to view your digital menu. Update
            your menu anytime without changing the QR code.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl border border-[#e8e1d7] bg-white p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-[#766c60]">Your café</p>
                <h2 className="mt-1 text-xl font-bold text-[#38291f]">
                  {cafe.name}
                </h2>
              </div>
              <span className="rounded-full bg-[#edf5e9] px-3 py-1 text-xs font-semibold text-[#45653c]">
                Active
              </span>
            </div>

            <div className="mx-auto mt-8 flex max-w-sm justify-center rounded-2xl bg-white p-4">
              <img
                src={qrImage}
                alt={`QR code for ${cafe.name} digital menu`}
                className="h-auto w-full max-w-[320px]"
              />
            </div>

            <button
              onClick={downloadQRCode}
              className="mt-6 w-full rounded-xl bg-[#a65337] px-5 py-3.5 font-semibold text-white transition hover:bg-[#88432d]"
            >
              Download QR Code PNG
            </button>

            <p className="mt-3 text-center text-xs text-[#766c60]">
              High-resolution image · Ready to print
            </p>
          </section>

          <section className="rounded-3xl border border-[#e8e1d7] bg-white p-6 sm:p-8">
            <h2 className="text-xl font-bold text-[#38291f]">
              Your public menu
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#766c60]">
              This is the link encoded in your QR code. Customers can open it
              in their browser without logging in.
            </p>

            <div className="mt-5 break-all rounded-xl bg-[#faf7f2] p-4 text-sm text-[#38291f]">
              {menuUrl}
            </div>

            <button
              onClick={() => {
                void navigator.clipboard.writeText(menuUrl);
              }}
              className="mt-4 w-full rounded-xl border border-[#d8cfc3] px-5 py-3 font-semibold text-[#38291f] hover:bg-[#faf7f2]"
            >
              Copy menu link
            </button>

            <a
              href={menuUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 block w-full rounded-xl px-5 py-3 text-center font-semibold text-[#a65337] hover:bg-[#faf7f2]"
            >
              Preview public menu ↗
            </a>

            <div className="mt-8 rounded-2xl bg-[#faf7f2] p-5">
              <h3 className="font-semibold text-[#38291f]">
                Where to use your QR code
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-[#766c60]">
                <li>• Print it on your café tables</li>
                <li>• Add it to your takeaway packaging</li>
                <li>• Display it near the counter</li>
                <li>• Share it on social media</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
