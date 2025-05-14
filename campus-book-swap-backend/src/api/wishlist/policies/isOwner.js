'use strict';

/**
 * `isOwner` policy for wishlist items
 * Checks if the current user is the owner of the wishlist item
 */

module.exports = (policyContext, config, { strapi }) => {
  // If it's the find action (getting a list of wishlists), we'll filter by user in the controller
  if (policyContext.request.route.action === 'find') {
    return true;
  }

  const { id } = policyContext.params;
  const user = policyContext.state.user;

  if (!user) {
    return false;
  }

  // For other actions, check if the wishlist item belongs to the user
  if (id) {
    return strapi.entityService.findOne('api::wishlist.wishlist', id, {
      populate: ['user']
    }).then(entity => {
      if (!entity || !entity.user) {
        return false;
      }

      return entity.user.id === user.id;
    });
  }

  return false;
};
