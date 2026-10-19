
import mongoose, { Schema, Model } from "mongoose";

export interface IOffer {
  cafeId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startAt: Date;
  endAt: Date;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OfferSchema = new Schema<IOffer>(
  {
    cafeId: {
      type: Schema.Types.ObjectId,
      ref: "Cafe",
      required: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0.01,
      max: 1000000,
    },
    startAt: {
      type: Date,
      required: true,
    },
    endAt: {
      type: Date,
      required: true,
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

OfferSchema.index({ cafeId: 1, startAt: 1, endAt: 1 });

const Offer: Model<IOffer> =
  (mongoose.models.Offer as Model<IOffer>) ||
  mongoose.model<IOffer>("Offer", OfferSchema);

export default Offer;
