
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { createSession, COOKIE_NAME } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  let expectedOrigin: string;

  try {
    expectedOrigin = process.env.APP_URL
      ? new URL(process.env.APP_URL).origin
      : new URL(request.url).origin;
  } catch {
    return NextResponse.json(
      { message: "Server origin configuration is invalid." },
      { status: 500 }
    );
  }

  if (!origin || origin !== expectedOrigin) {
    return NextResponse.json(
      { message: "Invalid request origin" },
      { status: 403 }
    );
  }

  try {
    const parsed = loginSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Enter a valid email and password." },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({
      email: parsed.data.email.toLowerCase(),
    }).select("+passwordHash");

    const passwordMatches = user
      ? await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        )
      : false;

    if (!user || !passwordMatches) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const token = await createSession(user._id.toString());

    const response = NextResponse.json({
      message: "Login successful.",
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json(
      { message: "Unable to log in right now." },
      { status: 500 }
    );
  }
}
