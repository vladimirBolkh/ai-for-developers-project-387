// Auto-generated from spec/openapi.yaml. Do not edit.
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

export type RouteHandler = (request: FastifyRequest, reply: FastifyReply) => unknown
export type RouteHandlers = Record<string, RouteHandler>

export function registerRoutes(app: FastifyInstance, handlers: RouteHandlers): void {
  app.get('/availability', { schema: {"querystring":{"type":"object","properties":{"eventTypeId":{"type":"string"}},"required":["eventTypeId"]}} }, handlers['Availability_get'])
  app.get('/bookings', { schema: {} }, handlers['Bookings_list'])
  app.post('/bookings', { schema: {"body":{"$ref":"BookingRequest"}} }, handlers['Bookings_create'])
  app.get('/event-types', { schema: {} }, handlers['EventTypes_list'])
  app.post('/event-types', { schema: {"body":{"$ref":"EventTypeCreate"}} }, handlers['EventTypes_create'])
  app.get('/event-types/:id', { schema: {"params":{"type":"object","properties":{"id":{"type":"string"}},"required":["id"]}} }, handlers['EventTypes_read'])
  app.patch('/event-types/:id', { schema: {"params":{"type":"object","properties":{"id":{"type":"string"}},"required":["id"]},"body":{"$ref":"EventTypeUpdate"}} }, handlers['EventTypes_update'])
  app.delete('/event-types/:id', { schema: {"params":{"type":"object","properties":{"id":{"type":"string"}},"required":["id"]}} }, handlers['EventTypes_remove'])
  app.get('/working-hours', { schema: {} }, handlers['WorkingHoursOperations_get'])
  app.put('/working-hours', { schema: {"body":{"$ref":"WorkingHours"}} }, handlers['WorkingHoursOperations_set'])
}
