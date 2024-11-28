import prisma from '~~/lib/prisma';

export default defineEventHandler(async (event) => {
    const playerIdStr = getRouterParam(event, 'playerId');
    const contestIdStr = getRouterParam(event, 'contestId');

    if (playerIdStr == undefined || isNaN(parseInt(playerIdStr)) || isNaN(Number(playerIdStr))) {
        throw createError({
            statusCode: 400,
            message: 'Invalid playerId'
        });
    }

    if (contestIdStr == undefined || isNaN(parseInt(contestIdStr)) || isNaN(Number(contestIdStr))) {
        throw createError({
            statusCode: 400,
            message: 'Invalid contestId'
        });
    }

    const playerId = parseInt(playerIdStr);
    const contestId = parseInt(contestIdStr);

    const { performance } = await prisma.player_to_contest.findUnique({
        where: {
            playerId_contestId: {
                playerId: playerId,
                contestId: contestId,
            },
        },
        select: {
            performance: {
                omit: {
                    id: true,
                    playerId: true
                }
            }
        }
    }) ?? {};

    if (!performance) {
        throw createError({
            statusCode: 404,
            message: 'Performance not found'
        });
    }

    
    return performance
})