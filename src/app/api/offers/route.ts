
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { getOrCreateCafe } from "@/lib/cafe";
import Offer from "@/models/Offer";

const offerSchema = z
  .object({
    title: z.string().trim().min(2).max(100),
    description: z.string().trim().max(500).default(""),
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: z.number().positive().max(1000000),
    startAt: z.string().datetime({ offset: true }),
    endAt: z.string().datetime({ offset: true }),
    isEnabled: z.boolean().default(true),
  })
  .refine(
    (data) =>
      data.discountType !== "percentage" || data.discountValue <= 100,
    {
      message: "Percentage discounts cannot exceed 100%.",
      path: ["discountValue"],
    }
  )
  .refine(
    (data) => new Date(data.endAt) > new Date(data.startAt),
    {
      message: "End time must be after start time.",
      path: ["endAt"],
    }
  );

function getStatus(
  offer: { startAt: Date; endAt: Date; isEnabled: boolean },
  now: number
) {
  if (now >= new Date(offer.endAt).getTime()) return "expired";
  if (!offer.isEnabled) return "paused";
  if (now < new Date(offer.startAt).getTime()) return "scheduled";
  return "active";
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Please log in." },
        { status: 401 }
      );
    }

    await connectDB();
    const cafe = await getOrCreateCafe(user.id, user.name);
    const offers = await Offer.find({
      ownerId: user.id,
      cafeId: cafe._id,
    }).sort({ createdAt: -1 }).lean();

    const now = Date.now();

    return NextResponse.json({
      offers: offers.map((offer) => ({
        id: offer._id.toString(),
        title: offer.title,
        description: offer.description,
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        startAt: new Date(offer.startAt).toISOString(),
        endAt: new Date(offer.endAt).toISOString(),
        isEnabled: offer.isEnabled,
        status: getStatus(offer, now),
      })),
    });
  } catch (error) {
    console.error("Get offers error:", error);

    return NextResponse.json(
      { message: "Unable to load offers." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Please log in." },
        { status: 401 }
      );
    }

    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    if (origin) {
      try {
        if (new URL(origin).host !== host) {
          return NextResponse.json(
            { message: "Invalid request origin." },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { message: "Invalid request origin." },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const parsed = offerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message:
            parsed.error.issues[0]?.message || "Please check the offer details.",
        },
        { status: 400 }
      );
    }

    await connectDB();
    const cafe = await getOrCreateCafe(user.id, user.name);

    const offer = await Offer.create({
      ...parsed.data,
      startAt: new Date(parsed.data.startAt),
      endAt: new Date(parsed.data.endAt),
      ownerId: user.id,
      cafeId: cafe._id,
    });

    return NextResponse.json(
      {
        message: "Offer scheduled successfully.",
        offer: {
          id: offer._id.toString(),
          title: offer.title,
          description: offer.description,
          discountType: offer.discountType,
          discountValue: offer.discountValue,
          startAt: offer.startAt.toISOString(),
          endAt: offer.endAt.toISOString(),
          isEnabled: offer.isEnabled,
          status: getStatus(offer, Date.now()),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create offer error:", error);

    return NextResponse.json(
      { message: "Unable to create offer." },
      { status: 500 }
    );
  }
}
