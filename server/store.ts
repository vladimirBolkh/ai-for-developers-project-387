// In-memory хранилище и доменная логика бэкенда.
// Fastify-agnostic: чистые данные и функции, чтобы их можно было тестировать без HTTP.
import type {
  BookingRequest,
  DayHours,
  EventType,
  EventTypeCreate,
  EventTypeUpdate,
  Meeting,
  Slot,
  SlotStatus,
  WorkingHours,
} from './generated/types'

// JS Date.getDay(): 0 — воскресенье … 6 — суббота.
export const WEEKDAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const

export type WeekdayKey = (typeof WEEKDAY_KEYS)[number]

export const SLOT_STEP_MINUTES = 15
export const WINDOW_DAYS = 14
export const TOPIC_MAX_LENGTH = 200

export interface Store {
  eventTypes: EventType[]
  workingHours: WorkingHours
  meetings: Meeting[]
  seq: number
}

export function createStore(): Store {
  return {
    eventTypes: [],
    workingHours: {
      monday: null,
      tuesday: null,
      wednesday: null,
      thursday: null,
      friday: null,
      saturday: null,
      sunday: null,
    },
    meetings: [],
    seq: 0,
  }
}

function nextId(store: Store, prefix: string): string {
  store.seq += 1
  return `${prefix}-${store.seq}`
}

function hhmmToMinutes(hhmm: string): number {
  const [hours, minutes] = hhmm.split(':').map(Number)
  return hours * 60 + minutes
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd
}

function dayHoursFor(workingHours: WorkingHours, date: Date): DayHours | null {
  return workingHours[WEEKDAY_KEYS[date.getDay()]]
}

function meetingsOverlap(store: Store, startMs: number, endMs: number): boolean {
  return store.meetings.some((meeting) => {
    const meetingStart = new Date(meeting.startDateTime).getTime()
    const meetingEnd = meetingStart + meeting.eventTypeDurationMinutes * 60000
    return overlaps(startMs, endMs, meetingStart, meetingEnd)
  })
}

// Слоты = сетка 15 минут внутри рабочих часов на окно «сегодня + WINDOW_DAYS».
// Каждый слот возвращается со статусом, а не отфильтровывается:
//   - `free` — будущий и не занят: можно записаться;
//   - `busy` — будущий, но пересекается с уже существующей записью;
//   - `unavailable` — момент уже наступил (время прошло).
// «Впритык» (back-to-back) разрешено.
export function computeAvailability(store: Store, eventTypeId: string, now = new Date()): Slot[] {
  const eventType = store.eventTypes.find((type) => type.id === eventTypeId)
  if (!eventType) return []

  const duration = eventType.durationMinutes
  const slots: Slot[] = []
  const nowMs = now.getTime()
  const baseDay = new Date(now)
  baseDay.setHours(0, 0, 0, 0)

  for (let offset = 0; offset < WINDOW_DAYS; offset += 1) {
    const day = new Date(baseDay)
    day.setDate(baseDay.getDate() + offset)
    const hours = dayHoursFor(store.workingHours, day)
    if (!hours) continue

    const open = hhmmToMinutes(hours.start)
    const close = hhmmToMinutes(hours.end)
    for (let startMin = open; startMin + duration <= close; startMin += SLOT_STEP_MINUTES) {
      const start = new Date(day)
      start.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0)
      const startMs = start.getTime()
      const endMs = startMs + duration * 60000
      let status: SlotStatus
      if (startMs < nowMs) status = 'unavailable'
      else if (meetingsOverlap(store, startMs, endMs)) status = 'busy'
      else status = 'free'
      slots.push({ startDateTime: start.toISOString(), status })
    }
  }
  return slots
}

export type BookingOutcome =
  { ok: true; meeting: Meeting } | { ok: false; status: 400 | 404 | 409; message: string }

export function createBooking(
  store: Store,
  body: BookingRequest,
  now = new Date(),
): BookingOutcome {
  const eventType = store.eventTypes.find((type) => type.id === body.eventTypeId)
  if (!eventType) return { ok: false, status: 404, message: 'Event type not found' }

  const topic = typeof body.topic === 'string' ? body.topic.trim() : ''
  if (!topic) return { ok: false, status: 400, message: 'topic must not be empty' }
  if (topic.length > TOPIC_MAX_LENGTH) {
    return {
      ok: false,
      status: 400,
      message: `topic must be at most ${TOPIC_MAX_LENGTH} characters`,
    }
  }

  const start = new Date(body.startDateTime)
  if (Number.isNaN(start.getTime())) {
    return { ok: false, status: 400, message: 'Invalid startDateTime' }
  }

  const hours = dayHoursFor(store.workingHours, start)
  if (!hours) return { ok: false, status: 400, message: 'Not a working day' }

  const duration = eventType.durationMinutes
  const startMin = start.getHours() * 60 + start.getMinutes()
  const open = hhmmToMinutes(hours.start)
  const close = hhmmToMinutes(hours.end)

  if (startMin % SLOT_STEP_MINUTES !== 0) {
    return { ok: false, status: 400, message: 'Slot must align to 15 minutes' }
  }
  if (startMin < open || startMin + duration > close) {
    return { ok: false, status: 400, message: 'Outside working hours' }
  }

  const startMs = start.getTime()
  if (startMs < now.getTime()) {
    return { ok: false, status: 400, message: 'Slot is in the past' }
  }
  const endMs = startMs + duration * 60000
  if (meetingsOverlap(store, startMs, endMs)) {
    return { ok: false, status: 409, message: 'Slot already booked' }
  }

  const meeting: Meeting = {
    id: nextId(store, 'meeting'),
    eventTypeId: eventType.id,
    eventTypeName: eventType.name,
    eventTypeDescription: eventType.description,
    eventTypeDurationMinutes: eventType.durationMinutes,
    eventTypeFormat: eventType.format,
    startDateTime: start.toISOString(),
    guestName: body.guestName,
    topic,
    ...(body.guestEmail ? { guestEmail: body.guestEmail } : {}),
  }
  store.meetings.push(meeting)
  return { ok: true, meeting }
}

// «Предстоящие» владеет сервер: отфильтровываем прошедшие и сортируем по времени.
export function upcomingMeetings(store: Store, now = new Date()): Meeting[] {
  const nowMs = now.getTime()
  return store.meetings
    .filter((meeting) => new Date(meeting.startDateTime).getTime() >= nowMs)
    .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
}

export function validateEventTypeInput(input: {
  name?: string
  description?: string
  durationMinutes?: number
  format?: string
}): string | null {
  if (input.name !== undefined && input.name.trim() === '') return 'name must not be empty'
  if (
    input.durationMinutes !== undefined &&
    (!Number.isInteger(input.durationMinutes) || input.durationMinutes <= 0)
  ) {
    return 'durationMinutes must be a positive integer'
  }
  if (input.format !== undefined && input.format !== 'online' && input.format !== 'offline') {
    return 'format must be online or offline'
  }
  return null
}

export type EventTypeMutation =
  { ok: true; eventType: EventType } | { ok: false; status: 400 | 404; message: string }

export function createEventType(store: Store, input: EventTypeCreate): EventTypeMutation {
  const error = validateEventTypeInput(input)
  if (error) return { ok: false, status: 400, message: error }
  const eventType: EventType = { id: nextId(store, 'event-type'), ...input }
  store.eventTypes.push(eventType)
  return { ok: true, eventType }
}

export function updateEventType(
  store: Store,
  id: string,
  input: EventTypeUpdate,
): EventTypeMutation {
  const existing = store.eventTypes.find((type) => type.id === id)
  if (!existing) return { ok: false, status: 404, message: 'Event type not found' }
  const error = validateEventTypeInput(input)
  if (error) return { ok: false, status: 400, message: error }
  Object.assign(existing, input)
  return { ok: true, eventType: existing }
}

export type RemoveOutcome = { ok: true } | { ok: false; status: 404; message: string }

export function removeEventType(store: Store, id: string): RemoveOutcome {
  const index = store.eventTypes.findIndex((type) => type.id === id)
  if (index === -1) return { ok: false, status: 404, message: 'Event type not found' }
  store.eventTypes.splice(index, 1)
  return { ok: true }
}

export type WorkingHoursOutcome = { ok: true } | { ok: false; status: 400; message: string }

export function setWorkingHours(store: Store, workingHours: WorkingHours): WorkingHoursOutcome {
  for (const key of WEEKDAY_KEYS) {
    const day = workingHours[key]
    if (!day) continue
    if (hhmmToMinutes(day.start) >= hhmmToMinutes(day.end)) {
      return { ok: false, status: 400, message: `${key}: start must be before end` }
    }
  }
  store.workingHours = workingHours
  return { ok: true }
}
