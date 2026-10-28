// Генератор серверных артефактов Fastify из spec/openapi.yaml.
// Регенерирует server/schemas.gen.ts, server/routes.gen.ts, server/types.ts.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const openapi = parseYaml(readFileSync(resolve(root, 'spec/openapi.yaml'), 'utf8'))

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete']

function rewriteRefs(node) {
  if (Array.isArray(node)) return node.map(rewriteRefs)
  if (node && typeof node === 'object') {
    if (typeof node.$ref === 'string') {
      const match = node.$ref.match(/^#\/components\/schemas\/(.+)$/)
      if (match) return { $ref: match[1] }
    }
    const out = {}
    for (const [key, value] of Object.entries(node)) {
      if (key === 'nullable') continue // обрабатывается ниже
      out[key] = rewriteRefs(value)
    }
    // OpenAPI 3.0 `nullable: true` — не ключевое слово JSON Schema, ajv его
    // игнорирует. Без трансляции `null` (выходной день) отсекается проверкой
    // `type: object` из allOf → 400 на сохранении. Превращаем в anyOf с null-типом.
    if (node.nullable) return { anyOf: [out, { type: 'null' }] }
    return out
  }
  return node
}

function buildParamSchemas(parameters) {
  const result = {}
  for (const param of parameters ?? []) {
    const location = param.in === 'query' ? 'querystring' : param.in === 'path' ? 'params' : null
    if (!location) continue
    result[location] ??= { type: 'object', properties: {}, required: [] }
    result[location].properties[param.name] = rewriteRefs(param.schema ?? {})
    if (param.required && !result[location].required.includes(param.name)) {
      result[location].required.push(param.name)
    }
  }
  for (const key of Object.keys(result)) {
    if (result[key].required.length === 0) delete result[key].required
  }
  return result
}

const schemas = Object.entries(openapi.components?.schemas ?? {}).map(([name, schema]) => ({
  $id: name,
  ...rewriteRefs(schema),
}))

const header = '// Auto-generated from spec/openapi.yaml. Do not edit.'

function emitSchemas() {
  const lines = [header, '', 'export const schemas = [']
  for (const schema of schemas) {
    const body = JSON.stringify(schema, null, 2)
      .split('\n')
      .map((line, index) => (index === 0 ? line : '  ' + line))
      .join('\n')
      .split('\n')
      .map((line) => '  ' + line)
      .join('\n')
    lines.push(body + ',')
  }
  lines.push(']', '')
  return lines.join('\n')
}

// Генерирует регистрацию маршрутов: пути и схемы — из OpenAPI, но хендлеры
// инжектируются снаружи по operationId. Бизнес-логика живёт вне генерации
// (server/handlers.ts + server/store.ts) и переживает регенерацию.
function emitRoutes() {
  const lines = [
    header,
    "import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'",
    '',
    'export type RouteHandler = (request: FastifyRequest, reply: FastifyReply) => unknown',
    'export type RouteHandlers = Record<string, RouteHandler>',
    '',
    'export function registerRoutes(app: FastifyInstance, handlers: RouteHandlers): void {',
  ]
  for (const [routePath, pathItem] of Object.entries(openapi.paths ?? {})) {
    for (const method of HTTP_METHODS) {
      const op = pathItem[method]
      if (!op) continue
      const fastifyPath = routePath.replace(/\{([^}]+)\}/g, ':$1')
      const schema = buildParamSchemas(op.parameters)
      if (op.requestBody?.content?.['application/json']?.schema) {
        schema.body = rewriteRefs(op.requestBody.content['application/json'].schema)
      }
      lines.push(
        `  app.${method}('${fastifyPath}', { schema: ${JSON.stringify(schema)} }, handlers['${op.operationId}'])`,
      )
    }
  }
  lines.push('}', '')
  return lines.join('\n')
}

function emitTypes() {
  return [header, '', "export type * from '../../src/api-client/types.gen'", ''].join('\n')
}

rmSync(resolve(root, 'server/generated'), { recursive: true, force: true })
mkdirSync(resolve(root, 'server/generated'), { recursive: true })
writeFileSync(resolve(root, 'server/generated/schemas.gen.ts'), emitSchemas())
writeFileSync(resolve(root, 'server/generated/routes.gen.ts'), emitRoutes())
writeFileSync(resolve(root, 'server/generated/types.ts'), emitTypes())
console.log('Generated server/generated/{schemas.gen.ts, routes.gen.ts, types.ts}')
