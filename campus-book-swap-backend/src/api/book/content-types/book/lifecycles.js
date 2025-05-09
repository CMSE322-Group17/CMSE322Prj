module.exports = {
  async afterCreate(event) {
    const { result } = event;

    // Create a sample message after creating a book
    await strapi.entityService.create("api::message.message", {
      data: {
        chatId: `1_2_${result.id}`,
        senderId: "1",
        receiverId: "2",
        bookId: result.id.toString(),
        text: `Hi, I'm interested in your book: ${result.title}`,
        timestamp: new Date(),
        messageType: "general",
      },
    });
  },
};
