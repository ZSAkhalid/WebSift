const express = require("express");
const path = require("path");
const router = express.Router();
const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET;
const mongoose = require('mongoose');

// Import OTP
const {
    sendOTP,
    verifyOTP,
    resendOTP
} = require('../Controllers/userVerificationController');

// Validation modules
const {
    handleContact,
    validateContactForm
} = require('../Utils/formHandler');

// User controller
const {
    signup,
    login,
    updateProfile,
    updatePassword,
    getUserInfo,
    validateLogin,
    validateSignup,
    validateUpdateProfile,
    validatePasswordChange
} = require('../Controllers/userController');

// Analysis controller
const {
    request_history,
    validateWebsiteAccessibility,
    delete_history
} = require('../Controllers/requestController');
const { send } = require("process");
const { error } = require("console");

// Middleware to verify token
const isLoggedIn = (request, response, next) => {
    const token = request.cookies.auth_token;
    if (!token) {
        return response.status(403).redirect('/login');
    }
    try {
        const decoded = jwt.verify(token, secretKey);
        if (!mongoose.Types.ObjectId.isValid(decoded)) {
            throw new Error("Invalid user ID");
        }
    } catch (error) {
        response.clearCookie('auth_token');
        response.clearCookie('username');
        request.flash('errorMessage', "Invalid token");
        return response.status(400).redirect('/login');
    }
    return next();
};

const isNotLoggedIn = (request, response, next) => {
    const token = request.cookies.auth_token;

    if (!token) {
        return next();
    }
    else {
        return response.redirect('/');
    }
};

// Delete token
router.get('/logout', isLoggedIn, (request, response) => {
    response.clearCookie('auth_token');
    response.clearCookie('username');
    response.redirect('/');
});

router.get('^/$|/index', (request, response) => {

    response.render('index');

});

// Login
router.get('/login', isNotLoggedIn, (request, response) => {
    const errorMessages = request.flash('errorMessages');
    const errorMessage = request.flash('errorMessage');
    const formValues = request.flash('formValues');
    return response.render('login', {
        errorMessage: errorMessage.length > 0 ? errorMessage[0] : null,
        errorMessages: errorMessages.length > 0 ? errorMessages[0] : [],
        formValues: formValues.length > 0 ? formValues[0] : {}
    });
});

// Login post request
router.post('/login', isNotLoggedIn, validateLogin, login);

// Signup page
router.get('/signup', isNotLoggedIn, (request, response) => {
    const errorMessages = request.flash('errorMessages');
    const errorMessage = request.flash('errorMessage');
    const formValues = request.flash('formValues');
    return response.render('signup', {
        errorMessage: errorMessage.length > 0 ? errorMessage[0] : null,
        errorMessages: errorMessages.length > 0 ? errorMessages[0] : [],
        formValues: formValues.length > 0 ? formValues[0] : {}
    });
});

// Signup post request
router.post('/signup', isNotLoggedIn, validateSignup, signup);

// OTP page
router.get('/OTP', isNotLoggedIn, (request, response) => {
    if (!request.session.email) {
        request.flash('errorMessage', "انتهت صلاحية الجلسة، او لم تسجيل حساب بعد نرجو التسجيل من جديد.");
        return response.redirect('/signup');
    }
    const errorMessage = request.flash('errorMessage');
    const successMessage = request.flash('successMessage');
    return response.render('OTP', {
        errorMessage: errorMessage.length > 0 ? errorMessage[0] : null,
        successMessage: successMessage.length > 0 ? successMessage[0] : null
    });
});

// OTP verification
router.post('/verifyOTP', isNotLoggedIn, verifyOTP);

// OTP resend
router.post('/resendOTP', isNotLoggedIn, resendOTP);

// User account managment
router.get('/account-management', isLoggedIn, async (request, response) => {
    try {
        const token = jwt.decode(request.cookies.auth_token)['id'];
        // Get user info
        const {user} = await getUserInfo(token);
        // Format date of birth
        const updatedYear = new Date(user.dateOfBirth).getFullYear();
        const updatedMonth = new Date(user.dateOfBirth).getMonth() + 1 < 10 ? "0" + (new Date(user.dateOfBirth).getMonth() + 1) : new Date(user.dateOfBirth).getMonth() + 1;
        const updatedDay = new Date(user.dateOfBirth).getDate() < 10 ? "0" + new Date(user.dateOfBirth).getDate() : new Date(user.dateOfBirth).getDate();
        const updatedDOB = updatedYear + "-" + updatedMonth +"-" + updatedDay;
        // Send only needed info
        const userInfo = {firstName: user.firstName, lastName: user.lastName, email: user.email, phoneNumber: user.phoneNumber, dateOfBirth: updatedDOB};
        
        // Get flash messages
        const errorMessages = request.flash('errorMessages');
        const errorMessage = request.flash('errorMessage');
        const successMessage = request.flash('successMessage');
        // Update username cookie

        response.cookie('username', user.firstName, { httpOnly: false, secure: process.env.NODE_ENV !== 'development' });
        // Render view
        return response.render('account', {
            user: userInfo,
            errorMessages: errorMessages.length > 0 ? errorMessages[0] : [],
            errorMessage: errorMessage.length > 0 ? errorMessage[0] : null,
            successMessage: successMessage.length > 0 ? successMessage[0] : null
        });
    } catch (error) {
        response.clearCookie('auth_token');
        response.clearCookie('username');
        return response.status(401).render('error', { errormessage: 'Invalid authentication token. Please log in again. If this happens again please contact us.' });
    }
});

// Update profile post request
router.post('/update-profile', isLoggedIn, validateUpdateProfile, updateProfile);

// Update password post request
router.post('/update-password', isLoggedIn, validatePasswordChange, updatePassword);

// Services
router.get('/services', isLoggedIn, (request, response) => {
    const errorMessage = request.flash('errorMessage');
    return response.render('services', {
        errorMessage: errorMessage.length > 0 ? errorMessage[0] : null,
    });
});

// Validation Requests
router.post("/validation-request", isLoggedIn, (request, response) => {
    const link = request.body.link;
    var typeOfRequest = request.body.typeOfRequest;
    if (typeOfRequest === "basic" || typeOfRequest === "advanced" || typeOfRequest === "premium") {
        validateWebsiteAccessibility(link, typeOfRequest, request, response);
    } else {
        response.send("Invalid Request");
    }
});

// History pages
router.get('/history', isLoggedIn ,request_history);

// Contact
router.get('/contact', (request, response) => {
    response.render('contact', {
        errorMessages: {},
        formValues: {}
    });
});

// Contact post request
router.post('/contact', validateContactForm, handleContact);

// About
router.get('/about', (request, response) => {
    response.render('about');
});

// To be changed
router.post('/delete-history', isLoggedIn, delete_history);

// References
router.get('/references', (request, response) => {
    response.render('references');
});

// 404
router.all('* || 404', (request, response) => {
    response.status(404).render('404');
});
module.exports = router;