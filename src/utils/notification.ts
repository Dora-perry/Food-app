import { accountSid, authToken, fromAdminMail, fromAdminPhone, GMAIL_PASS, GMAIL_USER, userSubject } from '../config'
import nodemailer from 'nodemailer'
import { string } from 'joi'
import { response } from 'express'

export const GenerateOTP = () => {
    const otp = Math.floor(1000 + Math.random() * 9000)
    const expiry = new Date()


    expiry.setTime(new Date().getTime() + (30 * 60 * 1000))
    return { otp, expiry }

}

export const onRequestOTP = async (otp: number, toPhoneNumber: string) => {
    
    const client = require('twilio')(accountSid, authToken);
    const response = await client.messages.create({
        body: `Your otp is ${otp}`,
        to: toPhoneNumber,
        from: fromAdminPhone
    })
    return response
}
// service and host are the same

const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
})


export const mailsent = async (
    from: string,
    to: string,
    subject: string,
    html: string
) => {
    try {
        await transport.sendMail({
            from: fromAdminMail, to, subject:
                userSubject, html

        })
        return response;
    } catch (error) {
        console.log(error);

    }
}

export const emailHtml = (otp: number): string => {
    let response = `
    <div style="max-width:700px; margin:auto; border:10px solid #ddd; padding:50px 20px; font-size:110%;">
    <h2 style="text-align:center; text-transform: uppercase; color:teal;">Welcome to My food App</h2>
    <p>Hi there, your otp is ${otp}</p>
    </div>
    `
    return response
}

//GenerateOTP()