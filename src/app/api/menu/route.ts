import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getOrCreateCafe } from "@/lib/cafe";
import { connectDB } from "@/lib/mongodb";
import MenuItem from "@/models/MenuItem";

const createMenuItemSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).default(""),
  price: z.number().finite().min(0).max(1000000),
  category: z.string().trim().min(1).max(60),
  imageUrl: z.string().trim().max(2000).default(""),
});

function originIsValid(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Please sign in." },
        { status: 401 }
      );
    }

    const cafe = await getOrCreateCafe(user.id, user.name);
    await connectDB();

    const items = await MenuItem.find({
      cafeId: cafe._id,
      ownerId: user.id,
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      cafe: {
        id: cafe._id.toString(),
        name: cafe.name,
        slug: cafe.slug,
      },
      items: items.map((item) => ({
        id: item._id.toString(),
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        imageUrl: item.imageUrl,
        isAvailable: item.isAvailable,
      })),
    });
  } catch (error) {
    console.error("Get menu error:", error);

    return NextResponse.json(
      { message: "Unable to load the menu." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!originIsValid(request)) {
      return NextResponse.json(
        { message: "Invalid request origin." },
        { status: 403 }
      );
    }

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Please sign in." },
        { status: 401 }
      );
    }

    const body: unknown = await request.json();
    const parsed = createMenuItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Check the item name, price, category, and description." },
        { status: 400 }
      );
    }

    const cafe = await getOrCreateCafe(user.id, user.name);

    const item = await MenuItem.create({
      ...parsed.data,
      cafeId: cafe._id,
      ownerId: user.id,
      isAvailable: true,
    });

    return NextResponse.json(
      {
        message: "Menu item added.",
        item: {
          id: item._id.toString(),
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          imageUrl: item.imageUrl,
          isAvailable: item.isAvailable,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create menu item error:", error);

    return NextResponse.json(
      { message: "Unable to add the menu item." },
      { status: 500 }
    );
  }
}