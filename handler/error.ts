export default defineNitroErrorHandler((error, event) => {
    console.error(error.stack)

    setResponseStatus(event, error.statusCode || 503)
    setResponseHeader(event, 'Content-Type', 'application/json')
    
    return send(event, JSON.stringify({
        statusCode: error.statusCode || 503,
        message: error.message,
        data: error.data
    }))
})