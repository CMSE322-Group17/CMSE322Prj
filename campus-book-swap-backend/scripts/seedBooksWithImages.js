// campus-book-swap-backend/scripts/seedBooksWithImages.js

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// CONFIGURATION
const STRAPI_API_URL = 'http://localhost:1337/api'; // Change if your Strapi runs elsewhere
const STRAPI_API_TOKEN = 'eb74bbf20399d8524e38766844cf5afab80bf0a16115ae288ac86cf2a74cc3ad5c85ef2409cb5511533e7caa76dc527d25d64e40759bb7d1155c55db68e1e10e4d55896718bbae504e84a09d710acf7bc88a2d34bfdd30d50a437a810218e523e6e4f88cc0f51374ae2c57e1f38a083aaef646ce037b20d4d271a4654502cf3e'; // <-- Replace with your actual API token

// Book data: align with cover images and real book info
// Only use categories that exist in Strapi:
// 5: Science (Physics, Chemistry, Biology)
// 7: Mathematics
// 9: Engineering/Technology
// 12: Medicine/Health Sciences
// 14: Social Sciences (Psychology, Sociology, Anthropology)
// 16: Humanities (History, Philosophy, Literature)
// 18: Education
// 20: Economics/Business
// 22: Law
// 24: Political Science
// 26: Fiction
const booksData = [
  {
    title: "The Testaments",
    author: "Margaret Atwood",
    description: "A powerful sequel to The Handmaid's Tale, exploring the inner workings of Gilead through the eyes of three women.",
    condition: "Like New",
    bookType: "For Sale",
    price: 13.99,
    subject: "Fiction",
    status: "available",
    users_permissions_user: 1, // <-- Update to a valid user ID
    category: 26, // Fiction
    coverImagePath: path.join(__dirname, '../seed-images/9780062859013.jpg')
  },
  {
    title: "The Code Breaker",
    author: "Walter Isaacson",
    description: "The story of Jennifer Doudna, gene editing, and the future of the human race.",
    condition: "New",
    bookType: "For Sale",
    price: 16.50,
    subject: "Science",
    status: "available",
    users_permissions_user: 1, // <-- Update to a valid user ID
    category: 5, // Science
    coverImagePath: path.join(__dirname, '../seed-images/9780063042667.jpg')
  },
  {
    title: "Demon Copperhead",
    author: "Barbara Kingsolver",
    description: "A modern retelling of David Copperfield set in the mountains of southern Appalachia.",
    condition: "Good",
    bookType: "For Sale",
    price: 12.00,
    subject: "Fiction",
    status: "available",
    users_permissions_user: 1, // <-- Update to a valid user ID
    category: 26, // Fiction
    coverImagePath: path.join(__dirname, '../seed-images/9780063250840.jpg')
  },
  {
    title: "The Midnight Library",
    author: "Matt Haig",
    description: "A dazzling novel about all the choices that go into a life well lived.",
    condition: "Like New",
    bookType: "For Sale",
    price: 11.99,
    subject: "Fiction",
    status: "available",
    users_permissions_user: 1, // <-- Update to a valid user ID
    category: 26, // Fiction
    coverImagePath: path.join(__dirname, '../seed-images/9780143137733.jpg')
  },
  {
    title: "The Silent Patient",
    author: "Alex Michaelides",
    description: "A shocking psychological thriller of a woman's act of violence against her husband—and of the therapist obsessed with uncovering her motive.",
    condition: "Good",
    bookType: "For Sale",
    price: 10.50,
    subject: "Fiction",
    status: "available",
    users_permissions_user: 1, // <-- Update to a valid user ID
    category: 26, // Fiction
    coverImagePath: path.join(__dirname, '../seed-images/9780316513074.jpg')
  },
  {
    title: "The Overstory",
    author: "Richard Powers",
    description: "A sweeping, impassioned work of activism and resistance that is also a stunning evocation of—and paean to—the natural world.",
    condition: "Like New",
    bookType: "For Sale",
    price: 13.00,
    subject: "Fiction",
    status: "available",
    users_permissions_user: 1, // <-- Update to a valid user ID
    category: 26, // Fiction
    coverImagePath: path.join(__dirname, '../seed-images/9780374193393.jpg')
  },
  {
    title: "Lessons in Chemistry",
    author: "Bonnie Garmus",
    description: "A funny, smart, and feminist novel about a chemist in the 1960s who becomes an unlikely TV cooking show host.",
    condition: "New",
    bookType: "For Sale",
    price: 15.00,
    subject: "Fiction",
    status: "available",
    users_permissions_user: 1, // <-- Update to a valid user ID
    category: 26, // Fiction
    coverImagePath: path.join(__dirname, '../seed-images/9780385549509.jpg')
  },
  {
    title: "The Anthropocene Reviewed",
    author: "John Green",
    description: "A deeply moving collection of personal essays reviewing different facets of the human-centered planet.",
    condition: "Good",
    bookType: "For Sale",
    price: 12.50,
    subject: "Fiction",
    status: "available",
    users_permissions_user: 1, // <-- Update to a valid user ID
    category: 26, // Fiction
    coverImagePath: path.join(__dirname, '../seed-images/9780393867992.jpg')
  },
  {
    title: "The Vanishing Half",
    author: "Brit Bennett",
    description: "A multi-generational family saga set between the 1950s and 1990s, exploring race and identity.",
    condition: "Like New",
    bookType: "For Sale",
    price: 14.00,
    subject: "Fiction",
    status: "available",
    users_permissions_user: 1, // <-- Update to a valid user ID
    category: 26, // Fiction
    coverImagePath: path.join(__dirname, '../seed-images/9780593239919.jpg')
  },
  {
    title: "The Maidens",
    author: "Alex Michaelides",
    description: "A spellbinding tale of psychological suspense, weaving together Greek mythology, murder, and obsession at Cambridge University.",
    condition: "New",
    bookType: "For Sale",
    price: 13.99,
    subject: "Fiction",
    status: "available",
    users_permissions_user: 1, // <-- Update to a valid user ID
    category: 26, // Fiction
    coverImagePath: path.join(__dirname, '../seed-images/9780593299067.jpg')
  },
  {
    title: "The Plot",
    author: "Jean Hanff Korelitz",
    description: "A propulsive literary thriller about a once-promising novelist who steals a plot from a student and finds himself at the center of a deadly web of deception.",
    condition: "Good",
    bookType: "For Sale",
    price: 12.00,
    subject: "Fiction",
    status: "available",
    users_permissions_user: 1, // <-- Update to a valid user ID
    category: 26, // Fiction
    coverImagePath: path.join(__dirname, '../seed-images/9780593299753.jpg')
  },
  {
    title: "The Lincoln Highway",
    author: "Amor Towles",
    description: "A stylish and propulsive novel set in 1954, following four boys on a cross-country adventure from Nebraska to New York City.",
    condition: "Like New",
    bookType: "For Sale",
    price: 14.50,
    subject: "Fiction",
    status: "available",
    users_permissions_user: 1, // <-- Update to a valid user ID
    category: 26, // Fiction
    coverImagePath: path.join(__dirname, '../seed-images/9780593316535.jpg')
  },
  {
    title: "Beautiful World, Where Are You",
    author: "Sally Rooney",
    description: "A novel about four young people in Ireland navigating friendship, love, and the complexities of adulthood.",
    condition: "Good",
    bookType: "For Sale",
    price: 13.00,
    subject: "Fiction",
    status: "available",
    users_permissions_user: 1, // <-- Update to a valid user ID
    category: 26, // Fiction
    coverImagePath: path.join(__dirname, '../seed-images/9780593317334.jpg')
  },
  {
    title: "The Candy House",
    author: "Jennifer Egan",
    description: "A dazzling, shape-shifting story about memory, privacy, and the search for authenticity in a world where technology can access every thought.",
    condition: "Like New",
    bookType: "For Sale",
    price: 12.99,
    subject: "Fiction",
    status: "available",
    users_permissions_user: 1, // <-- Update to a valid user ID
    category: 26, // Fiction
    coverImagePath: path.join(__dirname, '../seed-images/9780593320709.jpg')
  },
  {
    title: "The Four Winds",
    author: "Kristin Hannah",
    description: "An epic novel of love, heroism, and hope, set against the backdrop of the Great Depression.",
    condition: "New",
    bookType: "For Sale",
    price: 15.00,
    subject: "Fiction",
    status: "available",
    users_permissions_user: 1, // <-- Update to a valid user ID
    category: 26, // Fiction
    coverImagePath: path.join(__dirname, '../seed-images/9780593420256.jpg')
  },
  {
    title: "Project Hail Mary",
    author: "Andy Weir",
    description: "A lone astronaut must save the earth from disaster in this incredible new science-based thriller from the author of The Martian.",
    condition: "Like New",
    bookType: "For Sale",
    price: 14.99,
    subject: "Science",
    status: "available",
    users_permissions_user: 1, // <-- Update to a valid user ID
    category: 5, // Science
    coverImagePath: path.join(__dirname, '../seed-images/9780593535110.jpg')
  },
  {
    title: "The Last Thing He Told Me",
    author: "Laura Dave",
    description: "A gripping mystery about a woman who forms an unexpected relationship with her stepdaughter while searching for the truth about why her husband has disappeared.",
    condition: "Good",
    bookType: "For Sale",
    price: 13.50,
    subject: "Fiction",
    status: "available",
    users_permissions_user: 1, // <-- Update to a valid user ID
    category: 26, // Fiction
    coverImagePath: path.join(__dirname, '../seed-images/9780593536117.jpg')
  },
  {
    title: "The Night Watchman",
    author: "Louise Erdrich",
    description: "Based on the extraordinary life of a Native American leader, this Pulitzer Prize-winning novel is a powerful story of love and struggle in 1950s North Dakota.",
    condition: "New",
    bookType: "For Sale",
    price: 15.99,
    subject: "Fiction",
    status: "available",
    users_permissions_user: 1, // <-- Update to a valid user ID
    category: 26, // Fiction
    coverImagePath: path.join(__dirname, '../seed-images/9780593538241.jpg')
  },
  {
    title: "The Paris Library",
    author: "Janet Skeslien Charles",
    description: "Based on the true World War II story of the heroic librarians at the American Library in Paris, this is an unforgettable story of romance, friendship, and the power of literature.",
    condition: "Like New",
    bookType: "For Sale",
    price: 12.99,
    subject: "Fiction",
    status: "available",
    users_permissions_user: 1, // <-- Update to a valid user ID
    category: 26, // Fiction
    coverImagePath: path.join(__dirname, '../seed-images/9780593713938.jpg')
  },
  {
    title: "The Guncle",
    author: "Steven Rowley",
    description: "A warm and funny novel about a gay uncle who unexpectedly becomes the guardian of his niece and nephew, and the adventures that follow.",
    condition: "Good",
    bookType: "For Sale",
    price: 11.50,
    subject: "Fiction",
    status: "available",
    users_permissions_user: 1, // <-- Update to a valid user ID
    category: 26, // Fiction
    coverImagePath: path.join(__dirname, '../seed-images/9781250878359.jpg')
  },
  {
    title: "The One and Only Ivan",
    author: "Katherine Applegate",
    description: "A beautifully written tale of friendship, hope, and the power of art, told from the perspective of a captive gorilla.",
    condition: "Like New",
    bookType: "For Sale",
    price: 10.99,
    subject: "Fiction",
    status: "available",
    users_permissions_user: 1, // <-- Update to a valid user ID
    category: 26, // Fiction
    coverImagePath: path.join(__dirname, '../seed-images/9781442484412.jpg')
  },
  {
    title: "The Nightingale",
    author: "Kristin Hannah",
    description: "A novel that celebrates the resilience of the human spirit and the durability of women, set in World War II France.",
    condition: "New",
    bookType: "For Sale",
    price: 14.50,
    subject: "Fiction",
    status: "available",
    users_permissions_user: 1, // <-- Update to a valid user ID
    category: 26, // Fiction
    coverImagePath: path.join(__dirname, '../seed-images/9781476799667.jpg')
  },
  {
    title: "The Lying Life of Adults",
    author: "Elena Ferrante",
    description: "A powerful new novel set in a divided Naples, about the transition from childhood to adolescence.",
    condition: "Good",
    bookType: "For Sale",
    price: 13.00,
    subject: "Fiction",
    status: "available",
    users_permissions_user: 1, // <-- Update to a valid user ID
    category: 26, // Fiction
    coverImagePath: path.join(__dirname, '../seed-images/9781609458393.jpg')
  },
  {
    title: "Drive Your Plow Over the Bones of the Dead",
    author: "Olga Tokarczuk",
    description: "A subversive, entertaining noir novel from the winner of the Nobel Prize in Literature.",
    condition: "Like New",
    bookType: "For Sale",
    price: 12.50,
    subject: "Fiction",
    status: "available",
    users_permissions_user: 1, // <-- Update to a valid user ID
    category: 26, // Fiction
    coverImagePath: path.join(__dirname, '../seed-images/9781635901771.jpg')
  },
  {
    title: "The Lincoln Highway",
    author: "Amor Towles",
    description: "A stylish and propulsive novel set in 1954, following four boys on a cross-country adventure from Nebraska to New York City.",
    condition: "New",
    bookType: "For Sale",
    price: 15.00,
    subject: "Fiction",
    status: "available",
    users_permissions_user: 1, // <-- Update to a valid user ID
    category: 26, // Fiction
    coverImagePath: path.join(__dirname, '../seed-images/9781637583920.jpg')
  },
  {
    title: "The Sentence",
    author: "Louise Erdrich",
    description: "A wickedly funny ghost story, a tale of passion, of a complex marriage, and of a woman's relentless errors.",
    condition: "Good",
    bookType: "For Sale",
    price: 13.99,
    subject: "Fiction",
    status: "available",
    users_permissions_user: 1, // <-- Update to a valid user ID
    category: 26, // Fiction
    coverImagePath: path.join(__dirname, '../seed-images/9781638930563.jpg')
  },
  {
    title: "The Vanishing Half",
    author: "Brit Bennett",
    description: "A multi-generational family saga set between the 1950s and 1990s, exploring race and identity.",
    condition: "Like New",
    bookType: "For Sale",
    price: 14.00,
    subject: "Fiction",
    status: "available",
    users_permissions_user: 1, // <-- Update to a valid user ID
    category: 26, // Fiction
    coverImagePath: path.join(__dirname, '../seed-images/9781982146863.jpg')
  },
  {
    title: "The Last Thing He Told Me",
    author: "Laura Dave",
    description: "A gripping mystery about a woman who forms an unexpected relationship with her stepdaughter while searching for the truth about why her husband has disappeared.",
    condition: "Good",
    bookType: "For Sale",
    price: 13.50,
    subject: "Fiction",
    status: "available",
    users_permissions_user: 1, // <-- Update to a valid user ID
    category: 26, // Fiction
    coverImagePath: path.join(__dirname, '../seed-images/9781982153090.jpg')
  },
  {
    title: "The Personal Librarian",
    author: "Marie Benedict, Victoria Christopher Murray",
    description: "The remarkable, little-known story of Belle da Costa Greene, J.P. Morgan’s personal librarian, who became one of the most powerful women in New York despite the dangerous secret she kept in order to make her dreams come true.",
    condition: "Like New",
    bookType: "For Sale",
    price: 14.00,
    subject: "Fiction",
    status: "available",
    users_permissions_user: 1, // <-- Update to a valid user ID
    category: 26, // Fiction
    coverImagePath: path.join(__dirname, '../seed-images/9781982197995.jpg')
  },
  {
    title: "Matrix",
    author: "Lauren Groff",
    description: "A mesmerizing portrait of a visionary woman in medieval France, this novel explores themes of power, faith, and female creativity.",
    condition: "New",
    bookType: "For Sale",
    price: 15.00,
    subject: "Fiction",
    status: "available",
    users_permissions_user: 1, // <-- Update to a valid user ID
    category: 26, // Fiction
    coverImagePath: path.join(__dirname, '../seed-images/9781982198107.jpg')
  }
  // ...add more books as needed, matching coverImagePath to a file in seed-images
];

// Helper to upload an image and return its media ID
async function uploadImage(imagePath) {
  // Always resolve relative to the script's directory
  const absolutePath = path.resolve(imagePath.startsWith('..') ? path.join(__dirname, imagePath) : imagePath);
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
        categories: [book.category], // <-- Fix: send as array for Strapi v4
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
      // Defensive: print full response if data is missing
      if (!response.data || !response.data.data) {
        console.error('Unexpected response from Strapi when creating book:', JSON.stringify(response.data, null, 2));
        // If data is not as expected, log a generic success or skip logging the title
        console.log(`Book creation attempt for "${book.title}" processed. Check Strapi for details.`);
      } else {
        console.log(`Created book: ${response.data.data.attributes.title}`);
      }
    } catch (error) {
      console.error(`Error creating book: ${book.title}`);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error('No response received. Error request:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      // Always print the full error stack for debugging
      console.error('Full error:', error.stack || error);
    }
  }
  console.log('Book seeding finished.');
}

seedBooks();
