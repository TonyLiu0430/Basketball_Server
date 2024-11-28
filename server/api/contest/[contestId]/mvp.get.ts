import prisma from '~~/lib/prisma';

export default defineEventHandler(async (event) => {
    const idStr = getRouterParam(event, 'contestId')

    if (idStr == undefined || isNaN(parseInt(idStr)) || isNaN(Number(idStr))) {
        throw createError({
            statusCode: 400,
            message: 'Invalid contest id'
        })
    }

    const contestId = parseInt(idStr)
    const topPlayer = await prisma.performance.findFirst({
        where: {
            player_to_contest: {
                contestId
            }
        },
        orderBy: {
            score: 'desc'// 根據 score 排序，'desc' 表示降序（最高分在前）
        },
        select: {
            playerId: true
        }
    });
    
    if (!topPlayer) {
        throw createError({
            statusCode: 404,
            message: 'No player found'
        });
    }
    
    return topPlayer.playerId
});