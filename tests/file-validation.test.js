process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";

const { normalizeTags } = require("../src/validators/file.validator");

describe("File validation helpers", () => {
  test("normalizes comma-separated tags", () => {
    expect(normalizeTags("Project, Demo, project, VIDEO")).toEqual([
      "project",
      "demo",
      "video"
    ]);
  });

  test("normalizes JSON array tags", () => {
    expect(normalizeTags('["Project", "Demo"]')).toEqual([
      "project",
      "demo"
    ]);
  });

  test("returns empty array when tags are missing", () => {
    expect(normalizeTags(undefined)).toEqual([]);
  });
});
