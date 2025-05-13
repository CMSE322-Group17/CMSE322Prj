'use strict';

/**
 * Global policies file
 */

module.exports = {
  isAuthenticated: (policyContext, config, { strapi }) => {
    // Check if the user is authenticated
    if (policyContext.state.user) {
      // Go to next policy or controller
      return true;
    }

    return policyContext.unauthorized('You must be logged in to access this resource.');
  },
};