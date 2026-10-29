import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import type { EventType, Meeting, Slot } from '@/api'
import { MemoryRouter } from 'react-router-dom'
import BookPage from '@/pages/BookPage'
import { resetSdkMocks, sdkMocks } from './sdk-mock'
import { render } from './test-utils'

const consultation: EventType = {
  id: '1',
  name: 'Консультация',
  description: 'Разбор вопроса',
  durationMinutes: 30,
  format: 'online',
}

const call: EventType = {
  id: '2',
  name: 'Созвон',
  description: 'Короткий звонок',
  durationMinutes: 15,
  format: 'offline',
}

// «09:00 локально 21.10.2026» — момент, созданный в поясе самой машины. Так
// фикстура и вывод formatSlot (тоже локальный) совпадают везде, включая UTC в CI.
const at = (year: number, month: number, day: number, hour: number, minute: number) =>
  new Date(year, month, day, hour, minute).toISOString()

const meeting: Meeting = {
  id: 'm1',
  eventTypeId: '1',
  eventTypeName: 'Консультация',
  eventTypeDescription: 'Разбор вопроса',
  eventTypeDurationMinutes: 30,
  eventTypeFormat: 'online',
  startDateTime: at(2026, 9, 21, 9, 0),
  guestName: 'Анна',
  topic: 'Обсудить проект',
}

function free(iso: string): Slot {
  return { startDateTime: iso, status: 'free' }
}

function renderBookPage() {
  render(
    <MemoryRouter>
      <BookPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  resetSdkMocks()
})

describe('Страница записи', () => {
  it('показывает доступные типы в выпадающем списке и детали выбранного', async () => {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [consultation, call], error: undefined })

    renderBookPage()

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Запись на встречу' }),
    ).toBeInTheDocument()

    // Оба типа доступны в выпадающем списке.
    const select = await screen.findByLabelText('Тип встречи')
    expect(within(select).getByRole('option', { name: /Консультация/ })).toBeInTheDocument()
    expect(within(select).getByRole('option', { name: /Созвон/ })).toBeInTheDocument()

    // Первый тип выбран авто-матически, его детали видны в блоке информации.
    expect(screen.getByText('Консультация')).toBeInTheDocument()
    expect(screen.getByText('онлайн')).toBeInTheDocument()
    expect(screen.getByText('Разбор вопроса')).toBeInTheDocument()
  })

  it('переключает тип через выпадающий список', async () => {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [consultation, call], error: undefined })

    renderBookPage()
    const select = await screen.findByLabelText('Тип встречи')
    await userEvent.selectOptions(select, call.id)

    expect(await screen.findByText('Созвон')).toBeInTheDocument()
    expect(screen.getByText('оффлайн')).toBeInTheDocument()
  })

  it('показывает пустое состояние, когда типов нет', async () => {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [], error: undefined })

    renderBookPage()

    expect(await screen.findByText(/нет доступных типов/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /на главную/i })).toHaveAttribute('href', '/')
  })

  it('не падает, когда бэкенд вернул не-массив (недоступен/вне контракта)', async () => {
    // SPA-fallback Vite при отсутствии прокси отдаёт HTML строку вместо массива.
    // Раньше это роняло рендер (`types.find is not a function` → белый экран).
    sdkMocks.eventTypesList.mockResolvedValue({
      data: '<!doctype html><html><body></body></html>' as unknown as EventType[],
      error: undefined,
    })

    renderBookPage()

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Запись на встречу' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/нет доступных типов/i)).toBeInTheDocument()
  })
})

describe('Календарь и слоты', () => {
  it('запрашивает доступность и показывает свободные слоты выбранного дня', async () => {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [consultation], error: undefined })
    sdkMocks.availabilityGet.mockResolvedValue({
      data: [free(at(2026, 9, 21, 9, 0)), free(at(2026, 9, 21, 9, 15))],
      error: undefined,
    })

    renderBookPage()

    expect(await screen.findByText(/2026-10-21 · 09:00/)).toBeInTheDocument()
    expect(screen.getByText(/2026-10-21 · 09:15/)).toBeInTheDocument()
    expect(sdkMocks.availabilityGet).toHaveBeenCalledWith({
      query: { eventTypeId: consultation.id },
    })
  })

  it('фильтрует слоты по выбранной дате — календарь сокращает список', async () => {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [consultation], error: undefined })
    sdkMocks.availabilityGet.mockResolvedValue({
      data: [free(at(2026, 9, 21, 9, 0)), free(at(2026, 9, 22, 10, 0))],
      error: undefined,
    })

    renderBookPage()

    // Авто-выбрана первая свободная дата (21.10): её слот виден, слот 22.10 скрыт.
    expect(await screen.findByText(/2026-10-21 · 09:00/)).toBeInTheDocument()
    expect(screen.queryByText(/2026-10-22 · 10:00/)).not.toBeInTheDocument()
    // Блок календаря отрисован.
    expect(screen.getByRole('heading', { name: 'Календарь' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Доступные слоты' })).toBeInTheDocument()
  })

  it('помечает занятые и недоступные слоты, блокируя их', async () => {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [consultation], error: undefined })
    sdkMocks.availabilityGet.mockResolvedValue({
      data: [
        free(at(2026, 9, 21, 9, 0)),
        { startDateTime: at(2026, 9, 21, 9, 15), status: 'busy' },
        { startDateTime: at(2026, 9, 21, 9, 30), status: 'unavailable' },
      ],
      error: undefined,
    })

    renderBookPage()

    expect(await screen.findByText(/2026-10-21 · 09:00/)).toBeInTheDocument()
    expect(screen.getByText('занято')).toBeInTheDocument()
    expect(screen.getByText('недоступен')).toBeInTheDocument()
    // Занятый и недоступный слоты нельзя выбрать.
    expect(screen.getByText('занято').closest('button')).toBeDisabled()
    expect(screen.getByText('недоступен').closest('button')).toBeDisabled()
  })

  it('пересчитывает слоты при смене типа', async () => {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [consultation, call], error: undefined })
    sdkMocks.availabilityGet
      .mockResolvedValueOnce({ data: [free(at(2026, 9, 21, 9, 0))], error: undefined })
      .mockResolvedValueOnce({ data: [free(at(2026, 9, 22, 10, 0))], error: undefined })

    renderBookPage()
    await screen.findByText(/2026-10-21 · 09:00/)

    await userEvent.selectOptions(screen.getByLabelText('Тип встречи'), call.id)

    expect(await screen.findByText(/2026-10-22 · 10:00/)).toBeInTheDocument()
    expect(screen.queryByText(/2026-10-21 · 09:00/)).not.toBeInTheDocument()
    expect(sdkMocks.availabilityGet).toHaveBeenLastCalledWith({ query: { eventTypeId: call.id } })
  })

  it('фиксирует выбранный слот и открывает форму', async () => {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [consultation], error: undefined })
    sdkMocks.availabilityGet.mockResolvedValue({
      data: [free(at(2026, 9, 21, 9, 0))],
      error: undefined,
    })

    renderBookPage()
    await userEvent.click(await screen.findByRole('button', { name: /2026-10-21 · 09:00/ }))

    // После выбора слота календарь и слоты заменяются формой данных гостя.
    expect(await screen.findByText('Ваши данные')).toBeInTheDocument()
  })

  it('показывает сообщение при отсутствии свободных слотов', async () => {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [consultation], error: undefined })
    sdkMocks.availabilityGet.mockResolvedValue({ data: [], error: undefined })

    renderBookPage()

    expect(await screen.findByText(/нет свободных слотов/i)).toBeInTheDocument()
  })
})

describe('Подтверждение записи', () => {
  async function pickSlotAndOpenForm() {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [consultation], error: undefined })
    sdkMocks.availabilityGet.mockResolvedValue({
      data: [free(at(2026, 9, 21, 9, 0))],
      error: undefined,
    })
    renderBookPage()
    await userEvent.click(await screen.findByRole('button', { name: /2026-10-21 · 09:00/ }))
    await screen.findByText('Ваши данные')
  }

  it('требует имя перед отправкой', async () => {
    await pickSlotAndOpenForm()

    await userEvent.click(screen.getByRole('button', { name: /Подтвердить запись/ }))

    expect(await screen.findByText('Введите имя')).toBeInTheDocument()
    expect(sdkMocks.bookingsCreate).not.toHaveBeenCalled()
  })

  it('требует тему перед отправкой и не шлёт запрос', async () => {
    await pickSlotAndOpenForm()
    await userEvent.type(screen.getByLabelText(/Имя/), 'Анна')

    await userEvent.click(screen.getByRole('button', { name: /Подтвердить запись/ }))

    expect(await screen.findByText('Введите тему встречи')).toBeInTheDocument()
    expect(sdkMocks.bookingsCreate).not.toHaveBeenCalled()
  })

  it('считает тему из одних пробелов пустой', async () => {
    await pickSlotAndOpenForm()
    await userEvent.type(screen.getByLabelText(/Имя/), 'Анна')
    await userEvent.type(screen.getByLabelText(/Тема встречи/), '   ')

    await userEvent.click(screen.getByRole('button', { name: /Подтвердить запись/ }))

    expect(await screen.findByText('Введите тему встречи')).toBeInTheDocument()
    expect(sdkMocks.bookingsCreate).not.toHaveBeenCalled()
  })

  it('ограничивает ввод темы 200 символами', async () => {
    await pickSlotAndOpenForm()

    expect(screen.getByLabelText(/Тема встречи/)).toHaveAttribute('maxLength', '200')
  })

  it('обрезает тему, отправляет её в запросе и показывает на подтверждении', async () => {
    sdkMocks.bookingsCreate.mockResolvedValue({ data: meeting, error: undefined })

    await pickSlotAndOpenForm()
    await userEvent.type(screen.getByLabelText(/Имя/), 'Анна')
    await userEvent.type(screen.getByLabelText(/Тема встречи/), '  Обсудить проект  ')
    await userEvent.click(screen.getByRole('button', { name: /Подтвердить запись/ }))

    expect(await screen.findByRole('heading', { name: 'Вы записаны' })).toBeInTheDocument()
    expect(screen.getByText('Гость: Анна')).toBeInTheDocument()
    expect(screen.getByText('Тема: Обсудить проект')).toBeInTheDocument()
    // Вместо календаря и слотов — кнопка «Забронировать ещё».
    expect(screen.getByRole('button', { name: /Забронировать ещё/ })).toBeInTheDocument()
    expect(sdkMocks.bookingsCreate).toHaveBeenCalledWith({
      body: {
        eventTypeId: '1',
        startDateTime: at(2026, 9, 21, 9, 0),
        guestName: 'Анна',
        topic: 'Обсудить проект',
      },
    })
  })

  it('возвращается к записи по кнопке «Забронировать ещё»', async () => {
    sdkMocks.bookingsCreate.mockResolvedValue({ data: meeting, error: undefined })

    await pickSlotAndOpenForm()
    await userEvent.type(screen.getByLabelText(/Имя/), 'Анна')
    await userEvent.type(screen.getByLabelText(/Тема встречи/), 'Обсудить проект')
    await userEvent.click(screen.getByRole('button', { name: /Подтвердить запись/ }))
    await screen.findByRole('heading', { name: 'Вы записаны' })

    await userEvent.click(screen.getByRole('button', { name: /Забронировать ещё/ }))

    expect(await screen.findByRole('heading', { name: 'Календарь' })).toBeInTheDocument()
    expect(screen.queryByText('Вы записаны')).not.toBeInTheDocument()
  })

  it('при занятом слоте (409) возвращает к выбору слота', async () => {
    sdkMocks.bookingsCreate.mockResolvedValue({
      data: undefined,
      error: { message: 'conflict' },
      response: { status: 409 },
    })

    await pickSlotAndOpenForm()
    await userEvent.type(screen.getByLabelText(/Имя/), 'Анна')
    await userEvent.type(screen.getByLabelText(/Тема встречи/), 'Обсудить проект')
    await userEvent.click(screen.getByRole('button', { name: /Подтвердить запись/ }))

    expect(await screen.findByText(/уже занят/i)).toBeInTheDocument()
    expect(screen.queryByText('Ваши данные')).not.toBeInTheDocument()
  })

  it('не теряет введённую тему после конфликта слота', async () => {
    sdkMocks.bookingsCreate.mockResolvedValue({
      data: undefined,
      error: { message: 'conflict' },
      response: { status: 409 },
    })

    await pickSlotAndOpenForm()
    await userEvent.type(screen.getByLabelText(/Имя/), 'Анна')
    await userEvent.type(screen.getByLabelText(/Тема встречи/), 'Обсудить проект')
    await userEvent.click(screen.getByRole('button', { name: /Подтвердить запись/ }))
    await screen.findByText(/уже занят/i)

    await userEvent.click(await screen.findByRole('button', { name: /2026-10-21 · 09:00/ }))

    expect(await screen.findByLabelText(/Тема встречи/)).toHaveValue('Обсудить проект')
  })

  it('при ошибке валидации (400) показывает сообщение и остаётся в форме', async () => {
    sdkMocks.bookingsCreate.mockResolvedValue({
      data: undefined,
      error: { message: 'bad request' },
      response: { status: 400 },
    })

    await pickSlotAndOpenForm()
    await userEvent.type(screen.getByLabelText(/Имя/), 'Анна')
    await userEvent.type(screen.getByLabelText(/Тема встречи/), 'Обсудить проект')
    await userEvent.click(screen.getByRole('button', { name: /Подтвердить запись/ }))

    expect(await screen.findByText(/Не удалось создать запись/i)).toBeInTheDocument()
    expect(screen.getByText('Ваши данные')).toBeInTheDocument()
  })

  it('при серверной/сетевой ошибке показывает общее сообщение', async () => {
    sdkMocks.bookingsCreate.mockResolvedValue({
      data: undefined,
      error: { message: 'boom' },
    })

    await pickSlotAndOpenForm()
    await userEvent.type(screen.getByLabelText(/Имя/), 'Анна')
    await userEvent.type(screen.getByLabelText(/Тема встречи/), 'Обсудить проект')
    await userEvent.click(screen.getByRole('button', { name: /Подтвердить запись/ }))

    expect(await screen.findByText(/Что-то пошло не так/i)).toBeInTheDocument()
  })
})

describe('Прокрутка списка к доступным слотам', () => {
  // jsdom не считает layout: подменяем метрики viewport'а (scrollHeight/
  // clientHeight) и координаты (getBoundingClientRect), чтобы формула
  // прокрутки получала такие же значения, как в браузере. Откат — в afterEach.
  const savedMetrics: { name: 'scrollHeight' | 'clientHeight'; descriptor: PropertyDescriptor }[] =
    []

  function domRect(top: number): DOMRect {
    return {
      x: 0,
      y: top,
      width: 0,
      height: 0,
      top,
      right: 0,
      bottom: top,
      left: 0,
      toJSON: () => ({}),
    }
  }

  function mockScrollGeometry(opts: {
    scrollHeight: number
    clientHeight: number
    freeTop: number
  }) {
    for (const name of ['scrollHeight', 'clientHeight'] as const) {
      const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, name)
      if (!descriptor) continue
      savedMetrics.push({ name, descriptor })
      Object.defineProperty(Element.prototype, name, {
        ...descriptor,
        get(this: Element) {
          if (this.hasAttribute('data-scrollarea-viewport')) return opts[name]
          return descriptor.get?.call(this) ?? 0
        },
      })
    }
    const originalRect = Element.prototype.getBoundingClientRect
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: Element,
    ) {
      if (this.hasAttribute('data-scrollarea-viewport')) return domRect(0)
      if (this.getAttribute('data-status') === 'free') {
        // Как в браузере: визуальный отступ свободного слота уменьшается
        // на текущую прокрутку — тогда повторный прогон эффекта идемпотентен.
        const viewport = document.querySelector('[data-scrollarea-viewport]')
        return domRect(opts.freeTop - (viewport?.scrollTop ?? 0))
      }
      return originalRect.call(this) as DOMRect
    })
  }

  afterEach(() => {
    vi.restoreAllMocks()
    while (savedMetrics.length > 0) {
      const saved = savedMetrics.pop()
      if (saved) Object.defineProperty(Element.prototype, saved.name, saved.descriptor)
    }
  })

  async function findSlotsViewport() {
    await screen.findByText(/2026-10-21 · 09:30/)
    const viewport = document.querySelector('[data-scrollarea-viewport]')
    expect(viewport).not.toBeNull()
    return viewport as HTMLElement
  }

  const dayWithBusyPrefix: Slot[] = [
    { startDateTime: at(2026, 9, 21, 9, 0), status: 'busy' },
    { startDateTime: at(2026, 9, 21, 9, 15), status: 'busy' },
    free(at(2026, 9, 21, 9, 30)),
  ]

  it('список длиннее блока начинается с первого свободного слота', async () => {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [consultation], error: undefined })
    sdkMocks.availabilityGet.mockResolvedValue({ data: dayWithBusyPrefix, error: undefined })
    // Свободный слот помещается наверху (250 < maxScroll 700) — ставим его первым.
    mockScrollGeometry({ scrollHeight: 1000, clientHeight: 300, freeTop: 250 })

    renderBookPage()
    const viewport = await findSlotsViewport()

    await waitFor(() => expect(viewport.scrollTop).toBe(250))
  })

  it('свободный слот у самого хвоста — список прокручивается до конца', async () => {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [consultation], error: undefined })
    sdkMocks.availabilityGet.mockResolvedValue({ data: dayWithBusyPrefix, error: undefined })
    // Поднять первый свободный наверх некуда (900 > maxScroll 700) — упираемся в конец.
    mockScrollGeometry({ scrollHeight: 1000, clientHeight: 300, freeTop: 900 })

    renderBookPage()
    const viewport = await findSlotsViewport()

    await waitFor(() => expect(viewport.scrollTop).toBe(700))
  })

  it('всё, что помещается в блок, остаётся без прокрутки', async () => {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [consultation], error: undefined })
    sdkMocks.availabilityGet.mockResolvedValue({ data: dayWithBusyPrefix, error: undefined })
    // Список короче блока (maxScroll = 0) — прокрутить некуда.
    mockScrollGeometry({ scrollHeight: 300, clientHeight: 300, freeTop: 250 })

    renderBookPage()
    const viewport = await findSlotsViewport()

    await waitFor(() => expect(viewport.scrollTop).toBe(0))
  })
})
