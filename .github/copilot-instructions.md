# Copilot Instructions

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

## Validation Rules

- Do not run `npm run build` by default; the user will run the project build verification directly.
- When implementation work is complete, summarize what changed and mention any lighter checks that were run.
