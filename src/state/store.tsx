import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  initialCart,
  initialOrders,
  initialProfile,
  dishes as mockDishes,
  type CartItem,
  type Dish,
  type Order,
  type OrderStatus,
  type Profile,
} from "@/data/mock";
import type {
  SessionInfo,
  ApiProfile,
  ApiDish,
  ApiOrder,
  PatchProfileRequest,
  CreateOrderRequest,
} from "@/api/types";
import {
  getSession,
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
} from "@/api/auth";
import { getProfile, patchProfile } from "@/api/profile";
import { listCategories, listDishes } from "@/api/menu";
import {
  getCart,
  addCartItem as addCartItemApi,
  patchCartItem,
  removeCartItem as removeCartItemApi,
  clearCartApi,
} from "@/api/cart";
import { createOrder, listOrders } from "@/api/orders";

// ─── Mock session (бэкенд недоступен) ────────────────────────────────────────

const MOCK_SESSION: SessionInfo = {
  user_id: "mock-user",
  role: "customer",
  is_guest: false,
  csrf: "",
};

const MOCK_ADMIN_SESSION: SessionInfo = {
  user_id: "mock-admin",
  role: "admin",
  is_guest: false,
  csrf: "",
};

const MOCK_ADMIN_PROFILE = {
  firstName: "Анна",
  lastName: "Админова",
  email: "admin@demo.local",
  phone: "+7 (999) 000-00-00",
  allergens: [],
  dietary: [],
};

const emptyProfile: Profile = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  allergens: [],
  dietary: [],
};

// ─── Dish colour palette (детерминированная заглушка) ─────────────────────────

const BG_PAIRS: [string, string][] = [
  ["#fde68a", "#f97316"],
  ["#bbf7d0", "#10b981"],
  ["#fef3c7", "#fbbf24"],
  ["#fecaca", "#ef4444"],
  ["#fed7aa", "#ea580c"],
  ["#d9f99d", "#65a30d"],
  ["#bae6fd", "#0284c7"],
  ["#fce7f3", "#db2777"],
  ["#e7e5e4", "#78716c"],
  ["#fecaca", "#dc2626"],
];
const EMOJIS = ["🍽️", "🥗", "🍜", "🍝", "🍔", "🥘", "🍛", "🥙", "🍱", "🍲", "🥩", "🍣"];

function dishFallback(id: number) {
  const [bgFrom, bgTo] = BG_PAIRS[id % BG_PAIRS.length];
  return { bgFrom, bgTo, emoji: EMOJIS[id % EMOJIS.length] };
}

// ─── Adapters ─────────────────────────────────────────────────────────────────

function mapApiProfile(p: ApiProfile): Profile {
  return {
    firstName: p.first_name ?? "",
    lastName: p.last_name ?? "",
    email: p.email,
    phone: p.phone ?? "",
    allergens: p.allergens,
    dietary: p.dietary,
  };
}

function mapToApiPatch(patch: Partial<Profile>): PatchProfileRequest {
  const result: PatchProfileRequest = {};
  if ("firstName" in patch) result.first_name = patch.firstName || null;
  if ("lastName" in patch) result.last_name = patch.lastName || null;
  if ("phone" in patch) result.phone = patch.phone || null;
  return result;
}

function mapApiDish(d: ApiDish, categoryName: string): Dish {
  const { bgFrom, bgTo, emoji } = dishFallback(d.id);
  return {
    id: d.id,
    name: d.name,
    description: d.description,
    composition: d.composition,
    priceMinor: d.price_minor,
    category: categoryName,
    cuisine: d.cuisine,
    caloriesKcal: d.calories_kcal ?? 0,
    portionWeightG: d.portion_weight_g ?? 0,
    proteinG: d.protein_g ?? 0,
    fatG: d.fat_g ?? 0,
    carbsG: d.carbs_g ?? 0,
    isAvailable: d.is_available,
    tags: d.tags.map((t) => t.name),
    emoji,
    bgFrom,
    bgTo,
    image_url: d.image_url || undefined,
  };
}

function formatOrderDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const time = d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === now.toDateString()) return `Сегодня, ${time}`;
  const yesterday = new Date(now.getTime() - 86400000);
  if (d.toDateString() === yesterday.toDateString()) return `Вчера, ${time}`;
  const months = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря",
  ];
  return `${d.getDate()} ${months[d.getMonth()]}, ${time}`;
}

function extractTableNumber(notes: string | null | undefined): string | undefined {
  if (!notes) return undefined;
  const m = /Стол №(\S+)/.exec(notes);
  return m?.[1];
}

function mapApiOrder(o: ApiOrder): Order {
  return {
    id: o.id,
    status: o.status,
    createdAt: formatOrderDate(o.created_at),
    totalMinor: o.total_minor,
    fulfillmentType: o.fulfillment_type,
    paymentMethod: o.payment_method,
    itemsPreview: o.items.map((it) => ({ dishId: it.dish_id ?? -1, quantity: it.quantity })),
    address: o.delivery_address ?? undefined,
    tableNumber: extractTableNumber(o.notes),
  };
}

// ─── Store types ──────────────────────────────────────────────────────────────

type State = {
  session: SessionInfo | null;
  sessionLoading: boolean;
  /** true — бэкенд недоступен, все данные из моков */
  mockMode: boolean;
  cart: CartItem[];
  dishes: Dish[];
  profile: Profile;
  orders: Order[];

  initSession(): Promise<void>;
  /** Перезагрузить меню (категории + блюда) из бэка. После admin-операций. */
  refreshMenu(): Promise<void>;
  login(email: string, password: string): Promise<void>;
  register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone: string,
  ): Promise<void>;
  logout(): Promise<void>;

  getDishById(id: number): Dish | undefined;

  addToCart(dishId: number, quantity?: number, note?: string): void;
  setCartQuantity(dishId: number, quantity: number): void;
  removeFromCart(dishId: number): void;
  clearCart(): void;
  cartTotalMinor: number;
  cartCount: number;

  updateProfile(patch: Partial<Profile>): void;
  addAllergen(value: string): void;
  removeAllergen(value: string): void;
  addDietary(value: string): void;
  removeDietary(value: string): void;
  savePreferences(): void;

  createOrderFromCart(args: {
    fulfillmentType: Order["fulfillmentType"];
    paymentMethod: Order["paymentMethod"];
    address?: string;
    tableNumber?: string;
  }): Promise<Order>;
  cancelOrder(orderId: string): void;

  /** true, если текущий пользователь — админ (используется для admin-роутов) */
  isAdmin: boolean;
  /** В mock-режиме — переключиться на админа (для разработки/демо) */
  loginAsMockAdmin(): void;
};

// ─── Provider ─────────────────────────────────────────────────────────────────

const AppContext = createContext<State | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [mockMode, setMockMode] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [dishes, setDishes] = useState<Dish[]>(mockDishes);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [orders, setOrders] = useState<Order[]>([]);

  const cartTotalMinor = useMemo(
    () =>
      cart.reduce((sum, it) => {
        const d = dishes.find((x) => x.id === it.dishId);
        return d ? sum + d.priceMinor * it.quantity : sum;
      }, 0),
    [cart, dishes],
  );
  const cartCount = cart.reduce((s, it) => s + it.quantity, 0);

  const value: State = {
    session,
    sessionLoading,
    mockMode,
    cart,
    dishes,
    profile,
    orders,
    cartTotalMinor,
    cartCount,

    getDishById(id) {
      return dishes.find((d) => d.id === id);
    },

    async refreshMenu() {
      if (mockMode) return;
      const [catR, dishR] = await Promise.all([
        listCategories(),
        listDishes({ limit: 200 }),
      ]);
      const catMap = new Map(catR.items.map((c) => [c.id, c.name]));
      setDishes(dishR.items.map((d) => mapApiDish(d, catMap.get(d.category_id) ?? "Прочее")));
    },

    async initSession() {
      try {
        const s = await getSession();
        setSession(s);

        const pending: Promise<void>[] = [];

        // Меню загружаем всегда — гость тоже видит меню
        pending.push(
          (async () => {
            const [catR, dishR] = await Promise.all([
              listCategories(),
              listDishes({ limit: 200 }),
            ]);
            const catMap = new Map(catR.items.map((c) => [c.id, c.name]));
            setDishes(dishR.items.map((d) => mapApiDish(d, catMap.get(d.category_id) ?? "Прочее")));
          })().catch(() => {}),
        );

        if (!s.is_guest) {
          pending.push(
            getProfile()
              .then((p) => setProfile(mapApiProfile(p)))
              .catch(() => {}),
          );
          pending.push(
            getCart()
              .then((c) => {
                setCart(
                  c.items.map((it) => ({
                    dishId: it.dish_id,
                    quantity: it.quantity,
                    note: it.note ?? undefined,
                  })),
                );
              })
              .catch(() => {}),
          );
          pending.push(
            listOrders({ limit: 50 })
              .then((r) => setOrders(r.items.map(mapApiOrder)))
              .catch(() => {}),
          );
        }

        await Promise.all(pending);
      } catch {
        // Бэкенд недоступен — включаем mock-режим
        setMockMode(true);
        setSession(MOCK_SESSION);
        setProfile(initialProfile);
        setCart(initialCart);
        setOrders(initialOrders);
      } finally {
        setSessionLoading(false);
      }
    },

    async login(email, password) {
      if (mockMode) {
        setSession(MOCK_SESSION);
        setProfile(initialProfile);
        setCart(initialCart);
        setOrders(initialOrders);
        return;
      }
      const s = await apiLogin(email, password);
      setSession(s);
      const [p, c, o] = await Promise.allSettled([
        getProfile(),
        getCart(),
        listOrders({ limit: 50 }),
      ]);
      if (p.status === "fulfilled") setProfile(mapApiProfile(p.value));
      if (c.status === "fulfilled") {
        setCart(
          c.value.items.map((it) => ({
            dishId: it.dish_id,
            quantity: it.quantity,
            note: it.note ?? undefined,
          })),
        );
      }
      if (o.status === "fulfilled") setOrders(o.value.items.map(mapApiOrder));
    },

    async register(email, password, firstName, lastName, phone) {
      if (mockMode) {
        setSession(MOCK_SESSION);
        setProfile({ ...initialProfile, firstName, lastName, email, phone });
        return;
      }
      const s = await apiRegister(email, password);
      setSession(s);
      const patched = await patchProfile({
        first_name: firstName || null,
        last_name: lastName || null,
        phone: phone || null,
      });
      setProfile(mapApiProfile(patched));
    },

    async logout() {
      if (mockMode) {
        setSession({ ...MOCK_SESSION, is_guest: true, role: "guest" });
        setProfile(emptyProfile);
        setCart([]);
        setOrders([]);
        return;
      }
      await apiLogout();
      // Запрашиваем новую гостевую сессию — получаем свежий CSRF-токен
      const s = await getSession();
      setSession(s);
      setProfile(emptyProfile);
      setCart([]);
      setOrders([]);
    },

    addToCart(dishId, quantity = 1, note) {
      const existing = cart.find((it) => it.dishId === dishId);
      setCart((prev) => {
        const ex = prev.find((it) => it.dishId === dishId);
        if (ex) {
          return prev.map((it) =>
            it.dishId === dishId
              ? { ...it, quantity: Math.min(50, it.quantity + quantity), note: note ?? it.note }
              : it,
          );
        }
        return [...prev, { dishId, quantity, note }];
      });
      if (!mockMode) {
        if (existing) {
          void patchCartItem(dishId, {
            quantity: Math.min(50, existing.quantity + quantity),
          });
        } else {
          void addCartItemApi({ dish_id: dishId, quantity, note: note ?? null });
        }
      }
    },

    setCartQuantity(dishId, quantity) {
      setCart((prev) =>
        quantity <= 0
          ? prev.filter((it) => it.dishId !== dishId)
          : prev.map((it) =>
              it.dishId === dishId ? { ...it, quantity: Math.min(50, quantity) } : it,
            ),
      );
      if (!mockMode) {
        if (quantity <= 0) {
          void removeCartItemApi(dishId);
        } else {
          void patchCartItem(dishId, { quantity: Math.min(50, quantity) });
        }
      }
    },

    removeFromCart(dishId) {
      setCart((prev) => prev.filter((it) => it.dishId !== dishId));
      if (!mockMode) {
        void removeCartItemApi(dishId);
      }
    },

    clearCart() {
      setCart([]);
      if (!mockMode) {
        void clearCartApi();
      }
    },

    updateProfile(patch) {
      setProfile((p) => {
        const next = { ...p, ...patch };
        if (!mockMode) {
          const apiPatch = mapToApiPatch(patch);
          if (Object.keys(apiPatch).length > 0) {
            void patchProfile(apiPatch);
          }
        }
        return next;
      });
    },

    addAllergen(v) {
      const t = v.trim().toLowerCase();
      if (!t) return;
      setProfile((p) => (p.allergens.includes(t) ? p : { ...p, allergens: [...p.allergens, t] }));
    },
    removeAllergen(v) {
      setProfile((p) => ({ ...p, allergens: p.allergens.filter((a) => a !== v) }));
    },
    addDietary(v) {
      const t = v.trim().toLowerCase();
      if (!t) return;
      setProfile((p) => (p.dietary.includes(t) ? p : { ...p, dietary: [...p.dietary, t] }));
    },
    removeDietary(v) {
      setProfile((p) => ({ ...p, dietary: p.dietary.filter((d) => d !== v) }));
    },
    savePreferences() {
      if (!mockMode) {
        void patchProfile({ allergens: profile.allergens, dietary: profile.dietary });
      }
    },

    async createOrderFromCart({ fulfillmentType, paymentMethod, address, tableNumber }) {
      // Админ в режиме «вид клиента» не должен создавать реальный заказ —
      // показываем его локально, чтобы прокликать UI, но на бэк не отправляем.
      const isAdminClientView =
        session?.role === "admin" && sessionStorage.getItem("admin-view") === "1";
      if (mockMode || isAdminClientView) {
        const order: Order = {
          id: `ord-${Date.now()}`,
          status: "accepted",
          createdAt: "Только что",
          totalMinor: cartTotalMinor,
          fulfillmentType,
          paymentMethod,
          address,
          tableNumber,
          itemsPreview: cart.map((it) => ({ dishId: it.dishId, quantity: it.quantity })),
        };
        setOrders((prev) => [order, ...prev]);
        setCart([]);
        return order;
      }

      const req: CreateOrderRequest = {
        fulfillment_type: fulfillmentType,
        payment_method: paymentMethod,
        delivery_address: address ?? null,
        notes: tableNumber ? `Стол №${tableNumber}` : null,
      };
      const apiOrder = await createOrder(req);
      const order = mapApiOrder(apiOrder);
      setOrders((prev) => [order, ...prev]);
      // API очищает корзину при создании заказа
      setCart([]);
      return order;
    },

    isAdmin: session?.role === "admin",

    loginAsMockAdmin() {
      // Доступно только в mock-режиме как dev-вход.
      setMockMode(true);
      setSession(MOCK_ADMIN_SESSION);
      setProfile(MOCK_ADMIN_PROFILE);
      setCart([]);
      setOrders([]);
    },

    cancelOrder(orderId) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId && (o.status === "accepted" || o.status === "cooking")
            ? { ...o, status: "cancelled" satisfies OrderStatus }
            : o,
        ),
      );
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): State {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
