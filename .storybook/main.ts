import type { StorybookConfig } from '@storybook/nextjs-vite';
import { toRelativeRuntimePath } from './staticPaths';

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: '@storybook/nextjs-vite',
  // Do not copy public/storybook back into itself on subsequent deployment builds.
  staticDirs: [
    { from: '../public/brand', to: '/brand' },
    { from: '../public/universities', to: '/universities' },
  ],
  async viteFinal(config) {
    return {
      ...config,
      publicDir: false,
      base: './',
      plugins: [
        ...(config.plugins ?? []),
        {
          name: 'meeteam-storybook-relative-runtime',
          apply: 'build',
          transformIndexHtml: { order: 'post', handler: toRelativeRuntimePath },
        },
      ],
    };
  },
};

export default config;
