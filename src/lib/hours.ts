import type { WorkingHours } from '@/api'

// Дни недели в порядке недели: label — для редактора, short — для сводок.
export const days = [
  { key: 'monday', label: 'Понедельник', short: 'Пн' },
  { key: 'tuesday', label: 'Вторник', short: 'Вт' },
  { key: 'wednesday', label: 'Среда', short: 'Ср' },
  { key: 'thursday', label: 'Четверг', short: 'Чт' },
  { key: 'friday', label: 'Пятница', short: 'Пт' },
  { key: 'saturday', label: 'Суббота', short: 'Сб' },
  { key: 'sunday', label: 'Воскресенье', short: 'Вс' },
] as const

export type DayKey = (typeof days)[number]['key']

// Все дни пустые — часы не настроены.
export const emptyHours: WorkingHours = {
  monday: null,
  tuesday: null,
  wednesday: null,
  thursday: null,
  friday: null,
  saturday: null,
  sunday: null,
}

// Продуктовый дефолт: будни 09:00–18:00, выходные — выходной.
export const defaultHours: WorkingHours = {
  monday: { start: '09:00', end: '18:00' },
  tuesday: { start: '09:00', end: '18:00' },
  wednesday: { start: '09:00', end: '18:00' },
  thursday: { start: '09:00', end: '18:00' },
  friday: { start: '09:00', end: '18:00' },
  saturday: null,
  sunday: null,
}

// Не настроено (все дни пустые) → в редакторе показываем продуктовый дефолт.
// Ограничение: клиент не отличает «никогда не настраивалось» от «сохранил всё выкл».
export function isUnconfigured(hours: WorkingHours) {
  return days.every(({ key }) => hours[key] === null)
}

// Краткая сводка расписания: соседние дни с одинаковым временем склеиваются
// в диапазон — «Пн–Пт 09:00–18:00», пустые дни читаются как выходные.
export function summarizeHours(hours: WorkingHours): string[] {
  const value = (key: DayKey) => {
    const day = hours[key]
    return day ? `${day.start}–${day.end}` : null
  }
  const lines: string[] = []
  let start = 0
  while (start < days.length) {
    let end = start
    while (end + 1 < days.length && value(days[end + 1].key) === value(days[start].key)) {
      end += 1
    }
    const range = start === end ? days[start].short : `${days[start].short}–${days[end].short}`
    const time = value(days[start].key)
    lines.push(time ? `${range} ${time}` : `${range} — выходной`)
    start = end + 1
  }
  return lines
}
