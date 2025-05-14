/**
 * order controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
  async create(ctx) {
    // @ts-ignore
    const { items, ...orderData } = ctx.request.body.data;
    const buyerId = ctx.state.user?.id;

    if (!buyerId) {
      return ctx.badRequest('Buyer information is missing.');
    }

    // Call the default core action to create the order
    const response = await super.create(ctx);

    // After creating the order, update book statuses and create transactions
    if (response.data && items && Array.isArray(items)) {
      for (const item of items) {
        try {
          const book = await strapi.entityService.findOne('api::book.book', item.bookId, {
            populate: ['seller', 'users_permissions_user'], // Populate seller relation
          });

          if (!book) {
            strapi.log.warn(`Book with ID ${item.bookId} not found during order creation.`);
            continue;
          }

          // @ts-ignore
          const sellerId = book.seller?.id || book.users_permissions_user?.id; // Prioritize dedicated seller field

          if (!sellerId) {
            strapi.log.warn(`Seller ID not found for book ID ${item.bookId}.`);
            continue;
          }

          // Update book status to 'sold'
          await strapi.entityService.update('api::book.book', item.bookId, {
            data: {
              status: 'sold',
            },
          });

          // Create transaction record
          await strapi.entityService.create('api::transaction.transaction', {
            data: {
              book: item.bookId,
              users_permissions_user: buyerId, // Buyer
              seller: sellerId, // Seller
              Tstatus: 'completed',
              orderDate: new Date().toISOString(),
              // @ts-ignore
              amount: book.price, 
              type: 'sale', // This is the new field
              publishedAt: new Date().toISOString(),
            },
          });

        } catch (error) {
          strapi.log.error(`Failed to process book ID ${item.bookId} during order creation:`, error);
        }
      }
    }
    return response;
  },

  async update(ctx) {
    // Call the default core action
    const response = await super.update(ctx);
    // @ts-ignore
    const orderId = ctx.params.id;
    // @ts-ignore
    const { status } = ctx.request.body.data; // Get status from request body

    if (status === 'completed' && response.data) {
      const updatedOrder = await strapi.entityService.findOne('api::order.order', orderId, {
        // @ts-ignore
        populate: { 
          items: { 
            populate: { 
              book: { populate: ['seller', 'users_permissions_user'] } 
            }
          },
          user: true // Buyer
        },
      });
      
      // @ts-ignore
      const orderItems = updatedOrder?.items;
      // @ts-ignore
      const buyerId = updatedOrder?.user?.id || ctx.state.user?.id;

      if (!buyerId) {
        strapi.log.error(`Buyer ID not found for order ${orderId} during update.`);
        return response;
      }

      if (orderItems && Array.isArray(orderItems)) {
        for (const item of orderItems) {
          // @ts-ignore
          const bookEntry = item.book;
          if (!bookEntry || !bookEntry.id) {
            strapi.log.warn(`Book details missing for an item in order ${orderId} during update.`);
            continue;
          }
          const bookId = bookEntry.id;

          try {
            // @ts-ignore
            const sellerId = bookEntry.seller?.id || bookEntry.users_permissions_user?.id;

            if (!sellerId) {
              strapi.log.warn(`Seller ID not found for book ID ${bookId} during order update.`);
              continue;
            }

            await strapi.entityService.update('api::book.book', bookId, {
              data: {
                status: 'sold',
              },
            });
            
            const existingTransactions = await strapi.entityService.findMany('api::transaction.transaction', {
              filters: {
                book: { id: bookId },
                users_permissions_user: { id: buyerId },
                seller: { id: sellerId },
                type: 'sale',
              },
            });

            // @ts-ignore
            if (existingTransactions.length === 0) {
              await strapi.entityService.create('api::transaction.transaction', {
                data: {
                  book: bookId,
                  users_permissions_user: buyerId,
                  seller: sellerId,
                  Tstatus: 'completed',
                  orderDate: new Date().toISOString(),
                  // @ts-ignore
                  amount: bookEntry.price,
                  type: 'sale', // This is the new field
                  publishedAt: new Date().toISOString(),
                },
              });
            } else {
              strapi.log.info(`Transaction already exists for book ${bookId} by buyer ${buyerId} from seller ${sellerId}. Skipping creation.`);
            }

          } catch (error) {
            strapi.log.error(`Failed to process book ID ${bookId} during order update for order ${orderId}:`, error);
          }
        }
      }
    }
    return response;
  }
}));
