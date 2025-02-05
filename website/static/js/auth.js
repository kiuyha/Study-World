const container = document.getElementById("container");
const popup_container = document.getElementById("popup-container");
const loading = document.getElementById("loading");
const otp_type = document.getElementById("type-otp")

//delete message 
function delete_el(button){
    button.parentElement.remove();
}

    // function to toggle eye icon
function togglePasswordVisibility(icon) {
    let input = icon.previousElementSibling;
    if (input.type === "password") {
    input.type = "text";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
    } else {
    input.type = "password";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
    }
};

function toggleLoading(){
    container.classList.toggle("hidden")
    loading.classList.toggle("hidden"); 
};

//show and hide popup
function togglePopup(name_popup){
    popup_container.classList.toggle('hidden');
    const popup = document.getElementById(name_popup);
    popup.classList.toggle('hidden');
    container.classList.toggle('blur');
    if(name_popup === 'email-forgot'){
        if(popup.classList.contains('hidden')){
            document.getElementById('email').reset();
            move_capctha(1);
        }else{
            move_capctha(0);
        }
    }
};

//function create message
function create_msg(status, msg){
    const html = `
    <div class="message ${status}">
    <div class="icon"></div>
    <div class="text-msg">
        <h2>${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
        <p>${msg}</p>
    </div>
    <button onclick="delete_el(this)">&times;</button>
    </div>`
    document.getElementById('messages').insertAdjacentHTML('beforeend', html);
    const new_child = document.getElementById('messages').lastElementChild;
    setTimeout(() => {
        new_child.classList.add('fade-out');
        setTimeout(() => {
            new_child.remove();
        }, 2000);
    }, 7000);
}

function toggleFlip(name){
    if (name === 'login'){
        move_capctha(1);
    }else if (name === 'signup'){
        move_capctha(2);
    }
}

function onRecaptchaLoaded() {
    move_capctha(1);
}

let captcha_widgetID = null;
function move_capctha(index_container){
    if (captcha_widgetID){
        grecaptcha.reset(captcha_widgetID);
    }
    const captcha_container = document.querySelectorAll('.captcha-container');
    captcha_container.forEach((captcha) => {
        captcha.innerHTML = '';
    });
    const element = captcha_container[index_container];
    if (index_container !== 2){
        const br = document.createElement('br');
        element.appendChild(br);
    }
    const div = document.createElement('div');
    captcha_widgetID = grecaptcha.render(div, {
        sitekey: "6LdbQrEqAAAAAJWnlYamCYLwCAjvTlQwikegSdvv",
    });
    element.appendChild(div);
}

// function to send form data using AJAX
const forms = document.querySelectorAll(".form");
forms.forEach((form) => {
    form.addEventListener("submit", function (event) {
        event.preventDefault();
        const response = grecaptcha.getResponse(captcha_widgetID);
        const form_type = form.id;
        if (response === "" && form_type !== 'pass'){
            create_msg('error', 'Tolong selesaikan CAPTCHA');
            return;
        }
        const formData = new FormData(form);
        const dataObject = {};
        dataObject['g-recaptcha-response'] = response;
        formData.forEach((value, key) => {
            dataObject[key] = value;
        });
        let url = "";
        if (form_type === "login") {
            url = "/login";
        } else if (form_type === "signup") {
            url = "/signup";
            toggleLoading();
        } else if (form_type === 'email'){
            url = "/forgot";
            dataObject["form_type"] = "email";
            togglePopup('email-forgot');
            toggleLoading();
        }
        else if (form_type === 'pass'){
            url = "/forgot";
            dataObject["form_type"] = "pass";
        }
        fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
            body: JSON.stringify(dataObject)
        }).then(response => response.json())
        .then(data => {
            if (data.success) {
                if (data.redirect) {
                    window.location.href = data.redirect;
                }
                else{
                    toggleLoading();
                    otp_type.value = form_type;
                    document.getElementById('email-msg').textContent =`Kami telah mengirim kode verifikasi ke ${dataObject["email"]}`;
                    togglePopup('otp');
                }
            } else {
                if (form_type === 'email' || form_type === 'signup'){
                    if (form_type === 'email'){
                        togglePopup('email-forgot');
                    }
                    toggleLoading();
                }
                grecaptcha.reset(captcha_widgetID);
                create_msg("error", data.Message);
            }
        })
    });
});

// Get all the OTP input fields
const otpInputs = document.querySelectorAll('input[name^="otp"]');         
otpInputs.forEach((input, index) => {
    input.addEventListener('input', function () {
        if (input.value.length === 1 && index < otpInputs.length - 1) {
            // Move to the next input field
            otpInputs[index + 1].focus();
        }
    });

    input.addEventListener('keydown', function (event) {
        if (event.key === 'Backspace' && input.value.length === 0 && index > 0) {
            // Move to the previous input field if Backspace is pressed
            otpInputs[index - 1].focus();
        }
    });

    input.addEventListener('paste', function (event) {
    event.preventDefault();
    input.blur();
    let pasteData = event.clipboardData.getData('Text');
    pasteData = pasteData.replace(/[^0-9]/g, '');
    let i = 0
    while(i < pasteData.length){
        if(otpInputs[index + i]){
        otpInputs[index + i].value = pasteData[i];
        i++;
        } else{
        i--;
        break;
        }
    }
    otpInputs[index + i].focus();
    })
});

//function for send otp form with AJAX
const otp_form = document.querySelector(".otp");
otp_form.addEventListener("submit", function (event) {
    event.preventDefault();
    const formData = new FormData(otp_form);
    let otp_data = ""
    formData.forEach((value, key) => {
    if (key !== 'type-otp'){
        otp_data += value;
    }
    });
    const dataObject = {'otp' : otp_data, 'otp_type' : formData.get('type-otp')};
    fetch("/otp", {
    method: "POST",
    headers: {
    "Content-Type": "application/json",
    },
    body: JSON.stringify(dataObject)
    }).then(response => response.json())
    .then(data => {
        if (data.success) {
            if (data.redirect){
                window.location.href = data.redirect;
            }else{
                togglePopup('otp');
                togglePopup('pass-forgot');
            }
        } else {
            create_msg("error", data.Message);
        }
    })
})     