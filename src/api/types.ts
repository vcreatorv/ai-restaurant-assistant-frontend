export type SessionInfo = {
  user_id: string | null;
  role: "guest" | "customer" | "admin" | null;
  is_guest: boolean;
  csrf: string;
};

export type ApiProfile = {
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  allergens: string[];
  dietary: string[];
};

export type PatchProfileRequest = {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  allergens?: string[];
  dietary?: string[];
};

export type ApiErrorBody = {
  code: string;
  message: string;
  details?: {
    trace_id?: string;
    fields?: { name: string; reason: string }[];
  };
};

// ─── Menu ───────────────────────────────────────────────────────────────────

export type ApiCategory = {
  id: number;
  name: string;
  sort_order: number;
  is_available: boolean;
};

export type ApiCategoryList = {
  items: ApiCategory[];
};

export type ApiTag = {
  id: number;
  name: string;
  slug: string;
  color: string;
};

export type ApiDish = {
  id: number;
  category_id: number;
  name: string;
  description: string;
  composition: string;
  image_url: string;
  price_minor: number;
  currency: string;
  calories_kcal: number | null;
  protein_g: number | null;
  fat_g: number | null;
  carbs_g: number | null;
  portion_weight_g: number | null;
  cuisine: string;
  allergens: string[];
  dietary: string[];
  tags: ApiTag[];
  is_available: boolean;
};

export type ApiDishList = {
  items: ApiDish[];
  total: number;
  limit: number;
  offset: number;
};

// ─── Cart ────────────────────────────────────────────────────────────────────

export type ApiCartItem = {
  dish_id: number;
  name: string;
  price_minor: number;
  quantity: number;
  note: string | null;
  sort_order: number;
  added_at?: string;
  available: boolean;
  line_total_minor: number;
};

export type ApiCart = {
  items: ApiCartItem[];
  total_minor: number;
  currency: string;
  warnings: { code: string; dish_id: number }[];
};

export type AddCartItemRequest = {
  dish_id: number;
  quantity: number;
  note?: string | null;
};

export type PatchCartItemRequest = {
  quantity?: number;
  note?: string | null;
};

// ─── Orders ──────────────────────────────────────────────────────────────────

export type ApiOrderItem = {
  dish_id: number | null;
  dish_name: string;
  dish_price_minor: number;
  quantity: number;
  line_total_minor: number;
  sort_order: number;
};

export type ApiOrder = {
  id: string;
  user_id: string;
  status: "accepted" | "cooking" | "ready" | "in_delivery" | "closed" | "cancelled";
  fulfillment_type: "delivery" | "pickup" | "dine_in";
  total_minor: number;
  currency: string;
  payment_method: "on_delivery" | "online_stub";
  customer_first_name: string;
  customer_last_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_address: string | null;
  delivery_notes: string | null;
  notes: string | null;
  items: ApiOrderItem[];
  created_at: string;
  updated_at: string;
};

export type ApiOrderList = {
  items: ApiOrder[];
  total: number;
  limit: number;
  offset: number;
};

// ─── Chats ───────────────────────────────────────────────────────────────────

export type ApiChat = {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  last_message_at: string;
};

export type ApiMessage = {
  id: string;
  chat_id: string;
  role: "user" | "assistant";
  content: string;
  recommended_dish_ids?: number[];
  created_at: string;
};

export type ApiChatWithMessages = {
  chat: ApiChat;
  messages: ApiMessage[];
  has_more?: boolean;
};

export type ApiChatList = {
  items: ApiChat[];
  total: number;
  limit: number;
  offset: number;
};

export type SendMessageRequest = {
  content: string;
};

export type SSEMeta = {
  message_id: string;
  recommended_dish_ids: number[];
};

export type SSEDone = {
  tokens_in: number;
  tokens_out: number;
  latency_ms: number;
};

export type CreateOrderRequest = {
  fulfillment_type: "delivery" | "pickup" | "dine_in";
  delivery_address?: string | null;
  delivery_notes?: string | null;
  payment_method: "on_delivery" | "online_stub";
  notes?: string | null;
};

// ─── Prompts (admin) ─────────────────────────────────────────────────────────

/** Имена промптов синхронизированы с backend prompts.SupportedNames. */
export type ApiPromptName = "system" | "classification" | "refusal";

export type ApiPromptAuthor = {
  id: string;
  display_name: string;
  email: string;
};

export type ApiPromptVersion = {
  version: number;
  content: string;
  published_at: string;
  published_by: ApiPromptAuthor;
};

export type ApiPromptDraft = {
  name: ApiPromptName;
  content: string;
  updated_at: string;
};

export type ApiPrompt = {
  name: ApiPromptName;
  current: ApiPromptVersion;
  draft?: ApiPromptDraft | null;
};

export type ApiPromptList = {
  items: ApiPrompt[];
};

export type ApiPromptDetails = {
  name: ApiPromptName;
  current: ApiPromptVersion;
  draft?: ApiPromptDraft | null;
  history: ApiPromptVersion[];
};

export type UpsertPromptDraftRequest = {
  content: string;
};

// ─── Audit log (admin) ───────────────────────────────────────────────────────

export type ApiAdminActionTarget = "order" | "dish" | "category" | "tag" | "prompt";
export type ApiAdminActionVerb =
  | "create"
  | "update"
  | "delete"
  | "status_change"
  | "publish"
  | "rollback";

export type ApiAdminActionAuthor = {
  id?: string | null;
  display_name: string;
  email?: string | null;
  /** true → у этого ФИО в БД есть тёзка; фронт показывает email рядом */
  has_namesake: boolean;
};

export type ApiAdminActionChange = {
  field: string;
  from?: string | null;
  to?: string | null;
};

export type ApiAdminAction = {
  id: string;
  admin: ApiAdminActionAuthor;
  target: ApiAdminActionTarget;
  target_id: string;
  target_label: string;
  verb: ApiAdminActionVerb;
  changes: ApiAdminActionChange[];
  created_at: string;
};

export type ApiAdminActionList = {
  items: ApiAdminAction[];
  total: number;
  limit: number;
  offset: number;
};

export type ListActionsParams = {
  /** uuid админа или строка "me" */
  admin_id?: string;
  target?: ApiAdminActionTarget;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
};

// ─── Admin: categories / tags / dishes / orders ──────────────────────────────

export type CreateCategoryRequest = {
  name: string;
  sort_order?: number;
  is_available?: boolean;
};

export type PatchCategoryRequest = {
  name?: string;
  sort_order?: number;
  is_available?: boolean;
};

export type CreateTagRequest = {
  name: string;
  slug: string;
  color?: string;
};

export type PatchTagRequest = {
  name?: string;
  slug?: string;
  color?: string;
};

export type ApiTagList = {
  items: ApiTag[];
};

export type CreateDishRequest = {
  name: string;
  category_id: number;
  cuisine: string;
  price_minor: number;
  description?: string;
  composition?: string;
  image_url?: string;
  currency?: string;
  calories_kcal?: number;
  protein_g?: number;
  fat_g?: number;
  carbs_g?: number;
  portion_weight_g?: number;
  allergens?: string[];
  dietary?: string[];
  tag_ids?: number[];
  is_available?: boolean;
};

export type PatchDishRequest = Partial<CreateDishRequest>;

export type AdminListOrdersParams = {
  status?: ApiOrder["status"];
  from?: string;
  to?: string;
  user_id?: string;
  limit?: number;
  offset?: number;
};

export type UpdateOrderStatusRequest = {
  status: ApiOrder["status"];
  note?: string;
};
