import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '@/App'
import { render } from './test-utils'

describe('Навигация', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/')
  })

  it('кнопка «Записаться на встречу» с главной ведёт на страницу записи', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getAllByRole('link', { name: 'Записаться на встречу' })[0])

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Запись на встречу' }),
    ).toBeInTheDocument()
  })

  it('хедер отображается на всех страницах и ведёт по сервису', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Обе ссылки хедера видны на главной.
    expect(screen.getByRole('link', { name: 'Записаться' })).toHaveAttribute('href', '/book')
    expect(screen.getByRole('link', { name: 'Терминал владельца' })).toHaveAttribute(
      'href',
      '/owner',
    )

    // «Терминал владельца» ведёт на страницу владельца (бывшие «Мои типы встреч»).
    await user.click(screen.getByRole('link', { name: 'Терминал владельца' }))
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Терминал владельца' }),
    ).toBeInTheDocument()

    // Хедер остаётся и на странице владельца: «Записаться» ведёт к записи.
    await user.click(screen.getByRole('link', { name: 'Записаться' }))
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Запись на встречу' }),
    ).toBeInTheDocument()
  })

  it('ссылка «Calls Calendar» в хедере возвращает на главную', async () => {
    const user = userEvent.setup()
    window.history.pushState({}, '', '/book')
    render(<App />)

    await user.click(screen.getByRole('link', { name: 'Calls Calendar' }))

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Calls Calendar' }),
    ).toBeInTheDocument()
  })

  it('неизвестный маршрут редиректит на главную', async () => {
    window.history.pushState({}, '', '/definitely-not-a-route')
    render(<App />)

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Calls Calendar' }),
    ).toBeInTheDocument()
  })
})
