import {
  bookingsList,
  eventTypesCreate,
  eventTypesList,
  eventTypesRemove,
  eventTypesUpdate,
  workingHoursOperationsGet,
} from '@/api'
import type { EventType, EventTypeCreate, Meeting, MeetingFormat, WorkingHours } from '@/api'
import { asArray } from '@/lib/data'
import { formatLabel, formatSlot } from '@/lib/format'
import { emptyHours, isUnconfigured, summarizeHours } from '@/lib/hours'
import {
  Button,
  Container,
  Grid,
  Group,
  Loader,
  NativeSelect,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

// Длительность ограничена 15–120 минутами с шагом 15 (решение по времени).
const durationOptions = [15, 30, 45, 60, 75, 90, 105, 120].map((min) => ({
  value: String(min),
  label: `${min} мин`,
}))

const formatOptions = Object.entries(formatLabel).map(([value, label]) => ({ value, label }))

export default function OwnerPage() {
  const [types, setTypes] = useState<EventType[] | null>(null)
  const [hours, setHours] = useState<WorkingHours | null>(null)
  const [meetings, setMeetings] = useState<Meeting[] | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<EventType | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('30')
  const [format, setFormat] = useState<MeetingFormat>('online')
  const [nameError, setNameError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    eventTypesList().then((result) => {
      if (!cancelled) setTypes(asArray<EventType>(result.data))
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    workingHoursOperationsGet()
      .then((result) => {
        // Нет данных (в т.ч. ошибка) → показываем «не настроены», а не вечный спиннер.
        if (!cancelled) setHours(result.data ?? { ...emptyHours })
      })
      .catch(() => {
        if (!cancelled) setHours({ ...emptyHours })
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    bookingsList()
      .then((result) => {
        if (!cancelled) setMeetings(asArray<Meeting>(result.data))
      })
      .catch(() => {
        if (!cancelled) setMeetings([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  function refresh() {
    eventTypesList().then((result) => setTypes(asArray<EventType>(result.data)))
  }

  function openCreate() {
    setEditing(null)
    setName('')
    setDescription('')
    setDuration('30')
    setFormat('online')
    setNameError(null)
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(type: EventType) {
    setEditing(type)
    setName(type.name)
    setDescription(type.description)
    setDuration(String(type.durationMinutes))
    setFormat(type.format)
    setNameError(null)
    setFormError(null)
    setFormOpen(true)
  }

  function submit() {
    const trimmed = name.trim()
    if (!trimmed) {
      setNameError('Введите название')
      return
    }
    setNameError(null)
    setFormError(null)
    const body: EventTypeCreate = {
      name: trimmed,
      description: description.trim(),
      durationMinutes: Number(duration),
      format,
    }
    const request = editing
      ? eventTypesUpdate({ path: { id: editing.id }, body })
      : eventTypesCreate({ body })
    request.then((result) => {
      if (result.data) {
        setFormOpen(false)
        refresh()
      } else {
        setFormError('Не удалось сохранить тип. Проверьте данные.')
      }
    })
  }

  function remove(id: string) {
    setDeleteError(null)
    eventTypesRemove({ path: { id } }).then((result) => {
      if (!result.error) refresh()
      else setDeleteError('Не удалось удалить тип.')
    })
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="md">
        <div>
          <Title order={1}>Терминал владельца</Title>
          <Text c="dimmed">Типы встреч, рабочие часы и предстоящие записи — в одном месте.</Text>
        </div>

        {/* Сводка: две карточки, на узких экранах складываются в столбик. */}
        <Grid gap="md">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper withBorder p="md" radius="md" h="100%">
              <Text c="dimmed" size="sm">
                Типы встреч
              </Text>
              {types === null ? (
                <Loader size="sm" mt="xs" />
              ) : (
                <>
                  <Text fw={700} size="xl">
                    {types.length}
                  </Text>
                  <Text c="dimmed" size="sm">
                    {types.length === 0
                      ? 'Создайте первый тип.'
                      : types
                          .map((type) => `${type.name} — ${type.durationMinutes} мин`)
                          .join(', ')}
                  </Text>
                </>
              )}
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper withBorder p="md" radius="md" h="100%">
              <Group justify="space-between" align="flex-start">
                <div>
                  <Text c="dimmed" size="sm">
                    Рабочие часы
                  </Text>
                  {hours === null ? (
                    <Loader size="sm" mt="xs" />
                  ) : isUnconfigured(hours) ? (
                    <Text fw={700} size="xl">
                      Не настроены
                    </Text>
                  ) : (
                    <Stack gap={2} mt={4}>
                      {summarizeHours(hours).map((line) => (
                        <Text key={line} size="sm">
                          {line}
                        </Text>
                      ))}
                    </Stack>
                  )}
                </div>
                <Button component={Link} to="/hours" variant="light" size="xs">
                  Настроить часы
                </Button>
              </Group>
              {hours !== null && isUnconfigured(hours) && (
                <Text c="dimmed" size="sm" mt="xs">
                  Без часов запись невозможна.
                </Text>
              )}
            </Paper>
          </Grid.Col>
        </Grid>

        {/* Основные блоки: типы шире (там CRUD), встречи уже. */}
        <Grid gap="md" align="start">
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between" mb="sm">
                <Title order={2}>Типы встреч</Title>
                <Button onClick={openCreate}>Создать тип</Button>
              </Group>

              {types === null ? (
                <Loader size="sm" />
              ) : types.length === 0 ? (
                <Text c="dimmed">Пока нет типов встреч.</Text>
              ) : (
                <Stack gap="sm">
                  {types.map((type) => (
                    <Paper key={type.id} withBorder p="md" radius="md">
                      <Group justify="space-between" align="flex-start">
                        <div>
                          <Text fw={600}>{type.name}</Text>
                          <Text c="dimmed" size="sm">
                            {type.description}
                          </Text>
                          <Text size="sm" c="dimmed" mt={4}>
                            {type.durationMinutes} мин · {formatLabel[type.format]}
                          </Text>
                        </div>
                        <Group gap="xs">
                          <Button variant="light" size="xs" onClick={() => openEdit(type)}>
                            Изменить
                          </Button>
                          <Button
                            variant="light"
                            color="red"
                            size="xs"
                            onClick={() => remove(type.id)}
                          >
                            Удалить
                          </Button>
                        </Group>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              )}

              {deleteError && <Text c="red">{deleteError}</Text>}

              {formOpen && (
                <Paper withBorder p="md" radius="md" mt="sm">
                  <Stack gap="sm">
                    <Title order={3}>{editing ? 'Изменить тип' : 'Новый тип'}</Title>
                    <TextInput
                      label="Название"
                      required
                      value={name}
                      onChange={(event) => setName(event.currentTarget.value)}
                      error={nameError ?? undefined}
                    />
                    <Textarea
                      label="Описание"
                      value={description}
                      onChange={(event) => setDescription(event.currentTarget.value)}
                    />
                    <NativeSelect
                      label="Длительность"
                      data={durationOptions}
                      value={duration}
                      onChange={(event) => setDuration(event.currentTarget.value)}
                    />
                    <div>
                      <Text size="sm" fw={500} mb={4}>
                        Формат
                      </Text>
                      <SegmentedControl
                        data={formatOptions}
                        value={format}
                        onChange={(value) => setFormat(value as MeetingFormat)}
                      />
                    </div>
                    {formError && <Text c="red">{formError}</Text>}
                    <Group>
                      <Button onClick={submit}>{editing ? 'Сохранить' : 'Создать'}</Button>
                      <Button variant="subtle" onClick={() => setFormOpen(false)}>
                        Отмена
                      </Button>
                    </Group>
                  </Stack>
                </Paper>
              )}
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 5 }}>
            <Paper withBorder p="md" radius="md" h="100%">
              <Title order={2} mb="sm">
                Предстоящие встречи
              </Title>
              {meetings === null ? (
                <Loader size="sm" />
              ) : meetings.length === 0 ? (
                <Text c="dimmed">Пока нет встреч.</Text>
              ) : (
                <Stack gap="sm">
                  {meetings.map((meeting) => (
                    <Paper key={meeting.id} withBorder p="sm" radius="md">
                      <Text fw={600}>{meeting.guestName}</Text>
                      <Text c="dimmed" size="sm">
                        {meeting.eventTypeName}
                      </Text>
                      <Text size="sm" mt={4}>
                        {formatSlot(meeting.startDateTime)}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {meeting.eventTypeDurationMinutes} мин ·{' '}
                        {formatLabel[meeting.eventTypeFormat]}
                      </Text>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Paper>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  )
}
