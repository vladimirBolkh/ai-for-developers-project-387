import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Единый тестовый шов: модуль типизированного API-клиента подменяется на стабы
// из sdk-mock.ts. Каждый тест настраивает поведение через `sdkMocks`.
vi.mock('@/api', () => import('./sdk-mock').then((m) => m.sdkMocks))

// jsdom не реализует scrollIntoView, а Mantine Combobox его вызывает при открытии.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}

// jsdom не реализует ResizeObserver, а Mantine (например, SegmentedControl) его ждёт.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (!('ResizeObserver' in globalThis)) {
  Object.defineProperty(globalThis, 'ResizeObserver', {
    writable: true,
    value: ResizeObserverStub,
  })
}

// Точка монтирования — как в index.html. Выполняется до всех хуков тестов,
// чтобы `await import('@/main')` в beforeAll всегда находила <div id="app">.
if (!document.getElementById('app')) {
  document.body.innerHTML = '<div id="app"></div>'
}

// Окно, которого нет в jsdom, но который использует Mantine (например, для modal)
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}
