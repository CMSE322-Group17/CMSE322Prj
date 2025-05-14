import { initializeWebSocket } from './websockets/socket-server';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register() {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }) {
    // Ensure httpServer is available before initializing WebSockets
    if (strapi.server && strapi.server.httpServer) {
      initializeWebSocket(strapi.server.httpServer);
    } else {
      strapi.log.error('HTTP server is not available, WebSocket server cannot be started.');
    }
  },
};
