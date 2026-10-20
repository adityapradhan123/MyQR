
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";

type CafeData = {
  id: string;
  name: string;
  slug: string;
};

const DEFAULT_COLOR = "#E85D2A";

const COLOR_PRESETS = [
  { name: "Terracotta", color: "#E85D2A" },
  { name: "Forest", color: "#245447" },
  { name: "Coffee", color: "#493326" },
  { name: "Midnight", color: "#20242C" },
  { name: "Rose", color: "#B84C62" },
  { name: "Cream", color: "#E8D8B8" },
  { name: "White", color: "#F5F5F5" },
  { name: "Purple", color: "#7C3AED" },
  { name: "Blue", color: "#2563EB" },
  { name: "Cyan", color: "#0891B2" },
  { name: "Green", color: "#16A34A" },
  { name: "Yellow", color: "#CA8A04" },
  { name: "Orange", color: "#EA580C" },
  { name: "Red", color: "#DC2626" },
  { name: "Pink", color: "#DB2777" },
  { name: "Slate", color: "#64748B" },
  { name: "Lime", color: "#65A30D" },
  { name: "Teal", color: "#14B8A6" },
];

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function getReadableTextColor(hex: string) {
  const value = hex.replace("#", "");
  const normalized =
    value.length === 3
      ? value
          .split("")
          .map((char) => char + char)
          .join("")
      : value;

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return "#FFFFFF";

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  const luminance =
    0.2126 * r + 0.7152 * g + 0.0722 * b;

  return luminance > 155 ? "#241A15" : "#FFFFFF";
}

export default function QRCodePage() {
  const [cafe, setCafe] = useState<CafeData | null>(null);
  const [qrImage, setQrImage] = useState("");
  const [posterImage, setPosterImage] = useState("");
  const [menuUrl, setMenuUrl] = useState("");

  const [brandColor, setBrandColor] = useState(DEFAULT_COLOR);
  const [brandColorInput, setBrandColorInput] = useState(DEFAULT_COLOR);
  const [tagline, setTagline] = useState("GOOD FOOD. GREAT MOMENTS.");
  const [logoImage, setLogoImage] = useState("");

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  // Load café details and generate the QR code.
  useEffect(() => {
    let cancelled = false;

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

        const loadedCafe: CafeData = data.cafe;
        const url = `${window.location.origin}/menu/${loadedCafe.slug}`;

        const image = await QRCode.toDataURL(url, {
          width: 700,
          margin: 4,
          errorCorrectionLevel: "H",
          color: {
            dark: "#171717",
            light: "#FFFFFF",
          },
        });

        if (cancelled) return;

        setCafe(loadedCafe);
        setMenuUrl(url);
        setQrImage(image);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadQRCode();

    return () => {
      cancelled = true;
    };
  }, []);

  // Generate a poster whenever the design changes.
  useEffect(() => {
    if (!cafe || !qrImage) return;

    // Capture narrowed values for use inside the async function.
    const currentCafe = cafe;
    const currentQrImage = qrImage;

    let cancelled = false;

    async function createPoster() {
      setGenerating(true);

      try {
        const canvas = document.createElement("canvas");
        canvas.width = 1200;
        canvas.height = 1800;

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          throw new Error("Could not create poster.");
        }

        const W = canvas.width;
        const H = canvas.height;
        const textColor = getReadableTextColor(brandColor);

        // Background.
        ctx.fillStyle = brandColor;
        ctx.fillRect(0, 0, W, H);

        // Border.
        ctx.strokeStyle = textColor;
        ctx.globalAlpha = 0.8;
        ctx.lineWidth = 12;

        roundedRect(ctx, 22, 22, W - 44, H - 44, 65);
        ctx.stroke();

        // Decorative diagonal lines.
        ctx.globalAlpha = 0.13;
        ctx.lineWidth = 3;

        for (let i = -H; i < W + H; i += 30) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i - H, H);
          ctx.stroke();
        }

        ctx.globalAlpha = 1;

        // Logo panel.
        ctx.fillStyle = "#FFFFFF";
        roundedRect(ctx, 180, 95, 840, 170, 85);
        ctx.fill();

        let logoLoaded = false;

        if (logoImage) {
          try {
            const logo = await loadImage(logoImage);

            if (cancelled) return;

            const maxW = 160;
            const maxH = 110;
            const scale = Math.min(
              maxW / logo.width,
              maxH / logo.height,
              1
            );

            ctx.drawImage(
              logo,
              220,
              125,
              logo.width * scale,
              logo.height * scale
            );

            logoLoaded = true;
          } catch {
            // Continue using the café name if the logo fails to load.
          }
        }

        // Café name.
        ctx.fillStyle = "#211A17";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const nameX = logoLoaded ? 690 : 600;
        const maxNameWidth = logoLoaded ? 550 : 760;

        let nameSize = 62;

        ctx.font = `800 ${nameSize}px Arial, sans-serif`;

        while (
          ctx.measureText(currentCafe.name).width > maxNameWidth &&
          nameSize > 28
        ) {
          nameSize -= 2;
          ctx.font = `800 ${nameSize}px Arial, sans-serif`;
        }

        ctx.fillText(
          currentCafe.name,
          nameX,
          170,
          maxNameWidth
        );

        // Main promotional heading.
        ctx.fillStyle = textColor;
        ctx.font = "800 48px Arial, sans-serif";
        ctx.fillText("HUNGRY?", 600, 350);

        ctx.font = "900 84px Arial, sans-serif";
        ctx.fillText("SCAN THE MENU", 600, 445);

        ctx.font = "500 30px Arial, sans-serif";
        ctx.fillText("Discover your next favourite", 600, 505);

        // Decorative food illustrations.
        ctx.font = "76px Arial, sans-serif";
        ctx.fillText("🍔", 235, 690);
        ctx.fillText("🍟", 965, 690);

        ctx.font = "62px Arial, sans-serif";
        ctx.fillText("🥤", 185, 1090);
        ctx.fillText("🍕", 1010, 1090);

        // White QR card.
        ctx.fillStyle = "#FFFFFF";
        roundedRect(ctx, 220, 575, 760, 760, 52);
        ctx.fill();

        ctx.strokeStyle = "#211A17";
        ctx.lineWidth = 5;
        roundedRect(ctx, 242, 597, 716, 716, 36);
        ctx.stroke();

        const qr = await loadImage(currentQrImage);

        if (cancelled) return;

        // Keep the QR code high-contrast with a clear white margin.
        ctx.drawImage(qr, 290, 645, 620, 620);

        // Scan label.
        ctx.fillStyle = brandColor;
        roundedRect(ctx, 330, 1370, 540, 110, 30);
        ctx.fill();

        ctx.fillStyle = getReadableTextColor(brandColor);
        ctx.font = "800 52px Arial, sans-serif";
        ctx.fillText("SCAN ME", 600, 1425);

        // Tagline.
        ctx.fillStyle = textColor;
        ctx.font = "800 38px Arial, sans-serif";

        ctx.fillText(
          tagline.trim() || "GOOD FOOD. GREAT MOMENTS.",
          600,
          1545,
          1000
        );

        // MyQR footer.
        ctx.globalAlpha = 0.95;
        ctx.font = "500 28px Arial, sans-serif";
        ctx.fillText("DIGITAL MENU BY", 600, 1645);

        ctx.font = "900 44px Arial, sans-serif";
        ctx.fillText("MyQR", 600, 1705);

        if (!cancelled) {
          setPosterImage(canvas.toDataURL("image/png"));
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not generate your poster."
          );
        }
      } finally {
        if (!cancelled) setGenerating(false);
      }
    }

    void createPoster();

    return () => {
      cancelled = true;
    };
  }, [cafe, qrImage, brandColor, tagline, logoImage]);

  function chooseBrandColor(color: string) {
    setBrandColor(color);
    setBrandColorInput(color.toUpperCase());
  }

  function handleHexChange(value: string) {
    setBrandColorInput(value);

    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
      setBrandColor(value.toUpperCase());
    }
  }

  function downloadPoster() {
    if (!posterImage || !cafe) return;

    const link = document.createElement("a");
    link.href = posterImage;
    link.download = `${cafe.slug}-branded-menu-poster.png`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function copyMenuLink() {
    try {
      await navigator.clipboard.writeText(menuUrl);
      setError("");
    } catch {
      setError("Could not copy the menu link. Please copy it manually.");
    }
  }

  function handleLogoUpload(file?: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file for your logo.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Logo must be smaller than 5 MB.");
      return;
    }

    setError("");

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLogoImage(reader.result);
      }
    };

    reader.onerror = () => {
      setError("Could not read the logo file.");
    };

    reader.readAsDataURL(file);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#faf7f2] p-8">
        <p className="text-[#766c60]">Loading your QR Studio...</p>
      </main>
    );
  }

  if (!cafe || !qrImage) {
    return (
      <main className="min-h-screen bg-[#faf7f2] p-8">
        <p className="text-red-700">
          {error || "Unable to generate QR code."}
        </p>

        <Link href="/dashboard" className="mt-4 inline-block underline">
          Back to dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf7f2] p-5 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/dashboard"
          className="text-sm text-[#766c60] hover:text-[#a65337]"
        >
          ← Back to dashboard
        </Link>

        <header className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#a65337]">
            MyQR · QR Studio
          </p>

          <h1 className="mt-2 text-3xl font-bold text-[#38291f] sm:text-4xl">
            Make your QR stand out
          </h1>

          <p className="mt-3 max-w-2xl text-[#766c60]">
            Design a branded poster for your café tables. Your menu link
            stays the same, even when you update your menu.
          </p>
        </header>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-3xl border border-[#e8e1d7] bg-white p-6">
            <p className="text-sm text-[#766c60]">Your café</p>

            <h2 className="mt-1 text-xl font-bold text-[#38291f]">
              {cafe.name}
            </h2>

            <div className="mt-7">
              <label
                htmlFor="brand-color"
                className="block text-sm font-semibold text-[#38291f]"
              >
                Choose any brand color
              </label>

              <div className="mt-3 flex items-center gap-3">
                <input
                  id="brand-color"
                  type="color"
                  value={brandColor}
                  onChange={(event) =>
                    chooseBrandColor(event.target.value)
                  }
                  className="h-12 w-16 cursor-pointer rounded-lg border-0 bg-transparent"
                />

                <input
                  type="text"
                  aria-label="HEX color code"
                  value={brandColorInput}
                  onChange={(event) =>
                    handleHexChange(event.target.value)
                  }
                  onBlur={() => {
                    if (!/^#[0-9a-fA-F]{6}$/.test(brandColorInput)) {
                      setBrandColorInput(brandColor.toUpperCase());
                    }
                  }}
                  placeholder="#E85D2A"
                  maxLength={7}
                  className="w-32 rounded-lg border border-[#e8e1d7] px-3 py-2 font-mono text-sm text-[#38291f] outline-none focus:border-[#a65337]"
                />

                <span
                  className="h-8 flex-1 rounded-lg border border-black/10"
                  style={{ backgroundColor: brandColor }}
                  aria-label="Selected color preview"
                />
              </div>

              <p className="mt-2 text-xs text-[#766c60]">
                Use the color picker or enter a HEX code such as #E85D2A.
              </p>

              <p className="mt-5 text-sm font-semibold text-[#38291f]">
                Quick palettes
              </p>

              <div className="mt-3 grid grid-cols-6 gap-2">
                {COLOR_PRESETS.map((item) => (
                  <button
                    key={item.color}
                    type="button"
                    title={item.name}
                    aria-label={`Use ${item.name} color`}
                    onClick={() => chooseBrandColor(item.color)}
                    className={`h-10 rounded-lg border-2 transition ${
                      brandColor.toLowerCase() === item.color.toLowerCase()
                        ? "scale-105 border-[#211A17] ring-2 ring-[#d8cfc3]"
                        : "border-white hover:scale-105"
                    }`}
                    style={{ backgroundColor: item.color }}
                  />
                ))}
              </div>

              <p className="mt-2 text-xs text-[#766c60]">
                Select any swatch or use the full color picker above.
              </p>
            </div>

            <div className="mt-7">
              <label
                htmlFor="cafe-logo"
                className="block text-sm font-semibold text-[#38291f]"
              >
                Café logo (optional)
              </label>

              <input
                id="cafe-logo"
                type="file"
                accept="image/*"
                onChange={(event) =>
                  handleLogoUpload(event.target.files?.[0])
                }
                className="mt-3 block w-full text-sm text-[#766c60] file:mr-3 file:rounded-lg file:border-0 file:bg-[#faf7f2] file:px-4 file:py-2.5 file:font-semibold file:text-[#38291f]"
              />

              <p className="mt-2 text-xs text-[#766c60]">
                PNG with a transparent background works well. Maximum 5 MB.
              </p>

              {logoImage && (
                <button
                  type="button"
                  onClick={() => setLogoImage("")}
                  className="mt-2 text-sm font-medium text-[#a65337] underline"
                >
                  Remove logo
                </button>
              )}
            </div>

            <div className="mt-7">
              <label
                htmlFor="tagline"
                className="block text-sm font-semibold text-[#38291f]"
              >
                Poster tagline
              </label>

              <input
                id="tagline"
                value={tagline}
                maxLength={55}
                onChange={(event) => setTagline(event.target.value)}
                placeholder="GOOD FOOD. GREAT MOMENTS."
                className="mt-2 w-full rounded-xl border border-[#e8e1d7] px-4 py-3 text-sm text-[#38291f] outline-none focus:border-[#a65337]"
              />

              <p className="mt-2 text-xs text-[#766c60]">
                Keep it short so it fits nicely on your poster.
              </p>
            </div>

            <div className="mt-7 rounded-2xl bg-[#faf7f2] p-4">
              <p className="text-sm font-semibold text-[#38291f]">
                Menu destination
              </p>

              <p className="mt-2 break-all text-xs leading-5 text-[#766c60]">
                {menuUrl}
              </p>

              <button
                type="button"
                onClick={() => void copyMenuLink()}
                className="mt-3 text-sm font-semibold text-[#a65337] hover:underline"
              >
                Copy menu link
              </button>
            </div>

            <button
              type="button"
              onClick={downloadPoster}
              disabled={!posterImage || generating}
              className="mt-7 w-full rounded-xl bg-[#a65337] px-5 py-4 font-semibold text-white transition hover:bg-[#88432d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating ? "Preparing poster..." : "↓ Download Branded Poster"}
            </button>

            <p className="mt-3 text-center text-xs text-[#766c60]">
              High-resolution PNG · 1200 × 1800 px
            </p>
          </section>

          <section className="rounded-3xl border border-[#e8e1d7] bg-white p-5 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#38291f]">
                  Live poster preview
                </h2>

                <p className="mt-1 text-sm text-[#766c60]">
                  Your changes appear here automatically.
                </p>
              </div>

              <span className="rounded-full bg-[#edf5e9] px-3 py-1 text-xs font-semibold text-[#45653c]">
                Preview
              </span>
            </div>

            <div className="mx-auto mt-6 max-w-[420px] overflow-hidden rounded-2xl bg-[#eee9e1] p-3 sm:p-5">
              {posterImage ? (
                <img
                  src={posterImage}
                  alt={`Branded QR menu poster for ${cafe.name}`}
                  className="block h-auto w-full rounded-lg shadow-xl"
                />
              ) : (
                <div className="flex aspect-[2/3] items-center justify-center text-sm text-[#766c60]">
                  {generating
                    ? "Generating your poster..."
                    : "Your poster preview will appear here."}
                </div>
              )}
            </div>

            <div className="mt-5 rounded-xl border border-[#e8e1d7] p-4">
              <p className="text-sm font-semibold text-[#38291f]">
                Before printing
              </p>

              <p className="mt-1 text-sm leading-6 text-[#766c60]">
                Scan the downloaded poster with your phone to confirm it
                opens your public menu. Print a test copy before making
                multiple copies.
              </p>
            </div>

            <a
              href={menuUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 block text-center text-sm font-semibold text-[#a65337] hover:underline"
            >
              Open public menu ↗
            </a>
          </section>
        </div>
      </div>
    </main>
  );
}
