import type { Preview } from '@storybook/nextjs-vite';
import ToastViewport from '@/components/shared/ToastViewport';
import '../app/globals.css';

const preview: Preview = {
  parameters: {
    nextjs: { appDirectory: true },
    a11y: { test: 'error' },
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-mt-bg p-6 text-mt-text-primary">
        <Story />
        <ToastViewport />
      </div>
    ),
  ],
};

export default preview;
