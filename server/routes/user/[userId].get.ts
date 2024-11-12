import prisma from '~~/lib/prisma';

export default defineEventHandler(async (event) => {
    const userIdStr = getRouterParam(event, 'userId');

    if (userIdStr == undefined || isNaN(parseInt(userIdStr)) || isNaN(Number(userIdStr))) {
        throw createError({
            statusCode: 400,
            message: 'Invalid userId'
        })
    }

    const userId = parseInt(userIdStr);

    if(event.context.userId != userId){
        throw createError({
            statusCode: 403,
            message: 'Forbidden'
        })
    }

    const user = await prisma.user.findUniqueOrThrow({
        where: {
            id: userId
        },
        select: {
            id: true,
            email: true,
            name: true
        }
    })

    return user;
});