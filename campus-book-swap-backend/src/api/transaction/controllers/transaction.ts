/**
 * transaction controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::transaction.transaction', ({ strapi }) => ({
  async find(ctx) {
    // Only fetch completed transactions for the authenticated user
    const userId = ctx.state.user.id;
    ctx.query = {
      ...ctx.query,
      filters: {
        $or: [
          { users_permissions_user: { id: userId } },
          { seller: { id: userId } }
        ],
        Tstatus: 'completed',
      },
      sort: ['orderDate:desc'],
      populate: ['book', 'users_permissions_user', 'seller'],
    };

    const { data, meta } = await super.find(ctx);
    return { data, meta };
  }
}));
