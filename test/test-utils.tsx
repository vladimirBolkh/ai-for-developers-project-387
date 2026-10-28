import { MantineProvider } from '@mantine/core'
import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'

// Оборачивает компонент в MantineProvider — без него Mantine-компоненты не работают
function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <MantineProvider>{children}</MantineProvider>
  }

  return render(ui, { wrapper: Wrapper, ...options })
}

export { renderWithProviders as render }
