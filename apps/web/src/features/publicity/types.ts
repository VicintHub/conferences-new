export type PublicitySize = { key: string; label: string; dims: string; url: string };

export type PublicityItem = {
  slug: string;
  title: string;
  type: "flyer" | "video" | "status" | "design" | "logo";
  meta: string | null;
  ratio: string;
  preview: string | null;
  is_video: boolean;
  caption: string;
  sizes: PublicitySize[];
  new: boolean;
  published_at: string | null;
};

export type PublicityList = { data: PublicityItem[]; meta: { types: Record<string, string>; new_count: number } };
