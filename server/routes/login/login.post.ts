import prisma from '~~/lib/prisma';
import isVaildEmail from '~~/lib/util';
import jwt from 'jsonwebtoken';

export default defineEventHandler(async (event) => {
    const { email, token } = await readBody(event) as {
        email: string
        token: string
    }
    if (isVaildEmail(email) == false) {
        throw createError({
            statusCode: 400,
            message: 'Invalid email'
        })
    }
    if(isNaN(Number(token)) || token.length != 6){
        throw createError({
            statusCode: 400,
            message: 'Invalid token'
        })
    }

    const loinInfo = await prisma.loginToken.findMany({
        where: {
            email,
            token
        },
        orderBy: {
            time: 'desc'
        }
    })

    if(loinInfo.length == 0){
        throw createError({
            statusCode: 400,
            message: 'Invalid token'
        })
    }

    const currentTime = new Date();
    
    const timeDifference = (currentTime.getTime() - loinInfo[0].time.getTime()) / 60000;

    // 時限 5 分鐘
    if(timeDifference > 5){
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