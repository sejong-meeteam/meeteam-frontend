import { defineConfig } from 'cypress';

export default defineConfig({
  video: false,
  screenshotOnRunFailure: true,
  viewportWidth: 1280,
  viewportHeight: 900,
  defaultCommandTimeout: 15000,
  requestTimeout: 15000,
  pageLoadTimeout: 90000,
  retries: 0,
  allowCypressEnv: false,
  e2e: {
    baseUrl: 'http://127.0.0.1:3005',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    testIsolation: true,
    setupNodeEvents(on) {
      on('task', {
        reportA11y(messages) {
          console.log(JSON.stringify(messages, null, 2));
          return null;
        },
      });
    },
  },
});
