// Привязка доменной логики (server/store.ts) к маршрутам Fastify.
// Хендлеры ключуются по operationId из сгенерированного routes.gen.ts.
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { RouteHandlers } from './generated/routes.gen'
import type {
  BookingRequest,
  EventTypeCreate,
  EventTypeUpdate,
  WorkingHours,
} from './generated/types'
import {
  computeAvailability,
  createBooking,
  createEventType,
  removeEventType,
  setWorkingHours,
  updateEventType,
  upcomingMeetings,
  type Store,
} from './store'

export function createHandlers(store: Store): RouteHandlers {
  return {
    Availability_get: (request: FastifyRequest, reply: FastifyReply) => {
      const { eventTypeId } = request.query as { eventTypeId: string }
      if (!store.eventTypes.some((type) => type.id === eventTypeId)) {
        return reply.code(404).send({ message: 'Event type not found' })
      }
      return reply.send(computeAvailability(store, eventTypeId))
    },
    Bookings_list: (_request: FastifyRequest, reply: FastifyReply) =>
      reply.send(upcomingMeetings(store)),
    Bookings_create: (request: FastifyRequest, reply: FastifyReply) => {
      const result = createBooking(store, request.body as BookingRequest)
      if (!result.ok) return reply.code(result.status).send({ message: result.message })
      return reply.code(201).send(result.meeting)
    },
    EventTypes_list: (_request: FastifyRequest, reply: FastifyReply) =>
      reply.send(store.eventTypes),
    EventTypes_create: (request: FastifyRequest, reply: FastifyReply) => {
      const result = createEventType(store, request.body as EventTypeCreate)
      if (!result.ok) return reply.code(result.status).send({ message: result.message })
      return reply.send(result.eventType)
    },
    EventTypes_read: (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string }
      const found = store.eventTypes.find((type) => type.id === id)
      if (!found) return reply.code(404).send({ message: 'Event type not found' })
      return reply.send(found)
    },
    EventTypes_update: (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string }
      const result = updateEventType(store, id, request.body as EventTypeUpdate)
      if (!result.ok) return reply.code(result.status).send({ message: result.message })
      return reply.send(result.eventType)
    },
    EventTypes_remove: (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string }
      const result = removeEventType(store, id)
      if (!result.ok) return reply.code(result.status).send({ message: result.message })
      return reply.code(204).send()
    },
    WorkingHoursOperations_get: (_request: FastifyRequest, reply: FastifyReply) =>
      reply.send(store.workingHours),
    WorkingHoursOperations_set: (request: FastifyRequest, reply: FastifyReply) => {
      const result = setWorkingHours(store, request.body as WorkingHours)
      if (!result.ok) return reply.code(result.status).send({ message: result.message })
      return reply.send(store.workingHours)
    },
  }
}
