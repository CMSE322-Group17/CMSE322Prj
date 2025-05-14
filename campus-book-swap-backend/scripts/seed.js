// scripts/seed.js
module.exports = async () => {
  // Categories
  const categories = [
    { name: "Textbooks", Type: "Academic" },
    { name: "Fiction", Type: "Literature" },
    { name: "Science", Type: "Academic" },
    { name: "Computer Science", Type: "Technical" },
  ];

  for (const category of categories) {
    await strapi.entityService.create("api::category.category", {
      data: category,
    });
  }

  // Books
  const books = [
    {
      title: "Introduction to Computer Science",
      author: "John Smith",
      description: "A comprehensive introduction to computer science concepts.",
      price: 24.99,
      condition: "Like New",
      subject: "Computer Science",
      course: "CS101",
      bookType: "For Sale",
      // Add relationship to category
      category: 4, // ID of Computer Science category
    },
    // Add more books...
  ];

  for (const book of books) {
    await strapi.entityService.create("api::book.book", {
      data: book,
    });
  }

  // Add messages, swap offers, etc.
};
