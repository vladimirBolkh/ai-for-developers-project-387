import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { WorkingHours } from '@/api'
import { MemoryRouter } from 'react-router-dom'
import WorkingHoursPage from '@/pages/WorkingHoursPage'
import { resetSdkMocks, sdkMocks } from './sdk-mock'
import { render } from './test-utils'

const unconfigured: WorkingHours = {
  monday: null,
  tuesday: null,
  wednesday: null,
  thursday: null,
  friday: null,
  saturday: null,
  sunday: null,
}

function renderHoursPage() {
  render(
    <MemoryRouter>
      <WorkingHoursPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  resetSdkMocks()
  sdkMocks.workingHoursOperationsGet.mockResolvedValue({
    data: unconfigured,
    error: undefined,
  })
})

describe('Редактор рабочих часов', () => {
  it('показывает дефолт 09:00–18:00 в будние при ненастроенных часах', async () => {
    renderHoursPage()

    expect(await screen.findByLabelText('Понедельник начало')).toHaveValue('09:00')
    expect(screen.getByLabelText('Понедельник конец')).toHaveValue('18:00')
    expect(screen.getByLabelText('Пятница конец')).toHaveValue('18:00')
    // Выходные остаются пустыми → выходной.
    expect(screen.getAllByText('Выходной')).toHaveLength(2)
    expect(screen.getByLabelText('Суббота начало')).toHaveValue('')
    expect(screen.getByLabelText('Воскресенье конец')).toHaveValue('')
  })

  it('сохраняет часы через API', async () => {
    sdkMocks.workingHoursOperationsSet.mockResolvedValue({ data: unconfigured, error: undefined })

    renderHoursPage()
    await screen.findByLabelText('Понедельник начало')
    fireEvent.change(screen.getByLabelText('Понедельник начало'), {
      target: { value: '10:00' },
    })
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(await screen.findByText('Сохранено.')).toBeInTheDocument()
    expect(sdkMocks.workingHoursOperationsSet).toHaveBeenCalledWith({
      body: {
        monday: { start: '10:00', end: '18:00' },
        tuesday: { start: '09:00', end: '18:00' },
        wednesday: { start: '09:00', end: '18:00' },
        thursday: { start: '09:00', end: '18:00' },
        friday: { start: '09:00', end: '18:00' },
        saturday: null,
        sunday: null,
      },
    })
  })

  it('блокирует сохранение при конце раньше начала', async () => {
    renderHoursPage()
    await screen.findByLabelText('Понедельник начало')
    fireEvent.change(screen.getByLabelText('Понедельник конец'), {
      target: { value: '08:00' },
    })
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(await screen.findByText(/конец должен быть позже/i)).toBeInTheDocument()
    expect(sdkMocks.workingHoursOperationsSet).not.toHaveBeenCalled()
  })

  it('блокирует сохранение при частично заполненном дне', async () => {
    renderHoursPage()
    await screen.findByLabelText('Понедельник начало')
    fireEvent.change(screen.getByLabelText('Понедельник конец'), { target: { value: '' } })
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(await screen.findByText(/заполните начало и конец/i)).toBeInTheDocument()
    expect(sdkMocks.workingHoursOperationsSet).not.toHaveBeenCalled()
  })

  it('блокирует сохранение, если время не кратно 15 минутам', async () => {
    renderHoursPage()
    await screen.findByLabelText('Понедельник начало')
    fireEvent.change(screen.getByLabelText('Понедельник начало'), {
      target: { value: '10:07' },
    })
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(await screen.findByText(/Понедельник: шаг/)).toBeInTheDocument()
    expect(sdkMocks.workingHoursOperationsSet).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Понедельник начало')).toHaveValue('10:07')
  })

  it('показывает дефолт, если загрузка не удалась', async () => {
    sdkMocks.workingHoursOperationsGet.mockRejectedValue(new Error('network'))

    renderHoursPage()

    expect(await screen.findByLabelText('Понедельник начало')).toHaveValue('09:00')
  })

  it('отображает сохранённую конфигурацию, если она есть', async () => {
    const configured: WorkingHours = {
      ...unconfigured,
      tuesday: { start: '10:00', end: '16:00' },
    }
    sdkMocks.workingHoursOperationsGet.mockResolvedValue({ data: configured, error: undefined })

    renderHoursPage()

    expect(await screen.findByLabelText('Вторник начало')).toHaveValue('10:00')
    expect(screen.getByLabelText('Вторник конец')).toHaveValue('16:00')
    // Будни без конфигурации не перетираются дефолтом — показываем как есть.
    expect(screen.getByLabelText('Понедельник начало')).toHaveValue('')
    expect(screen.getAllByText('Выходной')).toHaveLength(6)
  })
})
