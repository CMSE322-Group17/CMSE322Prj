// campus-book-swap-backend/scripts/seedBooksWithImages.js

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// CONFIGURATION
const STRAPI_API_URL = 'http://localhost:1337/api'; // Change if your Strapi runs elsewhere
const STRAPI_API_TOKEN = 'YOUR_FULL_ACCESS_API_TOKEN'; // <-- Replace with your actual API token

// Book data: align with cover images and real book info
const booksData = [
  {
    title: "The Overstory",
    author: "Richard Powers",
    description: "A sweeping, impassioned work of activism and resistance that is also a stunning evocation of—and paean to—the natural world.",
    condition: "Like New",
    bookType: "For Sale",
    price: 12.99,
    subject: "Literature",
    status: "available",
    users_permissions_user: 1, // <-- Replace with actual user ID
    category: 1, // <-- Replace with actual category ID
    coverImagePath: "./seed-images/9780393356687.jpg"
  },
  {
    title: "The Midnight Library",
    author: "Matt Haig",
    description: "A dazzling novel about all the choices that go into a life well lived.",
    condition: "Good",
    bookType: "For Sale",
    price: 10.50,
    subject: "Fiction",
    status: "available",
    users_permissions_user: 1, // <-- Replace with actual user ID
    category: 2, // <-- Replace with actual category ID
    coverImagePath: "./seed-images/9780525559474.jpg"
  },
  {
    title: "Klara and the Sun",
    author: "Kazuo Ishiguro",
    description: "A thrilling book that offers a look at our changing world through the eyes of an unforgettable narrator.",
    condition: "New",
    bookType: "For Sale",
    price: 15.00,
    subject: "Science Fiction",
    status: "available",
    users_permissions_user: 2, // <-- Replace with actual user ID
    category: 3, // <-- Replace with actual category ID
    coverImagePath: "./seed-images/9780593318171.jpg"
  },
  // Add more books here, matching coverImagePath to a file in seed-images
];

// Helper to upload an image and return its media ID
async function uploadImage(imagePath) {
  const absolutePath = path.resolve(__dirname, imagePath);
  const fileName = path.basename(absolutePath);

  const formData = new FormData();
  formData.append('files', fs.createReadStream(absolutePath), fileName);

  const response = await axios.post(
    `${STRAPI_API_URL.replace('/api', '')}/api/upload`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        ...formData.getHeaders(),
      },
    }
  );
  // Strapi returns an array of uploaded files
  return response.data[0].id;
}

async function seedBooks() {
  for (const book of booksData) {
    try {
      // 1. Upload cover image if provided
      let coverId = null;
      if (book.coverImagePath) {
        coverId = await uploadImage(book.coverImagePath);
        console.log(`Uploaded image for "${book.title}", got media ID: ${coverId}`);
      }

      // 2. Prepare book payload
      const bookPayload = {
        title: book.title,
        author: book.author,
        description: book.description,
        condition: book.condition,
        bookType: book.bookType,
        price: book.price,
        subject: book.subject,
        status: book.status,
        users_permissions_user: book.users_permissions_user,
        category: book.category,
        exchange: book.exchange,
        // Optional fields
        featured: book.featured || false,
        bookOfWeek: book.bookOfWeek || false,
        bookOfYear: book.bookOfYear || false,
        displayTitle: book.displayTitle || "",
        Display: book.Display || false,
        rating: book.rating || 0,
        // Add the cover relation if image was uploaded
        ...(coverId && { cover: coverId }),
      };

      // 3. Create the book
      const response = await axios.post(
        `${STRAPI_API_URL}/books`,
        { data: bookPayload },
        {
          headers: {
            Authorization: `Bearer ${STRAPI_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log(`Created book: ${response.data.data.attributes.title}`);
    } catch (error) {
      console.error(`Error creating book: ${book.title}`);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.error('Error message:', error.message);
      }
    }
  }
  console.log('Book seeding finished.');
}

seedBooks();
