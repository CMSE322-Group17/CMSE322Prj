'use strict';

/**
 * Custom wishlist routes
 */

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/api/wishlists',
      handler: 'wishlist.find',
      config: {
        policies: ['isAuthenticated']
      },
    },
    {
      method: 'POST',
      path: '/api/wishlists',
      handler: 'wishlist.create',
      config: {
        policies: ['isAuthenticated']
      },
    },
    {
      method: 'DELETE',
      path: '/api/wishlists/:id',
      handler: 'wishlist.delete',
      config: {
        policies: ['isAuthenticated']
      },
    },
  ],
};