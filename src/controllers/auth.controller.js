const AuthService = require("../services/auth.service");
const { success } = require("../utils/response");

const ErrorHandler = require("../middlewares/error-middleware")



module.exports.register = async (req, res) => {
  const authService = new AuthService(req);
  try {
    const savedUser = await authService.register();
    return success(res, null, "User registered successfully.");
  } catch (err) {
    const handler = new ErrorHandler(req, res);
    handler.error(err);
  }
}

module.exports.login = async (req, res) => {
  const authService = new AuthService(req);
  try {
    const loginUserDetails = await authService.login();
    return success(res, loginUserDetails, "User logged in successfully.");
  } catch (err) {
    const handler = new ErrorHandler(req, res);
    handler.error(err);
  }
}

module.exports.forgotPassword = async (req, res) => {
  const authService = new AuthService(req);
  try {
    await authService.forgotPassword();
    return success(res, null, "Password updated successfully.");
  } catch (err) {
    const handler = new ErrorHandler(req, res);
    handler.error(err);
  }
}

module.exports.refresh = async (req, res) => {
  const authService = new AuthService(req);
  try {
    const updateToken = await authService.refresh();
    return success(res, updateToken, "User token refreshed successfully.");
  } catch (err) {
    const handler = new ErrorHandler(req, res);
    handler.error(err);
  }
}

module.exports.logout = async (req, res) => {
  const authService = new AuthService(req);
  try {
    await authService.logout();
    return success(res, null, "User logged out successfully.");
  } catch (err) {
    const handler = new ErrorHandler(req, res);
    handler.error(err);
  }
}

module.exports.findUserById = async (req, res) => {
  const authService = new AuthService(req);
  try {
    const userDetails = await authService.findUserById(req.params.userId);
    return success(res, userDetails, "User found successfully.");
  } catch (err) {
    const handler = new ErrorHandler(req, res);
    handler.error(err);
  }
}

