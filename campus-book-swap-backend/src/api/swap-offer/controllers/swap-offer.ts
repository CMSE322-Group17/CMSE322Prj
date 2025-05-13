/**
 * swap-offer controller
 */

import { factories } from '@strapi/strapi';
import { Strapi } from '@strapi/strapi';

export default factories.createCoreController('api::swap-offer.swap-offer', ({ strapi }: { strapi: Strapi }) => ({
  async create(ctx) {
    const { user } = ctx.state; // Authenticated user
    const bodyData = ctx.request.body?.data;

    if (!user) {
      return ctx.unauthorized('You must be logged in to create a swap offer.');
    }

    if (!bodyData || !bodyData.owner || !bodyData.requestedBook || !bodyData.offeredBooks || !bodyData.chatId) {
      return ctx.badRequest('Missing required fields in body.data: owner, requestedBook, offeredBooks, chatId are required.');
    }

    try {
      const entity = await strapi.service('api::swap-offer.swap-offer').create({
        data: {
          ...bodyData,
          requester: user.id,
          status: 'pending', // Default status
          timestamp: new Date().toISOString(),
          publishedAt: new Date().toISOString(), // Ensure it's published since draftAndPublish is true
        },
      });
      // Sanitize output if needed, for now returning directly
      return { data: entity };
    } catch (error) {
      strapi.log.error('Error creating swap-offer:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      return ctx.internalServerError('An error occurred while creating the swap offer.', { error: errorMessage });
    }
  },

  async find(ctx) {
    const { user } = ctx.state;
    if (!user) {
      return ctx.unauthorized('You must be logged in to view swap offers.');
    }

    // Initialize filters if not present
    if (!ctx.query.filters) {
      ctx.query.filters = {};
    }
    // Add filter to fetch offers where the user is either requester or owner
    ctx.query.filters.$or = [
      { requester: user.id },
      { owner: user.id },
    ];
    
    // Ensure populate is an object and merge existing populate queries
    const existingPopulate = typeof ctx.query.populate === 'object' && ctx.query.populate !== null ? ctx.query.populate : {};
    ctx.query.populate = {
        requester: { fields: ['id', 'username', 'email'] },
        owner: { fields: ['id', 'username', 'email'] },
        requestedBook: { populate: { cover: true, users_permissions_user: { fields: ['id', 'username'] } } },
        offeredBooks: { populate: { cover: true, users_permissions_user: { fields: ['id', 'username'] } } },
        ...existingPopulate,
    };

    // Call the default core action
    const { data, meta } = await super.find(ctx);
    return { data, meta };
  },

  async updateStatus(ctx) {
    const { user } = ctx.state;
    const { id } = ctx.params;
    const bodyData = ctx.request.body?.data;

    if (!user) {
      return ctx.unauthorized('You must be logged in to update a swap offer.');
    }

    if (!bodyData || !bodyData.status || !['accepted', 'declined', 'cancelled'].includes(bodyData.status)) {
      return ctx.badRequest('Invalid or missing status value in request body.data. Must be one of: accepted, declined, cancelled.');
    }
    const { status, messageToRequester, messageToOwner } = bodyData;

    try {
      // Fetch the existing offer. Using `as any` for populate to bypass TS errors if GetPopulatableKeys is problematic.
      // The runtime should correctly populate these if 'requester' and 'owner' are valid relations.
      const offer = await strapi.entityService.findOne('api::swap-offer.swap-offer', id, {
        populate: ['requester', 'owner'] as any, 
      });

      if (!offer) {
        return ctx.notFound('Swap offer not found.');
      }

      // Type assertion to inform TypeScript about the populated fields
      const populatedOffer = offer as typeof offer & {
        requester?: { id: string | number; [key: string]: any };
        owner?: { id: string | number; [key: string]: any };
      };

      let canUpdate = false;
      const updateData: { status: string; messageToOwner?: string; messageToRequester?: string } = { status }; 

      if (status === 'cancelled' && populatedOffer.requester && populatedOffer.requester.id === user.id && populatedOffer.status === 'pending') {
        canUpdate = true;
        if (messageToOwner) updateData.messageToOwner = messageToOwner;
      } 
      else if ((status === 'accepted' || status === 'declined') && populatedOffer.owner && populatedOffer.owner.id === user.id && populatedOffer.status === 'pending') {
        canUpdate = true;
        if (messageToRequester) updateData.messageToRequester = messageToRequester;
      }

      if (!canUpdate) {
        return ctx.forbidden('You are not authorized to update this swap offer with the given status, or the offer is not in a pending state.');
      }
      
      const updatedEntity = await strapi.service('api::swap-offer.swap-offer').update(id, {
        data: updateData,
      });

      return { data: updatedEntity };

    } catch (error) {
      strapi.log.error('Error updating swap-offer status:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      return ctx.internalServerError('An error occurred while updating the swap offer status.', { error: errorMessage });
    }
  }
}));
