export type Speaker = {
  slug: string;
  name: string;
  role: string;
  short_role: string;
  group: "host" | "imlc_2026" | "imlc_2027";
  photo: string | null;
  photo_mobile: string | null;
  bio: string[];
};

export const groupTag: Record<Speaker["group"], string> = { host: "Host", imlc_2026: "IMLC 2026 speaker", imlc_2027: "IMLC 2027 speaker" };
