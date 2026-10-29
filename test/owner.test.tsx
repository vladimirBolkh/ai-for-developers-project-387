import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { EventType, Meeting, WorkingHours } from '@/api'
import { MemoryRouter } from 'react-router-dom'
import OwnerPage from '@/pages/OwnerPage'
import { resetSdkMocks, sdkMocks } from './sdk-mock'
import { render } from './test-utils'

const consultation: EventType = {
  id: '1',
  name: 'Консультация',
  description: 'Разбор вопроса',
  durationMinutes: 30,
  format: 'online',
}

const meeting: Meeting = {
  id: 'm1',
  eventTypeId: '1',
  eventTypeName: 'Консультация',
  eventTypeDescription: 'Разбор вопроса',
  eventTypeDurationMinutes: 30,
  eventTypeFormat: 'online',
  // Момент 09:00 локального времени — вывод formatSlot тоже локальный, поэтому
  // тест одинаково проходит в любом поясе (включая UTC в CI).
  startDateTime: new Date(2026, 9, 21, 9, 0).toISOString(),
  guestName: 'Анна',
  topic: 'Обсудить проект',
}

const configuredHours: WorkingHours = {
  monday: { start: '09:00', end: '18:00' },
  tuesday: { start: '09:00', end: '18:00' },
  wednesday: { start: '09:00', end: '18:00' },
  thursday: { start: '09:00', end: '18:00' },
  friday: { start: '09:00', end: '18:00' },
  saturday: null,
  sunday: null,
}

function renderOwnerPage() {
  render(
    <MemoryRouter>
      <OwnerPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  resetSdkMocks()
})

describe('Поверхность владельца', () => {
  it('показывает список типов событий из API', async () => {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [consultation], error: undefined })

    renderOwnerPage()

    expect(await screen.findByText('Консультация')).toBeInTheDocument()
    expect(screen.getByText(/30 мин · онлайн/)).toBeInTheDocument()
  })

  it('требует название перед созданием', async () => {
    renderOwnerPage()

    await userEvent.click(await screen.findByRole('button', { name: 'Создать тип' }))
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }))

    expect(await screen.findByText('Введите название')).toBeInTheDocument()
    expect(sdkMocks.eventTypesCreate).not.toHaveBeenCalled()
  })

  it('создаёт новый тип события', async () => {
    const created: EventType = {
      id: '2',
      name: 'Созвон',
      description: 'Короткий звонок',
      durationMinutes: 45,
      format: 'offline',
    }
    sdkMocks.eventTypesList
      .mockResolvedValueOnce({ data: [], error: undefined })
      .mockResolvedValueOnce({ data: [created], error: undefined })
    sdkMocks.eventTypesCreate.mockResolvedValue({ data: created, error: undefined })

    renderOwnerPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Создать тип' }))
    await userEvent.type(screen.getByLabelText(/Название/), 'Созвон')
    await userEvent.type(screen.getByLabelText(/Описание/), 'Короткий звонок')
    await userEvent.selectOptions(screen.getByLabelText(/Длительность/), '45')
    await userEvent.click(screen.getByRole('radio', { name: 'оффлайн' }))
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }))

    expect(await screen.findByText('Созвон')).toBeInTheDocument()
    expect(sdkMocks.eventTypesCreate).toHaveBeenCalledWith({
      body: {
        name: 'Созвон',
        description: 'Короткий звонок',
        durationMinutes: 45,
        format: 'offline',
      },
    })
  })

  it('редактирует тип события', async () => {
    const updated: EventType = { ...consultation, name: 'Консультация v2' }
    sdkMocks.eventTypesList
      .mockResolvedValueOnce({ data: [consultation], error: undefined })
      .mockResolvedValueOnce({ data: [updated], error: undefined })
    sdkMocks.eventTypesUpdate.mockResolvedValue({ data: updated, error: undefined })

    renderOwnerPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Изменить' }))
    await userEvent.clear(screen.getByLabelText(/Название/))
    await userEvent.type(screen.getByLabelText(/Название/), 'Консультация v2')
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(await screen.findByText('Консультация v2')).toBeInTheDocument()
    expect(sdkMocks.eventTypesUpdate).toHaveBeenCalledWith({
      path: { id: consultation.id },
      body: {
        name: 'Консультация v2',
        description: 'Разбор вопроса',
        durationMinutes: 30,
        format: 'online',
      },
    })
  })

  it('удаляет тип события', async () => {
    sdkMocks.eventTypesList
      .mockResolvedValueOnce({ data: [consultation], error: undefined })
      .mockResolvedValueOnce({ data: [], error: undefined })
    sdkMocks.eventTypesRemove.mockResolvedValue({ data: undefined, error: undefined })

    renderOwnerPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Удалить' }))

    expect(await screen.findByText('Пока нет типов встреч.')).toBeInTheDocument()
    expect(sdkMocks.eventTypesRemove).toHaveBeenCalledWith({ path: { id: consultation.id } })
  })
})

describe('Сводка в терминале владельца', () => {
  it('показывает краткую сводку существующих типов', async () => {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [consultation], error: undefined })

    renderOwnerPage()

    expect(await screen.findByText('Консультация — 30 мин')).toBeInTheDocument()
  })

  it('показывает пустую сводку, когда типов нет', async () => {
    renderOwnerPage()

    expect(await screen.findByText('Создайте первый тип.')).toBeInTheDocument()
  })

  it('показывает сжатую сводку настроенных рабочих часов', async () => {
    sdkMocks.workingHoursOperationsGet.mockResolvedValue({
      data: configuredHours,
      error: undefined,
    })

    renderOwnerPage()

    expect(await screen.findByText('Пн–Пт 09:00–18:00')).toBeInTheDocument()
    expect(screen.getByText('Сб–Вс — выходной')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Настроить часы' })).toHaveAttribute('href', '/hours')
  })

  it('предупреждает, когда рабочие часы не настроены', async () => {
    renderOwnerPage()

    expect(await screen.findByText('Не настроены')).toBeInTheDocument()
    expect(screen.getByText('Без часов запись невозможна.')).toBeInTheDocument()
  })
})

describe('Предстоящие встречи в терминале владельца', () => {
  it('всегда показывает блок встреч: пустое состояние, когда их нет', async () => {
    renderOwnerPage()

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Предстоящие встречи' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Пока нет встреч.')).toBeInTheDocument()
    expect(sdkMocks.bookingsList).toHaveBeenCalled()
  })

  it('показывает тему, имя гостя, тип события и время', async () => {
    sdkMocks.bookingsList.mockResolvedValue({ data: [meeting], error: undefined })

    renderOwnerPage()

    expect(await screen.findByText('Обсудить проект')).toBeInTheDocument()
    expect(screen.getByText('Анна')).toBeInTheDocument()
    expect(screen.getByText('Консультация')).toBeInTheDocument()
    expect(screen.getByText('2026-10-21 · 09:00')).toBeInTheDocument()
    expect(screen.getByText(/30 мин · онлайн/)).toBeInTheDocument()
  })

  it('сохраняет тему встречи после удаления её типа события', async () => {
    sdkMocks.eventTypesList
      .mockResolvedValueOnce({ data: [consultation], error: undefined })
      .mockResolvedValueOnce({ data: [], error: undefined })
    sdkMocks.eventTypesRemove.mockResolvedValue({ data: undefined, error: undefined })
    sdkMocks.bookingsList.mockResolvedValue({ data: [meeting], error: undefined })

    renderOwnerPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Удалить' }))

    expect(await screen.findByText('Пока нет типов встреч.')).toBeInTheDocument()
    expect(screen.getByText('Обсудить проект')).toBeInTheDocument()
  })
})
