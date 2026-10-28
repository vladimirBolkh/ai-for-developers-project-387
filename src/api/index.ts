import { client } from '@/api-client/client.gen'

// В dev Vite пробрасывает `/api/*` на бэкенд (vite.config.ts + VITE_API_PROXY).
// В проде baseUrl переопределяется точкой развёртывания.
client.setConfig({ baseUrl: '/api' })

export {
  availabilityGet,
  bookingsCreate,
  bookingsList,
  eventTypesCreate,
  eventTypesList,
  eventTypesRead,
  eventTypesRemove,
  eventTypesUpdate,
  workingHoursOperationsGet,
  workingHoursOperationsSet,
} from '@/api-client/sdk.gen'

export type {
  BookingRequest,
  DayHours,
  EventType,
  EventTypeCreate,
  EventTypeUpdate,
  Meeting,
  MeetingFormat,
  Slot,
  SlotStatus,
  WorkingHours,
} from '@/api-client/types.gen'
