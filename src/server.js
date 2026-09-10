const app = require("./app");
const { port } = require("./config/env");

function start() {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Swagger running on http://localhost:${port}/api-docs`);
  });
}

// Start a listener locally; Vercel invokes the Express app directly.
if (!process.env.VERCEL) {
  start();
}

module.exports = app;
