# SPEC 02 — Home (landing) y reubicación de Biblioteca a /biblioteca

> **Estado:** Draft
> **Depende de:** SPEC 01
> **Fecha:** 2026-08-12
> **Objetivo:** Implementar como ruta real de Next.js App Router la nueva pantalla de inicio (landing) de Arcade Vault fiel a `references/home-about/`, moviendo la Biblioteca de `/` a `/biblioteca` para liberar la raíz del sitio.

## Por qué existe este spec

SPEC 01 decidió que `/` fuera la pantalla Biblioteca. La referencia de este spec (`references/home-about/nav.jsx`) trata "Inicio" y "Biblioteca" como enlaces de navegación distintos, lo que exige reabrir esa decisión de ruteo. El usuario confirmó explícitamente mover Biblioteca a `/biblioteca` y convertir `/` en la nueva landing, y dejar fuera la pantalla "Acerca de" (spec futuro).

## Scope

**In:**

- Nueva ruta `/` (Home/landing): hero con siluetas SVG flotantes decorativas, sección "¿Por qué Arcade Vault?" (grid de 4 feature cards con íconos), preview de juegos (mini-rail con los primeros 6 de `GAMES`, enlazando a `/detalle/[id]`), sección de stats (bloques estáticos "12+ JUEGOS", "MILES DE PARTIDAS", "GLOBAL RANKING"), sección "Actividad en vivo" (ticker de puntuaciones recientes + top 5 jugadores del día, datos estáticos de ejemplo tal cual el prototipo, con link "VER SALÓN" a `/salon`), sección de precios (card único "JUGADOR VAULT · $0/SIEMPRE" + FAQ de 3 preguntas, CTA a `/auth`), CTA final (a `/biblioteca`). Incluye animaciones reveal-on-scroll (IntersectionObserver) y las siluetas flotantes decorativas del prototipo.
- Reubicar la Biblioteca actual de `/` a `/biblioteca` (mover `app/page.tsx` → `app/biblioteca/page.tsx` sin cambios de contenido).
- Actualizar los 6 puntos del código que hoy asumen que `/` es la Biblioteca, para que apunten a `/biblioteca`: `components/nav.tsx` (lógica de estado activo y links), `app/salon/page.tsx` (botón "VOLVER A LA BIBLIOTECA"), `app/detalle/[id]/page.tsx` (botón "VOLVER AL VAULT"), `app/auth/page.tsx` (redirects tras login y tras "jugar como invitado"), `components/game-player-shell.tsx` (botón "VOLVER AL VAULT" tras fin de partida).
- Agregar el link "Inicio" al `Nav` (barra desktop + panel móvil), apuntando a `/`, resaltado como activo solo cuando `pathname === "/"`. El logo del Nav sigue apuntando a `/` (ahora Home).
- Portar únicamente los bloques de CSS de `references/home-about/styles.css` que usan las secciones del Home — HOME PAGE, ACTIVITY (ticker/top-list) y PRICING — hacia `app/globals.css`.
- Nuevos componentes: componente Home como client component (necesario por el hook de reveal-on-scroll vía `IntersectionObserver`), siluetas flotantes decorativas, íconos de features (GAMEPAD/FREE/TROPHY/ROCKET), y una mini-card de juego para el preview rail (distinta del `GameCard` existente de la Biblioteca).

**Out of scope (para specs futuros):**

- La pantalla "Acerca de" (`about.jsx`) y su formulario de contacto. El link "Acerca de" **no** se agrega al Nav en este spec, para evitar un enlace muerto.
- Cualquier dato real/dinámico para la sección "Actividad en vivo" del Home (p. ej. vía `seededScores()`). Se mantiene estática/decorativa tal cual el prototipo.
- Redirección automática o alias de la antigua `/` (Biblioteca) hacia `/biblioteca`. No aplica: el sitio no tiene usuarios en producción todavía.
- Rediseño visual vía `/frontend-design`. Se mantiene fidelidad total al prototipo, mismo criterio acordado en SPEC 01.
- El bloque de CSS "GAMEPAD" presente en `references/home-about/styles.css` (controles tipo joystick/botones A-B). No lo usa ninguna sección del Home; parece pertenecer a un futuro rediseño del reproductor, fuera de este spec.
- Juegos reales jugables, backend, autenticación real y persistencia real de puntuaciones (sigue sin abordarse, igual que en SPEC 01).

## Data model

Este spec no introduce estructuras de datos persistentes nuevas. Reutiliza `Game` y `GAMES` de `lib/games.ts` (SPEC 01) para la sección de preview de juegos. Los datos de "Actividad en vivo" (ticker de puntuaciones + top jugadores) son arrays literales estáticos definidos junto al componente Home, sin tipo exportado ni persistencia — igual que en `references/home-about/home.jsx`.

## Implementation plan

1. Mover `app/page.tsx` → `app/biblioteca/page.tsx` sin cambios de contenido. Test manual: `/biblioteca` renderiza la Biblioteca igual que antes.
2. Actualizar los 5 archivos que enlazan a `"/"` asumiendo que es la Biblioteca (`app/salon/page.tsx`, `app/detalle/[id]/page.tsx`, `app/auth/page.tsx` ×2, `components/game-player-shell.tsx`) para que apunten a `"/biblioteca"`. Test manual: desde Detalle, Salón, Auth (login e invitado) y fin de partida, cada botón regresa a `/biblioteca`.
3. Actualizar `components/nav.tsx`: agregar el link "Inicio" → `/` (desktop + móvil), cambiar el link "Biblioteca" para apuntar a `/biblioteca`, y separar la lógica de estado activo en `isHome` (`pathname === "/"`) e `isBiblioteca` (`pathname === "/biblioteca"` o empieza con `/detalle` o `/jugar`). Test manual: en cada una de las 6 rutas del sitio, el Nav resalta el link correcto.
4. Extender `app/globals.css` con los bloques CSS de HOME PAGE, ACTIVITY y PRICING portados de `references/home-about/styles.css`. Test manual: no hay regresiones visuales en las pantallas existentes.
5. Crear un módulo (p. ej. `lib/home-activity.ts`) con los arrays estáticos de ticker/top-jugadores portados literalmente de `home.jsx`. Test manual: los datos coinciden con los del prototipo.
6. Implementar el nuevo `app/page.tsx` (Home, client component) con: hero + siluetas flotantes + CTAs, hook de reveal-on-scroll, sección de features (4 cards + íconos SVG), preview de juegos (`GAMES.slice(0, 6)` vía mini-card, enlazando a `/detalle/[id]`), sección de stats, sección de actividad en vivo (desde el módulo del paso 5, con link "VER SALÓN" a `/salon`), sección de precios (card + FAQ, CTA a `/auth`), CTA final (a `/biblioteca`). Test manual: recorrer el scroll completo, cada sección aparece con la animación reveal, todos los CTAs navegan a su ruta correspondiente.
7. Pasada de QA responsive del nuevo Home en los breakpoints usados por sus secciones (1100px, 980px, 900px, 720px, 600px, 520px) sin overflow horizontal.

## Acceptance criteria

- [ ] `/` renderiza el nuevo Home (hero, features, preview de juegos, stats, actividad en vivo, precios, CTA final) sin errores de consola.
- [ ] `/biblioteca` renderiza exactamente el mismo contenido que antes tenía `/`.
- [ ] El Nav muestra "Inicio", "Biblioteca" y "Salón de la Fama"; "Inicio" se resalta como activo solo en `/`; "Biblioteca" se resalta activo en `/biblioteca`, `/detalle/[id]` y `/jugar/[id]`.
- [ ] El logo del Nav navega a `/`.
- [ ] Los botones "VOLVER AL VAULT" (Detalle y fin de partida en Jugador) y "VOLVER A LA BIBLIOTECA" (Salón) navegan a `/biblioteca`.
- [ ] Iniciar sesión, crear cuenta y "Jugar como invitado" en `/auth` navegan a `/biblioteca` tras completarse.
- [ ] En el Home, cada una de las 6 mini-cards de "JUEGOS DISPONIBLES AHORA" navega al `/detalle/[id]` correspondiente; "VER TODOS LOS JUEGOS" navega a `/biblioteca`.
- [ ] En el Home, "VER SALÓN" navega a `/salon`; el botón de precios navega a `/auth` y el CTA final navega a `/biblioteca`.
- [ ] Las secciones con la clase `reveal` aparecen con la animación de fade/slide al hacer scroll hasta ellas.
- [ ] No hay overflow horizontal en el Home en ninguno de los breakpoints usados por sus secciones.
- [ ] Ningún link "Acerca de" aparece en el Nav en este spec.

## Decisions

- **Sí:** mover Biblioteca de `/` a `/biblioteca` y hacer que `/` sea el nuevo Home. Decisión explícita del usuario; sigue el patrón de nav de la referencia, donde Inicio y Biblioteca son secciones distintas.
- **No:** mantener `/` como Biblioteca y ubicar Home en otra ruta (p. ej. `/inicio`). Descartado por el usuario a favor de la estructura convencional landing (`/`) + app (`/biblioteca`).
- **Sí:** la pantalla "Acerca de" queda fuera de este spec. Decisión explícita del usuario; por eso tampoco se agrega su link al Nav (evita un enlace muerto).
- **Sí:** los datos de "Actividad en vivo" del Home son estáticos, portados tal cual del prototipo, sin conectarlos a `seededScores()`. Decisión explícita del usuario: es contenido decorativo de marketing, no un ranking real.
- **No:** redirigir automáticamente la antigua `/`. No aplica, el sitio no tiene usuarios reales todavía.
- **Sí:** fidelidad visual total al prototipo, sin pasar por `/frontend-design`. Mismo criterio ya acordado en SPEC 01; `references/` sigue siendo la spec de producto definitiva.
- **Sí:** portar solo los bloques CSS de `home-about/styles.css` usados por Home (HOME PAGE, ACTIVITY, PRICING), excluyendo ABOUT PAGE y GAMEPAD. Ninguno de los dos es usado por el Home y su alcance no fue confirmado por el usuario.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Mover Biblioteca de `/` a `/biblioteca` puede dejar enlaces externos/bookmarks rotos | Aceptado explícitamente: el sitio no tiene usuarios en producción todavía. |
| El Home mezcla contenido mayormente estático con comportamiento de cliente (reveal-on-scroll) | Marcar el componente Home como `"use client"`, siguiendo el mismo patrón ya usado en `components/library-browser.tsx`. |
| Los bloques CSS de ACTIVITY/PRICING podrían colisionar con clases ya existentes en `globals.css` | Revisar que ninguna clase (`.tick-row`, `.top-row`, `.price-card`, etc.) esté ya definida antes de agregar el bloque. |

## Qué **no** está en este spec

- Pantalla "Acerca de" y su formulario de contacto.
- Datos reales/dinámicos para la sección "Actividad en vivo" del Home.
- Redirección o alias de la antigua ruta `/` (Biblioteca).
- Rediseño visual vía `/frontend-design`.
- Bloque de CSS "GAMEPAD" (controles tipo joystick).
- Juegos reales jugables, backend, autenticación real, persistencia real de puntuaciones.

Cada uno de estos, si se aborda, va en su propio spec.
