import { ItemView } from "@/features/publicity/ItemView";

export const metadata = { title: "Publicity kit — Jan. Conf 2027" };

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <ItemView slug={(await params).slug} backHref="/app/publicity" />;
}
