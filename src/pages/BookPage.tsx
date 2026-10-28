import { availabilityGet, bookingsCreate, eventTypesList } from '@/api'
import type { EventType, Meeting, Slot } from '@/api'
import { asArray } from '@/lib/data'
import { formatLabel, formatSlot } from '@/lib/format'
import {
  Badge,
  Button,
  Container,
  Grid,
  Group,
  Loader,
  NativeSelect,
  Paper,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core'
import { Calendar } from '@mantine/dates'
import dayjs from 'dayjs'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

// Каноничная метка дня — локальная дата ISO-момента (строго та же часть даты,
// что показывает formatSlot), поэтому календарь и список слотов всегда
// согласованы в часовом поясе пользователя.
function dayKey(iso: string) {
  return dayjs(iso).format('YYYY-MM-DD')
}

// Текущий размер календаря (7 ячеек по --day-size ≈ 2.25rem при size="sm" +
// зазоры ячеек) — это же минимум блока: Paper не сжимается ниже, сколько бы ни
// уменьшался блок. Считаем в border-box, поэтому прибавляем padding p="md"
// и рамку withBorder. Календарь fullWidth растягивается по ширине блока вверх
// от этого минимума.
const CALENDAR_MIN_WIDTH = 'calc(7 * 2.25rem * var(--mantine-scale, 1) + 8px + 2 * 1rem + 2px)'

export default function BookPage() {
  const [types, setTypes] = useState<EventType[] | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  // Триггер повторной загрузки доступности (после брони или конфликта 409).
  const [reloadKey, setReloadKey] = useState(0)
  // Сообщение «слот уже занят» живёт вне слота, чтобы пережить перезагрузку.
  const [notice, setNotice] = useState<string | null>(null)

  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [bookingError, setBookingError] = useState<'validation' | 'unknown' | null>(null)
  const [confirmed, setConfirmed] = useState<Meeting | null>(null)

  useEffect(() => {
    let cancelled = false
    eventTypesList().then((result) => {
      // Ошибка, пустой список и не-массив (недоступный бэкенд) дают пустое
      // состояние, а не вечный спиннер или белый экран.
      if (cancelled) return
      const list = asArray<EventType>(result.data)
      setTypes(list)
      // Авто-выбор первого типа: календарь и слоты видны сразу, без лишнего клика.
      if (list.length > 0) setSelectedId((prev) => prev ?? list[0].id)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedId) return
    let cancelled = false
    setSlots(null)
    setSelectedDay(null)
    setSelectedSlot(null)
    setConfirmed(null)
    setBookingError(null)
    setGuestName('')
    setGuestEmail('')
    setNameError(null)
    availabilityGet({ query: { eventTypeId: selectedId } }).then((result) => {
      if (cancelled) return
      const list = asArray<Slot>(result.data)
      setSlots(list)
      // Авто-выбор первой даты со свободным слотом — сразу виден бронируемый день.
      const firstFree = list.find((slot) => slot.status === 'free')
      if (firstFree) setSelectedDay(dayKey(firstFree.startDateTime))
    })
    return () => {
      cancelled = true
    }
  }, [selectedId, reloadKey])

  // Дни, на которые есть хотя бы один свободный слот (остальные — disabled + серый фон).
  const availableDays = useMemo(() => {
    const set = new Set<string>()
    for (const slot of slots ?? []) {
      if (slot.status === 'free') set.add(dayKey(slot.startDateTime))
    }
    return set
  }, [slots])

  // Последний день сетки — ограничивает навигацию календаря данными.
  const maxSlotDay = useMemo(() => {
    const list = slots ?? []
    return list.length > 0 ? dayKey(list[list.length - 1].startDateTime) : null
  }, [slots])

  // Все слоты выбранного дня (со статусами free / busy / unavailable).
  const daySlots = useMemo(() => {
    if (!slots || !selectedDay) return []
    return slots.filter((slot) => dayKey(slot.startDateTime) === selectedDay)
  }, [slots, selectedDay])

  const slotsViewport = useRef<HTMLDivElement>(null)

  // При каждой отрисовке списка (открытие страницы, смена дня, перезагрузка
  // после брони, возврат из формы гостя) показываем доступные слоты без ручной
  // прокрутки: первый свободный слот встаёт первым видимым. Если поднять его
  // наверх некуда — список уходит до конца, и хвост с оставшимися свободными
  // слотами тоже виден. Всё, что помещается в блок, остаётся сверху.
  useEffect(() => {
    const viewport = slotsViewport.current
    if (!viewport) return
    const firstFree = viewport.querySelector<HTMLElement>('[data-status="free"]')
    if (!firstFree) {
      viewport.scrollTop = 0
      return
    }
    const top =
      firstFree.getBoundingClientRect().top -
      viewport.getBoundingClientRect().top +
      viewport.scrollTop
    const maxScroll = Math.max(viewport.scrollHeight - viewport.clientHeight, 0)
    viewport.scrollTop = Math.min(Math.max(top, 0), maxScroll)
  })

  const todayLabel = useMemo(() => dayjs().format('YYYY-MM-DD'), [])
  const selected = types?.find((type) => type.id === selectedId)
  // Пока выбран слот или показано подтверждение — календарь и слоты заменены,
  // а блок информации становится только для чтения (без выбора типа).
  const bookingMode = !selectedSlot && !confirmed

  function pickSlot(start: string) {
    setSelectedSlot(start)
    setBookingError(null)
    setNotice(null)
  }

  function cancelSlot() {
    setSelectedSlot(null)
    setBookingError(null)
  }

  function submitBooking() {
    if (!selectedId || !selectedSlot) return
    const trimmed = guestName.trim()
    if (!trimmed) {
      setNameError('Введите имя')
      return
    }
    setNameError(null)
    setBookingError(null)
    bookingsCreate({
      body: {
        eventTypeId: selectedId,
        startDateTime: selectedSlot,
        guestName: trimmed,
        guestEmail: guestEmail.trim() || undefined,
      },
    }).then((result) => {
      if (result.data) {
        setConfirmed(result.data)
        setSelectedSlot(null)
      } else if (result.response?.status === 409) {
        // Слот успели занять: возвращаемся к списку и перезагружаем сетку.
        setNotice('Этот слот уже занят. Выберите другой.')
        setSelectedSlot(null)
        setReloadKey((key) => key + 1)
      } else if (result.response?.status === 400) {
        setBookingError('validation')
      } else {
        setBookingError('unknown')
      }
    })
  }

  function bookAgain() {
    setConfirmed(null)
    setSelectedSlot(null)
    setSelectedDay(null)
    setGuestName('')
    setGuestEmail('')
    setNameError(null)
    setBookingError(null)
    setNotice(null)
    setReloadKey((key) => key + 1)
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1}>Запись на встречу</Title>
          <Text c="dimmed">Выберите тип встречи, затем дату и свободный слот.</Text>
        </div>

        <Grid gap="lg">
          {/* Информация о встрече */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper withBorder p="md" radius="md" h="100%">
              <Title order={3} mb="sm">
                Информация о встрече
              </Title>
              {types === null ? (
                <Loader size="sm" />
              ) : types.length === 0 ? (
                <Text c="dimmed">Пока нет доступных типов встреч.</Text>
              ) : (
                <Stack gap="sm">
                  {bookingMode && (
                    <NativeSelect
                      label="Тип встречи"
                      data={types.map((type) => ({
                        value: type.id,
                        label: `${type.name} (${type.durationMinutes} мин)`,
                      }))}
                      value={selectedId ?? ''}
                      onChange={(event) => {
                        setSelectedId(event.currentTarget.value || null)
                        setNotice(null)
                      }}
                      w="100%"
                    />
                  )}
                  {selected ? (
                    <Stack gap={4}>
                      <Group justify="space-between" wrap="wrap">
                        <Text fw={600}>{selected.name}</Text>
                        <Badge variant="light">{formatLabel[selected.format]}</Badge>
                      </Group>
                      {selected.description && (
                        <Text c="dimmed" size="sm">
                          {selected.description}
                        </Text>
                      )}
                      <Text size="sm" c="dimmed">
                        Длительность: {selected.durationMinutes} мин
                      </Text>
                    </Stack>
                  ) : (
                    <Text c="dimmed">Выберите тип встречи.</Text>
                  )}
                </Stack>
              )}
            </Paper>
          </Grid.Col>

          {confirmed ? (
            /* Успешное бронирование: вместо календаря и слотов. */
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Paper withBorder p="md" radius="md">
                <Stack gap="sm">
                  <Title order={3}>Вы записаны</Title>
                  <Text fw={600}>{confirmed.eventTypeName}</Text>
                  <Text>{formatSlot(confirmed.startDateTime)}</Text>
                  <Text c="dimmed">Гость: {confirmed.guestName}</Text>
                  {confirmed.guestEmail && <Text c="dimmed">Email: {confirmed.guestEmail}</Text>}
                  <Group mt="xs">
                    <Button onClick={bookAgain}>Забронировать ещё</Button>
                  </Group>
                </Stack>
              </Paper>
            </Grid.Col>
          ) : selectedSlot ? (
            /* Форма гостя: вместо календаря и слотов. */
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Paper withBorder p="md" radius="md">
                <Stack gap="sm">
                  <Title order={3}>Ваши данные</Title>
                  <Text c="dimmed">Слот: {formatSlot(selectedSlot)}</Text>
                  <TextInput
                    label="Имя"
                    required
                    value={guestName}
                    onChange={(event) => setGuestName(event.currentTarget.value)}
                    error={nameError ?? undefined}
                  />
                  <TextInput
                    label="Email"
                    value={guestEmail}
                    onChange={(event) => setGuestEmail(event.currentTarget.value)}
                  />
                  {bookingError === 'validation' && (
                    <Text c="red">Не удалось создать запись. Проверьте введённые данные.</Text>
                  )}
                  {bookingError === 'unknown' && (
                    <Text c="red">Что-то пошло не так. Попробуйте позже.</Text>
                  )}
                  <Group mt="xs">
                    <Button onClick={submitBooking}>Подтвердить запись</Button>
                    <Button variant="subtle" onClick={cancelSlot}>
                      Выбрать другой слот
                    </Button>
                  </Group>
                </Stack>
              </Paper>
            </Grid.Col>
          ) : (
            <>
              {/* Календарь */}
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Paper
                  withBorder
                  p="md"
                  radius="md"
                  h="100%"
                  style={{ minWidth: CALENDAR_MIN_WIDTH }}
                >
                  <Title order={3} mb="sm">
                    Календарь
                  </Title>
                  {!selectedId ? (
                    <Text c="dimmed">Сначала выберите тип встречи.</Text>
                  ) : slots === null ? (
                    <Loader size="sm" />
                  ) : (
                    <Calendar
                      w="100%"
                      fullWidth
                      defaultDate={selectedDay ?? todayLabel}
                      minDate={todayLabel}
                      maxDate={maxSlotDay ?? undefined}
                      maxLevel="month"
                      // fullWidth растягивает календарь по ширине блока; day не
                      // даёт ячейке сжаться ниже текущего размера (--day-size).
                      // Общий минимум блока задаёт CALENDAR_MIN_WIDTH на Paper.
                      styles={{ day: { minWidth: 'var(--day-size)' } }}
                      getDayProps={(date: string) => {
                        const available = availableDays.has(date)
                        const isSelected = date === selectedDay
                        return {
                          // Дата без свободных слотов — заблокирована и залита серым.
                          disabled: !available,
                          style: {
                            backgroundColor: isSelected
                              ? 'var(--mantine-color-indigo-5)'
                              : available
                                ? undefined
                                : 'var(--mantine-color-gray-1)',
                            color: isSelected ? 'var(--mantine-color-white)' : undefined,
                          },
                          // Выбор дня кликом (недоступные кликнуть нельзя — disabled выше).
                          onClick: () => {
                            if (available) {
                              setSelectedDay(date)
                              setNotice(null)
                            }
                          },
                        }
                      }}
                    />
                  )}
                </Paper>
              </Grid.Col>

              {/* Доступные слоты */}
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Paper withBorder p="md" radius="md" h="100%">
                  <Title order={3} mb="sm">
                    Доступные слоты
                  </Title>
                  {notice && (
                    <Text c="red" size="sm" mb="xs">
                      {notice}
                    </Text>
                  )}
                  {!selectedId ? (
                    <Text c="dimmed">Сначала выберите тип встречи.</Text>
                  ) : slots === null ? (
                    <Loader size="sm" />
                  ) : slots.length === 0 ? (
                    <Text c="dimmed">Нет свободных слотов в ближайшие 14 дней.</Text>
                  ) : !selectedDay ? (
                    <Text c="dimmed">Выберите дату в календаре.</Text>
                  ) : daySlots.length === 0 ? (
                    <Text c="dimmed">В этот день нет слотов.</Text>
                  ) : (
                    <ScrollArea h={380} type="auto" offsetScrollbars viewportRef={slotsViewport}>
                      <Stack gap="xs">
                        {daySlots.map((slot) => {
                          const isFree = slot.status === 'free'
                          const isSelected = slot.startDateTime === selectedSlot
                          return (
                            <UnstyledButton
                              key={slot.startDateTime}
                              data-status={slot.status}
                              disabled={!isFree}
                              onClick={() => isFree && pickSlot(slot.startDateTime)}
                              aria-pressed={isSelected}
                            >
                              <Paper
                                withBorder
                                p="sm"
                                radius="md"
                                bg={
                                  isSelected
                                    ? 'var(--mantine-color-indigo-0)'
                                    : isFree
                                      ? undefined
                                      : 'var(--mantine-color-gray-0)'
                                }
                              >
                                <Group justify="space-between" wrap="nowrap">
                                  <Text size="sm" c={isFree ? undefined : 'dimmed'}>
                                    {formatSlot(slot.startDateTime)}
                                  </Text>
                                  {slot.status === 'busy' && (
                                    <Badge color="red" variant="light">
                                      занято
                                    </Badge>
                                  )}
                                  {slot.status === 'unavailable' && (
                                    <Badge color="gray" variant="light">
                                      недоступен
                                    </Badge>
                                  )}
                                </Group>
                              </Paper>
                            </UnstyledButton>
                          )
                        })}
                      </Stack>
                    </ScrollArea>
                  )}
                </Paper>
              </Grid.Col>
            </>
          )}
        </Grid>

        <div>
          <Button component={Link} to="/" variant="subtle" px={0}>
            ← На главную
          </Button>
        </div>
      </Stack>
    </Container>
  )
}
