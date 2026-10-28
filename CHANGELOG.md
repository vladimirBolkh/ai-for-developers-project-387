# Changelog

## [1.3.0](https://github.com/vladimirBolkh/ai-for-developers-project-387/compare/v1.2.0...v1.3.0) (2026-10-28)


### Features

* add engineering agent skills from project 386 ([b0f2788](https://github.com/vladimirBolkh/ai-for-developers-project-387/commit/b0f2788afb2b8339d3b3384b36d85499eef0dc90))

## [1.2.0](https://github.com/vladimirBolkh/ai-for-developers-project-386/compare/v1.1.0...v1.2.0) (2026-10-21)


### Features

* **book:** add a date calendar that filters the slot list ([4270417](https://github.com/vladimirBolkh/ai-for-developers-project-386/commit/427041730a0d2d4c9882eb2a3dad0afba1551148))
* **book:** month calendar fills its block, block size floored by calendar ([98a3355](https://github.com/vladimirBolkh/ai-for-developers-project-386/commit/98a335535e5473a2a54a48e2ca75f0b1c8c3ecb7))
* **book:** scroll slot list to first available slot ([1e60253](https://github.com/vladimirBolkh/ai-for-developers-project-386/commit/1e60253e7e2b888e43a8c9dd3a1b6dcfc4659e28))
* **book:** three-column layout with month calendar and slot statuses ([e11d6f3](https://github.com/vladimirBolkh/ai-for-developers-project-386/commit/e11d6f37bdabc91a11dceddc249e749e47bf69b1))
* **owner:** add owner surface with event-type CRUD ([97ce4d0](https://github.com/vladimirBolkh/ai-for-developers-project-386/commit/97ce4d07cfd62adfd53c694b7ab8c8236e97d87b))
* **owner:** add upcoming meetings list page ([1dd4d85](https://github.com/vladimirBolkh/ai-for-developers-project-386/commit/1dd4d856c50f0cdb51964a2bdf46e3abce11e347))
* **owner:** add working-hours editor ([fc61473](https://github.com/vladimirBolkh/ai-for-developers-project-386/commit/fc61473befdd2adc221b96ba3e446a8eccba1278))
* **owner:** dashboard with type/hours summary and upcoming meetings block ([7cb8b7b](https://github.com/vladimirBolkh/ai-for-developers-project-386/commit/7cb8b7ba534c6c748b55c345b3e67dcd759a2266))
* **server:** implement in-memory Fastify backend with real handlers ([fc7f755](https://github.com/vladimirBolkh/ai-for-developers-project-386/commit/fc7f755d7890e4017f115b379dc135bbd232844f))
* **ui:** global header, owner terminal rename, two-column home page ([66fcd87](https://github.com/vladimirBolkh/ai-for-developers-project-386/commit/66fcd877b8678593d0f6c885f63b0d5da51e80ff))


### Bug Fixes

* **app:** don't white-screen when API returns non-array ([178a93f](https://github.com/vladimirBolkh/ai-for-developers-project-386/commit/178a93f161a2dd8e555fdedfead5207d76fb21bb))
* **book:** distinguish validation from other booking errors ([93a1aaf](https://github.com/vladimirBolkh/ai-for-developers-project-386/commit/93a1aaf5fe53a7c9e4dd04566f8ba4a804d31546))
* **owner:** enforce 15-min step and handle hours load errors ([9c24e10](https://github.com/vladimirBolkh/ai-for-developers-project-386/commit/9c24e10249e2aabbff756b2e60163d9e0ddedf69))
* **server:** translate OpenAPI nullable to JSON Schema for ajv ([00237e2](https://github.com/vladimirBolkh/ai-for-developers-project-386/commit/00237e287a1b602c44051e3ddacc29718217ee77))
* **ui:** display slot times in the user's local timezone ([b7837bc](https://github.com/vladimirBolkh/ai-for-developers-project-386/commit/b7837bc16b2de958ba2d581e33e71318bc75a718))

## [1.1.0](https://github.com/vladimirBolkh/ai-for-developers-project-386/compare/v1.0.0...v1.1.0) (2026-10-20)


### Features

* **api:** add TypeSpec contract with generated OpenAPI and heyapi client ([f987614](https://github.com/vladimirBolkh/ai-for-developers-project-386/commit/f987614b968df896cc98ae9280a95ca18257493e))
* **api:** wire generated SDK into frontend and add Fastify server artifacts ([0acde7e](https://github.com/vladimirBolkh/ai-for-developers-project-386/commit/0acde7e155bdf26f916030324e9bb8b90b8150aa))
* **book:** confirm booking with guest details ([5161e62](https://github.com/vladimirBolkh/ai-for-developers-project-386/commit/5161e62824d55a66773ce9505a03d429c142c12a))
* **book:** list and select event types on booking page ([f464564](https://github.com/vladimirBolkh/ai-for-developers-project-386/commit/f464564377b3cef718fb50db95dfd078c67374b6))
* **book:** pick a time slot from availability ([fb0bd9c](https://github.com/vladimirBolkh/ai-for-developers-project-386/commit/fb0bd9ce17d1e43bc5ec357a6d4c96b585ea9e0d))
* **landing:** add home page with routing to booking stub ([1539eed](https://github.com/vladimirBolkh/ai-for-developers-project-386/commit/1539eedfe664b06a2b0230aa784ce7955cc529f9))
* **landing:** add home page with routing to booking stub ([0066df4](https://github.com/vladimirBolkh/ai-for-developers-project-386/commit/0066df494fce6701d6627607dac0a12b0efe7221))
* **ui:** add gradient page background and hero title ([445cad4](https://github.com/vladimirBolkh/ai-for-developers-project-386/commit/445cad48f335554489aef4c82ba0a49db1283ff4))


### Bug Fixes

* **book:** fall back to empty state when loading event types fails ([dc43506](https://github.com/vladimirBolkh/ai-for-developers-project-386/commit/dc4350628d8937a8f0480808340eeb6f78d2afaf))

## 1.0.0 (2026-10-17)


### Features

* scaffold Vite + React + Mantine app with lint, tests and commit hooks ([c114b2e](https://github.com/vladimirBolkh/ai-for-developers-project-386/commit/c114b2e5d2b638253bd119fe04c8c0f3be189b85))
