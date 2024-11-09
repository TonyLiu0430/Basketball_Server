import prisma from '~~/lib/prisma';
import { isVaildEmail, timeDifference } from '~~/lib/util';
import jwt from 'jsonwebtoken';

export default defineEventHandler(async (event) => {
    const { email, token } = await readBody(event) as {
        email: string | undefined,
        token: string | undefined
    }

    if (email == undefined || isVaildEmail(email) == false) {
        throw createError({
            statusCode: 400,
            message: 'Invalid email'
        })
    }

    // SQL injection prevention
    if (token == undefined || isNaN(parseInt(token)) || isNaN(Number(token)) || token.length != 6){
        throw createError({
            statusCode: 400,
            message: 'Invalid token'
        })
    }


    const { time: tokenTime } = await prisma.loginToken.findUnique({
        where: {
            email_token: {
                email,
                token: parseInt(token)
            }
        },
        select: {
            time: true
        }
    }) ?? { time: null }
    
    if (tokenTime == null) {
        throw createError({
            statusCode: 400,
            message: 'Invalid token'
        })
    }
    
    const timeDiff = timeDifference(tokenTime);

    // 時限 5 分鐘
    if(timeDiff > 5){
        throw createError({
            statusCode: 400,
            message: 'Token expired'
        })
    }

    const user = await prisma.user.upsert({
        where: {
            email
        },
        update: {},
        create: {
            email
        },
        select: {
            id: true,
            email: true
        }
    })

    // 產生 JWT
    const jwtToken = jwt.sign({ id: user.id, email: user.email }, process.env.AUTH_SECRET!, {
        expiresIn: '45d'
    })

    return {
        jwtToken
    }
});