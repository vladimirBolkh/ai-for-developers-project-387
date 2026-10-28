import { Box, Button, Container, Group, Text } from '@mantine/core'
import { Link, useLocation } from 'react-router-dom'

// Общий хедер всех страниц: слева — название сервиса (ссылка на главную),
// справа — записи и терминал владельца. Липнет к верху: страница записи
// длинная, навигация должна быть под рукой.
export default function AppHeader() {
  const { pathname } = useLocation()

  return (
    <Box
      component="header"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(255, 255, 255, 0.72)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--mantine-color-gray-3)',
      }}
    >
      <Container size="xl">
        <Group justify="space-between" py={10}>
          <Text
            component={Link}
            to="/"
            fw={700}
            size="lg"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            Calls Calendar
          </Text>
          <Group gap="xs">
            <Button component={Link} to="/book" variant={pathname === '/book' ? 'light' : 'subtle'}>
              Записаться
            </Button>
            <Button
              component={Link}
              to="/owner"
              variant={pathname === '/owner' ? 'light' : 'subtle'}
            >
              Терминал владельца
            </Button>
          </Group>
        </Group>
      </Container>
    </Box>
  )
}
