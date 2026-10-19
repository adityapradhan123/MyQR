
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getOrCreateCafe } from "@/lib/cafe";

const cafeSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500),
});

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Please log in." },
        { status: 401 }
      );
    }

    const cafe = await getOrCreateCafe(user.id, user.name);

    return NextResponse.json({
      cafe: {
        name: cafe.name,
        slug: cafe.slug,
        description: cafe.description,
      },
    });
  } catch (error) {
    console.error("Get café error:", error);

    return NextResponse.json(
      { message: "Unable to load café settings." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
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
        const originUrl = new URL(origin);

        if (originUrl.host !== host) {
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
    const parsed = cafeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Enter a café name and a description under 500 characters." },
        { status: 400 }
      );
    }

    const cafe = await getOrCreateCafe(user.id, user.name);

    cafe.name = parsed.data.name;
    cafe.description = parsed.data.description;

    await cafe.save();

    return NextResponse.json({
      message: "Café profile updated successfully.",
      cafe: {
        name: cafe.name,
        slug: cafe.slug,
        description: cafe.description,
      },
    });
  } catch (error) {
    console.error("Update café error:", error);

    return NextResponse.json(
      { message: "Unable to update café settings." },
      { status: 500 }
    );
  }
}
