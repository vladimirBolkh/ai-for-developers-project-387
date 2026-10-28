// Контракт гарантирует массив, но недоступный или некорректный бэкенд может
// вернуть не-массив (например, HTML из SPA-fallback Vite при отсутствии прокси).
// Тогда `result.data ?? []` не спасает: строка проходит как «есть данные», и
// `data.find`/`data.map` роняют рендер в белый экран. Сводим к пустому списку.
export function asArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : []
}
