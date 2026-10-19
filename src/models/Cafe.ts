import mongoose, { Schema, Model } from "mongoose";

export interface ICafe {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const CafeSchema = new Schema<ICafe>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      default: "My Cafe",
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  { timestamps: true }
);

const Cafe: Model<ICafe> =
  (mongoose.models.Cafe as Model<ICafe>) ||
  mongoose.model<ICafe>("Cafe", CafeSchema);

export default Cafe;