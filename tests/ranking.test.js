const { calculateRelevance, calculateScore } = require("../src/utils/ranking");

describe("File ranking", () => {
  test("exact filename gets the highest filename relevance", () => {
    const file = {
      filename: "travel",
      tags: [],
      viewCount: 0,
      createdAt: new Date()
    };

    expect(calculateRelevance(file, "travel")).toBe(100);
  });

  test("exact tag contributes to relevance", () => {
    const file = {
      filename: "holiday.jpg",
      tags: ["travel"],
      viewCount: 0,
      createdAt: new Date()
    };

    expect(calculateRelevance(file, "travel")).toBe(50);
  });

  test("popular files receive popularity points", () => {
    const file = {
      filename: "video.mp4",
      tags: [],
      viewCount: 100,
      createdAt: new Date()
    };

    expect(calculateScore(file, "video")).toBeGreaterThan(
      calculateScore({ ...file, viewCount: 0 }, "video")
    );
  });

  test("relevance score uses filename field from the File model", () => {
    const file = {
      filename: "project-video.mp4",
      tags: ["demo"],
      viewCount: 0,
      createdAt: new Date()
    };

    expect(calculateRelevance(file, "project")).toBe(60);
  });
});
