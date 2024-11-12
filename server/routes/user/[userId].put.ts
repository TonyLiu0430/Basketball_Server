import prisma from '~~/lib/prisma';
import { isVaildEmail, isVaildName } from '~~/lib/util';

export default defineEventHandler(async (event) => {
    const userIdStr = getRouterParam(event, 'userId');

    if (userIdStr == undefined || isNaN(parseInt(userIdStr)) || isNaN(Number(userIdStr))) {
        throw createError({
            statusCode: 400,
            message: 'Invalid userId'
        })
    }

    const userId = parseInt(userIdStr);

    const user = await prisma.user.findUnique({
        where: {
            id: userId
        },
        select: {
            id: true
        }
    })

    if (user == null) {
        throw createError({
            statusCode: 404,
            message: `User ${userId} not found`
        })
    }

    if(event.context.userId != userId){
        throw createError({
            statusCode: 403,
            message: 'Forbidden'
        })
    }

    const { name, email } = await readBody(event) as {
        name: string | undefined,
        email: string | undefined
    }

    if (name == undefined || email == undefined) {
        throw createError({
            statusCode: 400,
            message: 'parameter name and email is required'
        })
    }

    //test name 特殊字元
    if (isVaildName(name) == false) {
        throw createError({
            statusCode: 400,
            message: 'Invalid name'
        })
    }

    if (isVaildEmail(email) == false) {
        throw createError({
            statusCode: 400,
            message: 'Invalid email'
        })
    }

    await prisma.user.update({
        where: {
            id: userId
        },
        data: {
            name,
            email
        },
        select: {
            id: true
        }
    })
});