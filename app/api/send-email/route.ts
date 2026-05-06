import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_MAIL_PROVIDER);

export async function POST(request: Request) {
    try {
        const apiKey = process.env.RESEND_MAIL_PROVIDER;
        console.log("API Key present:", !!apiKey);

        if (!apiKey) {
            console.error("RESEND_API_KEY is missing");
            return NextResponse.json({ error: 'Server configuration error: Missing API Key' }, { status: 500 });
        }

        const { to, subject, html } = await request.json();
        console.log("Attempting to send email to:", to);

        if (!to || !subject || !html) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const data = await resend.emails.send({
            from: 'Find My Pet <noreply@kiopio.com>',
            to: to,
            subject: subject,
            html: html,
        });

        if (data.error) {
            console.error("Resend API Error:", data.error);
            return NextResponse.json({ error: data.error }, { status: 500 });
        }

        console.log("Email sent successfully:", data);
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Unexpected Error sending email:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
