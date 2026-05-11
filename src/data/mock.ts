// Mock data для прототипа — без бэка. priceMinor = копейки.

export type Dish = {
  id: number;
  name: string;
  description: string;
  composition: string;
  priceMinor: number;
  category: string;
  cuisine: string;
  caloriesKcal: number;
  portionWeightG: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  isAvailable: boolean;
  tags: string[];
  emoji: string;
  bgFrom: string;
  bgTo: string;
  image_url?: string;
};

export const dishes: Dish[] = [
  {
    id: 1,
    name: "Том Ям с креветками",
    description:
      "Острый кокосово-цитрусовый суп с тигровыми креветками, грибами шиитаке и лемонграссом.",
    composition:
      "Креветки, кокосовое молоко, лемонграсс, галангал, листья каффира, грибы шиитаке, помидоры черри, чили",
    priceMinor: 79000,
    category: "Супы",
    cuisine: "Тайская",
    caloriesKcal: 320,
    portionWeightG: 350,
    proteinG: 22,
    fatG: 18,
    carbsG: 14,
    isAvailable: true,
    tags: ["острое", "морепродукты", "глютен-фри"],
    emoji: "🍜",
    bgFrom: "#fde68a",
    bgTo: "#f97316",
  },
  {
    id: 2,
    name: "Паста Карбонара",
    description:
      "Классическая римская паста с гуанчиале, желтком, пекорино и чёрным перцем. Без сливок.",
    composition: "Спагетти, гуанчиале, желток, пекорино романо, чёрный перец",
    priceMinor: 65000,
    category: "Паста",
    cuisine: "Итальянская",
    caloriesKcal: 540,
    portionWeightG: 320,
    proteinG: 24,
    fatG: 28,
    carbsG: 52,
    isAvailable: true,
    tags: ["классика", "сытное"],
    emoji: "🍝",
    bgFrom: "#fef3c7",
    bgTo: "#fbbf24",
  },
  {
    id: 3,
    name: "Боул с лососем",
    description: "Лосось гриль, киноа, авокадо, эдамаме, маринованный имбирь и соус понзу.",
    composition: "Лосось, киноа, авокадо, эдамаме, морковь, огурец, понзу",
    priceMinor: 89000,
    category: "Боулы",
    cuisine: "Авторская",
    caloriesKcal: 480,
    portionWeightG: 380,
    proteinG: 32,
    fatG: 22,
    carbsG: 38,
    isAvailable: true,
    tags: ["полезное", "high-protein", "глютен-фри"],
    emoji: "🥗",
    bgFrom: "#bbf7d0",
    bgTo: "#10b981",
  },
  {
    id: 4,
    name: "Бургер Truffle",
    description:
      "Котлета из мраморной говядины, трюфельный майонез, выдержанный чеддер, рукола, бриошь.",
    composition: "Говядина, бриошь, чеддер, трюфельный майонез, рукола, маринованный лук",
    priceMinor: 78000,
    category: "Бургеры",
    cuisine: "Авторская",
    caloriesKcal: 720,
    portionWeightG: 420,
    proteinG: 38,
    fatG: 42,
    carbsG: 48,
    isAvailable: true,
    tags: ["сытное", "премиум"],
    emoji: "🍔",
    bgFrom: "#fed7aa",
    bgTo: "#ea580c",
  },
  {
    id: 5,
    name: "Тартар из тунца",
    description:
      "Свежий тунец, авокадо, икра тобико, кунжутное масло, поджаренный кунжут.",
    composition: "Тунец, авокадо, тобико, лук-шалот, соевый соус, кунжут",
    priceMinor: 92000,
    category: "Закуски",
    cuisine: "Японская",
    caloriesKcal: 290,
    portionWeightG: 180,
    proteinG: 26,
    fatG: 16,
    carbsG: 8,
    isAvailable: false,
    tags: ["сырое", "морепродукты"],
    emoji: "🐟",
    bgFrom: "#fecaca",
    bgTo: "#ef4444",
  },
  {
    id: 6,
    name: "Цезарь с курицей",
    description: "Романо, цыплёнок гриль, пармезан, анчоусный соус, гренки из бриоши.",
    composition: "Салат романо, куриная грудка, пармезан, анчоусы, чеснок, бриошь",
    priceMinor: 55000,
    category: "Салаты",
    cuisine: "Итальянская",
    caloriesKcal: 420,
    portionWeightG: 280,
    proteinG: 28,
    fatG: 24,
    carbsG: 18,
    isAvailable: true,
    tags: ["классика"],
    emoji: "🥬",
    bgFrom: "#d9f99d",
    bgTo: "#65a30d",
  },
  {
    id: 7,
    name: "Тирамису",
    description: "Маскарпоне, савоярди, эспрессо, амаретто, какао-порошок Valrhona.",
    composition: "Маскарпоне, савоярди, эспрессо, амаретто, какао, желток",
    priceMinor: 39000,
    category: "Десерты",
    cuisine: "Итальянская",
    caloriesKcal: 380,
    portionWeightG: 150,
    proteinG: 8,
    fatG: 22,
    carbsG: 36,
    isAvailable: true,
    tags: ["классика", "содержит алкоголь"],
    emoji: "🍰",
    bgFrom: "#fde68a",
    bgTo: "#a16207",
  },
  {
    id: 8,
    name: "Ризотто с белыми грибами",
    description:
      "Карнароли, белые грибы, белое вино, пармиджано, петрушка, чёрный трюфель.",
    composition: "Рис карнароли, белые грибы, белое вино, пармиджано, лук, трюфель",
    priceMinor: 72000,
    category: "Паста",
    cuisine: "Итальянская",
    caloriesKcal: 510,
    portionWeightG: 320,
    proteinG: 14,
    fatG: 18,
    carbsG: 64,
    isAvailable: true,
    tags: ["вегетарианское", "содержит алкоголь"],
    emoji: "🍚",
    bgFrom: "#e7e5e4",
    bgTo: "#78716c",
  },
  {
    id: 9,
    name: "Гаспачо",
    description:
      "Холодный томатный суп с базиликом, перцем, оливковым маслом и хересным уксусом.",
    composition: "Помидоры, перец, огурец, чеснок, базилик, оливковое масло, хересный уксус",
    priceMinor: 42000,
    category: "Супы",
    cuisine: "Испанская",
    caloriesKcal: 180,
    portionWeightG: 320,
    proteinG: 4,
    fatG: 8,
    carbsG: 22,
    isAvailable: true,
    tags: ["вегетарианское", "лёгкое", "веган"],
    emoji: "🥣",
    bgFrom: "#fecaca",
    bgTo: "#dc2626",
  },
  {
    id: 10,
    name: "Греческий салат",
    description:
      "Помидоры, огурец, перец, оливки каламата, фета, орегано, оливковое масло.",
    composition: "Помидоры, огурец, перец, лук, оливки, фета, орегано, оливковое масло",
    priceMinor: 48000,
    category: "Салаты",
    cuisine: "Греческая",
    caloriesKcal: 290,
    portionWeightG: 280,
    proteinG: 9,
    fatG: 22,
    carbsG: 12,
    isAvailable: true,
    tags: ["вегетарианское", "лёгкое"],
    emoji: "🫒",
    bgFrom: "#bae6fd",
    bgTo: "#0284c7",
  },
  {
    id: 11,
    name: "Брускетта с помидорами",
    description: "Чиабатта, помидоры, базилик, чеснок, моцарелла, бальзамик.",
    composition: "Чиабатта, помидоры, базилик, моцарелла, чеснок, бальзамический крем",
    priceMinor: 36000,
    category: "Закуски",
    cuisine: "Итальянская",
    caloriesKcal: 240,
    portionWeightG: 180,
    proteinG: 8,
    fatG: 10,
    carbsG: 28,
    isAvailable: true,
    tags: ["вегетарианское"],
    emoji: "🥖",
    bgFrom: "#fed7aa",
    bgTo: "#c2410c",
  },
  {
    id: 12,
    name: "Чизкейк Нью-Йорк",
    description: "Сливочный крем-чиз на песочной основе, ягодный кулис.",
    composition: "Крем-чиз, песочное тесто, сахар, яйцо, сливки, ягоды",
    priceMinor: 35000,
    category: "Десерты",
    cuisine: "Американская",
    caloriesKcal: 420,
    portionWeightG: 160,
    proteinG: 7,
    fatG: 28,
    carbsG: 36,
    isAvailable: true,
    tags: ["сладкое"],
    emoji: "🍮",
    bgFrom: "#fce7f3",
    bgTo: "#db2777",
  },
];

export const categories = [
  { id: "all", name: "Всё" },
  { id: "Супы", name: "Супы" },
  { id: "Салаты", name: "Салаты" },
  { id: "Закуски", name: "Закуски" },
  { id: "Паста", name: "Паста" },
  { id: "Бургеры", name: "Бургеры" },
  { id: "Боулы", name: "Боулы" },
  { id: "Десерты", name: "Десерты" },
];

export type ChatMessage =
  | { id: string; role: "user"; text: string; time: string }
  | {
      id: string;
      role: "assistant";
      text: string;
      time: string;
      recommendedDishIds?: number[];
    };

export const chatHistory: ChatMessage[] = [
  {
    id: "m0",
    role: "assistant",
    text:
      "Здравствуйте, Алексей! Я Sapore — помогу подобрать блюда под ваше настроение, время и ограничения. Расскажите, что хотелось бы сегодня, или нажмите одну из подсказок ниже.",
    time: "14:30",
  },
  {
    id: "m1",
    role: "user",
    text: "Хочу что-нибудь острое и не сильно калорийное. Аллергии на арахис.",
    time: "14:32",
  },
  {
    id: "m2",
    role: "assistant",
    text:
      "Подобрал четыре варианта — от самых лёгких до сытных. Том Ям согреет и даст лёгкость; Боул с лососем — белок без перегруза; Гаспачо холодный и почти диетический; Цезарь — между ними по сытости.",
    time: "14:32",
    recommendedDishIds: [1, 3, 9, 6],
  },
  {
    id: "m3",
    role: "user",
    text: "А есть что-то более сытное на горячее?",
    time: "14:34",
  },
];

export type CartItem = {
  dishId: number;
  quantity: number;
  note?: string;
};

export const initialCart: CartItem[] = [
  { dishId: 1, quantity: 1 },
  { dishId: 3, quantity: 1, note: "без имбиря" },
];

export type Profile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  allergens: string[];
  dietary: string[];
};

export const initialProfile: Profile = {
  firstName: "Алексей",
  lastName: "Морозов",
  email: "alexey@example.com",
  phone: "+7 (999) 123-45-67",
  allergens: ["арахис", "лактоза"],
  dietary: ["без свинины"],
};

export type OrderStatus =
  | "accepted"
  | "cooking"
  | "ready"
  | "in_delivery"
  | "closed"
  | "cancelled";

export type Order = {
  id: string;
  status: OrderStatus;
  createdAt: string;
  totalMinor: number;
  fulfillmentType: "delivery" | "pickup" | "dine_in";
  paymentMethod: "on_delivery" | "online_stub";
  itemsPreview: { dishId: number; quantity: number }[];
  address?: string;
  tableNumber?: string;
};

export const initialOrders: Order[] = [
  {
    id: "ord-1",
    status: "accepted",
    createdAt: "Сегодня, 14:50",
    totalMinor: 99000,
    fulfillmentType: "dine_in",
    paymentMethod: "online_stub",
    tableNumber: "12",
    itemsPreview: [
      { dishId: 9, quantity: 1 },
      { dishId: 11, quantity: 1 },
    ],
  },
  {
    id: "ord-2",
    status: "cooking",
    createdAt: "Сегодня, 14:38",
    totalMinor: 168000,
    fulfillmentType: "delivery",
    paymentMethod: "on_delivery",
    address: "Москва, Никольская 10",
    itemsPreview: [
      { dishId: 1, quantity: 1 },
      { dishId: 3, quantity: 1 },
    ],
  },
  {
    id: "ord-3",
    status: "ready",
    createdAt: "Сегодня, 13:20",
    totalMinor: 78000,
    fulfillmentType: "pickup",
    paymentMethod: "on_delivery",
    itemsPreview: [{ dishId: 4, quantity: 1 }],
  },
  {
    id: "ord-4",
    status: "in_delivery",
    createdAt: "20 апреля, 13:45",
    totalMinor: 148000,
    fulfillmentType: "delivery",
    paymentMethod: "online_stub",
    address: "Москва, Никольская 10",
    itemsPreview: [
      { dishId: 8, quantity: 1 },
      { dishId: 11, quantity: 2 },
    ],
  },
  {
    id: "ord-5",
    status: "closed",
    createdAt: "Вчера, 19:12",
    totalMinor: 117000,
    fulfillmentType: "pickup",
    paymentMethod: "on_delivery",
    itemsPreview: [
      { dishId: 4, quantity: 1 },
      { dishId: 7, quantity: 1 },
    ],
  },
  {
    id: "ord-6",
    status: "cancelled",
    createdAt: "15 апреля, 12:08",
    totalMinor: 55000,
    fulfillmentType: "delivery",
    paymentMethod: "on_delivery",
    address: "Москва, Никольская 10",
    itemsPreview: [{ dishId: 6, quantity: 1 }],
  },
];

export function getDish(id: number): Dish | undefined {
  return dishes.find((d) => d.id === id);
}
