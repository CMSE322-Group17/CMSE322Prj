module.exports = {
  async beforeCreate(event) {
    const { data } = event.params;
    
    // Set default timestamp if not provided
    if (!data.timestamp) {
      data.timestamp = new Date().toISOString();
    }
    
    // Set default message type if not provided
    if (!data.messageType) {
      data.messageType = 'general';
    }

    // Validate seller-buyer relationship for purchase/swap requests
    if (data.messageType === 'purchase_request' || data.messageType === 'swap_offer') {
      try {
        // Get the book details
        const book = await strapi.entityService.findOne('api::book.book', data.book.id, {
          populate: ['users_permissions_user']
        });

        if (!book) {
          throw new Error('Book not found');
        }

        // Verify that the receiver is the book owner
        if (book.users_permissions_user.id !== data.receiver.id) {
          throw new Error('Invalid receiver: must be the book owner');
        }

        // Verify that the sender is not the book owner
        if (book.users_permissions_user.id === data.sender.id) {
          throw new Error('Cannot send request to yourself');
        }

        // Set initial request status
        data.requestStatus = 'pending';
      } catch (error) {
        throw new Error(`Validation failed: ${error.message}`);
      }
    }
  },

  async afterCreate(event) {
    const { result } = event;
    
    try {
      // Get the book and users details for notification
      const book = await strapi.entityService.findOne('api::book.book', result.book.id, {
        populate: ['users_permissions_user']
      });

      const sender = await strapi.entityService.findOne('plugin::users-permissions.user', result.sender.id);
      const receiver = await strapi.entityService.findOne('plugin::users-permissions.user', result.receiver.id);

      // Log the message creation
      strapi.log.info(`New message created: ${result.id}`);
      strapi.log.info(`From: ${sender.username} To: ${receiver.username} Book: ${book.title}`);

      // Here you can add notification logic
      // For example, send a notification to the receiver
      // strapi.io.emit('new_message', {
      //   message: result,
      //   book: book,
      //   sender: sender,
      //   receiver: receiver
      // });
    } catch (error) {
      strapi.log.error('Error in afterCreate:', error);
    }
  },

  async beforeUpdate(event) {
    const { data, where } = event.params;
    
    // Update timestamp when marking as read
    if (data.read === true) {
      data.readAt = new Date().toISOString();
    }

    // Handle request status updates
    if (data.requestStatus) {
      const message = await strapi.entityService.findOne('api::message.message', where.id);
      
      if (message.messageType === 'purchase_request' || message.messageType === 'swap_offer') {
        // Validate status transition
        const validTransitions = {
          pending: ['accepted', 'declined', 'cancelled'],
          accepted: ['completed', 'cancelled'],
          declined: ['cancelled'],
          completed: [],
          cancelled: []
        };

        if (!validTransitions[message.requestStatus].includes(data.requestStatus)) {
          throw new Error(`Invalid status transition from ${message.requestStatus} to ${data.requestStatus}`);
        }

        // Update timestamp for status change
        data.statusChangedAt = new Date().toISOString();
      }
    }
  }
}; 