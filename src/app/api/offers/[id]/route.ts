
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Offer from "@/models/Offer";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateSchema = z.object({
  isEnabled: z.boolean(),
});

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Please log in." },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { message: "Invalid offer ID." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid offer update." },
        { status: 400 }
      );
    }

    await connectDB();

    const offer = await Offer.findOneAndUpdate(
      { _id: id, ownerId: user.id },
      { $set: { isEnabled: parsed.data.isEnabled } },
      { new: true, runValidators: true }
    );

    if (!offer) {
      return NextResponse.json(
        { message: "Offer not found." },
        { status: 404 }
      );
    }

    const now = Date.now();
    let status: "scheduled" | "active" | "paused" | "expired";

    if (now >= offer.endAt.getTime()) {
      status = "expired";
    } else if (!offer.isEnabled) {
      status = "paused";
    } else if (now < offer.startAt.getTime()) {
      status = "scheduled";
    } else {
      status = "active";
    }

    return NextResponse.json({
      message: "Offer updated successfully.",
      offer: {
        id: offer._id.toString(),
        isEnabled: offer.isEnabled,
        status,
      },
    });
  } catch (error) {
    console.error("Update offer error:", error);

    return NextResponse.json(
      { message: "Unable to update offer." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Please log in." },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { message: "Invalid offer ID." },
        { status: 400 }
      );
    }

    await connectDB();

    const offer = await Offer.findOneAndDelete({
      _id: id,
      ownerId: user.id,
    });

    if (!offer) {
      return NextResponse.json(
        { message: "Offer not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Offer deleted successfully.",
    });
  } catch (error) {
    console.error("Delete offer error:", error);

    return NextResponse.json(
      { message: "Unable to delete offer." },
      { status: 500 }
    );
  }
}
