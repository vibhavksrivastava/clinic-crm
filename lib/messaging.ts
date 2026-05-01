import { Twilio } from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || '';
const client = new Twilio(accountSid, authToken);

export async function sendWhatsAppMessage(to: string, body: string) {
  try {
    const message = await client.messages.create({
      from: 'whatsapp:+14155238886',
      body: body,
      to: `whatsapp:${to}`
    });
    console.log('Message sent:', message.sid);
    return message.sid;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}