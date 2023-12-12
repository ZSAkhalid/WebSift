const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const validateContactForm = getContactValidation();

function handleContact(request, response) {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        let errorMessages = {};
        errors.array().forEach((error) => {
            if (!errorMessages[error.path]) {
                errorMessages[error.path] = error.msg;
            }
        });
        request.flash('errorMessages', errorMessages);
        response.redirect('/contactus');
    } else {
        return sendForm(request, response);
    }
}


function sendForm(request, response){
    var fname = request.body.fname;
    var lname = request.body.lname;
    var from = request.body.email;
    var subject = request.body.subject;
    var body = request.body.message;


    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.MAIL,
          pass: process.env.MAILPASS
        },
    });
    

    const mailOptions = {
        from: process.env.MAIL,
        to: process.env.MAIL,
        subject: subject,
        text: `First name: ${fname}\nLast name: ${lname}\nEmail: ${from}\nMessage: ${body}`,
    };
  
  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return response.status(500).send(error.toString());
    }
    return response.render('postForm', {sender_name: fname});
  });

}



function getContactValidation() {
    return [
        body('fname').trim().isLength({ min: 2, max: 35 }).withMessage('الإسم الأول يجب ان لا يتعدى 35 حرف وان يكون حرف على الأقل.')
            .matches(/^(?=.{2,35}$)[a-zA-Z\u0600-\u06FF]+(\s{0,1}[a-zA-Z\u0600-\u06FF]+)?$/).withMessage('الأسم الأول يجب ان يحتوي على احرف ومسافات فقط.'),
        body('lname').trim().isLength({ min: 2, max: 35 }).withMessage('الإسم الأخير يجب ان لا يتعدى 35 حرف وان يكون حرف على الأقل.')
            .matches(/^(?=.{2,35}$)[a-zA-Z\u0600-\u06FF]+(\s{0,1}[a-zA-Z\u0600-\u06FF]+)?$/).withMessage('الأسم الأخير يجب ان يحتوي على احرف ومسافات فقط.'),
        body('email').trim().isEmail().withMessage('الإيميل غير صحيح.')
            .isLength({ min: 5, max: 50 }).withMessage('يجب ان لايتعدى الإيميل 50 ولا يقل عن 5 احرف.'),
        body('subject').trim().notEmpty().withMessage('الموضوع مطلوب.')
            .isIn(['general-inquiry', 'technical-issues', 'report-issues', 'suggestions', 'account-support', 'language-support'])
            .withMessage('الموضوع المختار يحب ان يكون من القائمة وان لا يكون فارغ.'),
        body('message').trim().isLength({ min: 1, max: 255 }).withMessage('الرسالة يجب ان لاتتعدى 255 حرف وان لا تقل عن حرف.')
        .matches(/^(?=.{1,255}$)[a-zA-Z0-9\u0600-\u06FF,.?!:;'-]+(\s*[a-zA-Z0-9\u0600-\u06FF,.?!:;'-]+)*$/).withMessage('الرسالة تحتوي على رموز غير مسموح بها.')
    ]
}


module.exports = {
    handleContact,
    validateContactForm
}