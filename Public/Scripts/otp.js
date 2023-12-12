const inputs = document.querySelectorAll(".input-field input[type='number']"),
      hiddenOTPInput = document.querySelector("input[name='OTP']"),
      button = document.querySelector("button");

inputs.forEach((input, index1) => {
    input.addEventListener("keyup", (e) => {
        const currentInput = input,
              nextInput = input.nextElementSibling,
              prevInput = input.previousElementSibling;

        // Concatenate and update the OTP value
        const otpValue = Array.from(inputs).map(inp => inp.value).join('');
        hiddenOTPInput.value = otpValue;

        if (currentInput.value.length > 1) {
            currentInput.value = "";
            return;
        } else if (nextInput && nextInput.hasAttribute("disabled") && currentInput.value !== "") {
            nextInput.removeAttribute("disabled");
            nextInput.focus();
        } else if (e.key === "Backspace") {
            if (prevInput) {
                prevInput.focus();
            }
            currentInput.setAttribute("disabled", true);
            currentInput.value = "";
        } else if (!inputs[3].disabled) {
            button.classList.add("active");
            return;
        }
        button.classList.remove("active");
    });
});
