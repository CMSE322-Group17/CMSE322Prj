// campus-book-swap-backend/config/server.js
module.exports = ({ env }) => ({
  host: env("HOST", "0.0.0.0"),
  port: env.int("PORT", 1337),
  app: {
    keys: env.array("APP_KEYS", ["myKeyA", "myKeyB", "myKeyC", "myKeyD"]),
  },
  // ... other configurations
});
