/**
 * Email service using Resend
 * 
 * Handles transactional emails for:
 * - Order confirmations
 * - Ticket delivery
 * - Payment receipts
 * - Refund notifications
 * - Event updates
 * 
 * Docs: https://resend.com/docs
 */

import { Resend } from 'resend'

// ─── Config ───────────────────────────────────────────────────────────────────

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? ''
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'Northstar <onboarding@resend.dev>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export const emailEnabled = !!RESEND_API_KEY && RESEND_API_KEY !== 're_...'

const resend = emailEnabled ? new Resend(RESEND_API_KEY) : null

// ─── Email Templates ──────────────────────────────────────────────────────────

interface OrderConfirmationData {
  customerName: string
  eventTitle: string
  eventDate: string
  eventVenue: string
  orderNumber: string
  ticketCount: number
  totalAmount: string
  myTicketsUrl: string
}

interface TicketDeliveryData {
  customerName: string
  eventTitle: string
  eventDate: string
  eventVenue: string
  tickets: Array<{
    typeName: string
    ticketCode: string
    qrUrl: string
  }>
  myTicketsUrl: string
}

interface RefundNotificationData {
  customerName: string
  eventTitle: string
  orderNumber: string
  refundAmount: string
  reason?: string
}

interface EventUpdateData {
  customerName: string
  eventTitle: string
  updateMessage: string
  eventUrl: string
}

// ─── Send Functions ───────────────────────────────────────────────────────────

export async function sendOrderConfirmation(
  to: string,
  data: OrderConfirmationData,
): Promise<{ success: boolean; error?: string }> {
  if (!emailEnabled || !resend) {
    console.log('[email] Skipping order confirmation (Resend not configured)')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Order Confirmation - ${data.eventTitle}`,
      html: renderOrderConfirmation(data),
    })
    return { success: true }
  } catch (err) {
    console.error('[email] Order confirmation failed:', err)
    return { success: false, error: String(err) }
  }
}

export async function sendTicketDelivery(
  to: string,
  data: TicketDeliveryData,
): Promise<{ success: boolean; error?: string }> {
  if (!emailEnabled || !resend) {
    console.log('[email] Skipping ticket delivery (Resend not configured)')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Your Tickets for ${data.eventTitle}`,
      html: renderTicketDelivery(data),
    })
    return { success: true }
  } catch (err) {
    console.error('[email] Ticket delivery failed:', err)
    return { success: false, error: String(err) }
  }
}

export async function sendRefundNotification(
  to: string,
  data: RefundNotificationData,
): Promise<{ success: boolean; error?: string }> {
  if (!emailEnabled || !resend) {
    console.log('[email] Skipping refund notification (Resend not configured)')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Refund Processed - ${data.eventTitle}`,
      html: renderRefundNotification(data),
    })
    return { success: true }
  } catch (err) {
    console.error('[email] Refund notification failed:', err)
    return { success: false, error: String(err) }
  }
}

export async function sendEventUpdate(
  to: string,
  data: EventUpdateData,
): Promise<{ success: boolean; error?: string }> {
  if (!emailEnabled || !resend) {
    console.log('[email] Skipping event update (Resend not configured)')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Event Update - ${data.eventTitle}`,
      html: renderEventUpdate(data),
    })
    return { success: true }
  } catch (err) {
    console.error('[email] Event update failed:', err)
    return { success: false, error: String(err) }
  }
}

// ─── HTML Templates ───────────────────────────────────────────────────────────

function renderOrderConfirmation(data: OrderConfirmationData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; padding: 30px 0; border-bottom: 2px solid #f0f0f0;">
    <h1 style="margin: 0; font-size: 24px; color: #111;">✅ Order Confirmed</h1>
  </div>
  
  <div style="padding: 30px 0;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.customerName},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Your order has been confirmed! We've received your payment and your tickets are being processed.
    </p>
    
    <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #111;">${data.eventTitle}</h2>
      <p style="margin: 5px 0; color: #666;">📅 ${data.eventDate}</p>
      <p style="margin: 5px 0; color: #666;">📍 ${data.eventVenue}</p>
    </div>
    
    <div style="margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Order Number:</strong> ${data.orderNumber}</p>
      <p style="margin: 5px 0;"><strong>Tickets:</strong> ${data.ticketCount}</p>
      <p style="margin: 5px 0;"><strong>Total Paid:</strong> ${data.totalAmount}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.myTicketsUrl}" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 500;">View My Tickets</a>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      Your tickets will be available in your account shortly. You'll receive another email with your ticket details.
    </p>
  </div>
  
  <div style="border-top: 2px solid #f0f0f0; padding: 20px 0; text-align: center; color: #999; font-size: 12px;">
    <p>Powered by Northstar</p>
    <p>${APP_URL}</p>
  </div>
</body>
</html>
  `.trim()
}

function renderTicketDelivery(data: TicketDeliveryData): string {
  const ticketsHtml = data.tickets.map(ticket => `
    <div style="background: #f9f9f9; border-radius: 8px; padding: 15px; margin: 10px 0;">
      <p style="margin: 5px 0; font-weight: 500;">${ticket.typeName}</p>
      <p style="margin: 5px 0; font-family: monospace; color: #666;">Ticket Code: ${ticket.ticketCode}</p>
    </div>
  `).join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Tickets</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; padding: 30px 0; border-bottom: 2px solid #f0f0f0;">
    <h1 style="margin: 0; font-size: 24px; color: #111;">🎟️ Your Tickets Are Ready!</h1>
  </div>
  
  <div style="padding: 30px 0;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.customerName},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Your tickets for <strong>${data.eventTitle}</strong> are now available!
    </p>
    
    <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 5px 0; color: #666;">📅 ${data.eventDate}</p>
      <p style="margin: 5px 0; color: #666;">📍 ${data.eventVenue}</p>
    </div>
    
    <h3 style="margin: 30px 0 15px 0;">Your Tickets:</h3>
    ${ticketsHtml}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.myTicketsUrl}" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 500;">View Full Tickets with QR Codes</a>
    </div>
    
    <div style="background: #fffbf0; border-left: 4px solid #ffcc00; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px;"><strong>Important:</strong> Save this email or screenshot your QR codes. You'll need them for entry at the event.</p>
    </div>
  </div>
  
  <div style="border-top: 2px solid #f0f0f0; padding: 20px 0; text-align: center; color: #999; font-size: 12px;">
    <p>Powered by Northstar</p>
    <p>${APP_URL}</p>
  </div>
</body>
</html>
  `.trim()
}

function renderRefundNotification(data: RefundNotificationData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Refund Processed</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; padding: 30px 0; border-bottom: 2px solid #f0f0f0;">
    <h1 style="margin: 0; font-size: 24px; color: #111;">💰 Refund Processed</h1>
  </div>
  
  <div style="padding: 30px 0;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.customerName},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Your refund for <strong>${data.eventTitle}</strong> has been processed.
    </p>
    
    <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Order Number:</strong> ${data.orderNumber}</p>
      <p style="margin: 5px 0;"><strong>Refund Amount:</strong> ${data.refundAmount}</p>
      ${data.reason ? `<p style="margin: 5px 0;"><strong>Reason:</strong> ${data.reason}</p>` : ''}
    </div>
    
    <div style="background: #f0f8ff; border-left: 4px solid #4a90e2; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px;">
        <strong>Note:</strong> It may take 5-10 business days for the refund to appear in your account, depending on your payment method.
      </p>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      If you have any questions about this refund, please contact the event organizer or our support team.
    </p>
  </div>
  
  <div style="border-top: 2px solid #f0f0f0; padding: 20px 0; text-align: center; color: #999; font-size: 12px;">
    <p>Powered by Northstar</p>
    <p>${APP_URL}</p>
  </div>
</body>
</html>
  `.trim()
}

function renderEventUpdate(data: EventUpdateData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Update</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; padding: 30px 0; border-bottom: 2px solid #f0f0f0;">
    <h1 style="margin: 0; font-size: 24px; color: #111;">📢 Event Update</h1>
  </div>
  
  <div style="padding: 30px 0;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.customerName},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      There's an important update about <strong>${data.eventTitle}</strong>:
    </p>
    
    <div style="background: #fffbf0; border-left: 4px solid #ffcc00; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-size: 16px;">${data.updateMessage}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.eventUrl}" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 500;">View Event Details</a>
    </div>
  </div>
  
  <div style="border-top: 2px solid #f0f0f0; padding: 20px 0; text-align: center; color: #999; font-size: 12px;">
    <p>Powered by Northstar</p>
    <p>${APP_URL}</p>
  </div>
</body>
</html>
  `.trim()
}
