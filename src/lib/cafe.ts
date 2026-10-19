
import { connectDB } from "@/lib/mongodb";
import Cafe from "@/models/Cafe";

export async function getOrCreateCafe(
  ownerId: string,
  ownerName: string
) {
  await connectDB();

  let cafe = await Cafe.findOne({ ownerId });

  if (!cafe) {
    cafe = await Cafe.create({
      ownerId,
      name: "My Cafe",
      slug: `cafe-${ownerId}`,
      description: "",
    });
  } else if (cafe.name === `${ownerName}'s Cafe`) {
    // Replace the old automatically generated owner-based name.
    cafe.name = "My Cafe";
    await cafe.save();
  }

  return cafe;
}
