const ErrorHandler = require("../middlewares/error-middleware");

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateRegister(req, res, next) {
  const { name, email, password } = req.body || {};

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return new ErrorHandler(req, res).error({ message: "Name must be at least 2 characters." });
  }

  if (!email || typeof email !== "string" || !validateEmail(email)) {
    return new ErrorHandler(req, res).error({ message: "Valid email is required." });
  }

  if (!password || typeof password !== "string" || password.length < 8) {
    return new ErrorHandler(req, res).error({ message: "Password must be at least 8 characters." });
  }

  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body || {};

  if (!email || !validateEmail(email) || !password) {
    return new ErrorHandler(req, res).error({ message: "Valid email and password are required." });
  }

  next();
}

function validateForgotPassword(req, res, next) {
  const email = req.headers.email;
  const { password } = req.body || {};

  // Read the account email from the request header as required by this endpoint.
  if (!email || !validateEmail(email)) {
    return new ErrorHandler(req, res).error({ message: "A valid email header is required." });
  }

  // Require a new password with the same minimum length as registration.
  if (!password || typeof password !== "string" || password.length < 8) {
    return new ErrorHandler(req, res).error({ message: "Password must be at least 8 characters." });
  }

  next();
}

function validateFindUserById(req, res, next) {
  const { userId } = req.params;

  if (!userId) {
    return new ErrorHandler(req, res).error({ message: "User ID is required." });
  }

  next();
}




module.exports = {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateFindUserById
};
