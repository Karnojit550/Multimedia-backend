function success(res, data, message = "Success") {
  const response = {
    success: true,
    message
  };

  if (data !== null && data !== undefined) {
    response.data = data;
  }

  return res.status(200).json(response);
}

module.exports = { success };
