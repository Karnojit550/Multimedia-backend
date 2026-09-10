process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";

const request = require("supertest");
const app = require("../src/app");

describe("Health API", () => {
  test("GET /api/health returns healthy", async () => {
    const response = await request(app).get("/api/health");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("unknown route returns 404", async () => {
    const response = await request(app).get("/api/not-found");

    expect(response.statusCode).toBe(404);
    expect(response.body.success).toBe(false);
  });
});
