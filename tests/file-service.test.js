process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";

jest.mock("../src/models/File", () => ({
  findOneAndUpdate: jest.fn()
}));

jest.mock("../src/services/cloudinary.service", () => ({
  uploadMedia: jest.fn(),
  destroyMedia: jest.fn()
}));

const File = require("../src/models/File");
const FileService = require("../src/services/file.service");

describe("FileService", () => {
  const service = new FileService({
    headers: { userId: "user-123" },
    query: {}
  });

  test("buildSearchFilter supports filename/tag search", () => {
    const filter = service.buildSearchFilter("video", undefined, undefined);

    expect(filter.$or).toHaveLength(2);
    expect(filter.$or[0].filename).toBeInstanceOf(RegExp);
    expect(filter.$or[1].tags).toBeInstanceOf(RegExp);
  });

  test("buildSearchFilter supports inclusive date range", () => {
    const filter = service.buildSearchFilter(
      undefined,
      "2026-09-01",
      "2026-09-10"
    );

    expect(filter.createdAt.$gte.getHours()).toBe(0);
    expect(filter.createdAt.$gte.getMinutes()).toBe(0);
    expect(filter.createdAt.$lte.getHours()).toBe(23);
    expect(filter.createdAt.$lte.getMinutes()).toBe(59);
    expect(filter.createdAt.$lte.getSeconds()).toBe(59);
  });

  test("buildSearchFilter supports file type", () => {
    const filter = service.buildSearchFilter("video", undefined, undefined, "video");

    expect(filter.resourceType).toBe("video");
  });

  test("viewFile increments viewCount atomically", async () => {
    const updatedFile = {
      id: "file-123",
      filename: "video.mp4",
      viewCount: 6
    };

    File.findOneAndUpdate.mockResolvedValue(updatedFile);

    const result = await service.viewFile("file-123");

    expect(File.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: "file-123", enabled: true },
      { $inc: { viewCount: 1 } },
      { new: true }
    );
    expect(result).toEqual(updatedFile);
  });

  test("viewFile throws 404 when file does not exist", async () => {
    File.findOneAndUpdate.mockResolvedValue(null);

    await expect(service.viewFile("missing-id")).rejects.toMatchObject({
      message: "File not found.",
      statusCode: 404
    });
  });
});
