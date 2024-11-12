import jwt from 'jsonwebtoken';
import prisma from '~~/lib/prisma';


export default defineEventHandler(async (event) => {
    const jwtToken = event.headers.get('authorization');
    if (jwtToken == null || jwtToken == '') {
        return;
    }
    try {
        const {id, email} = jwt.verify(jwtToken, process.env.AUTH_SECRET!) as {
            id: number,
            email: string
        };
        
        //just for ensure
        //remove in production
        await prisma.user.findUniqueOrThrow({
            where: {
                id,
                email
            },
            select: {
                id: true
            }
        })
        
        event.context.userId = id;
        event.context.email = email;
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