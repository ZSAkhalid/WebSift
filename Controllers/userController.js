const { request } = require('express');
const User = require('../Models/userModel');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');

const moment = require('moment');
const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET;
const bcrypt = require('bcrypt');

// Import OTP
const {
    sendOTP,
    deleteAllOTP
} = require('../Controllers/userVerificationController');



// Custom validator to check age
const checkAge = (value) => {
    const dateFormat = 'MM-DD-YYYY';
    const eighteenYearsAgo = moment().subtract(18, 'years');

    if (!moment(value, dateFormat, true).isValid()) {
        throw new Error('الرجاء إدخال تاريخ الميلاد بالصيغة الصحيحة.');
    }

    if (moment(value).isAfter(eighteenYearsAgo)) {
        throw new Error('يجب أن يكون العمر 18 عامًا أو أكثر.');
    }

    return true;
};

// Forms inputs validations
const validateLogin = getLoginValidation();
const validateSignup = getSignupValidation();
const validateUpdateProfile = getUpdateProfileValidation();
const validatePasswordChange = getPasswordChangeValidation();

// Login
const login = async (request, response) => {
    const errors = validationResult(request);
    const { email, password } = request.body;
    try {
        if (!errors.isEmpty()) {
            let errorMessages = {};
            errors.array().forEach((error) => {
                if (!errorMessages[error.path]) {
                    errorMessages[error.path] = error.msg;
                }
            });

            request.flash('errorMessages', errorMessages);
            request.flash('formValues', request.body);
            request.flash('errorMessage', "الرجاء التأكد من صحة البيانات المدخلة.");
            return response.redirect('/login');
        }

        const user = await User.findOne({ email: email });
        if (user === null || !user.verified) {
            request.flash('errorMessage', "البريد الإلكتروني أو كلمة المرور غير صحيحة.");
            request.flash('formValues', request.body);
            return response.redirect('/login');
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (passwordMatch) {
            const token = jwt.sign({ id: user._id }, secretKey, { expiresIn: '24h' });
            response.cookie('auth_token', token, { httpOnly: true, secure: process.env.NODE_ENV !== 'development' });
            const username = user.firstName;
            response.cookie('username', username, { httpOnly: false, secure: process.env.NODE_ENV !== 'development' });
            response.setHeader('Content-Security-Policy', "script-src 'self'");
            return response.redirect('/');
        } else {
            request.flash('errorMessage', "البريد الإلكتروني أو كلمة المرور غير صحيحة.");
            request.flash('formValues', request.body);
            return response.redirect('/login');
        }
    }
    catch (error) {
        request.flash('errorMessage', "حدث خطأ ما، الرجاء المحاولة مرة أخرى. اذا تكرر معك الخطأ الرجاء التواصل معنا. الخطأ: " + error);
        request.flash('formValues', request.body);
        return response.redirect('/login');
    }

}
// Create user
const signup = async (request, response) => {
    request.session.email = null;
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        let errorMessages = {};
        errors.array().forEach((error) => {
            if (!errorMessages[error.path]) {
                errorMessages[error.path] = error.msg;
            }
        });
        request.flash('errorMessages', errorMessages);
        request.flash('formValues', request.body);
        request.flash('errorMessage', "الرجاء التأكد من صحة البيانات المدخلة.");
        return response.redirect('/signup');
    } else {
        var { fname, lname, email, tel, password, dob } = request.body;
        var firstName = fname;
        var lastName = lname;
        var email = email;
        var phoneNumber = tel;
        var password = password;
        var dateOfBirth = dob;
        try {
            // Hash password
            const saltRounds = 10;
            password = await bcrypt.hash(password, saltRounds);
            // Check if email exists
            const searchedUser = await User.findOne({ email: email });
            if (searchedUser !== null) {
                // Check if email exists and the user is verified
                if (searchedUser.verified) {
                    request.flash('errorMessage', "البريد الإلكتروني مسجل مسبقاً.");
                    request.flash('formValues', request.body);
                    return response.redirect('/signup');
                } else {
                    // Delete all OTPs and the user
                    await deleteAllOTP(searchedUser._id);
                    await User.deleteOne({ email: email });
                }
            }
            // Create user
            const user = await User.create({ firstName, lastName, email, phoneNumber, dateOfBirth, password, verified: false });
            // Create OTP
            const state = await sendOTP(user.email);
            // Store the email in the session
            if (state === "success"){
                request.session.email = user.email;
                request.flash('successMessage', "تم إنشاء حسابك بنجاح، الرجاء التحقق من بريدك الإلكتروني لإكمال عملية التسجيل.");
                return response.redirect('/OTP');
            } else{
                request.flash('errorMessage', state);
                request.flash('formValues', request.body);
                return response.redirect('/signup');
            }
            
        } catch (error) {
            // Catch duplicate email error
            if (error.code === 11000) {
                request.flash('formValues', request.body);
                request.flash('errorMessage', "البريد الإلكتروني مسجل مسبقاً.");
                return response.redirect('/signup');
            } else {
                // Catch any other error
                request.flash('formValues', request.body);
                request.flash('errorMessage', "حدث خطأ ما، الرجاء المحاولة مرة أخرى. اذا تكرر معك الخطأ الرجاء التواصل معنا. الخطأ: " + error);
                return response.redirect('/signup');
            }
        }
    }
}

const updateProfile = async (request, response) => {
    const { firstName, lastName, email, dateOfBirth, phoneNumber } = request.body;
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        let errorMessages = {};
        errors.array().forEach((error) => {
            if (!errorMessages[error.path]) {
                errorMessages[error.path] = error.msg;
            }
        });
        request.flash('errorMessage', "الرجاء التأكد من صحة البيانات المدخلة.");
        return response.redirect('/account-management');
    }
    try {
        const token = request.cookies.auth_token;
        const userID = jwt.decode(token, secretKey).id;
        const user = await User.findById(userID);
        if (!user) {
            response.clearCookie('auth_token');
            response.clearCookie('username');
            request.flash('errorMessage', "Invalid token");
            return response.status(400).redirect('/login');
        }
        let isDataChanged = false;
        if (email && user.email !== email) {
            const searchedUsers = await User.find({ email: email });
            if (searchedUsers.length > 0) {
                request.flash('errorMessage', "البريد الإلكتروني مستخدم من قبل.");
                return response.status(400).redirect('/account-management');
            }
            user.email = email;
            isDataChanged = true;
        }
        if (firstName && user.firstName !== firstName) {
            user.firstName = firstName;
            isDataChanged = true;
        }
        if (lastName && user.lastName !== lastName) {
            user.lastName = lastName;
            isDataChanged = true;
        }
        if (dateOfBirth && new Date(user.dateOfBirth).getTime() !== new Date(dateOfBirth).getTime()) {
            user.dateOfBirth = dateOfBirth;
            isDataChanged = true;
        }

        if (phoneNumber && user.phoneNumber !== phoneNumber) {
            user.phoneNumber = phoneNumber;
            isDataChanged = true;
        }

        if (isDataChanged) {
            await user.save();
            request.flash('successMessage', "تم تحديث المعلومات بنجاح!");
            return response.redirect('/account-management');
        } else {
            request.flash('errorMessage', "لا يوجد تغييرات.");
            return response.redirect('/account-management');
        }
    } catch (error) {
        request.flash('errorMessage', "حدث خطأ اثناء تحديث المعلومات، اذا حصل لك اكثر من مرة الرجاء التواصل معنا. الخطأ: " + error);
        return response.status(400).redirect('/account-management');
    }
};

// Update password
const updatePassword = async (request, response) => {
    const { oldPassword, newPassword } = request.body;

    try {
        // Get user ID
        const token = request.cookies.auth_token;
        const userID = jwt.decode(token, secretKey).id;

        // Check if user exists
        const user = await User.findById(userID);
        if (!user) {
            response.clearCookie('auth_token');
            response.clearCookie('username');
            request.flash('errorMessage', "Invalid token");
            return response.status(400).redirect('/login');
        }

        // Check if current password is correct
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            request.flash('errorMessage', "كلمة المرور الحالية غير صحيحة.");
            return response.redirect('/account-management');
        }

        // Check if new password is the same as the old password
        if (oldPassword === newPassword) {
            request.flash('errorMessage', "كلمة المرور الجديدة مطابقة لكلمة المرور الحالية.");
            response.redirect('/account-management');
        }

        // Hash new password and update it
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedNewPassword;
        await user.save();
        response.clearCookie('auth_token');
        response.clearCookie('username');
        return response.redirect('/login');
    } catch (error) {
        request.flash('errorMessage', "حدث خطأ اثناء تحديث كلمة المرور، اذا حصل لك اكثر من مرة الرجاء التواصل معنا. الخطأ: " + error);
        return response.redirect('/account-management');
    }
};

// Get User's information
const getUserInfo = async (token) => {
    let userID = token;
    try {
        const user = await User.findById(userID);
        return { user: user };
    } catch (error) {
        return { user: null };
    }
};

// Login Validation
// Validates the information
function getLoginValidation() {
    return [
        body('email')
            .trim()
            .isLength({ min: 5, max: 50 }).withMessage('لايمكن للإيميل ان يكون اقصر من 5 او اكثر من 50 حرف.')
            .matches(/^[a-zA-Z0-9]+([.!#$%&'*+\-\/=?^_`{|}~]?[a-zA-Z0-9]+)?@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/).withMessage('الرجاء إدخال بريد إلكتروني صحيح.'),

        body('password')
            .trim()
            .isLength({ min: 8, max: 32 }).withMessage('لايمكن لكلمة المرور ان تكون اقصر من 8 او اكثر من 32 حرف.')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*_=+-]).*$/).withMessage('الرجاء كتابة كلمة مرور بالصيغة الصحيحة.')
    ]
}


// Signup Validation
function getSignupValidation() {
    return [
        body('fname')
            .trim()
            .isLength({ min: 2, max: 35 }).withMessage('لايمكن للإسم ان يكون اقصر من 2 او اكثر من 35 حرف.')
            .matches(/^[a-zA-Z\u0600-\u06FF]+(\s{0,1}[a-zA-Z\u0600-\u06FF]+)?$/).withMessage('الاسم لا يطابق الصيغة الصحيحة؛ يجب أن يحتوي فقط على حروف وإذا لزم الأمر، مسافة واحدة.'),

        body('lname')
            .trim()
            .isLength({ min: 2, max: 35 }).withMessage('لايمكن للإسم ان يكون اقصر من 2 او اكثر من 35 حرف.')
            .matches(/^[a-zA-Z\u0600-\u06FF]+(\s{0,1}[a-zA-Z\u0600-\u06FF]+)?$/).withMessage('الاسم لا يطابق الصيغة الصحيحة؛ يجب أن يحتوي فقط على حروف وإذا لزم الأمر، مسافة واحدة.'),

        body('email')
            .trim()
            .isLength({ min: 5, max: 50 }).withMessage('لايمكن للإيميل ان يكون اقصر من 5 او اكثر من 50 حرف.')
            .isEmail().withMessage('الرجاء إدخال بريد إلكتروني صحيح.'),

        body('password')
            .trim()
            .isLength({ min: 8, max: 32 }).withMessage('لايمكن لكلمة المرور ان تكون اقصر من 8 او اكثر من 32 حرف.')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*_=+-]).*$/)
            .withMessage('الرجاء كتابة كلمة مرور بالصيغة الصحيحة.'),

        body('tel')
            .trim()
            .isLength({ min: 10, max: 10 }).withMessage('رقم الهاتف يجب ان يتكون من 10 ارقام مبتأ ب05.')
            .isNumeric().withMessage('الرجاء ادخال ارقام فقط.')
            .matches(/^05[03456789][0-9]{7}$/).withMessage('الرجاء إدخال رقم هاتف صحيح.'),

        body('dob')
            .trim()
            .isLength({ min: 10, max: 10 }).withMessage('الرجاء إدخال تاريخ الميلاد بالصيغة الصحيحة.')
            .isISO8601().toDate().withMessage('الرجاء إدخال تاريخ الميلاد بالصيغة الصحيحة.')
            .custom(checkAge).withMessage('يجب أن يكون العمر 18 عامًا أو أكثر.')
    ]
}
// Reset Password Validation
function getPasswordChangeValidation() {
    return[
        body('oldPassword')
            .trim()
            .isLength({ min: 8, max: 32 }).withMessage('لايمكن لكلمة المرور ان تكون اقصر من 8 او اكثر من 32 حرف.')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*_=+-]).*$/).withMessage('الرجاء كتابة كلمة مرور بالصيغة الصحيحة.'),
        body('newPassword')
            .trim()
            .isLength({ min: 8, max: 32 }).withMessage('لايمكن لكلمة المرور ان تكون اقصر من 8 او اكثر من 32 حرف.')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*_=+-]).*$/).withMessage('الرجاء كتابة كلمة مرور بالصيغة الصحيحة.'),
        
    ]
}

// Update Profile Validation
function getUpdateProfileValidation() {
    return [
        body('firstName')
            .trim()
            .isLength({ min: 2, max: 35 }).withMessage('لايمكن للإسم ان يكون اقصر من 2 او اكثر من 35 حرف.')
            .matches(/^[a-zA-Z\u0600-\u06FF]+(\s{0,1}[a-zA-Z\u0600-\u06FF]+)?$/).withMessage('الاسم لا يطابق الصيغة الصحيحة؛ يجب أن يحتوي فقط على حروف وإذا لزم الأمر، مسافة واحدة.'),

        body('lastName')
            .trim()
            .isLength({ min: 2, max: 35 }).withMessage('لايمكن للإسم ان يكون اقصر من 2 او اكثر من 35 حرف.')
            .matches(/^[a-zA-Z\u0600-\u06FF]+(\s{0,1}[a-zA-Z\u0600-\u06FF]+)?$/).withMessage('الاسم لا يطابق الصيغة الصحيحة؛ يجب أن يحتوي فقط على حروف وإذا لزم الأمر، مسافة واحدة.'),

        body('phoneNumber')
            .trim()
            .isLength({ min: 10, max: 10 }).withMessage('رقم الهاتف يجب ان يتكون من 10 ارقام مبتأ ب05.')
            .isNumeric().withMessage('الرجاء ادخال ارقام فقط.')
            .matches(/^05[03456789][0-9]{7}$/).withMessage('الرجاء إدخال رقم هاتف صحيح.'),

        body('dateOfBirth')
            .trim()
            .isLength({ min: 10, max: 10 }).withMessage('الرجاء إدخال تاريخ الميلاد بالصيغة الصحيحة.')
            .isISO8601().toDate().withMessage('الرجاء إدخال تاريخ الميلاد بالصيغة الصحيحة.')
            .custom(checkAge).withMessage('يجب أن يكون العمر 18 عامًا أو أكثر.'),

        body('email')
            .trim()
            .isLength({ min: 5, max: 50 }).withMessage('لايمكن للإيميل ان يكون اقصر من 5 او اكثر من 50 حرف.')
            .isEmail().withMessage('الرجاء إدخال بريد إلكتروني صحيح.')
    ]
}

module.exports = {
    signup,
    login,
    updateProfile,
    updatePassword,
    getUserInfo,
    validateLogin,
    validateSignup,
    validateUpdateProfile,
    validatePasswordChange
};