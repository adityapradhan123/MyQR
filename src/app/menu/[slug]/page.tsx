
import { Suspense } from "react";
import MenuClient from "./MenuClient";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function MenuLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf7f2] px-4">
      <p className="text-[#766c60]">Preparing your menu...</p>
    </main>
  );
}

async function MenuPageContent({ params }: PageProps) {
  const { slug } = await params;

  return <MenuClient slug={slug} />;
}

export default function PublicMenuPage(props: PageProps) {
  return (
    <Suspense fallback={<MenuLoading />}>
      <MenuPageContent params={props.params} />
    </Suspense>
  );
}
