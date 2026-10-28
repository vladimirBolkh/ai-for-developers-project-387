import { schemas } from '../server/generated/schemas.gen'

// Регрессия генератора сервера (scripts/generate-server.mjs): OpenAPI `nullable: true`
// — не ключевое слово JSON Schema, ajv (валидатор Fastify) его игнорирует, и `null`
// (выходной день) отсекается проверкой `type: object` → 400 на сохранении часов.
// Генератор обязан транслировать nullable в anyOf с явным null-типом.
describe('Серверные схемы Fastify', () => {
  it('транслирует OpenAPI nullable в JSON-Schema-совместимый anyOf', () => {
    const raw = JSON.stringify(schemas)

    expect(raw).toContain('"type":"null"')
    expect(raw).not.toContain('"nullable"')
  })
})
