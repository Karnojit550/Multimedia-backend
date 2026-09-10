const FileService = require("../services/file.service");
const { success } = require("../utils/response");

const ErrorHandler = require("../middlewares/error-middleware")



module.exports.upload = async (req, res) => {
  const fileService = new FileService(req);
  try {
    const savedFile = await fileService.uploadFile();
    return success(res, savedFile, "File uploaded successfully.");
  } catch (err) {
    const handler = new ErrorHandler(req, res);
    handler.error(err, err.statusCode || 400);
  }
}

module.exports.list = async (req, res) => {
  const fileService = new FileService(req);
  try {
    const savedFile = await fileService.getFiles();
    return success(res, savedFile, "Files retrieved successfully.");
  } catch (err) {
    const handler = new ErrorHandler(req, res);
    handler.error(err, err.statusCode || 400);
  }
};

module.exports.getFileById = async (req, res) => {
  const fileService = new FileService(req);
  try {
    const savedFile = await fileService.getFileById(req.params.id);
    return success(res, savedFile, "File retrieved successfully.");
  } catch (err) {
    const handler = new ErrorHandler(req, res);
    handler.error(err, err.statusCode || 400);
  }
};

module.exports.updateFile = async (req, res) => {
  const fileService = new FileService(req);
  try {
    const savedFile = await fileService.updateFile(req.params.id);
    return success(res, savedFile, "File updated successfully.");
  } catch (err) {
    const handler = new ErrorHandler(req, res);
    handler.error(err, err.statusCode || 400);
  }
};

module.exports.inactiveFile = async (req, res) => {
  const fileService = new FileService(req);
  try {
    const savedFile = await fileService.inactiveFile(req.params.id);
    return success(res, savedFile, "File deleted successfully.");
  } catch (err) {
    const handler = new ErrorHandler(req, res);
    handler.error(err, err.statusCode || 400);
  }
};
module.exports.viewFile = async (req, res) => {
  const fileService = new FileService(req);
  try {
    const savedFile = await fileService.viewFile(req.params.id);
    return success(res, savedFile, "File viewed successfully.");
  } catch (err) {
    const handler = new ErrorHandler(req, res);
    handler.error(err, err.statusCode || 400);
  }
};

