import prisma from '~~/lib/prisma'
import isVaildEmail from '~~/lib/util';
import otpGenerator from 'otp-generator';
import { EmailClient }  from '@azure/communication-email';

const emailClient = new EmailClient(process.env.COMMUNICATION_SERVICES_CONNECTION_STRING!);

export default defineEventHandler(async (event) => {
    //刪除逾期token
    await prisma.loginToken.deleteMany({
        where: {
            time: {
                lt: new Date(new Date().getTime() - 5 * 60 * 1000)
            }
        }
    })


    const { email } = await readBody(event) as {
        email : string
    }
    
    if (isVaildEmail(email) == false) {
        throw createError({
            statusCode: 400,
            message: 'Invalid email'
        })
    }
    const loginUser = await prisma.loginEmailfrequency.findUnique({
        where: {
            email
        }
    })
    if (loginUser == null) {
        await prisma.loginEmailfrequency.create({
            data: {
                email,
                requestTime: new Date(),
            }
        });
    }
    else {
        const { requestTime, times } = await prisma.loginEmailfrequency.findUnique({
            where: {
                email
            },
            select: {
                requestTime: true,
                times: true
            }
        })
        const currentTime = new Date();
        const timeDifference = (currentTime.getTime() - requestTime.getTime()) / 60000;
        if (timeDifference < 10 && times > 5) {
            throw createError({
                statusCode: 429,
                message: 'Too many requests'
            })
        }
        if (timeDifference < 10) {
            await prisma.loginEmailfrequency.update({
                where: {
                    email
                },
                data: {
                    times: {
                        increment: 1
                    }
                }
            })
        }
        else {
            await prisma.loginEmailfrequency.update({
                where: {
                    email
                },
                data: {
                    requestTime: new Date(),
                    times: 1
                }
            })
        }
    }

    const token = otpGenerator.generate(6, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false
    });


    await prisma.loginToken.create({
        data: {
            email,
            token,
            time: new Date()
        }
    })

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
    
    if (emailResponse.status === 'Failed') {
        throw createError({
            statusCode: 500,
            message: 'Failed to send email'
        })
    }
    
    return {success: true}
});