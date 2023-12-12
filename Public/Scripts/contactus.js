$(document).ready(function () {
  // Initialize labels and error flags
  $("#fnameLabel, #lnameLabel, #emailLabel, #messageLabel, #subjectLabel").hide();
  let fnameError = true;
  let lnameError = true;
  let emailError = true;
  let messageError = true;
  let subjectError = true;

  // Name validation function
  function validateName(field) {
    var input = $("#" + field).val();
    var label = "#" + field + "Label";
    var nameRegex = new RegExp("^(?=.{2,35}$)[a-zA-Z\u0600-\u06FF]+(\s{0,1}[a-zA-Z\u0600-\u06FF]+)?$");

    if (input.length < 1) {
      $(label).show().html("الرجاء عدم ترك الخانة فاضية.");
      return false;
    } else if (input.length > 35) {
      $(label).show().html("يجب ألا يتجاوز الاسم 35 حرفًا.");
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
    var emailRegex = new RegExp("^(?=.{5,50}$)[a-zA-Z0-9]+([.!#$%&'*+\-\/=?^_`{|}~]?[a-zA-Z0-9]+)?@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$");
    if (input.length < 1) {
      $("#emailLabel").show().html("الرجاء إدخال البريد الإلكتروني.");
      return false;
    } else if (input.length > 50) {
      $("#emailLabel").show().html("الحد الأقصى لعدد الأحرف 50.");
      return false;
    } else if (!emailRegex.test(input)) {
      $("#emailLabel").show().html("الرجاء إدخال بريد إلكتروني صحيح.");
      return false;
    } else {
      $("#emailLabel").hide();
      return true;
    }
  }

  // Validate email
  $("#email").keyup(function () {
    emailError = validateEmail();
  });

  // Message validation function
  function validateMessage() {
    var input = $("#message").val();
    var messageRegex = new RegExp("^(?=.{1,255}$)[a-zA-Z0-9\u0600-\u06FF,.?!:;'-]+(\s*[a-zA-Z0-9\u0600-\u06FF,.?!:;'-]+)*$");
    if (input.length < 1) {
      $("#messageLabel").show().html("الرجاء إدخال الرسالة.");
      return false;
    } else if (input.length > 255) {
      $("#messageLabel").show().html("الرجاء إدخال رسالة لا تتجاوز 255 حرفًا.");
      return false;
    } else if (!messageRegex.test(input)) {
      $("#messageLabel").show().html("الرجاء إدخال رسالة صحيحة وذلك بدون رموز غير مسموحة.");
      return false;
    } else {
      $("#messageLabel").hide();
      return true;
    }
  }

  // Validate message
  $("#message").keyup(function () {
    messageError = validateMessage();
  });

  // Subject validation function
  function validateSubject() {
    const validSubjects = ["general-inquiry", "technical-issues", "report-issues", "suggestions", "account-support", "language-support"];
    var input = $("#subject").val();
  
    if (!validSubjects.includes(input)) {
      $("#subjectLabel").show().html("الرجاء اختيار موضوع صحيح من القائمة.");
      return false;
    } else {
      $("#subjectLabel").hide();
      return true;
    }
  }

  // Validate subject
  $("#subject").change(function () {
    subjectError = validateSubject();
  }).keyup(function () { // In case someone types into a "select" field, which is unusual
    subjectError = validateSubject();
  });

  // Submit button event
  $("#submitbtn").click(function (event) {
    fnameError = validateName("fname");
    lnameError = validateName("lname");
    emailError = validateEmail();
    messageError = validateMessage();
    subjectError = validateSubject();
    
    if (!fnameError || !lnameError || !emailError || !messageError || !subjectError) {
      event.preventDefault();
    }
  });

});
