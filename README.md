# ai-restaurant-assistant-frontend

React-фронтенд цифрового ассистента рекомендаций блюд — мобильное веб-приложение с чатом, меню, корзиной и профилем.

## Стек

- **React 19** + **TypeScript 6**
- **Vite 8** — сборщик
- **Tailwind CSS 4** — стили
- **React Router 7** — роутинг
- **Lucide React** — иконки

---

## Требования

- [Node.js](https://nodejs.org/) 18 или новее
- npm 9+

---

## Быстрый старт

```sh
# 1. Установить зависимости
npm install

# 2. Запустить dev-сервер
npm run dev
```

Приложение откроется по адресу: `http://localhost:5173`

> Для полноценной работы чата и заказов нужен запущенный бэкенд. Смотри инструкцию в `../ai-restaurant-assistant-backend/README.md`.

---

## Скрипты

| Команда | Описание |
|---|---|
| `npm run dev` | Запустить dev-сервер с HMR |
| `npm run build` | Собрать production-сборку в `dist/` |
| `npm run preview` | Предпросмотр production-сборки локально |
| `npm run lint` | Запустить ESLint |

---

## Структура проекта

```
src/
  pages/        — страницы (Chat, Menu, Cart, Profile, Login, Register, OrderDetail)
  components/   — переиспользуемые компоненты
  state/        — глобальное состояние (store)
  lib/          — утилиты (cn, format, theme)
  data/         — mock-данные для разработки
  App.tsx       — роуты и layout
  main.tsx      — точка входа
```

---

## Роуты

| Путь | Страница |
|---|---|
| `/login` | Вход |
| `/register` | Регистрация |
| `/chat` | Чат с ИИ-ассистентом (главная) |
| `/menu` | Меню |
| `/cart` | Корзина |
| `/profile` | Профиль и история заказов |
| `/orders/:id` | Детали заказа |
