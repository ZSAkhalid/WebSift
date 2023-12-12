document.addEventListener('DOMContentLoaded', () => {
  var form = document.getElementById("validation-request");
  var submit_url_form = document.getElementById("submit-url");
  var cards = document.getElementById("cards");
  var hidden = document.getElementById("hidden");

  document.getElementById("validation-request").addEventListener("submit", function (e) {
    e.preventDefault();
    if (!isValidLink(document.getElementById('link').value)){
      document.getElementById('error-message').innerHTML = 'اكتب الرابط بشكل صحيح';
      document.getElementById('alert').classList.remove('d-none');
      return;
    }
    else {
      document.getElementById('error-message').innerHTML = '';
      document.getElementById('alert').classList.add('d-none');
    }
    e.preventDefault();
    submit_url_form.classList.add("d-none");
    cards.classList.remove('d-none');
  });


  document.getElementById("button1").addEventListener("click", () => {
    hidden.value = "basic";
    form.submit();
    document.getElementById('loading').classList.remove('loading-container--hidden');
    document.getElementById('loading-text').classList.remove('d-none');
    cards.classList.add('d-none');
  });

  document.getElementById("button2").addEventListener("click", () => {
    hidden.value = "advanced";
    form.submit();
    document.getElementById('loading').classList.remove('loading-container--hidden');
    document.getElementById('loading-text').classList.remove('d-none');
    cards.classList.add('d-none');
  });

  document.getElementById("button3").addEventListener("click", () => {
    hidden.value = "premium";
    form.submit();
    document.getElementById('loading').classList.remove('loading-container--hidden');
    document.getElementById('loading-text').classList.remove('d-none');
    cards.classList.add('d-none');
  });


});

function isValidLink(string) {
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    return false;  
  }
  return url.protocol === "http:" || url.protocol === "https:";
}