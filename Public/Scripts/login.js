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
    $("#emailErr, #passwordErr").hide();
    let emailError = true;
    let passwordError = true;
    
  
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
  
    // Submit button event
    $("#submitbtn").click(function (event) {
      emailError = validateEmail();
      passwordError = validatePassword();
      
      if (!emailError || !passwordError) {
        event.preventDefault();
      }
    });
  
  });