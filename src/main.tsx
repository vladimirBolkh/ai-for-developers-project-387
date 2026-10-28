import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import 'dayjs/locale/ru'

import { MantineProvider } from '@mantine/core'
import dayjs from 'dayjs'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/App'

// Русская локаль для календаря (@mantine/dates) — названия месяцев и дней недели.
dayjs.locale('ru')

const root = document.getElementById('app')

if (!root) {
  throw new Error('Root element #app not found')
}

createRoot(root).render(
  <StrictMode>
    <MantineProvider>
      <App />
    </MantineProvider>
  </StrictMode>,
)
