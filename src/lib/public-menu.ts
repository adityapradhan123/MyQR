
import { cacheLife } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import Cafe from "@/models/Cafe";
import MenuItem from "@/models/MenuItem";
import Offer from "@/models/Offer";

export async function getCachedPublicMenu(slug: string) {
  "use cache";

  cacheLife({
    stale: 30,
    revalidate: 60,
    expire: 3600,
  });

  await connectDB();

  const cafe = await Cafe.findOne({ slug }).lean();

  if (!cafe) {
    return null;
  }

  const now = new Date();

  const [items, offers] = await Promise.all([
    MenuItem.find({
      cafeId: cafe._id,
      isAvailable: true,
    })
      .sort({ category: 1, name: 1 })
      .lean(),

    Offer.find({
      cafeId: cafe._id,
      isEnabled: true,
      startAt: { $lte: now },
      endAt: { $gt: now },
    })
      .sort({ endAt: 1 })
      .lean(),
  ]);

  // Return plain, serializable data from the cache.
  return {
    cafe: {
      id: cafe._id.toString(),
      name: cafe.name,
      slug: cafe.slug,
      description: cafe.description,
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

    offers: offers.map((offer) => ({
      id: offer._id.toString(),
      title: offer.title,
      description: offer.description,
      discountType: offer.discountType,
      discountValue: offer.discountValue,
      startAt: new Date(offer.startAt).toISOString(),
      endAt: new Date(offer.endAt).toISOString(),
    })),
  };
}
