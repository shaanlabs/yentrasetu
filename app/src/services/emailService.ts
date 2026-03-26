/**
 * EmailJS Service
 * Client-side email sending using EmailJS (https://www.emailjs.com/).
 * 
 * To configure:
 * 1. Create an account on emailjs.com
 * 2. Create an email service and template
 * 3. Set the following environment variables in .env:
 *    VITE_EMAILJS_SERVICE_ID=service_xxxx
 *    VITE_EMAILJS_TEMPLATE_ID=template_xxxx
 *    VITE_EMAILJS_PUBLIC_KEY=xxxx
 */

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_demo';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_demo';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'demo_key';

interface EmailParams {
  to_email: string;
  to_name: string;
  subject: string;
  message: string;
  from_name?: string;
}

/**
 * Send email via EmailJS REST API (no SDK needed).
 * Falls back to console.log in dev mode if keys are not configured.
 */
export async function sendEmail(params: EmailParams): Promise<{ success: boolean; message: string }> {
  // Dev mode fallback
  if (SERVICE_ID === 'service_demo' || PUBLIC_KEY === 'demo_key') {
    console.log('📧 [DEV MODE] Email would be sent:', params);
    return { success: true, message: 'Email sent (dev mode — check console)' };
  }

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: SERVICE_ID,
        template_id: TEMPLATE_ID,
        user_id: PUBLIC_KEY,
        template_params: params,
      }),
    });

    if (response.ok) {
      return { success: true, message: 'Email sent successfully!' };
    }
    return { success: false, message: 'Failed to send email.' };
  } catch {
    return { success: false, message: 'Email service error.' };
  }
}

/**
 * Pre-built email templates for common actions.
 */
export const emailTemplates = {
  bookingConfirmation: (to: string, name: string, listingName: string, dates: string) =>
    sendEmail({ to_email: to, to_name: name, subject: `Booking Confirmed: ${listingName}`, message: `Your booking for ${listingName} (${dates}) has been confirmed.`, from_name: 'YantraSetu' }),

  contactSeller: (to: string, name: string, fromName: string, listingName: string, message: string) =>
    sendEmail({ to_email: to, to_name: name, subject: `Inquiry about ${listingName}`, message: `${fromName} is interested in ${listingName}: ${message}`, from_name: fromName }),

  welcomeEmail: (to: string, name: string) =>
    sendEmail({ to_email: to, to_name: name, subject: 'Welcome to YantraSetu!', message: `Hi ${name}, welcome to India's largest heavy equipment marketplace. Start browsing or list your first machine today!`, from_name: 'YantraSetu' }),
};
