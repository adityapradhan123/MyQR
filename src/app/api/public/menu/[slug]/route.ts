
import { NextResponse } from "next/server";
import { getCachedPublicMenu } from "@/lib/public-menu";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const { slug } = await params;

    const menu = await getCachedPublicMenu(slug);

    if (!menu) {
      return NextResponse.json(
        { message: "Cafe not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(menu);
  } catch (error) {
    console.error("Public menu error:", error);

    return NextResponse.json(
      { message: "Unable to load the public menu." },
      { status: 500 }
    );
  }
}
