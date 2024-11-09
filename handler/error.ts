import { H3Error, H3Event } from 'h3';

export default defineNitroErrorHandler((error: H3Error, event : H3Event) => {
    console.error(error.stack)

    setResponseStatus(event, error.statusCode || 503)
    setResponseHeader(event, 'Content-Type', 'application/json')
    
    return send(event, JSON.stringify({
        statusCode: error.statusCode || 503,
        message: error.message,
        data: error.data
    }))
})