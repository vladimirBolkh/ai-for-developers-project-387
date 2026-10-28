import { eventTypesList } from '@/api'
import { Badge, Button, Container, Grid, Group, Paper, Stack, Text, Title } from '@mantine/core'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const steps = [
  {
    step: '1',
    title: 'Владелец публикует время',
    description: 'Он отмечает, когда ему удобно провести встречи.',
  },
  {
    step: '2',
    title: 'Ты выбираешь слот',
    description: 'Смотришь свободное время и выбираешь удобный слот.',
  },
  {
    step: '3',
    title: 'Ты записан на встречу',
    description: 'Слот закрепляется за тобой, встреча добавляется в календарь владельца.',
  },
]

export default function HomePage() {
  const [eventTypesCount, setEventTypesCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    eventTypesList()
      .then((result) => {
        // Считаем только если это реально массив: недоступный бэкенд отдаёт
        // не-массив (например, HTML), и `.length` дал бы фиктивное число.
        if (!cancelled && Array.isArray(result.data)) setEventTypesCount(result.data.length)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Container size="lg" py="xl">
      <Grid gap="xl" align="center">
        {/* Слева — о сервисе и запись */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Stack gap="sm">
            <Title order={1}>
              <Text
                component="span"
                variant="gradient"
                gradient={{ from: 'indigo', to: 'violet', deg: 135 }}
                inherit
              >
                Calls Calendar
              </Text>
            </Title>
            <Text c="dimmed">
              Бронируй время для встреч без переписки: владелец публикует свободное время, ты
              выбираешь слот и записываешься.
            </Text>
            {eventTypesCount !== null && (
              <Text c="dimmed" size="sm">
                Доступно типов встреч: {eventTypesCount}
              </Text>
            )}
            <Group mt="sm">
              <Button component={Link} to="/book" size="md">
                Записаться на встречу
              </Button>
            </Group>
          </Stack>
        </Grid.Col>

        {/* Справа — как работает сервис */}
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Stack gap="md">
            <Title order={2}>Как это работает</Title>
            {steps.map((item) => (
              <Paper key={item.step} withBorder p="md" radius="md">
                <Group gap="xs" align="center">
                  <Badge variant="light" size="sm" radius="sm">
                    {item.step}
                  </Badge>
                  <Text fw={500}>{item.title}</Text>
                </Group>
                <Text c="dimmed" size="sm" mt="xs">
                  {item.description}
                </Text>
              </Paper>
            ))}
          </Stack>
        </Grid.Col>
      </Grid>
    </Container>
  )
}
