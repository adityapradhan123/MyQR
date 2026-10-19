import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import MenuItem from "@/models/MenuItem";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).optional(),
  price: z.number().finite().min(0).max(1000000).optional(),
  category: z.string().trim().min(1).max(60).optional(),
  imageUrl: z.string().trim().max(2000).optional(),
  isAvailable: z.boolean().optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Provide at least one field to update." }
);

function originIsValid(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
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

    const { id } = await context.params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { message: "Invalid menu item ID." },
        { status: 400 }
      );
    }

    const body: unknown = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid update data." },
        { status: 400 }
      );
    }

    await connectDB();

    const item = await MenuItem.findOneAndUpdate(
      { _id: id, ownerId: user.id },
      { $set: parsed.data },
      { new: true, runValidators: true }
    );

    if (!item) {
      return NextResponse.json(
        { message: "Menu item not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Menu item updated.",
      item: {
        id: item._id.toString(),
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        imageUrl: item.imageUrl,
        isAvailable: item.isAvailable,
      },
    });
  } catch (error) {
    console.error("Update menu item error:", error);

    return NextResponse.json(
      { message: "Unable to update the menu item." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
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

    const { id } = await context.params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { message: "Invalid menu item ID." },
        { status: 400 }
      );
    }

    await connectDB();

    const item = await MenuItem.findOneAndDelete({
      _id: id,
      ownerId: user.id,
    });

    if (!item) {
      return NextResponse.json(
        { message: "Menu item not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Menu item deleted." });
  } catch (error) {
    console.error("Delete menu item error:", error);

    return NextResponse.json(
      { message: "Unable to delete the menu item." },
      { status: 500 }
    );
  }
}