import type { MeetingFormat } from '@/api'
import dayjs from 'dayjs'

export const formatLabel: Record<MeetingFormat, string> = {
  online: 'онлайн',
  offline: 'оффлайн',
}

// «дата · время» в локальном поясе пользователя. API отдаёт абсолютный момент
// (UTC), а показывать нужно так, как человек планировал встречу — по своему времени.
export function formatSlot(iso: string) {
  return dayjs(iso).format('YYYY-MM-DD · HH:mm')
}
