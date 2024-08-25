const Joi = require('joi');
const CustomErrorHandler = require('../services/CustomErrorHandler');
const QuickEnquiry = require('../models/quickEnquiry');
const sendEmail = require('../middleware/emailMiddleware');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

const quickEnquiryController = {
  async register(req, res, next) {
    const registerSchema = Joi.object({
      businessname: Joi.string().allow(null, '').optional(),
      price: Joi.string().allow(null, '').optional(),
      reservations: Joi.string().allow(null, '').optional(),
      name: Joi.string().min(3).max(30).required(),
      phoneno: Joi.string().length(10).required(),
      email: Joi.string().email().required(),
      message: Joi.string(),
    });

    const { error } = registerSchema.validate(req.body);
    if (error) {
      return next(error);
    }

    const { businessname, price, reservations, name, phoneno, email, message } = req.body;

    try {
      const newQuickEnquiry = new QuickEnquiry({
        businessname,
        price,
        reservations,
        name,
        phoneno,
        email,
        message,
      });

      const result = await newQuickEnquiry.save();
      if (result) {
        // Send email to the user
        const userSubject = 'Thank you for your quick enquiry!';
        const userMessage = `
          <html>
            <head>
              <style>
                body {
                  font-family: Arial, sans-serif;
                }
                .container {
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  background-color: #e0e0e0;
                  border-radius: 8px;
                  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                h1 {
                  color: #333;
                }
                p {
                  color: #555;
                  line-height: 1.6;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Thank you for your quick enquiry!</h1>
                <p>Dear ${name},</p>
                <p>Your enquiry has been received. We will review it and get back to you soon.</p>
                <p>We look forward to assisting you further. Thank you!</p>
                <p>Best regards,<br> The Vector Instruments Team</p>
              </div>
            </body>
          </html>
        `;
        await sendEmail(email, userSubject, userMessage);

        // Send email to the admin
        const adminSubject = 'New quick enquiry submission';
        const adminMessage = `
          <h4>A new quick enquiry has been submitted:</h4>
          <table style="border-collapse: collapse; width: 100%;">
            <tr>
              <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;"><strong>Name:</strong></td>
              <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${name}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;"><strong>Email:</strong></td>
              <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${email}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;"><strong>Phone No:</strong></td>
              <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${phoneno}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;"><strong>Business Name:</strong></td>
              <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${businessname}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;"><strong>Price:</strong></td>
              <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${price}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;"><strong>Reservations:</strong></td>
              <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${reservations}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;"><strong>Message:</strong></td>
              <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${message}</td>
            </tr>
          </table>
        `;
        await sendEmail(ADMIN_EMAIL, adminSubject, adminMessage, true);

        return res.status(200).json({ message: 'Data inserted successfully' });
      }
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = quickEnquiryController;
