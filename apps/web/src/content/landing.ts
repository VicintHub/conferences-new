// Placeholder content from the design handoff. Replaced by API data as each domain ships
// (speakers → step 5, programme → step 4, products → step 6, testimonies → step 5).

export const photo = (name: string) => `/images/photos/${name}.webp`;

export const REGISTER_HREF = "/register";
export const PARTNER_HREF = "mailto:mivmandate2010@gmail.com?subject=Partnering%20with%20Jan.%20Conf%202027";

export const navLinks = [
  { label: "About", href: "#about" },
  { label: "Speakers", href: "/speakers" },
  { label: "Schedule", href: "#schedule" },
  { label: "Accommodation", href: "#accommodation" },
  { label: "Shop", href: "/shop" },
] as const;

export const why = [
  {
    n: "01",
    t: "Global networking opportunities",
    s: "Meet like-minded leaders from every corner of the world! Build partnerships, exchange ideas, and create lifelong connections that will strengthen your ministry.",
  },
  {
    n: "02",
    t: "World class speakers",
    s: "Gain fresh perspectives from world-renowned leaders in ministry, leadership, and innovation. Hear how to navigate today's challenges with wisdom and grace.",
  },
  {
    n: "03",
    t: "Powerful divine sessions",
    s: "Experience the presence of God filled with inspiring sermons and uplifting worship sessions that stirred the soul.",
  },
];

export const ministers = [
  {
    n: "Rev. Samson Ajetomobi",
    r: "Host · President, The Men of Issachar Vision Inc.",
    img: photo("lp-host-1"),
    imgM: photo("lp-host-1m"),
  },
  {
    n: "Rev. Mrs Stella Ajetomobi",
    r: "Host · Vice-President, The Men of Issachar Vision Inc.",
    img: photo("lp-host-2"),
    imgM: photo("lp-host-2m"),
  },
];

export const days = ["Tue 19", "Wed 20", "Thu 21", "Fri 22", "Sat 23", "Sun 24"] as const;

const standard = [
  { time: "9:00 AM", t: "Morning Plenary Session", where: "Main hall" },
  { time: "5:00 PM", t: "Breakout Session", where: "Breakout halls · Zoom" },
  { time: "6:00 PM", t: "Evening Plenary Session", where: "Main hall" },
];

export const sessionsByDay: Record<(typeof days)[number], { time: string; t: string; where: string }[]> = {
  "Tue 19": [{ time: "5:00 PM", t: "Evening of Worship", where: "Main hall" }],
  "Wed 20": standard,
  "Thu 21": standard,
  "Fri 22": standard,
  "Sat 23": standard,
  "Sun 24": standard,
};

export const regOptions = [
  "Physical Attendance",
  "Live Streaming on Facebook",
  "Live Streaming on Radio",
  "Audio Recording of All Conference Sessions",
  "Remote Break Out Sessions Via Zoom",
];

// The Revival (37th IMLC) merchandise: keep in step with the shop's catalogue (apps/api ShopSeeder).
export const merch = [
  { t: "Revival Hoodie", p: "₦20,000", src: "/images/merch/revival-hoodie.jpg", href: "/shop/revival-hoodie" },
  { t: "Revival Polo", p: "₦13,000", src: "/images/merch/revival-polo-white.jpg", href: "/shop/revival-polo" },
  { t: "Revival Baseball Shirt", p: "₦16,000", src: "/images/merch/revival-baseball.jpg", href: "/shop/revival-baseball-shirt" },
  { t: "Revival T-shirt", p: "₦13,000", src: "/images/merch/revival-tee.jpg", href: "/shop/revival-t-shirt" },
];

export const galleryPhotos = ["lp-hero", "lp-about-1", "lp-about-2", "lp-hotel", "lp-reg", "lp-hero-m", "lp-host-1", "lp-host-2"].map(
  photo,
);

export const reels = [
  { src: photo("lp-hero-m"), t: "Opening night", d: "0:48" },
  { src: photo("lp-about-2"), t: "Worship highlights", d: "1:12" },
  { src: photo("lp-about-1"), t: "Breakout sessions", d: "0:35" },
  { src: photo("lp-reg"), t: "Royal Conference", d: "0:56" },
];

export const testimonies = [
  {
    q: "The breakout on church planting gave our team a clear plan. We have started two outreach cells since the conference.",
    n: "Rev. Daniel O.",
    w: "Ilorin · IMLC 2026",
    av: photo("lp-host-1"),
  },
  {
    q: "I watched online from Accra. The stream held all week and the radio option saved my data.",
    n: "Abena K.",
    w: "Accra · Online delegate",
    av: photo("lp-about-2"),
  },
  {
    q: "My first IYLC. I made friends from five states and found my place in missions.",
    n: "Tobi E.",
    w: "Lagos · IYLC 2026",
    av: photo("lp-about-1"),
  },
  {
    q: "Registration and badge collection took less than ten minutes. Everything was in order.",
    n: "Mrs. Ngozi U.",
    w: "Enugu · Delegate",
    av: photo("lp-host-2"),
  },
];

export const contact = {
  email: "mivmandate2010@gmail.com",
  phone: "0808 085 4818",
  address: "Leadership and Missions Conference Centre Olororo, Ojoo Ibadan, Nigeria",
};
