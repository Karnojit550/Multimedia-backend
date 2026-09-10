const JWT = require('jsonwebtoken');
const config = require("../config/env");

function checkHeader(request, response, next) {
  const authenticationHeader = request.headers.authorization; // Get the Authorization header
  const originalUrl = request.originalUrl; // Get the request's original URL

  // If the route requires no authentication, move to the next middleware
  if (isOmittedRoute(originalUrl)) {
    return next();
  }

  // If no Authorization header is present, respond with 401 Unauthorized
  if (!authenticationHeader) {
    return response.status(401).json(
      {
        status: false,
        error: "Request is unauthorized. Authentication header missing."
      }
    );
  }

  // Check the authorization token validity
  const data = checkAuthorizationToken(authenticationHeader, response);

  if (!data) {
    return;
  }

  // Process the authentication token and move to the next middleware
  ExtractHeaderInformation(request, response, next, authenticationHeader);
}


async function ExtractHeaderInformation(request, response, next, authenticationHeader) {
  // Remove "Bearer" prefix from the token
  const Token = authenticationHeader.replace("Bearer ", "");

  // Verify and decrypt the token using the configured secret
  const DecryptedToken = JWT.verify(Token, config.accessSecret);
  // Add decrypted data to request headers for further use
  request.headers.userId = DecryptedToken.userId;

  // Proceed to the next middleware
  next();
}



function isOmittedRoute(url) {
  // Define static routes that should be omitted from all checks
  const staticRoutes = [
    "/api/v1/users/login",
    "/api/v1/users/register",
  ];

  // Define dynamic route patterns that should be omitted
  const dynamicRoutes = [];

  // Check if the URL matches any static route
  if (staticRoutes.some(route => url.startsWith(route))) {
    return true;
  }

  // Check if the URL matches any dynamic route pattern
  for (const route of dynamicRoutes) {
    if (route.test(url)) {
      return true;
    }
  }

  // If no match is found, the route is not omitted
  return false;
}


// Check authorization token validity
function checkAuthorizationToken(token, response) {
  token = token.replaceAll("Bearer ", "");

  try {
    // Verify and decrypt the token using the configured secret
    const decryptedToken = JWT.verify(token, config.accessSecret);
    return decryptedToken;
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      console.log("Token has expired.");
      response.status(417).json({ status: false, error: "Authorization token expired!" });
    } else {
      console.log("Token verification failed:", error.message);
      response.status(417).json({ status: false, error: "Authorization token expired!" });
    }

    return null;
  }
}

module.exports = checkHeader;