# SPEC 01 — MVP visual de las pantallas de Arcade Vault

> **Estado:** Implemented
> **Depende de:** Ninguno
> **Fecha:** 2026-08-10
> **Objetivo:** Implementar como rutas reales de Next.js App Router la capa visual completa de las cinco pantallas del prototipo (Biblioteca, Detalle, Jugador, Autenticación y Salón de la Fama), fieles al lenguaje visual retro-neón de `references/templates/`, sin lógica de juego real.

## Por qué existe este spec

El directorio `app/` sigue siendo el scaffold sin modificar de `create-next-app`. El diseño real del producto vive como prototipo estático en `references/templates/` (React vía CDN + Babel, sin bundler), documentado en `CLAUDE.md` como la spec de UX/comportamiento a reimplementar de forma idiomática en el App Router — no a portar literalmente (enrutamiento por hash, `localStorage` global, componentes React globales). Este spec traduce ese comportamiento a rutas, componentes y datos reales de Next.js, cubriendo únicamente la capa visual: ninguna pantalla ejecuta lógica de juego real.

## Scope

**In:**

- Layout global (`app/layout.tsx`): `Nav` persistente (barra desktop + panel deslizante móvil) y footer, capas decorativas de fondo (`av-bg`, `av-noise`) y tokens de diseño (fuentes Press Start 2P / JetBrains Mono, paleta neón, efectos CRT/scanline) portados a `app/globals.css` a partir de `references/templates/styles.css`.
- Ruta `/` (Biblioteca): hero, buscador + chips de categoría, grid de tarjetas de juego (`GameCard`) con efecto tilt al hover, estado vacío "NO HAY RESULTADOS".
- Ruta `/detalle/[id]`: layout de dos columnas, tags, descripción larga, stat strip, botones "JUGAR AHORA" y "VOLVER AL VAULT", tabla de mejores puntuaciones generada con el port de `seededScores()`. Id inexistente responde con `notFound()`.
- Ruta `/jugar/[id]`: shell visual CRT/HUD (jugador, puntuación de ejemplo fija, vidas, nivel). Los botones PAUSA/REANUDAR y FIN alternan overlays de estado (pausa, fin de partida) sin generar puntuación real. El modal de fin de partida simula el flujo de guardar puntuación (incluye el toast de confirmación) sin persistir nada.
- Ruta `/auth`: tabs "Iniciar sesión" / "Crear cuenta", botón "Jugar como invitado", formulario que persiste `{ name }` en `localStorage` (`av_user`) y navega a `/`. Sin validación real ni backend; botones sociales (Google/GitHub) decorativos.
- Ruta `/salon`: tabs por juego, podio (top 3), tabla de ranking con el mismo generador seedeado, fila destacada "tu mejor marca" cuando hay sesión activa.
- Datos mock: catálogo `GAMES`, `CATS` y el generador `seededScores()` portados desde `data.jsx` a un módulo de datos TypeScript.
- Persistencia mock de sesión vía `localStorage` (`av_user`), reflejada en `Nav` (nombre de usuario / cerrar sesión) y en Salón de la Fama.
- Diseño responsive replicando los breakpoints del prototipo (840px nav hamburguesa, 900px detalle a una columna, 720px podio/tabla condensados).

**Out of scope (para specs futuros):**

- Cualquier juego real jugable (canvas, iframe, lógica de colisiones/input). `/jugar/[id]` es solo un shell visual.
- Backend o autenticación real: passwords, validación de credenciales, proveedores OAuth reales de Google/GitHub.
- Persistencia real de puntuaciones de usuario (`av_scores`). "GUARDAR PUNTUACIÓN" simula la acción sin escribir en `localStorage`.
- Cualquier lógica de servidor/API externa (fetch remoto, base de datos). Todo el catálogo y los rankings son datos mock estáticos o generados en cliente.
- Tests automatizados (no hay test runner configurado en el repo).

## Data model

Módulo nuevo `lib/games.ts` (resuelto vía el alias `@/lib/games`), traducido de `references/templates/data.jsx`:

```ts
export type Game = {
  id: string; // slug kebab-case, usado como route param
  title: string;
  short: string;
  long: string;
  cat: "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
  cover: string; // clase CSS de portada, ej. "cover-bricks"
  color: "cyan" | "magenta" | "green" | "yellow";
  best: number;
  plays: string; // ej. "12.4K"
};

export const CATS = ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"] as const;

export type ScoreRow = { rank: number; name: string; score: number; date: string };

export function seededScores(seed: number, count?: number): ScoreRow[];
```

Sesión mock en `localStorage`:

- Clave `av_user`: `{ name: string } | null`. Escrita por `/auth` al enviar el formulario o pulsar "Jugar como invitado" (en ese caso `null`), leída por `Nav` y `/salon`.

No se introduce la clave `av_scores`: al no persistir puntuaciones reales (ver Scope), ese dato mock del prototipo no se porta.

## Implementation plan

1. Extender `app/globals.css` con los tokens de diseño (colores, fuentes vía `next/font/google`, capas `av-bg`/`av-noise`, utilidades `.pixel`/`.mono`/`.neon-*`/`.btn`) portados de `styles.css`. Manual test: la página scaffold actual sigue renderizando, ahora con la tipografía y paleta neón aplicadas.
2. Crear `lib/games.ts` con `GAMES`, `CATS` y `seededScores()` portados de `data.jsx`. Manual test: `console.log` o test manual en una ruta temporal confirma que `seededScores(1, 5)` devuelve 5 filas estables entre llamadas.
3. Construir `Nav` (`components/nav.tsx`, client component) con barra desktop + panel móvil, resaltado de ruta activa vía `usePathname()`, y lectura/escritura de `av_user` mediante un hook simple (`useAuth` o similar). Integrarlo en `app/layout.tsx` junto al footer. Manual test: la barra aparece en toda ruta, el hamburguesa abre/cierra el panel por debajo de 840px.
4. Implementar `/` (`app/page.tsx`): hero, filtros (buscador + chips, client component) y grid de `GameCard` con tilt hover, leyendo de `lib/games.ts`. Cada tarjeta enlaza a `/detalle/[id]`. Manual test: filtrar por texto/categoría actualiza el grid en vivo; una búsqueda sin resultados muestra "NO HAY RESULTADOS".
5. Implementar `/detalle/[id]/page.tsx`: layout de dos columnas, stat strip, tabla de ranking vía `seededScores(id)`, botones a `/jugar/[id]` y `/`. `id` no encontrado llama a `notFound()`. Manual test: navegar a un id inexistente muestra la página 404 de Next.js.
6. Implementar `/jugar/[id]/page.tsx` como client component con estado local `paused`/`over`: overlay de pausa, HUD estático, modal de fin de partida con input de nombre y botón "GUARDAR PUNTUACIÓN" que solo muestra el toast de confirmación. "SALIR" vuelve a `/detalle/[id]`. Manual test: alternar PAUSA/REANUDAR muestra y oculta el overlay; FIN abre el modal; guardar no escribe en `localStorage`.
7. Implementar `/auth/page.tsx`: tabs iniciar sesión/crear cuenta, botón invitado, formulario que escribe `av_user` vía el hook de auth y navega a `/`. Manual test: tras enviar el formulario, `Nav` muestra el nombre de usuario; cerrar sesión desde `Nav` lo revierte.
8. Implementar `/salon/page.tsx`: tabs por juego, podio y tabla vía `seededScores()`, fila "tu mejor marca" cuando `av_user` no es `null`. Manual test: cambiar de pestaña regenera podio/tabla; iniciar sesión y volver a Salón muestra la fila destacada.
9. Pasada de QA responsive: verificar los tres breakpoints del prototipo (840px, 900px, 720px) en las cinco rutas sin overflow horizontal.

## Acceptance criteria

- [X] Las cinco rutas (`/`, `/detalle/[id]`, `/jugar/[id]`, `/auth`, `/salon`) renderizan sin errores de consola.
- [X] `Nav` persiste en las cinco rutas, resalta "Biblioteca" como activa también en `/detalle/[id]` y `/jugar/[id]`, y colapsa a panel móvil por debajo de 840px.
- [X] La Biblioteca filtra el grid en vivo por texto y categoría; sin coincidencias muestra "NO HAY RESULTADOS".
- [X] Cada `GameCard` navega a `/detalle/[id]` correspondiente al hacer click en la tarjeta o en "JUGAR".
- [X] Visitar `/detalle/id-inexistente` devuelve la página 404 de Next.js (`notFound()`).
- [X] En `/detalle/[id]`, "JUGAR AHORA" navega a `/jugar/[id]`; "VOLVER AL VAULT" navega a `/`.
- [X] En `/jugar/[id]`, PAUSA muestra el overlay "EN PAUSA" y REANUDAR lo oculta; FIN abre el modal de fin de partida.
- [X] El modal de fin de partida acepta un nombre y, al pulsar "GUARDAR PUNTUACIÓN", muestra el toast de confirmación sin escribir en `localStorage`.
- [X] "JUGAR DE NUEVO" reinicia el estado visual del shell; "VOLVER AL VAULT" navega a `/`.
- [X] En `/auth`, enviar el formulario o pulsar "Jugar como invitado" actualiza `localStorage.av_user`, navega a `/`, y `Nav` refleja el cambio inmediatamente.
- [ ] Cerrar sesión desde `Nav` borra `av_user` y `Nav` vuelve a mostrar "Iniciar Sesión".
- [X] En `/salon`, cambiar de pestaña regenera podio y tabla con `seededScores()`; con sesión activa aparece la fila "tu mejor marca".
- [X] Tipografías, paleta neón, efectos CRT/scanline y portadas CSS por juego son consistentes con `references/templates/styles.css` en las cinco pantallas.
- [X] Ninguna de las cinco rutas produce overflow horizontal en los breakpoints 840px, 900px y 720px.

## Decisions

- **Sí:** `/` actúa como la pantalla Biblioteca. Es el punto de entrada natural de un sitio Next.js; evita un `/biblioteca` redundante con redirect desde la raíz.
- **No:** mantener `app/page.tsx` como scaffold y añadir `/biblioteca` aparte. Duplicaría la ruta home sin beneficio.
- **Sí:** `/jugar/[id]` como shell visual con estado local de pausa/fin de partida (sin `setInterval` de puntuación automática ni juego real). Demuestra la interacción sin implementar un juego.
- **No:** portar el `setInterval` de puntuación automática del prototipo, ni omitir la ruta por completo. Ambas opciones fueron consideradas y descartadas explícitamente por el usuario a favor del punto medio.
- **Sí:** el botón "GUARDAR PUNTUACIÓN" simula el flujo (toast) sin persistir en `localStorage`. No existe una puntuación real que guardar en este MVP.
- **Sí:** portar `seededScores()` tal cual desde `data.jsx` a TypeScript. Mantiene fidelidad total con el prototipo sin inventar datos de ranking a mano.
- **Sí:** replicar la sesión mock vía `localStorage` (`av_user`) igual que el prototipo, sin backend. Es simple y ya está validado como patrón de UX en la spec de comportamiento.
- **Sí:** fidelidad visual total al prototipo (mismos tokens, tipografías, efectos CRT/neón, portadas CSS puras por juego), sin rediseño vía `/frontend-design`. `references/templates/` se acordó como la spec de producto definitiva.
- **No:** clave `av_scores` en `localStorage`. Al no perseguir persistencia real de puntuaciones en este spec, no tiene datos reales que almacenar.

## Risks

| Riesgo                                                                                     | Mitigación                                                                                                   |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Fuentes retro (Press Start 2P, JetBrains Mono) cargadas mal pueden causar layout shift (CLS) | Cargarlas con `next/font/google` en vez de `<link>` manual, como recomienda la documentación de Next.js 16.  |
| Las capas CRT/scanline/noise superpuestas pueden degradar el rendimiento en móviles de gama baja | Usarlas como capas CSS livianas (gradientes/SVG), sin animaciones costosas; revisar con Lighthouse si aparece jank. |
| `seededScores()` debe producir el mismo resultado en servidor y cliente para evitar errores de hidratación | La función es puramente determinística a partir del `seed` (sin `Date.now()`/`Math.random()` reales); verificar que se mantenga así al portarla. |

## Qué **no** está en este spec

- Juegos reales jugables (canvas, iframe, lógica de input/colisiones).
- Autenticación o backend real (passwords, OAuth funcional, validación de credenciales).
- Persistencia real de puntuaciones de usuario (`av_scores`).
- Tests automatizados.

Cada uno de estos, si se aborda, va en su propio spec.
