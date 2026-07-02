const nodemailer = require('nodemailer');

// Build email template HTML
function buildEmailHtml(customerName, orderId, status, note = '') {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e5e5; border-radius: 8px;">
      <h2 style="color: #4F46E5; margin-bottom: 20px;">Last-Mile Delivery Tracker</h2>
      <p>Hello <strong>${customerName}</strong>,</p>
      <p>Your order status has been updated. Here are the details:</p>
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
        <p style="margin: 5px 0;"><strong>New Status:</strong> <span style="background-color: #E0E7FF; color: #4338CA; padding: 4px 8px; border-radius: 9999px; font-size: 0.875rem; font-weight: 600;">${status}</span></p>
        ${note ? `<p style="margin: 5px 0; color: #4b5563;"><strong>Note:</strong> ${note}</p>` : ''}
      </div>
      <p>Thank you for using our last-mile delivery services!</p>
      <hr style="border: 0; border-top: 1px solid #e5e5e5; margin: 20px 0;" />
      <p style="font-size: 0.75rem; color: #9ca3af; text-align: center;">This is an automated notification. Please do not reply directly to this email.</p>
    </div>
  `;
}

async function sendStatusEmail(toEmail, customerName, orderId, status, note = '') {
  const subjects = {
    CREATED: 'Order Confirmed',
    ASSIGNED: 'Agent Assigned to Your Order',
    PICKED_UP: 'Package Picked Up',
    IN_TRANSIT: 'Your Package is In Transit',
    OUT_FOR_DELIVERY: 'Out for Delivery Today',
    DELIVERED: 'Package Delivered Successfully',
    FAILED: 'Delivery Failed — Reschedule Required',
    RESCHEDULED: 'Delivery Rescheduled',
  };

  const subject = `[Order ${orderId}] ${subjects[status] || 'Status Update'}`;

  // Check if credentials exist
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn(`[Mail Service] Credentials missing. Skipping email send for Order ${orderId} (Status: ${status}).`);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: toEmail,
      subject: subject,
      html: buildEmailHtml(customerName, orderId, status, note),
    });
    console.log(`[Mail Service] Email sent to ${toEmail} for Order ${orderId}.`);
  } catch (error) {
    console.error(`[Mail Service] Failed to send email to ${toEmail} for Order ${orderId}:`, error.message);
  }
}

module.exports = { sendStatusEmail };
