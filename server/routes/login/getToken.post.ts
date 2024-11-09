import prisma from '~~/lib/prisma'
import { isVaildEmail, timeDifference} from '~~/lib/util';
import otpGenerator from 'otp-generator';
import { EmailClient } from '@azure/communication-email';
import { EXPIREDTIME } from '~~/lib/tokenExpireConfig';

export default defineEventHandler(async (event) => {
    //刪除逾期token
    const loginTokenTableSize = await prisma.loginToken.count();
    if (loginTokenTableSize > 100) {
        await prisma.loginToken.deleteMany({
            where: {
                time: {
                    lt: new Date(new Date().getTime() - EXPIREDTIME * 3 * 60000)
                }
            },
        })
    }

    const { email } = await readBody(event) as {
        email : string | undefined
    }
    
    if (email == undefined || isVaildEmail(email) == false) {
        throw createError({
            statusCode: 400,
            message: 'Invalid email'
        })
    }

    const {requestTime, times} = await prisma.loginEmailfrequency.upsert({
        where: {
            email
        },
        update: {
            times: {
                increment: 1
            }
        },
        create: {
            email,
            requestTime: new Date()
        },
        select: {
            requestTime: true,
            times: true
        }
    })

    const timeDiff = timeDifference(requestTime);

    if (timeDiff < EXPIREDTIME * 2 && times > 5) {
        throw createError({
            statusCode: 429,
            message: 'Too many requests'
        })
    }

    if (timeDiff > EXPIREDTIME * 2) {
        await prisma.loginEmailfrequency.update({
            where: {
                email
            },
            data: {
                requestTime: new Date(),
                times: 1
            },
            select: null
        })
    }

    const token = otpGenerator.generate(6, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false
    });

    await prisma.loginToken.upsert({
        where: {
            email_token: {
                email,
                token: parseInt(token)
            }
        },
        update: {
            time: new Date()
        },
        create: {
            email,
            token: parseInt(token),
            time: new Date()
        },
        select: null
    })

    const emailClient = new EmailClient(process.env.COMMUNICATION_SERVICES_CONNECTION_STRING!);
    const poller = await emailClient.beginSend({
        senderAddress: process.env.EMAIL!,
        content: {
            subject: '台北大學籃球聯盟APP 登錄驗證碼',
            html:
                `<h1>您的登錄驗證碼是</h1><br>
                <h2>${token}</h2>
                <p>此驗證碼將在 5 分鐘後失效</p>`
        },
        recipients: {
            to: [{address: email}]
        }
    })

    const emailResponse = await poller.pollUntilDone();
    
    if (emailResponse.error != undefined) {
        throw createError({
            statusCode: 500,
            message: 'Failed to send email',
        })
    }
    
    return {success: true}
});