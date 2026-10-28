import { screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HomePage from '@/pages/HomePage'
import { resetSdkMocks, sdkMocks } from './sdk-mock'
import { render } from './test-utils'

beforeEach(() => {
  resetSdkMocks()
})

describe('Главная страница', () => {
  it('рассказывает о сервисе и ведёт на страницу записи', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Calls Calendar' })).toBeInTheDocument()
    expect(screen.getByText(/бронируй время для встреч/i)).toBeInTheDocument()

    expect(screen.getByRole('heading', { level: 2, name: 'Как это работает' })).toBeInTheDocument()
    expect(screen.getByText('Владелец публикует время')).toBeInTheDocument()
    expect(screen.getByText('Ты выбираешь слот')).toBeInTheDocument()
    expect(screen.getByText('Ты записан на встречу')).toBeInTheDocument()

    const ctaLinks = screen.getAllByRole('link', { name: 'Записаться на встречу' })
    expect(ctaLinks).toHaveLength(1)
    expect(ctaLinks[0]).toHaveAttribute('href', '/book')
  })

  it('показывает число типов событий из API (мок SDK, без сети)', async () => {
    sdkMocks.eventTypesList.mockResolvedValue({
      data: [
        {
          id: '1',
          name: 'Консультация',
          description: '30 минут',
          durationMinutes: 30,
          format: 'online',
        },
        {
          id: '2',
          name: 'Созвон',
          description: '15 минут',
          durationMinutes: 15,
          format: 'offline',
        },
      ],
      error: undefined,
    })

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Доступно типов встреч: 2')).toBeInTheDocument()
  })
})
