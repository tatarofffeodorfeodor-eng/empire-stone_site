/** Тонкая обёртка над localStorage — не падает, если браузер его запрещает (приватный режим и т.п.). */
export const storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* молча игнорируем — например, если хранилище переполнено или недоступно */
    }
  },
};
