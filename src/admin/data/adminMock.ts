/*
 * Mock-данные админки. Пока всё локально, без бэкенда.
 * Структуры подобраны так, чтобы потом легко смапить на /admin/* эндпоинты.
 */

export type AdminTag = {
  id: number;
  name: string;
  slug: string;
  color: string;
};

export type AdminCategory = {
  id: number;
  name: string;
  sortOrder: number;
  isAvailable: boolean;
};

export type AdminOrderStatus =
  | "accepted"
  | "cooking"
  | "ready"
  | "in_delivery"
  | "closed"
  | "cancelled";

export type AdminOrder = {
  id: string;
  shortId: string;
  customer: string;
  phone: string;
  status: AdminOrderStatus;
  fulfillmentType: "delivery" | "pickup" | "dine_in";
  paymentMethod: "on_delivery" | "online_stub";
  totalMinor: number;
  createdAt: string;
  address?: string;
  tableNumber?: string;
  itemsCount: number;
  items: { dishName: string; quantity: number; priceMinor: number }[];
};

export type AdminQuery = {
  id: string;
  text: string;
  createdAt: string;
  user: string;
  recommendedDishIds: number[];
  addedToCart: number;
  ordered: number;
};

export type AnalyticsAggregate = {
  totalQueries: number;
  uniqueUsers: number;
  avgRecommendedPerQuery: number;
  avgAddedToCartPerQuery: number;
  avgOrderedPerQuery: number;
  queriesLeadingToOrder: number;
  conversionToOrderPercent: number;
  topQueries: { text: string; count: number; conversionPercent: number }[];
  topRecommendedDishes: { id: number; name: string; recommendations: number; orders: number }[];
  /** распределение запросов по часам суток (24 значения) */
  hourlyDistribution: number[];
};

export const mockAnalyticsAggregate: AnalyticsAggregate = {
  totalQueries: 412,
  uniqueUsers: 128,
  avgRecommendedPerQuery: 3.4,
  avgAddedToCartPerQuery: 1.2,
  avgOrderedPerQuery: 0.5,
  queriesLeadingToOrder: 71,
  conversionToOrderPercent: 17.2,
  topQueries: [
    { text: "Что-то острое и лёгкое", count: 84, conversionPercent: 22.6 },
    { text: "Хочу сытное на двоих", count: 71, conversionPercent: 19.7 },
    { text: "Подойдёт под белое вино", count: 56, conversionPercent: 12.5 },
    { text: "До 500 рублей", count: 48, conversionPercent: 8.3 },
    { text: "Веган-ужин", count: 32, conversionPercent: 25.0 },
    { text: "Без глютена", count: 27, conversionPercent: 18.5 },
    { text: "Холодные блюда", count: 19, conversionPercent: 10.5 },
    { text: "Что взять на ужин", count: 16, conversionPercent: 12.5 },
  ],
  topRecommendedDishes: [
    { id: 1, name: "Том Ям", recommendations: 142, orders: 38 },
    { id: 8, name: "Бургер Truffle", recommendations: 121, orders: 47 },
    { id: 4, name: "Цезарь с курицей", recommendations: 98, orders: 31 },
    { id: 6, name: "Карбонара", recommendations: 84, orders: 24 },
    { id: 3, name: "Боул с лососем", recommendations: 76, orders: 19 },
    { id: 9, name: "Гаспачо", recommendations: 52, orders: 8 },
  ],
  hourlyDistribution: [
    1, 0, 0, 0, 0, 0, 1, 3, 8, 14, 22, 35, 48, 41, 28, 18, 22, 31, 44, 38, 27, 18, 10, 4,
  ],
};

export type AdminPeriod = "today" | "week" | "month";

export const PERIOD_LABEL: Record<AdminPeriod, string> = {
  today: "Сегодня",
  week: "Неделя",
  month: "Месяц",
};

export type AdminOverview = {
  orders: number;
  revenueMinor: number;
  averageCheckMinor: number;
  conversionPercent: number;
  topDishes: { id: number; name: string; orders: number }[];
  topQueries: { text: string; count: number }[];
  ordersByStatus: { status: AdminOrderStatus; count: number }[];
};

export const mockTags: AdminTag[] = [
  { id: 1, name: "Хит", slug: "hit", color: "#f97316" },
  { id: 2, name: "Новинка", slug: "new", color: "#10b981" },
  { id: 3, name: "Острое", slug: "spicy", color: "#dc2626" },
  { id: 4, name: "Веган", slug: "vegan", color: "#65a30d" },
  { id: 5, name: "Сезонное", slug: "seasonal", color: "#0284c7" },
];

export const mockCategories: AdminCategory[] = [
  { id: 1, name: "Завтраки", sortOrder: 1, isAvailable: true },
  { id: 2, name: "Закуски", sortOrder: 2, isAvailable: true },
  { id: 3, name: "Салаты", sortOrder: 3, isAvailable: true },
  { id: 4, name: "Супы", sortOrder: 4, isAvailable: true },
  { id: 5, name: "На гриле", sortOrder: 5, isAvailable: true },
  { id: 6, name: "Мясное", sortOrder: 6, isAvailable: true },
  { id: 7, name: "Морепродукты", sortOrder: 7, isAvailable: true },
  { id: 8, name: "Паста", sortOrder: 8, isAvailable: true },
  { id: 9, name: "Десерты", sortOrder: 9, isAvailable: true },
  { id: 10, name: "Напитки", sortOrder: 10, isAvailable: true },
  { id: 11, name: "Алкоголь", sortOrder: 11, isAvailable: false },
];

const NAMES = [
  "Алексей Морозов",
  "Мария Иванова",
  "Игорь Петров",
  "Светлана Кузнецова",
  "Дмитрий Соколов",
  "Анна Лебедева",
];

const DISHES = [
  "Том Ям",
  "Ризотто с белыми грибами",
  "Бургер Truffle",
  "Цезарь с курицей",
  "Боул с лососем",
  "Карбонара",
  "Стейк Фланк",
  "Паста Аррабиата",
  "Гаспачо",
  "Тирамису",
];

function rndDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(10 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));
  return d.toISOString();
}

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

export const mockOrders: AdminOrder[] = Array.from({ length: 24 }, (_, i) => {
  const statuses: AdminOrderStatus[] = [
    "accepted",
    "cooking",
    "ready",
    "in_delivery",
    "closed",
    "cancelled",
  ];
  const status = pick(statuses, i + Math.floor(i / 6));
  const ftypes = ["delivery", "pickup", "dine_in"] as const;
  const fulfillmentType = pick([...ftypes], i);
  const itemsCount = 2 + (i % 4);
  const items = Array.from({ length: itemsCount }, (_, j) => ({
    dishName: pick(DISHES, i + j),
    quantity: 1 + (j % 3),
    priceMinor: (300 + ((i + j) % 9) * 80) * 100,
  }));
  const totalMinor = items.reduce((s, it) => s + it.priceMinor * it.quantity, 0);
  return {
    id: `mock-${1000 + i}`,
    shortId: `#${1000 + i}`,
    customer: pick(NAMES, i),
    phone: `+7 (9${String(10 + (i % 90)).padStart(2, "0")}) ${String(100 + i).padStart(3, "0")}-${String(10 + i).padStart(2, "0")}-${String(20 + i).padStart(2, "0")}`,
    status,
    fulfillmentType,
    paymentMethod: i % 2 === 0 ? "on_delivery" : "online_stub",
    totalMinor,
    createdAt: rndDate(Math.floor(i / 4)),
    address: fulfillmentType === "delivery" ? `Никольская, ${1 + i}` : undefined,
    tableNumber: fulfillmentType === "dine_in" ? String(1 + (i % 20)) : undefined,
    itemsCount,
    items,
  };
});

export const mockQueries: AdminQuery[] = Array.from({ length: 30 }, (_, i) => {
  const texts = [
    "Что-то острое и лёгкое",
    "Хочу сытное на двоих",
    "Подойдёт под белое вино",
    "До 500 рублей",
    "Без глютена",
    "Что взять на ужин",
    "Веган-ужин",
    "Холодные блюда",
    "Что есть из морепродуктов",
    "Самое популярное",
  ];
  const dishCount = 2 + (i % 3);
  const recommendedDishIds = Array.from({ length: dishCount }, (_, j) => ((i + j) % 50) + 1);
  return {
    id: `q-${100 + i}`,
    text: pick(texts, i),
    createdAt: rndDate(Math.floor(i / 6)),
    user: pick(NAMES, i),
    recommendedDishIds,
    addedToCart: i % 3 === 0 ? 1 + (i % 2) : 0,
    ordered: i % 5 === 0 ? 1 : 0,
  };
});

export const mockOverviewByPeriod: Record<AdminPeriod, AdminOverview> = {
  today: {
    orders: 18,
    revenueMinor: 4_82_000,
    averageCheckMinor: 2_68_000,
    conversionPercent: 14.6,
    topDishes: [
      { id: 8, name: "Бургер Truffle", orders: 6 },
      { id: 4, name: "Цезарь с курицей", orders: 5 },
      { id: 1, name: "Том Ям", orders: 4 },
      { id: 6, name: "Карбонара", orders: 3 },
      { id: 3, name: "Боул с лососем", orders: 2 },
    ],
    topQueries: [
      { text: "Что-то острое и лёгкое", count: 4 },
      { text: "Хочу сытное на двоих", count: 3 },
      { text: "Подойдёт под белое вино", count: 2 },
      { text: "До 500 рублей", count: 2 },
      { text: "Веган-ужин", count: 1 },
    ],
    ordersByStatus: [
      { status: "accepted", count: 4 },
      { status: "cooking", count: 6 },
      { status: "ready", count: 3 },
      { status: "in_delivery", count: 2 },
      { status: "closed", count: 2 },
      { status: "cancelled", count: 1 },
    ],
  },
  week: {
    orders: 124,
    revenueMinor: 32_18_000,
    averageCheckMinor: 2_60_000,
    conversionPercent: 13.9,
    topDishes: [
      { id: 8, name: "Бургер Truffle", orders: 38 },
      { id: 4, name: "Цезарь с курицей", orders: 31 },
      { id: 1, name: "Том Ям", orders: 27 },
      { id: 6, name: "Карбонара", orders: 24 },
      { id: 3, name: "Боул с лососем", orders: 19 },
    ],
    topQueries: [
      { text: "Что-то острое и лёгкое", count: 22 },
      { text: "Хочу сытное на двоих", count: 18 },
      { text: "Подойдёт под белое вино", count: 14 },
      { text: "До 500 рублей", count: 12 },
      { text: "Веган-ужин", count: 9 },
    ],
    ordersByStatus: [
      { status: "accepted", count: 4 },
      { status: "cooking", count: 6 },
      { status: "ready", count: 3 },
      { status: "in_delivery", count: 2 },
      { status: "closed", count: 102 },
      { status: "cancelled", count: 7 },
    ],
  },
  month: {
    orders: 542,
    revenueMinor: 138_40_000,
    averageCheckMinor: 2_55_000,
    conversionPercent: 13.2,
    topDishes: [
      { id: 8, name: "Бургер Truffle", orders: 142 },
      { id: 4, name: "Цезарь с курицей", orders: 128 },
      { id: 1, name: "Том Ям", orders: 96 },
      { id: 6, name: "Карбонара", orders: 88 },
      { id: 3, name: "Боул с лососем", orders: 71 },
    ],
    topQueries: [
      { text: "Что-то острое и лёгкое", count: 84 },
      { text: "Хочу сытное на двоих", count: 71 },
      { text: "Подойдёт под белое вино", count: 56 },
      { text: "До 500 рублей", count: 48 },
      { text: "Веган-ужин", count: 32 },
    ],
    ordersByStatus: [
      { status: "accepted", count: 4 },
      { status: "cooking", count: 6 },
      { status: "ready", count: 3 },
      { status: "in_delivery", count: 2 },
      { status: "closed", count: 510 },
      { status: "cancelled", count: 17 },
    ],
  },
};

export const ORDER_STATUS_LABEL: Record<AdminOrderStatus, string> = {
  accepted: "Принят",
  cooking: "Готовится",
  ready: "Готов",
  in_delivery: "В доставке",
  closed: "Закрыт",
  cancelled: "Отменён",
};

export const FULFILLMENT_LABEL = {
  delivery: "Доставка",
  pickup: "Самовывоз",
  dine_in: "В зале",
} as const;

export const PAYMENT_LABEL = {
  on_delivery: "При получении",
  online_stub: "Онлайн",
} as const;
