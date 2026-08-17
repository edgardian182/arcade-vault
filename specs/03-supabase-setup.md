# SPEC 03 — Conexión de Supabase al proyecto Next.js

> **Estado:** Implemented
> **Depende de:** Ninguno
> **Fecha:** 2026-08-17
> **Objetivo:** Conectar el proyecto Next.js de Arcade Vault al proyecto Supabase ya existente, dejando instalados los clientes oficiales y helpers reutilizables de conexión, sin migrar aún ninguna funcionalidad mock.

## Por qué existe este spec

El repo no tiene ninguna dependencia de Supabase instalada ni carpeta `supabase/`, pero ya existe un proyecto Supabase vinculado a esta sesión vía MCP (`https://ybfrpthdrttjigpcozpt.supabase.co`), con el esquema `public` vacío. Además, `env.local` (sin punto inicial, por lo que **no** cae bajo el patrón `.env*` de `.gitignore`) está trackeado en git y contiene `SUPABASE_DB_PASS` en texto plano. Este spec resuelve ambos puntos como trabajo de infraestructura puro: deja el proyecto listo para que specs futuros construyan autenticación real y persistencia de datos sobre Supabase, sin tocar todavía ninguna de las funcionalidades mock existentes (`av_user` en `localStorage`, `lib/games.ts`).

## Scope

**In:**

- Instalar `@supabase/ssr` y `@supabase/supabase-js` como dependencias del proyecto (vía `npm`, coherente con el `package-lock.json` existente).
- Crear `lib/supabase/client.ts`: un `createClient()` para Client Components, usando `createBrowserClient` de `@supabase/ssr`.
- Crear `lib/supabase/server.ts`: un `createClient()` async para Server Components y Route Handlers, usando `createServerClient` de `@supabase/ssr` y leyendo/escribiendo cookies vía `cookies()` de `next/headers` (`await`, ya que es async-only en Next.js 16).
- Crear `.env.local` (nuevo archivo, cubierto por el patrón `.env*` ya presente en `.gitignore`) con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, apuntando al proyecto ya conectado vía MCP y usando su publishable key moderna (`sb_publishable_...`).
- Crear `.env.example` (trackeado) documentando esas mismas dos claves sin valores reales.
- Quitar `env.local` (el archivo sin punto, hoy trackeado) del control de versiones, junto con el secreto `SUPABASE_DB_PASS` que contiene.
- Verificación manual puntual de que el cliente conecta correctamente (ej. una consulta trivial ejecutada temporalmente durante la implementación), retirando ese código antes de comitear. No se deja ninguna ruta ni endpoint de debug en el repo.

**Out of scope (para specs futuros):**

- Migrar la sesión mock `av_user` (`localStorage`) a Supabase Auth real.
- Migrar el catálogo de juegos (`lib/games.ts`) o los scores/`seededScores()` a tablas reales de Supabase.
- Crear `proxy.ts` (middleware de refresco de sesión de `@supabase/ssr`, reemplazo de `middleware.ts` en Next.js 16). No aplica todavía porque no hay auth real en este spec; se agrega junto con la migración de autenticación.
- Crear cualquier tabla, esquema o política RLS en la base de datos. El esquema `public` permanece vacío al finalizar este spec.
- Conservar o reutilizar `SUPABASE_DB_PASS` para uso futuro (CLI, migraciones). Descartado explícitamente por decisión del usuario.
- Crear un proyecto Supabase nuevo. Se usa el proyecto ya existente y conectado vía MCP.
- Purgar `SUPABASE_DB_PASS` del historial de git de commits anteriores (ver Risks). Es una operación destructiva (reescritura de historial) que requiere autorización explícita aparte.

## Data model

Este spec no introduce estructuras de datos ni tablas nuevas en Supabase. El esquema `public` del proyecto permanece vacío al finalizar; solo se agregan helpers de conexión de cliente y servidor.

## Implementation plan

1. Quitar `env.local` del tracking de git (`git rm --cached env.local`) y agregarlo explícitamente al `.gitignore` por nombre exacto (el patrón `.env*` no lo cubre por no tener punto inicial). Test manual: `git status` ya no lo muestra como trackeado tras el commit.
2. Crear `.env.local` (nuevo, ignorado por el patrón `.env*` ya existente) con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Crear `.env.example` con las mismas claves sin valores. Test manual: `git status` no muestra `.env.local` como pendiente de commit, pero sí muestra `.env.example`.
3. Instalar `@supabase/ssr` y `@supabase/supabase-js` vía `npm`. Test manual: `npm run build` sigue completando sin errores.
4. Crear `lib/supabase/client.ts` con `createClient()` usando `createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)`. Test manual: el archivo compila sin errores de TypeScript.
5. Crear `lib/supabase/server.ts` con un `createClient()` async usando `createServerClient()` de `@supabase/ssr`, leyendo cookies vía `await cookies()` de `next/headers`. Test manual: compila sin errores de TypeScript.
6. Verificar la conexión de forma manual y puntual: agregar temporalmente una llamada (ej. `await supabase.auth.getSession()` o un `select` trivial) en un Server Component o script, confirmar en la terminal que no hay error de red/autenticación, y retirar ese código antes de comitear. Test manual: la terminal no muestra errores de conexión durante esa prueba.

## Acceptance criteria

- [ ] `env.local` ya no aparece en `git ls-files` ni contiene `SUPABASE_DB_PASS` trackeado desde este commit en adelante.
- [ ] `.env.local` existe localmente con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, y no aparece en `git status` (está ignorado).
- [ ] `.env.example` existe, está trackeado en git, y documenta esas mismas claves sin valores reales.
- [ ] `@supabase/ssr` y `@supabase/supabase-js` aparecen en `package.json` como dependencias.
- [ ] `lib/supabase/client.ts` exporta un `createClient()` funcional para Client Components.
- [ ] `lib/supabase/server.ts` exporta un `createClient()` async funcional para Server Components/Route Handlers, sin errores de TypeScript.
- [ ] `npm run build` completa sin errores tras los cambios.
- [ ] Durante la implementación se confirmó manualmente (sin dejar código en el repo) que el cliente conecta al proyecto Supabase sin errores.
- [ ] No se agregó ninguna tabla, política RLS ni endpoint de debug al repo como parte de este spec.

## Decisions

- **Sí:** alcance limitado a infraestructura (cliente + variables de entorno + helpers), sin migrar auth ni datos. Decisión explícita del usuario; sigue el patrón de este repo de dividir specs por dominio (igual que SPEC 02 separó Home de Biblioteca).
- **No:** migrar `av_user` o el catálogo de juegos a Supabase en este spec. Descartado a favor de specs futuros dedicados.
- **Sí:** usar `@supabase/ssr` + `@supabase/supabase-js` en vez de un único cliente de `supabase-js`. Es el patrón oficial recomendado por Supabase para Next.js App Router y deja el camino listo para SSR/Server Components sin retrabajo.
- **Sí:** usar el proyecto Supabase ya conectado vía MCP (`https://ybfrpthdrttjigpcozpt.supabase.co`, esquema `public` vacío) en vez de crear uno nuevo. Ya está disponible y vinculado a esta sesión.
- **Sí:** usar la publishable key moderna (`sb_publishable_...`) en vez de la anon key legacy. Es la recomendación actual de Supabase para proyectos nuevos.
- **No:** crear `proxy.ts` (middleware de refresco de sesión) en este spec. No aplica porque no hay auth real todavía; se agrega junto con la migración de autenticación.
- **Sí:** sacar `env.local` del tracking de git y no conservar `SUPABASE_DB_PASS`. Decisión explícita del usuario: el secreto no se usa en este spec (no hay migraciones SQL) y no debe permanecer expuesto en código nuevo.
- **No:** dejar una ruta de debug o endpoint de verificación de conexión en el repo. Decisión explícita del usuario: la verificación es puntual durante la implementación, no un artefacto permanente.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| `SUPABASE_DB_PASS` ya está en el historial de git de commits anteriores (commit `27007b8`), no solo en el árbol actual | Sacarlo del tracking futuro evita nuevas exposiciones, pero no purga el historial existente. Purgar el historial (rebase/filter-repo) o rotar la contraseña en Supabase queda explícitamente fuera de este spec (ver Scope) y requiere autorización aparte del usuario. |
| `cookies()` de `next/headers` es async-only en Next.js 16; un helper de servidor mal implementado puede romper en build o runtime | Seguir la guía oficial de `@supabase/ssr` para Next.js App Router y consultar `node_modules/next/dist/docs/` antes de escribir `server.ts`, como indica `AGENTS.md`. |
| La publishable key moderna (`sb_publishable_...`) es relativamente nueva; alguna versión de `@supabase/ssr` podría no reconocerla igual que la anon key legacy | Verificar que la versión instalada de `@supabase/ssr` soporta `sb_publishable_...`; si no, usar la anon key legacy como fallback documentado en esta misma sección de Decisions. |

## Qué **no** está en este spec

- Migración de la sesión mock `av_user` a Supabase Auth real.
- Migración del catálogo de juegos o scores a tablas reales de Supabase.
- `proxy.ts` / middleware de refresco de sesión.
- Cualquier tabla, esquema o política RLS.
- Conservación de `SUPABASE_DB_PASS`.
- Creación de un proyecto Supabase nuevo.
- Purga del historial de git.

Cada uno de estos, si se aborda, va en su propio spec.
