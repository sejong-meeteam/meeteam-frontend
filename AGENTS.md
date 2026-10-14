# Copilot Instructions

## Project Overview

- This project is the meeTeam frontend.
- The application is built with Next.js App Router and TypeScript.

## Tech Stack Rules

- Use the existing project stack and conventions:
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- Zustand for global state management
- Zod for input validation
- ESLint
- Prettier

## Formatting Rules

- Follow Prettier formatting rules.
- Respect the workspace formatting settings in `.vscode/settings.json`.
- If input validation is needed, use Zod rather than ad-hoc validation logic.

## Project Structure Rules

- Keep routing-related code in `app/`.
- Put domain-specific UI in `components/features`.
- Put reusable UI primitives in `components/shared`.
- Put shared types in `types/`.
- Put mock API handlers and mock data in `mocks/`.
- Put shared Zustand stores in `stores/`.
- Put shared Zod schemas in `schemas/`.
- For domain-specific state, prefer `components/features/{domain}/store.ts`.
- For domain-specific Zod schemas, prefer `components/features/{domain}/schema.ts`.
- Use `public/` for assets accessed by URL.
- Use `assets/` for assets imported into components.

## Domain Rules

- Follow the existing domain split:
- `auth`
- `project`
- `profile`
- `team`
- `notification`
- Keep new files under the appropriate domain whenever possible.

## Naming Rules

- Use `PascalCase` for component filenames and component names.
- In `app/**/page.tsx`, keep the default export component name as `Page`.
- Prefer exporting components/functions inline with their declaration.
- Use `camelCase` with the `use` prefix for hooks.
- Use `UPPER_SNAKE_CASE` for constants.

## Responsive Rules

- Avoid fixed widths when a flexible layout is possible.
- Prefer `w-full` with an appropriate `max-w-*` constraint.
- Keep images and media responsive with shrinking behavior preserved.
- For page layouts, follow the existing `section` + spacing patterns already used in this project.

## Design Token Rules

- Always use color tokens defined in [app/globals.css](../app/globals.css) `@theme` block.
- Prefer semantic token classes such as `text-text-black`, `text-text-gray`, `border-border-gray`, `bg-white`, `text-brand-500`.
- Do not use hard-coded color values directly in code (`#hex`, `rgb()`, `rgba()`, `hsl()`, `hsla()`).
- Do not use Tailwind arbitrary color values like `text-[#xxxxxx]`, `bg-[#xxxxxx]`, `border-[#xxxxxx]`, `fill-[#xxxxxx]`, `stroke-[#xxxxxx]`.
- If a required color token does not exist, add it to [app/globals.css](../app/globals.css) first, then use the token class.
- Apply the same rule when creating or refactoring components.

## Size Rules

- Prefer Tailwind's predefined spacing/size/typography scale first (for example: `h-10`, `px-4`, `gap-2`, `text-sm`, `rounded-md`).
- Avoid hard-coded size values such as `px`, `rem`, `em` in arbitrary classes (for example: `h-[60px]`, `px-[21px]`, `text-[14px]`, `rounded-[4px]`).
- Use arbitrary size values only when no equivalent Tailwind scale value exists and the exception is explicitly required by design.
- When a similar predefined class exists, always choose the predefined class.

## Icon Rules

- Use `lucide-react` for all icons by default.
- Do not add or use custom SVG icon files or inline `<svg>` icons unless explicitly requested.
- Keep icon stroke and size consistent with adjacent UI elements (for example: `h-4 w-4`, `strokeWidth={1.8}` or `2`).
- Prefer storing icons as SVG assets when that is the established project requirement or the user explicitly wants SVG-based icons.

## Figma Implementation Rules

- Prefer existing shared components before creating new screen-specific components.
- Reuse and extend common components in `components/shared` whenever possible to maintain consistency across the product.
- When implementing a screen from Figma, match the Figma design as perfectly as possible.
- If a Figma node contains child nodes, inspect and reflect those child nodes as well instead of implementing only the top-level container.
- Reproduce layout, spacing, typography, border radius, icon placement, and component states to match the Figma source exactly.
- If the current design tokens or component primitives are insufficient to match the Figma design, update the appropriate tokens or shared components first, then implement the screen.

## Validation Rules

- Do not run `npm run build` by default; the user will run the project build verification directly.
- When implementation work is complete, summarize what changed and mention any lighter checks that were run.
