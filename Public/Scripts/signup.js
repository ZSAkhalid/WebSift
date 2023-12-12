document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('input').forEach(input => {
      // Add the event listeners
      input.addEventListener('focus', toggleHasValue);
      input.addEventListener('input', toggleHasValue);
      input.addEventListener('blur', toggleHasValue);

      // Check if the input has a value on page load
      toggleHasValue.call(input);
  });
});

function toggleHasValue() {
  this.classList.toggle('has-value', this.value !== '');
}



$(document).ready(function () {
    // Initialize labels and error flags
    $("#fnameErr, #lnameErr, #emailErr, #dobErr, #telErr, passwordErr").hide();
    let fnameError = true;
    let lnameError = true;
    let emailError = true;
    let passwordError = true;
    let telError = true;
    let dobError = true;
  
    // Name validation function
    function validateName(field) {
      var input = $("#" + field).val();
      var label = "#" + field + "Err";
      var nameRegex = new RegExp("^[a-zA-Z\u0600-\u06FF]+(\s{0,1}[a-zA-Z\u0600-\u06FF]+)?$");
  
      if (input.length < 1) {
        $(label).show().html("الرجاء عدم ترك الخانة فاضية.");
        return false;
      } else if (input.length > 35 || input.length < 2) {
        $(label).show().html("لايمكن للإسم ان يكون اقصر من 2 او اكثر من 35 حرف.");
        return false;
      } else if (!nameRegex.test(input)) {
        $(label).show().html("الاسم لا يطابق الصيغة الصحيحة؛ يجب أن يحتوي فقط على حروف وإذا لزم الأمر، مسافة واحدة.");
        return false;
      } else {
        $(label).hide();
        return true;
      }
    }
  
    // Validate first name
    $("#fname").keyup(function () {
      fnameError = validateName("fname");
    });
  
    // Validate last name
    $("#lname").keyup(function () {
      lnameError = validateName("lname");
    });
  
    // Email validation function
    function validateEmail() {
      var input = $("#email").val();
      if (input.length < 1) {
        $("#emailErr").show().html("الرجاء إدخال البريد الإلكتروني.");
        return false;
      } else if (input.length > 50 || input.length < 5) {
        $("#emailErr").show().html("لايمكن للإيميل ان يكون اقصر من 5 او اكثر من 50 حرف.");
        return false;
      } else if (!validator.isEmail(input)) {
        $("#emailErr").show().html("الرجاء إدخال بريد إلكتروني صحيح.");
        return false;
      } else {
        $("#emailErr").hide();
        return true;
      }
    }
  
    // Validate email
    $("#email").keyup(function () {
      emailError = validateEmail();
    });
  
    // Password validation function
    function validatePassword() {
      var input = $("#password").val();
      var messageRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*_=+-]).*$");
      if (input.length < 1) {
        $("#passwordErr").show().html("الرجاء إدخال كلمة المرور.");
        return false;
      } else if (input.length > 32 || input.length < 8) {
        $("#passwordErr").show().html("لايمكن لكلمة المرور ان تكون اقصر من 8 او اكثر من 32 حرف.");
        return false;
      } else if (!messageRegex.test(input)) {
        $("#passwordErr").show().html("الرجاء كتابة كلمة مرور بالصيغة الصحيحة.");
        return false;
      } else {
        $("#passwordErr").hide();
        return true;
      }
    }
  
    // Validate message
    $("#password").keyup(function () {
        passwordError = validatePassword();
    });
  
    // Phone number validation function
    function validatePhoneNumber() {
        var input = $("#tel").val();
      var messageRegex = new RegExp("^05[03456789][0-9]{7}$");
      if (input.length < 1) {
        $("#telErr").show().html("الرجاء إدخال رقم الهاتف.");
        return false;
      } else if (input.length != 10) {
        $("#telErr").show().html("رقم الهاتف يجب ان يتكون من 10 ارقام مبتأ ب05.");
        return false;
      } else if (!messageRegex.test(input)) {
        $("#telErr").show().html("الرجاء إدخال رقم هاتف صحيح.");
        return false;
      } else {
        $("#telErr").hide();
        return true;
      }
    }

    // Validate phone number
    $("#tel").keyup(function () {
        telError = validatePhoneNumber();
    });

    // Date of birth validation function
    // User should be more than 18 years old
    function validateDateOfBirth() {
        var input = $("#dob").val();
        var today = new Date();
        var birthDate = new Date(input);
        var age = today.getFullYear() - birthDate.getFullYear();
        var m = today.getMonth() - birthDate.getMonth();
        if (input.length != 10) {
            $("#dobErr").show().html("الرجاء إدخال تاريخ الميلاد.");
            return false;
        } else if (!validator.isDate(input)) {
            $("#dobErr").show().html("الرجاء إدخال تاريخ ميلاد صحيح.");
            return false;
        } else if (age < 18 || (age == 18 && m < 0)) {
            $("#dobErr").show().html("يجب أن يكون العمر 18 عامًا أو أكثر.");
            return false;
        } else {
            $("#dobErr").hide();
            return true;
        }
    }

    // Validate date of birth
    $("#dob").change(function () {
        dobError = validateDateOfBirth();
    }).keyup(function () {
        dobError = validateDateOfBirth();
    });
  
    // Submit button event
    $("#submitbtn").click(function (event) {
      fnameError = validateName("fname");
      lnameError = validateName("lname");
      emailError = validateEmail();
      passwordError = validatePassword();
      dobError = validateDateOfBirth();
      telError = validatePhoneNumber();
      
      if (!fnameError || !lnameError || !emailError || !passwordError || !telError || !dobError) {
        event.preventDefault();
      }
    });
  
  });