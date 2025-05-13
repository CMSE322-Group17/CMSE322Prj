/**
 * wishlist controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::wishlist.wishlist', ({ strapi }) => ({
  // Create a wishlist entry for the authenticated user
  async create(ctx) {
    const userId = ctx.state.user?.id;
    const { book } = ctx.request.body.data || {};

    if (!userId || !book) {
      return ctx.badRequest('Missing user ID or book ID');
    }

    const entity = await strapi.service('api::wishlist.wishlist').create({
      data: { book, user: userId },
    });

    const sanitized = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitized);
  },

  // Get wishlist entries for the authenticated user, with book populated
  async find(ctx) {
    const userId = ctx.state.user?.id;
    if (!userId) {
      return ctx.badRequest('User ID is required');
    }

    // Filter by current user and populate book
    ctx.query = {
      ...ctx.query,
      filters: {
        ...(ctx.query.filters || {}),
        user: { id: userId },
      },
      populate: ['book'],
    };

    const { data, meta } = await super.find(ctx);
    return { data, meta };
  },

  // Delete a wishlist entry only if it belongs to the authenticated user
  async delete(ctx) {
    const { id } = ctx.params;
    const userId = ctx.state.user?.id;

    const entry = await strapi.entityService.findOne('api::wishlist.wishlist', id, {
      populate: ['user'],
    });
    if (!entry) {
      return ctx.notFound('Wishlist item not found');
    }
    if (entry.user?.id !== userId) {
      return ctx.unauthorized('You can only remove your own wishlist items');
    }

    const entity = await strapi.service('api::wishlist.wishlist').delete(id);
    const sanitized = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitized);
  },
}));
