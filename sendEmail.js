const nodemailer = require("nodemailer");
require('dotenv').config()

module.exports = async (email, subject, text) => {
	try {
		const transporter = nodemailer.createTransport({
			service:process.env.SERVICE,
            logger:true,
            debug:true,
            secureConnection :false,
            tls: {
                rejectUnauthorized: true
            },
			port: process.env.EMAIL_PORT,
			secure: true,
			auth: {
				user: process.env.USER,
				pass: process.env.PASS,
			},
		});
        console.log("hii")
		await transporter.sendMail({
			from: process.env.USER,
			to: email,
			subject: subject,
			text: text,
		});
		console.log("email sent successfully");
	} catch (error) {
		console.log("email not sent!");
		console.log(error);
		return error;
	}
};