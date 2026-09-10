class Handler {
    constructor(request, response) {
        this.response = response;
        this.request = request;
    }

    notFound(req, res) {
        console.log(req.method, req.originalUrl);
        res.status(404).json({
            success: false,
            message: `Route not found: ${req.method} ${req.originalUrl}`
        });
    }

    // ❌ Error response
    error(error, statusCode = 400) {
        return this.response.status(statusCode).json({
            success: false,
            error: error.message || "Request failed",
            data: error.data || null
        });
    }

    customError(error) {
        switch (error.name) {
            case "ValidationError":
                const errorMessages = Object.values(error.errors).map(err =>
                    err.message.replace(/^ValidationError:\s\w+:\s/, "")
                );
                error.message = errorMessages.join(", ");
                throw error;

            default:
                throw error;
        }
    }
}

module.exports = Handler;
