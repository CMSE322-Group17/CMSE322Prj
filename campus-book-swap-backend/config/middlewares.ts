module.exports = ({ env }) => [
  "strapi::errors",
  "strapi::security",
  {
    name: "strapi::cors",
    config: {
      enabled: true,
      origin: ["http://localhost:5173", "http://localhost:1337"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
      headers: ["Content-Type", "Authorization", "Origin", "Accept", "X-Requested-With"],
      keepHeaderOnError: true,
      credentials: true,
      maxAge: 86400
    },
  },
  "strapi::logger",
  "strapi::poweredBy",
  "strapi::query",
  "strapi::body",
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
];
