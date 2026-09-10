const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Multimedia Upload & Search API",
      version: "1.0.0",
      description: "REST API for authenticated multimedia upload, preview, search and ranking."
    },
    servers: [
      { url: "http://localhost:5000", description: "Local server" }
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "accessToken"
        },
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" }
          }
        },
        File: {
          type: "object",
          required: ["id", "filename", "url", "resourceType", "tags", "enabled"],
          properties: {
            id: { type: "string", example: "6aa298d8ccc2fb508a9f3620" },
            userId: { type: "string", example: "6aa19c0acf811160bece7486" },
            filename: { type: "string", example: "sample-20mb-video.mp4" },
            publicId: { type: "string", example: "multimedia-app/file_p98pq9" },
            url: {
              type: "string",
              format: "uri",
              example: "https://res.cloudinary.com/example/video/upload/sample-20mb-video.mp4"
            },
            resourceType: {
              type: "string",
              enum: ["image", "video", "audio", "raw"],
              example: "video"
            },
            mimeType: { type: "string", example: "video/mp4" },
            extension: { type: "string", example: ".mp4" },
            size: { type: "number", example: 21218443 },
            tags: { type: "array", items: { type: "string" } },
            viewCount: { type: "number", example: 0 },
            enabled: { type: "boolean", example: true },
            relevanceScore: {
              type: "number",
              example: 50,
              description: "Calculated only for search results; not stored in MongoDB."
            },
            createdAt: { type: "string", format: "date-time", example: "2026-09-10T11:47:36.540Z" },
            updatedAt: { type: "string", format: "date-time", example: "2026-09-10T11:47:36.540Z" }
          }
        },
        FileListResponse: {
          type: "object",
          properties: {
            items: { type: "array", items: { $ref: "#/components/schemas/File" } },
            pagination: {
              type: "object",
              properties: {
                page: { type: "integer", example: 1 },
                limit: { type: "integer", example: 20 },
                total: { type: "integer", example: 1 },
                pages: { type: "integer", example: 1 }
              }
            }
          }
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string", example: "Request is unauthorized." },
            data: { nullable: true, example: null }
          }
        }
      }
    }
  },
  apis: ["./src/routes/*.js"]
};

module.exports = swaggerJSDoc(options);
