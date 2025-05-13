'use strict';

/**
 * wishlist router
 */

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/wishlists', // Changed from /api/wishlists
      handler: 'wishlist.find',
      config: {
        policies: ['plugins::users-permissions.isAuthenticated'],
      },
    },
    {
      method: 'POST',
      path: '/wishlists', // Changed from /api/wishlists
      handler: 'wishlist.create',
      config: {
        policies: ['plugins::users-permissions.isAuthenticated'],
      },
    },
    {
      method: 'DELETE',
      path: '/wishlists/:id', // Changed from /api/wishlists/:id
      handler: 'wishlist.delete',
      config: {
        policies: ['plugins::users-permissions.isAuthenticated'],
      },
    },
  ],
};
