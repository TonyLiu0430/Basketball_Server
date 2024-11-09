import jwt from 'jsonwebtoken';
export default defineEventHandler(async (event) => {
    console.log('123')
    const jwtToken = event.headers.get('authorization');
    if (jwtToken == null) {
        return;
    }
    try {
        const userInfo = jwt.verify(jwtToken, process.env.AUTH_SECRET!) as {
            id: number,
            email: string
        };
        event.context.userId = userInfo.id;
        event.context.email = userInfo.email;
    }
    catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            throw createError({
                statusCode: 401,
                message: error.message
            });
        }
        else if (error instanceof jwt.TokenExpiredError) {
            throw createError({
                statusCode: 440,
                message: error.message
            });
        }
        else if (error instanceof jwt.NotBeforeError) {
            throw createError({
                statusCode: 503,
                message: error.message
            });
        }
        else {
            throw error
        }
    }
});