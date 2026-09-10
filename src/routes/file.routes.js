const express = require("express");
const controller = require("../controllers/file.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");
const { validateFile, validateFileForUpdate } = require("../validators/file.validator");

const router = express.Router();


router.use(authMiddleware);

/**
 * @swagger
 * /api/files/upload:
 *   post:
 *     summary: Upload a multimedia file
 *     description: Upload a file and optionally add up to 20 comma-separated tags. The file belongs to the authenticated user.
 *     tags:
 *       - Files
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               tags:
 *                 type: string
 *                 example: nature,travel,video
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: File uploaded successfully.
 *               data:
 *                 id: 6aa298d8ccc2fb508a9f3620
 *                 filename: sample-20mb-video.mp4
 *                 resourceType: video
 *                 mimeType: video/mp4
 *                 tags: [nature, travel, video]
 *                 enabled: true
 *       400:
 *         description: File is missing or has an unsupported type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 */
router.post("/upload", upload.single("file"), validateFile, controller.upload);

/**
 * @swagger
 * /api/files:
 *   get:
 *     summary: Get files with search, filters, pagination and ranking
 *     description: Returns only enabled files owned by the authenticated user. Search checks filename and tags. The frontend should read files from data.items and pagination from data.pagination.
 *     tags:
 *       - Files
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         example: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search filename or tags. Search results are relevance ranked by default.
 *         example: Nature
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [image, video, audio, raw]
 *         example: video
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Include files uploaded from this date.
 *         example: 2026-09-01
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Include files uploaded through this date.
 *         example: 2026-09-10
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest, popular, relevance]
 *           default: newest
 *         description: Sorting option. When search is supplied with the default newest option, relevance ranking is used.
 *         example: relevance
 *     responses:
 *       200:
 *         description: Files retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Files retrieved successfully. }
 *                 data: { $ref: '#/components/schemas/FileListResponse' }
 *             example:
 *               success: true
 *               message: Files retrieved successfully.
 *               data:
 *                 items:
 *                   - id: 6aa298d8ccc2fb508a9f3620
 *                     filename: sample-20mb-video.mp4
 *                     url: https://res.cloudinary.com/example/video/upload/sample-20mb-video.mp4
 *                     resourceType: video
 *                     mimeType: video/mp4
 *                     size: 21218443
 *                     tags: [nature]
 *                     viewCount: 0
 *                     enabled: true
 *                     relevanceScore: 50
 *                     createdAt: 2026-09-10T11:47:36.540Z
 *                 pagination:
 *                   page: 1
 *                   limit: 20
 *                   total: 1
 *                   pages: 1
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", controller.list);

/**
 * @swagger
 * /api/files/{id}/view:
 *   get:
 *     summary: Increment a file view count
 *     description: Atomically increments viewCount and returns the updated file. This endpoint can be used when another user opens a file.
 *     tags:
 *       - Files
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 6aa298d8ccc2fb508a9f3620
 *     responses:
 *       200:
 *         description: File view count incremented successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: File viewed successfully.
 *               data:
 *                 id: 6aa298d8ccc2fb508a9f3620
 *                 filename: sample-20mb-video.mp4
 *                 viewCount: 1
 *                 enabled: true
 *       404:
 *         description: File not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id/view", controller.viewFile);

/**
 * @swagger
 * /api/files/{id}:
 *   get:
 *     summary: Get one file by ID
 *     description: Returns one enabled file owned by the authenticated user.
 *     tags:
 *       - Files
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         example: 6aa298d8ccc2fb508a9f3620
 *     responses:
 *       200:
 *         description: File retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: File retrieved successfully. }
 *                 data: { $ref: '#/components/schemas/File' }
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: File not found
 */
router.get("/:id", controller.getFileById);


/**
 * @swagger
 * /api/files/{id}:
 *   put:
 *     summary: Update file tags or replace the media file
 *     description: Send a new file, new tags, or both. The file and tags belong to the authenticated user.
 *     tags:
 *       - Files
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               tags:
 *                 type: string
 *                 example: nature,updated
 *     responses:
 *       200:
 *         description: File updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: File updated successfully. }
 *                 data: { $ref: '#/components/schemas/File' }
 *       400:
 *         description: Invalid update
 *       404:
 *         description: File not found
 *       401:
 *         description: Unauthorized
 */
router.put("/:id", upload.single("file"), validateFileForUpdate, controller.updateFile);

/**
 * @swagger
 * /api/files/{id}:
 *   patch:
 *     summary: Soft delete a file
 *     description: Sets enabled to false. The file is retained in the database but excluded from list and detail results.
 *     tags:
 *       - Files
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         example: 6aa298d8ccc2fb508a9f3620
 *     responses:
 *       200:
 *         description: File deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: File deleted successfully.
 *               data:
 *                 id: 6aa298d8ccc2fb508a9f3620
 *                 enabled: false
 *       404:
 *         description: File not found
 *       401:
 *         description: Unauthorized
 */
router.patch("/:id", controller.inactiveFile);

module.exports = router;
