const UserModel = require("../models/User");
const bcrypt = require('bcryptjs');
const ErrorHandler = require("../middlewares/error-middleware");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../utils/jwt");
class AuthService {

  // Keep the request body available to each authentication operation.
  constructor(req) {
    this.rquestBody = req?.body;
    this.email = req?.headers?.email;
  }

  /**
   * Creates a user account after checking that the email is unique.
   *
   * @returns {Promise<User>} The saved user document.
   */
  async register() {

    try {
      const { name, email, password } = this.rquestBody;
      const SALT_ROUNDS = 10;

      // Prevent multiple accounts from using the same email address.
      const exists = await UserModel.findOne({ email: email });
      if (exists) {
        const error = new Error("Email is already registered.");
        error.statusCode = 409;
        throw error;
      }

      // Never store the user's plain-text password in MongoDB.
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      return await UserModel.create({
        name: name.trim(),
        email: email.trim(),
        password: hashedPassword
      });

    } catch (error) {
      new ErrorHandler().customError(error);
    }
  }

  /**
   * Authenticates a user and creates access and refresh tokens.
   *
   * @returns {Promise<object>} User details and signed authentication tokens.
   */
  async login() {
    try {
      const { email, password } = this.rquestBody;

      // Normalize email so login is case-insensitive.
      const user = await UserModel.findOne({ email: email.trim().toLowerCase() })


      // Use the same message for an unknown email and a wrong password.
      if (!user) {
        const error = new Error("Invalid email or password.");
        throw error;
      }

      // Compare the supplied password with the stored bcrypt hash.
      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        const error = new Error("Invalid email or password.");
        throw error;
      }

      // Create a short-lived token for API requests.
      const accessToken = signAccessToken({ userId: user._id.toString() });

      // Create a longer-lived token used to obtain a new access token.
      const refreshToken = signRefreshToken({ userId: user._id.toString() });

      // Store the refresh token so it can be checked during rotation.
      user.refreshTokenHash = refreshToken;
      await user.save();

      return {
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        },
        accessToken,
        refreshToken
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verifies a refresh token and rotates both authentication tokens.
   *
   * @returns {Promise<object>} The new access and refresh tokens.
   */
  async refresh() {

    try {
      const { refreshToken } = this.rquestBody;

      if (!refreshToken) {
        const error = new Error("Refresh token required.");
        error.statusCode = 401;
        throw error;
      }

      let payload;
      try {
        // Decode and validate the refresh token signature and expiration.
        payload = verifyRefreshToken(refreshToken);
      } catch {
        const error = new Error("Invalid or expired refresh token.");
        error.statusCode = 401;
        throw error;
      }

      // Confirm the token is still the one stored for this user.
      const user = await UserModel.findById(payload.userId);

      if (!user || !user.refreshTokenHash || user.refreshTokenHash !== refreshToken) {
        const error = new Error("Refresh token is not valid.");
        error.statusCode = 401;
        throw error;
      }

      // Rotate tokens so the previous refresh token cannot be reused.
      const accessToken = signAccessToken({ userId: user._id.toString() });
      const newRefreshToken = signRefreshToken({ userId: user._id.toString() });

      // Store the replacement refresh token for the next rotation.
      user.refreshTokenHash = newRefreshToken;
      await user.save();

      return {
        accessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      console.log("Error in refresh:", error);
      throw error;
    }
  }

  /**
   * Invalidates the user's stored refresh token.
   *
   * @returns {Promise<boolean>} True when logout is complete.
   */
  async logout() {
    try {
      const { userId } = this.rquestBody;

      // Find the account before clearing its refresh token.
      const user = await UserModel.findById(userId);

      if (!user) {
        const error = new Error("User not found.");
        error.statusCode = 404;
        throw error;
      }

      // Clearing the token prevents future refresh requests.
      user.refreshTokenHash = null;
      await user.save();

      return true;
    } catch (error) {
      console.log("Error in logout:", error);
      throw error;
    }
  }



  /**
   * Retrieves public account details by user ID.
   *
   * @param {string} userId User document ID.
   * @returns {Promise<object>} User ID, name, and email.
   */
  async findUserById(userId) {
    try {
      // Do not return the password or refresh token fields.
      const user = await UserModel.findById(userId);

      if (!user) {
        const error = new Error("User not found.");
        error.statusCode = 404;
        throw error;
      }

      return {
        id: user._id,
        name: user.name,
        email: user.email
      }

    } catch (error) {
      console.log("Error in logout:", error);
      throw error;
    }

  }

  /**
   * Resets the password for an enabled user identified by the email header.
   *
   * @returns {Promise<boolean>} True when the password is updated.
   */
  async forgotPassword() {
    const { password } = this.rquestBody;
    const normalizedEmail = this.email.trim().toLowerCase();

    // Find only enabled accounts so disabled users cannot reset credentials.
    const user = await UserModel.findOne({
      email: normalizedEmail,
      enabled: true
    });

    if (!user) {
      const error = new Error("User with this email was not found.");
      error.statusCode = 404;
      throw error;
    }

    // Store only the bcrypt hash and invalidate existing refresh tokens.
    user.password = await bcrypt.hash(password, 10);
    user.refreshTokenHash = null;
    await user.save();

    return true;
  }
}



module.exports = AuthService;

