const path = require("path");
const mongoose = require("mongoose");
const File = require("../models/File");
const { uploadMedia, destroyMedia } = require("./cloudinary.service");
const { normalizeTags } = require("../validators/file.validator");
const { calculateScore } = require("../utils/ranking");
class FileService {
  // Keep request data and the authenticated user available to every service method.
  constructor(req) {
    this.req = req;
    this.userId = req?.headers?.userId;

    // Aggregation pipelines do not receive Mongoose's automatic ObjectId casting.
    this.databaseUserId = mongoose.Types.ObjectId.isValid(this.userId)
      ? new mongoose.Types.ObjectId(this.userId)
      : this.userId;
  }


  /**
   * Uploads a file to Cloudinary and saves its metadata in MongoDB.
   *
   * @returns {Promise<File>} The saved file document.
   */
  async uploadFile() {
    const { file, body } = this.req;

    // Convert the tags received from the request into a normalized array.
    const tags = normalizeTags(body.tags);

    // Upload the file to Cloudinary and get its uploaded file details.
    const cloud = await uploadMedia(file);

    try {
      // Save the file metadata and Cloudinary information in MongoDB.
      const saved = await File.create({
        userId: this.userId,
        filename: file.originalname,
        publicId: cloud.publicId,
        url: cloud.url,
        resourceType: cloud.resourceType,
        mimeType: file.mimetype,
        extension: path.extname(file.originalname).toLowerCase(),
        size: file.size,
        tags: tags
      });

      return saved;
    } catch (error) {
      await destroyMedia(cloud.publicId, cloud.resourceType).catch(() => { });

      throw error;
    }
  }

  /**
   * Get all files for the authenticated user with optional
   * search, date, type, pagination and sorting support.
   *
   * @returns {Promise<File>} Files list with pagination details.
   */
  async getFiles() {
    const { page, limit, search, from, to, type, sort, view } = this.req.query;

    // If sort is not provided:
    // - Use relevance sorting when a search query is present.
    // - Otherwise, show the newest files first.
    const requestedSort = sort || (search?.trim() ? "relevance" : "newest");

    try {
      // Build the MongoDB filter.
      // Only return enabled files belonging to the authenticated user.

      //view==all then send user all files except his own upload  he see other upload ed things

      const filter = {
        ...(view === "all"
          ? { userId: { $ne: this.databaseUserId } }
          : { userId: this.databaseUserId }),
        enabled: true,
        ...this.buildSearchFilter(search, from, to, type)
      };

      // Make sure page is at least 1.
      const safePage = Math.max(Number(page) || 1, 1);

      // Make sure limit is between 1 and 100.
      const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

      /*
       * SEARCH + RELEVANCE
       *
       * MongoDB handles:
       * 1. Filtering
       * 2. Relevance score calculation
       * 3. Sorting
       * 4. Pagination
       *
       * This prevents all matching documents from being
       * loaded into Node.js.
       */
      if (search?.trim() && requestedSort === "relevance") {
        const query = search.trim().toLowerCase();
        const pipeline = [
          // Filter matching files first.
          {
            $match: filter
          },

          /*
           * Calculate the search relevance score.
           *
           * Filename:
           * Exact match  = 100 points
           * Starts with   = 60 points
           * Contains       = 35 points
           *
           * Tags:
           * Exact match   = 50 points
           */
          {
            $addFields: {
              relevanceScore: {
                $add: [
                  // Exact filename match.
                  {
                    $cond: [{
                      $eq: [{ $toLower: "$filename" }, query]
                    }, 100, 0]
                  },

                  // Filename starts with the search query.
                  {
                    $cond: [{
                      $regexMatch: { input: { $toLower: "$filename" }, regex: query }
                    }, 35, 0]
                  },

                  // Exact tag match.
                  {
                    $cond: [{ $in: [query, "$tags"] }, 50, 0]
                  }
                ]
              }
            }
          },

          /*
           * Highest relevance score appears first.
           *
           * createdAt is used as a tie-breaker when
           * multiple files have the same relevance score.
           */
          {
            $sort: {
              relevanceScore: -1,
              createdAt: -1
            }
          },

          // Skip files from previous pages.
          {
            $skip: (safePage - 1) * safeLimit
          },

          // Return only the requested number of files.
          {
            $limit: safeLimit
          }
        ];
        // MongoDB returns only the requested page.
        const items = await File.aggregate(pipeline);

        // Count total matching files for pagination.
        const total = await File.countDocuments(filter);

        return {
          items,
          pagination: {
            page: safePage,
            limit: safeLimit,
            total,
            pages: Math.ceil(total / safeLimit)
          }
        };
      }

      /*
       * NORMAL SORTING
       *
       */
      let sortOption = {
        createdAt: -1
      };

      // Oldest files first.
      if (requestedSort === "oldest") {
        sortOption = {
          createdAt: 1
        };

        // Most viewed files first.
        // createdAt is used as a tie-breaker.
      } else if (requestedSort === "popular") {
        sortOption = {
          viewCount: -1,
          createdAt: -1
        };
      }

      /*
       * Get only the requested page from MongoDB.
       *
       * Promise.all() executes the file query and count query
       * at the same time.
       */
      const [items, total] = await Promise.all([
        File.find(filter)
          .sort(sortOption)
          .skip((safePage - 1) * safeLimit)
          .limit(safeLimit),

        File.countDocuments(filter)
      ]);

      return {
        items,
        pagination: {
          page: safePage,
          limit: safeLimit,
          total,
          pages: Math.ceil(total / safeLimit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  buildSearchFilter(search, from, to, type) {
    const filter = {};

    // Search both the original filename and every value in the tags array.
    if (search?.trim()) {
      const regex = new RegExp(this.escapeRegex(search.trim()), "i");

      filter.$or = [{ filename: regex }, { tags: regex }];
    }

    // Restrict results to one supported media type when requested.
    if (type) {
      filter.resourceType = type;
    }

    // Build an inclusive date range for the file creation timestamp.
    if (from || to) {
      filter.createdAt = {};

      if (from) {
        const start = new Date(from);
        start.setHours(0, 0, 0, 0);

        filter.createdAt.$gte = start;
      }

      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);

        filter.createdAt.$lte = end;
      }
    }
    console.log(filter);

    return filter;
  }

  // Escape user input before putting it into a regular expression.
  escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Finds one enabled file owned by the authenticated user.
   *
   * @param {string} id File document ID.
   * @returns {Promise<File>} The matching file document.
   */
  async getFileById(id) {
    try {
      const file = await File.findOne({ _id: id, enabled: true });

      if (!file) {
        const error = new Error("File not found.");
        error.statusCode = 404;
        throw error;
      }
      return file;
    } catch (error) {
      throw error;
    }
  }

  async viewFile(id) {
    // $inc performs an atomic database increment, so simultaneous views do
    // not overwrite each other when multiple users open the same file.
    const file = await File.findOneAndUpdate(
      { _id: id, enabled: true },
      { $inc: { viewCount: 1 } },
      { new: true }
    );

    if (!file) {
      const error = new Error("File not found.");
      error.statusCode = 404;
      throw error;
    }

    return file;
  }

  /**
   * Updates tags, replaces the media asset, or performs both operations.
   *
   * @param {string} id File document ID.
   * @returns {Promise<File>} The updated file document.
   */
  async updateFile(id) {
    try {
      const { file, body } = this.req;

      // Tags are optional when the request includes a replacement file.
      const tags = body.tags;

      const existingFile = await this.getFileById(id);

      if (!file && (tags === undefined || tags.length === 0)) {
        throw new Error("Nothing to update");
      }

      // Update tags only when the client sends the tags field.
      if (tags !== undefined) {
        existingFile.tags = normalizeTags(tags);
      }

      // Update media file and remove the old Cloudinary asset after the
      // database record has been successfully updated.
      if (file) {
        const oldPublicId = existingFile.publicId;
        const oldResourceType = existingFile.resourceType;
        // Upload the replacement before changing the existing database record.
        const uploadedFile = await uploadMedia(file);

        existingFile.publicId = uploadedFile.publicId;
        existingFile.url = uploadedFile.url;
        existingFile.resourceType = uploadedFile.resourceType;
        existingFile.mimeType = file.mimetype;
        existingFile.extension = path.extname(file.originalname).toLowerCase();
        existingFile.size = file.size;
        existingFile.filename = file.originalname;

        try {
          // Save the new metadata before deleting the old Cloudinary asset.
          await existingFile.save();
          await destroyMedia(oldPublicId, oldResourceType).catch(() => { });
        } catch (error) {
          // Remove the new asset if the database update fails.
          await destroyMedia(uploadedFile.publicId, uploadedFile.resourceType).catch(() => { });
          throw error;
        }

        return existingFile;
      }

      await existingFile.save();

      return existingFile;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Soft-deletes a file by disabling it instead of removing its record.
   *
   * @param {string} id File document ID.
   * @returns {Promise<File>} The disabled file document.
   */
  async inactiveFile(id) {
    try {
      const file = await this.getFileById(id);

      if (!file) {
        throw new Error("File not found");
      }

      if (!file.enabled) {
        throw new Error("File is already deleted");
      }

      file.enabled = false;

      await file.save();

      return file;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = FileService;
