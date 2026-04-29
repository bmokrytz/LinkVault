import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (email: string, token: string): Promise<boolean> => {
    const template = `
    <h1>Click the link below to verify your email address.</h1>
    <a href="https://www.linkvault.ca/verify?token=${token}">Verify</a>
    `;
    const { data, error } = await resend.emails.send({
        from: `noreply@linkvault.ca`,
        to: [`${email}`],
        subject: "Email verification",
        html: template,
    });

    if (error) {
        console.error(`Resend error: ${error}`);
        return false;
    }
    return true;
};