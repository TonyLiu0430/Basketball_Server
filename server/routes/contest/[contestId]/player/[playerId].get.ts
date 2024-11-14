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

    const player = await prisma.player.findUniqueOrThrow({
        where: {
            id: playerId,
        },
        select: {
            id: true,
            name: true,
            number: true,
            team: {
                select: {
                    name: true,
                },
            },
            player_to_contest: { 
                where: {
                    id: contestId, 
                },
                include: {
                    performance: {
                        select: {
                            two_point_made: true,
                            two_point_missed: true,
                            three_point_made: true,
                            three_point_missed: true,
                            free_throw_made: true,
                            free_throw_missed: true,
                            rebound_offensive: true,
                            rebound_defensive: true,
                            block: true,
                            steal: true,
                            assist: true,
                            foul: true,
                            mistake: true,
                            score: true,
                        },
                    },
                },
            },
        },
    });

    if (!player.player_to_contest || player.player_to_contest.length === 0) {
        throw createError({
            statusCode: 404,
            message: 'No matching contest found for the player'
        });
    }

    return player;
})