'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::wishlist.wishlist', ({ strapi }) => ({
  async create(ctx) {
    try {
      const userId = ctx.state.user.id;
      // Strapi REST POST body format: { data: { book: id } }
      const { book } = ctx.request.body.data || {};

      if (!userId || !book) {
        return ctx.badRequest('Missing user ID or book ID');
      }

      const entity = await strapi.service('api::wishlist.wishlist').create({
        data: { book, user: userId }
      });

      const sanitized = await this.sanitizeOutput(entity, ctx);
      return this.transformResponse(sanitized);
    } catch (error) {
      return ctx.badRequest('Unable to add to wishlist');
    }
  },

  async find(ctx) {
    try {
      const { id } = ctx.state.user;
      
      if (!id) {
        return ctx.badRequest('User ID is required');
      }

      ctx.query = {
        ...ctx.query,
        filters: {
          ...(ctx.query.filters || {}),
          user: {
            id: id
          }
        },
        populate: {
          book: true
        }
      };

      const { data, meta } = await super.find(ctx);
      return { data, meta };
    } catch (error) {
      ctx.body = error;
      return ctx.badRequest('Unable to fetch wishlist');
    }
  },

  async delete(ctx) {
    try {
      const { id } = ctx.params;
      const userId = ctx.state.user.id;

      const entry = await strapi.entityService.findOne('api::wishlist.wishlist', id, {
        populate: ['user']
      });
      
      if (!entry) {
        return ctx.notFound('Wishlist item not found.');
      }

      if (entry.user.id !== userId) {
        return ctx.unauthorized('You can only remove your own wishlist items.');
      }

      const entity = await strapi.service('api::wishlist.wishlist').delete(id);
      const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
      return this.transformResponse(sanitizedEntity);
    } catch (error) {
      ctx.body = error;
      return ctx.badRequest('Unable to delete wishlist item.');
    }
  },
}));
