const otpGenerator = require('otp-generator');
const UserVerification = require('../Models/userVerificationModel');
const User = require('../Models/userModel');

const nodemailer = require('nodemailer');

const bcrypt = require('bcrypt');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL,
        pass: process.env.MAILPASS
    },
});

const sendOTP = async (email) => {
    try {
        // Generate a 4-digit OTP
        var OTP = otpGenerator.generate(4, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            digits: true,
            specialChars: false
        });

        const mailOptions = {
            from: process.env.MAIL,
            to: email,
            subject: "تأكيد البريد الإلكتروني - رمز OTP",
            html: `<p>رمز التحقق الخاص بك هو: <b>${OTP}</b>. الرجاء استخدام هذا الرمز لتأكيد بريدك الإلكتروني. ملاحظة: يُعتبر هذا الرمز صالحًا لمدة 15 دقيقة.</p>`
        };

        // Hash the OTP
        const saltRounds = 10;
        const hashedOTP = await bcrypt.hash(OTP, saltRounds);

        // Delete any existing OTPs for the email
        await deleteAllOTP(email);

        // Create a new OTP entry
        await UserVerification.create({
            userEmail: email,
            OTP: hashedOTP,
            expiry: Date.now() + 900000
        });

        // Send the email
        await transporter.sendMail(mailOptions);
        return "success";
    } catch (error) {
        let errorMessage = "حدث خطأاثناء إرسال رمز التحقق. الرجاء المحاولة مرة أخرى. الخطأ: " + error;
        return errorMessage;
    }
};

const verifyOTP = async (request, response) => {
    const OTP = request.body.OTP;
    const email = request.session.email;
    try {
        // Find the user verification record
        const userVerificationRecord = await UserVerification.findOne({
            userEmail: email
        });

        if (!userVerificationRecord) {
            request.flash('errorMessage', "انتهت صلاحية الرمز او لم تسجيل حساب بعد نرجو التسجيل من جديد.");
            request.session.email = null;
            return response.redirect('/signup');
        }

        const { expiry, OTP: hashedOTP } = userVerificationRecord;

        // Check if OTP is expired
        if (expiry < Date.now()) {
            await deleteAllOTP(email);
            request.flash('errorMessage', "انتهت صلاحية الرمز نرجو منك إعادة إنشاء الحساب.");
            request.session.email = null;
            return response.redirect('/signup');
        }

        // Compare the provided OTP with the stored hashed OTP
        const validOTP = await bcrypt.compare(OTP, hashedOTP);
        if (!validOTP) {
            request.flash('errorMessage', "رمز التحقق المدخل خطأ يرجى التأكد من صحة رمز التحقق.");
            return response.redirect('/OTP');
        }

        // Update user's verification status
        await User.updateOne({ email }, { verified: true });
        await deleteAllOTP(email);

        // Send confirmation email
        const mailOptions = {
            from: process.env.MAIL,
            to: email,
            subject: "مرحباً بك في ويب سيفت!",
            html: `<p>تم تأكيد بريدك الإلكتروني بنجاح. يمكنك الآن تسجيل الدخول إلى حسابك.</p>`
        };
        await transporter.sendMail(mailOptions);
        request.session.email = null;
        return response.redirect('/login');
    } catch (error) {
        request.flash('errorMessage', "حدث خطأ اثناء التحقق من الرمز، اذا حصل لك اكثر من مرة الرجاء التواصل معنا. الخطأ: " + error);
        return response.redirect('/signup');
    }
};

const resendOTP = async (request, response) => {
    const email = request.session.email
    try {
        // Check if there's an existing OTP record
        const userVerificationRecord = await UserVerification.findOne({
            userEmail: email
        });

        // Delete existing OTP records if any
        if (userVerificationRecord) {
            await deleteAllOTP(email);
        }

        // Generate a 4-digit OTP
        var OTP = otpGenerator.generate(4, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            digits: true,
            specialChars: false
        });

        const mailOptions = {
            from: process.env.MAIL,
            to: email,
            subject: "تأكيد البريد الإلكتروني - رمز OTP",
            html: `<p>رمز التحقق الخاص بك هو: <b>${OTP}</b>. الرجاء استخدام هذا الرمز لتأكيد بريدك الإلكتروني. ملاحظة: يُعتبر هذا الرمز صالحًا لمدة 15 دقيقة.</p>`
        };

        // Hash the OTP
        const saltRounds = 10;
        const hashedOTP = await bcrypt.hash(OTP, saltRounds);

        // Create a new OTP record
        await UserVerification.create({
            userEmail: email,
            OTP: hashedOTP,
            expiry: Date.now() + 900000
        });
        
        // Send the email
        await transporter.sendMail(mailOptions);
        request.flash('successMessage', "تم إرسال رمز التحقق مرة اخرى، الرجاء التحقق من بريدك الإلكتروني.");
        return response.redirect('/OTP');
    } catch (error) {
        request.flash('errorMessage', "حدث خطأ اثناء إعادة إرسال رمز التحقق وإنشاء الحساب، اذا حصل لك اكثر من مرة الرجاء التواصل معنا. الخطأ: " + error);
        return response.redirect('/signup');
    }
};


const deleteAllOTP = async (email) => {
    try {
        await UserVerification.deleteMany({ userEmail: email });
    } catch (error) {
        console.log(error);
    }
}
module.exports = {
    sendOTP,
    verifyOTP,
    resendOTP,
    deleteAllOTP
}