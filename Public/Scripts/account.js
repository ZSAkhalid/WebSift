function openTab(evt, tabName) {
    var i, tabcontent, tablinks;

    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }
  
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
  
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('Profile').addEventListener('submit', function(event) {
      submitUpdateProfile(event);
  });

  document.getElementById('Password').addEventListener('submit', function(event) {
      submitUpdatePassword(event);
  });
});
//Validate the Profile Update
function submitUpdateProfile(event) {
    $("#fnameErr, #lnameErr, #emailErr, #dobErr, #telErr").hide();
    let fnameError = !validateFirstName();
    let lnameError = !validateLastName();
    let emailError = !validateEmail();
    let telError = !validatePhoneNumber();
    let dobError = !validateDateOfBirth();

    if (fnameError) $("#fnameErr").show();
    if (lnameError) $("#lnameErr").show();
    if (emailError) $("#emailErr").show();
    if (telError) $("#telErr").show();
    if (dobError) $("#dobErr").show();

    if (fnameError || lnameError || emailError || telError || dobError) {
        event.preventDefault();
    }
}
// Validate First Name
function validateFirstName() {
  const firstName = document.getElementById("fname").value;
  const fnameErr = $("#fnameErr").hide();

  if (firstName === "") {
    fnameErr.show().html("الرجاء إدخال اسم الأول");
    return false;
  } else if (!firstName.match(/^(?=.{2,35}$)[a-zA-Z\u0600-\u06FF]+(\s{0,1}[a-zA-Z\u0600-\u06FF]+)?$/)) {
    fnameErr.show().html("الرجاء إدخال اسم صحيح");
    return false;
  } else if (firstName.length > 35 || firstName.length < 2) {
    fnameErr.show().html("لا يمكن للإسم أن يكون أقصر من 2 أو أكثر من 35 حرف.");
      return false;
  }

  return true;
}
// Validate Last Name
function validateLastName() {
  const lastName = document.getElementById("lname").value;
  const lnameErr = $("#lnameErr").hide();

  if (lastName === "") {
    lnameErr.show().html("الرجاء إدخال اسم الأخير");
    return false;
  } else if (!lastName.match(/^(?=.{2,35}$)[a-zA-Z\u0600-\u06FF]+(\s{0,1}[a-zA-Z\u0600-\u06FF]+)?$/)) {
    lnameErr.show().html("الرجاء إدخال اسم صحيح");
    return false;
  } else if (lastName.length > 35 || lastName.length < 2) {
    lnameErr.show().html("لا يمكن للإسم أن يكون أقصر من 2 أو أكثر من 35 حرف.");
    return false;
  }

  return true;
}
// Validate Phone Number
function validatePhoneNumber() {
  const phoneNumber = document.getElementById("tel").value;
  const telErr = $("#telErr").hide();

  if (phoneNumber.length < 1) {
    telErr.show().html("الرجاء إدخال رقم الهاتف.");
    return false;
  } else if (phoneNumber.length !== 10) {
    telErr.show().html("رقم الهاتف يجب أن يتكون من 10 أرقام بدأ بـ 05.");
    return false;
  } else if (!phoneNumber.match(/^05[03456789][0-9]{7}$/)) {
    telErr.show().html("الرجاء إدخال رقم هاتف صحيح.");
    return false;
  }

  return true;
}
// Validate Email
function validateEmail() {
  const email = document.getElementById("email").value;
  const emailErr = $("#emailErr").hide()

  if (email.length < 1) {
    emailErr.show().html("الرجاء إدخال البريد الإلكتروني.");
    return false;
  } else if (email.length > 50 || email.length < 5) {
    emailErr.show().html("لا يمكن للإيميل أن يكون أقصر من 5 أو أكثر من 50 حرف.");
    return false;
  } else if (!email.match(/^(?=.{5,50}$)[a-zA-Z0-9]+([.!#\$%&'*+\-\/=?^_`{|}~]?[a-zA-Z0-9]+)?@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/)) {
    emailErr.show().html("الرجاء إدخال بريد إلكتروني صحيح.");
    return false;
  }

  return true;
}
// Validate Date Of Birth
function validateDateOfBirth() {
  const dob = document.getElementById("dob").value;
  const dobErr = $("#dobErr").hide()
  var today = new Date();
  var birthDate = new Date(dob);
  var age = today.getFullYear() - birthDate.getFullYear();
  var m = today.getMonth() - birthDate.getMonth();

  if (dob.length !== 10) {
    dobErr.show().html("الرجاء إدخال تاريخ الميلاد.");
    return false;
  } else if (isNaN(birthDate.getTime())) {
    dobErr.show().html("الرجاء إدخال تاريخ ميلاد صحيح.");
      return false;
  } else if (age < 18 || (age === 18 && m < 0)) {
    dobErr.show().html("يجب أن يكون العمر 18 عامًا أو أكثر.");
    return false;
  }

  return true;
}
//Validate the Password Update
function submitUpdatePassword(event){
    // Initialize labels and error flags
    $("#oldpasswordErr, #newpasswordErr").hide();
    let oldpasswordErr = !validateOldPassword();
    let newpasswordErr = !validateNewPassword();
    // Display error messages next to corresponding input fields
    if (oldpasswordErr) $("#oldpasswordErr").show();
    if (newpasswordErr) $("#newpasswordErr").show();
    // Stop form submission if there are errors
    if (oldpasswordErr || newpasswordErr) {
        event.preventDefault();
    }

}

//Old Password validation function
function validateOldPassword(){
    const oldPassword = document.getElementById("oldPassword").value;
    const oldpasswordErr = $("#oldpasswordErr").hide()
    if (oldPassword.length < 1) {
        oldpasswordErr.show().html("الرجاء إدخال كلمة المرور.");
        return false;
      } else if (oldPassword.length > 32 || oldPassword.length < 8) {
        oldpasswordErr.show().html("لايمكن لكلمة المرور أن تكون أقصر من 8 أو أكثر من 32 حرف.");
        return false;
      } else if (!oldPassword.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*_=+-]).*$/)) {
        oldpasswordErr.show().html("الرجاء كتابة كلمة مرور بالصيغة الصحيحة.");
        return false;
      }
    return true;
}


//New Password validation function
function validateNewPassword() {
  const newPassword = document.getElementById("newPassword").value;
  const newpasswordErr = $("#newpasswordErr").hide()

  if (newPassword.length < 1) {
    newpasswordErr.show().html("الرجاء إدخال كلمة المرور الجديدة.");
      return false;
  } else if (newPassword.length > 32 || newPassword.length < 8) {
    newpasswordErr.show().html("لايمكن لكلمة المرور الجديدة أن تكون أقصر من 8 أو أكثر من 32 حرف.");
    return false;
  } else if (!newPassword.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*_=+-]).*$/)) {
    newpasswordErr.show().html("الرجاء كتابة كلمة مرور جديدة بالصيغة الصحيحة.");
    return false
  }

  return true;
}
