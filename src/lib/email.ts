import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendTenderInvitation(
  supplierEmail: string,
  supplierName: string,
  tenderDetails: {
    productName: string
    units: number
    paymentCondition: string
    expiresAt: Date
  },
  inviteLink: string
) {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: supplierEmail,
    subject: `Tender Invitation - ${tenderDetails.productName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Tender Invitation</h2>
        <p>Dear ${supplierName},</p>
        <p>You have been invited to participate in a live tender for:</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #555;">${tenderDetails.productName}</h3>
          <p><strong>Units:</strong> ${tenderDetails.units}</p>
          <p><strong>Payment Condition:</strong> ${tenderDetails.paymentCondition}</p>
          <p><strong>Expires:</strong> ${tenderDetails.expiresAt.toLocaleString()}</p>
        </div>
        
        <p>Click the link below to participate in this live tender:</p>
        <a href="${inviteLink}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0;">
          Join Live Tender
        </a>
        
        <p><strong>Important:</strong> This is a live tender where you can see real-time competition and adjust your bid accordingly. Make sure to submit your best offer before the deadline.</p>
        
        <p>Best regards,<br>Bravah Tender System</p>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error('Email sending failed:', error)
    return { success: false, error }
  }
}

export async function sendWinnerNotification(
  supplierEmail: string,
  supplierName: string,
  awardDetails: {
    productName: string
    units: number
    winningPrice: number
    paymentCondition: string
    deliveryDays?: number | null
    warrantyMonths?: number | null
  }
) {
  const deliveryInfo = awardDetails.deliveryDays ? `${awardDetails.deliveryDays} days` : 'As specified'
  const warrantyInfo = awardDetails.warrantyMonths ? `${awardDetails.warrantyMonths} months` : 'Standard'

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: supplierEmail,
    subject: `🎉 Congratulations! You Won the Tender - ${awardDetails.productName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10B981, #34D399); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🏆 Congratulations!</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">You have won the tender!</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; line-height: 1.6;">Dear ${supplierName},</p>
          
          <p style="font-size: 16px; line-height: 1.6;">
            We are pleased to inform you that your bid has been selected as the winning proposal for the following tender:
          </p>
          
          <div style="background: #f9fafb; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10B981;">
            <h3 style="margin-top: 0; color: #374151; font-size: 20px;">${awardDetails.productName}</h3>
            <div style="display: grid; gap: 10px;">
              <p style="margin: 5px 0;"><strong>Winning Price:</strong> <span style="color: #10B981; font-size: 18px; font-weight: bold;">$${awardDetails.winningPrice.toFixed(2)}</span></p>
              <p style="margin: 5px 0;"><strong>Units:</strong> ${awardDetails.units}</p>
              <p style="margin: 5px 0;"><strong>Payment Terms:</strong> ${awardDetails.paymentCondition}</p>
              <p style="margin: 5px 0;"><strong>Delivery Time:</strong> ${deliveryInfo}</p>
              <p style="margin: 5px 0;"><strong>Warranty Period:</strong> ${warrantyInfo}</p>
            </div>
          </div>
          
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
            <h4 style="margin-top: 0; color: #92400e;">📋 Next Steps:</h4>
            <ul style="color: #92400e; line-height: 1.8;">
              <li>Our team will contact you within 24 hours to finalize the contract details</li>
              <li>Please prepare all necessary documentation and certifications</li>
              <li>Ensure your delivery schedule aligns with the committed timeframe</li>
              <li>Quality standards and warranty terms as specified in your bid will apply</li>
            </ul>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Thank you for your competitive offer and we look forward to a successful partnership.
          </p>
          
          <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              Best regards,<br>
              <strong>Bravah Tender Management System</strong><br>
              <a href="mailto:${process.env.SMTP_USER}" style="color: #3b82f6;">${process.env.SMTP_USER}</a>
            </p>
          </div>
        </div>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error('Winner notification email failed:', error)
    return { success: false, error }
  }
}