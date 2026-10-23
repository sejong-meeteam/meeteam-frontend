// Storybook 10.2 injects this runtime with a root URL even when Vite base is './'.
// Keep the runtime alongside iframe.html when publishing under /storybook.
export function toRelativeRuntimePath(html: string) {
  return html.replaceAll(
    'src="/vite-inject-mocker-entry.js"',
    'src="./vite-inject-mocker-entry.js"',
  );
}
