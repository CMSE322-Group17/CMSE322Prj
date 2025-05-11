module.exports = {
  async afterCreate(event) {
    const { result } = event;

    // Create a sample message after creating a book
    await strapi.entityService.create("api::message.message", {
      data: {
        ChatId: `1_2_${result.id}`,
        sender: {
          connect: [{ id: 1 }]
        },
        receiver: {
          connect: [{ id: 2 }]
        },
        book: {
          connect: [{ id: result.id }]
        },
        text: `Hi, I'm interested in your book: ${result.title}`,
        timestamp: new Date(),
        messageType: "general",
      },
    });
  },
};
