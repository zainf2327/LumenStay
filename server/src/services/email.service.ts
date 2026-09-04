import { Resend } from 'resend';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export interface BookingEmailData {
  guestName: string;
  guestEmail: string;
  confirmationCode: string;
  propertyName: string;
  propertyAddress?: string;
  propertyPhone?: string;
  propertyEmail?: string;
  roomTypeName: string;
  ratePlanName: string;
  checkInDate: string;
  checkOutDate: string;
  totalNights: number;
  adultCount: number;
  childCount: number;
  assignedRoomNumber?: string;
  specialRequests?: string | null;
  nightlyRate: number;
  subtotal: number;
  taxAmount: number;
  resortFee: number;
  grandTotal: number;
  cardLast4?: string;
}

export class EmailService {
  private resend: Resend | null = null;

  constructor() {
    if (config.resendApiKey) {
      this.resend = new Resend(config.resendApiKey);
      logger.info('📧 [Resend] Email service initialized with API Key.');
    } else {
      logger.warn('📧 [Resend] RESEND_API_KEY is not set. Outgoing emails will be simulated and logged in console.');
    }
  }

  /**
   * Format date for luxurious presentation: "Thu, Oct 15, 2026"
   */
  private formatDate(dateStr: string): string {
    try {
      const d = new Date(dateStr + 'T12:00:00');
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  /**
   * Generate an ultra-premium, responsive HTML email template for LumenStay
   */
  private generateBookingConfirmationHtml(data: BookingEmailData): string {
    const formattedCheckIn = this.formatDate(data.checkInDate);
    const formattedCheckOut = this.formatDate(data.checkOutDate);
    const lookupUrl = `${config.corsOrigin}/lookup?code=${encodeURIComponent(data.confirmationCode)}`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Reservation Confirmation — ${data.confirmationCode}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F7F4EE;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1C1815;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    td {
      padding: 0;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #F7F4EE;
      padding: 40px 0;
    }
    .main-card {
      background-color: #FFFFFF;
      margin: 0 auto;
      max-width: 600px;
      border: 1px solid #DDD7CD;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(28, 24, 21, 0.06);
    }
    .header {
      background-color: #1C1815;
      padding: 36px 40px;
      text-align: center;
      color: #F7F4EE;
    }
    .header-badge {
      display: inline-block;
      font-size: 11px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #D4AF37;
      margin-bottom: 8px;
      font-weight: 600;
    }
    .header-title {
      font-family: "Playfair Display", Georgia, "Times New Roman", serif;
      font-size: 28px;
      font-weight: normal;
      margin: 0;
      letter-spacing: -0.5px;
      color: #F7F4EE;
    }
    .content {
      padding: 36px 40px;
    }
    .greeting {
      font-family: "Playfair Display", Georgia, serif;
      font-size: 20px;
      color: #1C1815;
      margin: 0 0 12px 0;
    }
    .intro-text {
      font-size: 14px;
      line-height: 1.6;
      color: #736B63;
      margin: 0 0 28px 0;
    }
    .itinerary-box {
      background-color: #FAF8F5;
      border: 1px solid #E5E0D8;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 28px;
    }
    .code-badge {
      display: inline-block;
      background-color: #FAF6EE;
      border: 1px solid #ECE2CE;
      color: #8C621E;
      font-size: 13px;
      font-family: monospace;
      font-weight: bold;
      padding: 4px 10px;
      border-radius: 6px;
      margin-top: 4px;
    }
    .info-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #8C827A;
      margin-bottom: 4px;
    }
    .info-val {
      font-size: 15px;
      font-weight: 600;
      color: #1C1815;
    }
    .divider {
      height: 1px;
      background-color: #E5E0D8;
      margin: 20px 0;
    }
    .ledger-table {
      width: 100%;
      margin-top: 12px;
    }
    .ledger-row td {
      padding: 8px 0;
      font-size: 13px;
      color: #4A433D;
    }
    .ledger-row.total td {
      padding-top: 14px;
      border-top: 1px solid #DDD7CD;
      font-size: 15px;
      font-weight: bold;
      color: #1C1815;
    }
    .paid-badge {
      background-color: #EBF4EF;
      border: 1px solid #C8E3D4;
      color: #236446;
      font-size: 12px;
      font-weight: bold;
      padding: 6px 12px;
      border-radius: 6px;
      display: inline-block;
      margin-top: 6px;
    }
    .cta-button {
      display: block;
      background-color: #1C1815;
      color: #F7F4EE !important;
      text-align: center;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      margin: 32px 0 24px 0;
    }
    .footer {
      background-color: #F4EFE6;
      border-top: 1px solid #DDD7CD;
      padding: 24px 40px;
      text-align: center;
      font-size: 12px;
      color: #8C827A;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <div class="main-card">
            
            <!-- Luxury Header -->
            <div class="header">
              <div class="header-badge">LUMENSTAY SANCTUARIES</div>
              <h1 class="header-title">Reservation Confirmed</h1>
            </div>

            <!-- Content Area -->
            <div class="content">
              <h2 class="greeting">Dear ${data.guestName},</h2>
              <p class="intro-text">
                We are delighted to confirm your upcoming stay at <strong>${data.propertyName}</strong>.
                Your retreat has been reserved, and our hospitality team is already preparing for your arrival.
              </p>

              <!-- Booking Summary Box -->
              <div class="itinerary-box">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td width="50%" valign="top" style="padding-bottom: 16px;">
                      <div class="info-label">Confirmation Code</div>
                      <div class="code-badge">${data.confirmationCode}</div>
                    </td>
                    <td width="50%" valign="top" style="padding-bottom: 16px;">
                      <div class="info-label">Status</div>
                      <span class="paid-badge">✓ Confirmed & Paid</span>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2"><div class="divider" style="margin: 4px 0 16px 0;"></div></td>
                  </tr>
                  <tr>
                    <td width="50%" valign="top" style="padding-bottom: 16px;">
                      <div class="info-label">Check-In</div>
                      <div class="info-val">${formattedCheckIn}</div>
                      <div style="font-size: 12px; color: #736B63; margin-top: 2px;">From 4:00 PM</div>
                    </td>
                    <td width="50%" valign="top" style="padding-bottom: 16px;">
                      <div class="info-label">Check-Out</div>
                      <div class="info-val">${formattedCheckOut}</div>
                      <div style="font-size: 12px; color: #736B63; margin-top: 2px;">Until 11:00 AM</div>
                    </td>
                  </tr>
                  <tr>
                    <td width="50%" valign="top">
                      <div class="info-label">Suite Type</div>
                      <div class="info-val">${data.roomTypeName}</div>
                      <div style="font-size: 12px; color: #736B63;">Suite #${data.assignedRoomNumber || 'Assigned on arrival'}</div>
                    </td>
                    <td width="50%" valign="top">
                      <div class="info-label">Guests & Duration</div>
                      <div class="info-val">${data.totalNights} Night${data.totalNights > 1 ? 's' : ''}</div>
                      <div style="font-size: 12px; color: #736B63;">${data.adultCount} Adult${data.adultCount > 1 ? 's' : ''}${data.childCount > 0 ? `, ${data.childCount} Child` : ''}</div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Itemized Folio Billing -->
              <div class="info-label" style="margin-bottom: 8px;">Payment & Folio Summary</div>
              <table class="ledger-table" border="0" cellspacing="0" cellpadding="0">
                <tr class="ledger-row">
                  <td>Nightly Rate (${data.totalNights} night${data.totalNights > 1 ? 's' : ''} @ $${data.nightlyRate.toFixed(2)})</td>
                  <td align="right" style="font-family: monospace;">$${data.subtotal.toFixed(2)}</td>
                </tr>
                <tr class="ledger-row">
                  <td>State & Lodging Taxes (12%)</td>
                  <td align="right" style="font-family: monospace;">$${data.taxAmount.toFixed(2)}</td>
                </tr>
                <tr class="ledger-row">
                  <td>Property Resort & Amenity Fee</td>
                  <td align="right" style="font-family: monospace;">$${data.resortFee.toFixed(2)}</td>
                </tr>
                <tr class="ledger-row total">
                  <td>Total Paid (Card ending in ${data.cardLast4 || '4242'})</td>
                  <td align="right" style="font-family: monospace; color: #236446;">$${data.grandTotal.toFixed(2)} USD</td>
                </tr>
              </table>

              ${data.specialRequests ? `
                <div style="margin-top: 24px; padding: 16px; background-color: #FAF8F5; border-radius: 8px; border: 1px solid #E5E0D8;">
                  <div class="info-label">Special Requests on File</div>
                  <div style="font-size: 13px; color: #1C1815; margin-top: 4px;">"${data.specialRequests}"</div>
                </div>
              ` : ''}

              <!-- Self-Service Action CTA -->
              <a href="${lookupUrl}" class="cta-button" target="_blank">
                Manage Reservation & View Folio →
              </a>

              <p style="font-size: 12px; line-height: 1.6; color: #8C827A; margin: 0; text-align: center;">
                Need to modify your stay or request early check-in? Use your confirmation code <strong>${data.confirmationCode}</strong> in our Guest Portal or contact the front desk.
              </p>
            </div>

            <!-- Footer -->
            <div class="footer">
              <strong>${data.propertyName}</strong><br>
              ${data.propertyAddress ? `${data.propertyAddress}<br>` : ''}
              ${data.propertyPhone ? `Tel: ${data.propertyPhone} • ` : ''} Concierge: ${data.propertyEmail || 'concierge@lumenstay.com'}<br>
              <span style="font-size: 11px; margin-top: 8px; display: inline-block;">© 2026 Lumen Hospitality Group LLC. All rights reserved.</span>
            </div>

          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Send a booking confirmation email via Resend
   */
  public async sendBookingConfirmation(data: BookingEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const subject = `Your Reservation is Confirmed: ${data.propertyName} (Code: ${data.confirmationCode})`;
    const html = this.generateBookingConfirmationHtml(data);

    if (!this.resend || !config.isResendConfigured) {
      logger.info(`📧 [Resend Simulated] Sending confirmation email for #${data.confirmationCode} to ${data.guestEmail}`);
      logger.info(`📧 [Resend Simulated Subject]: "${subject}"`);
      return {
        success: true,
        messageId: `sim_${Date.now()}_${data.confirmationCode}`,
      };
    }

    try {
      let fromAddress = config.resendFromEmail || 'LumenStay <onboarding@resend.dev>';
      let response = await this.resend.emails.send({
        from: fromAddress,
        to: data.guestEmail,
        subject,
        html,
      });

      // If custom from-domain is unverified in Resend, automatically fallback to verified onboarding@resend.dev
      if (response.error && (response.error.message?.includes('not verified') || response.error.message?.includes('domain'))) {
        logger.warn(`⚠️ [Resend Domain Notice]: ${response.error.message}. Retrying with verified sender onboarding@resend.dev...`);
        fromAddress = 'LumenStay <onboarding@resend.dev>';
        response = await this.resend.emails.send({
          from: fromAddress,
          to: data.guestEmail,
          subject,
          html,
        });
      }

      if (response.error) {
        logger.error(`❌ [Resend API Error]: ${response.error.message}`);
        return {
          success: false,
          error: response.error.message,
        };
      }

      logger.info(`✅ [Resend Success] Confirmation email sent to ${data.guestEmail} for reservation ${data.confirmationCode}. ID: ${response.data?.id}`);

      return {
        success: true,
        messageId: response.data?.id,
      };
    } catch (err: any) {
      logger.error(`❌ [Resend Failed] Could not dispatch email: ${err.message}`);
      return {
        success: false,
        error: err.message,
      };
    }
  }
}

export const emailService = new EmailService();
