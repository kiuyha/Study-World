const popup_container = document.getElementById('popup-container');
const menus = document.querySelectorAll('.menu');
const buttons = document.querySelectorAll('#select-button button');
const photo_profile = document.getElementById('photo-profile');
const photo_input = document.getElementById('photo-pic')
const type_otp = document.getElementById('type-otp');
let cropper;

//delete message 
function delete_el(button){
    button.parentElement.remove();
}

//get a rounded canvas
// actually I don't know how it works because I get it from creator's github lol
function getRoundedCanvas(sourceCanvas) {
    let canvas = document.createElement('canvas');
    let context = canvas.getContext('2d');
    let width = sourceCanvas.width;
    let height = sourceCanvas.height;

    canvas.width = width;
    canvas.height = height;
    context.imageSmoothingEnabled = true;
    context.drawImage(sourceCanvas, 0, 0, width, height);
    context.globalCompositeOperation = 'destination-in';
    context.beginPath();
    context.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, 2 * Math.PI, true);
    context.fill();
    return canvas;
}

//detect a photo being upload and show the crop menu
photo_input.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if(!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = function() {
        const crop_image = document.getElementById('crop-image');
        crop_image.src = reader.result;
        if(cropper){
            cropper.destroy();
        }
        togglePopup('crop-photo');
        cropper = new Cropper(crop_image, {
            aspectRatio: 1,
            viewMode: 1,
        });
    };
    reader.readAsDataURL(file);
});

// function to show the cropped image after cropping
function showCroppedImage() {
    let cropped_canvas = getRoundedCanvas(cropper.getCroppedCanvas());
    // convert canvas to base64
    photo_profile.src = cropped_canvas.toDataURL("image/webp");
    togglePopup('crop-photo');
}

//change the menu tab, hide all menu and show the selected menu
function toggleMenu(button) {
    menus.forEach(menu => {
        menu.classList.add('hidden');
    });
    const selectedMenu = document.getElementById(button.textContent.toLowerCase());
    selectedMenu.classList.remove('hidden');
    buttons.forEach(btn => {
        btn.classList.remove('active-btn');
    });
    button.classList.add('active-btn');
};

//show and hide popup
function togglePopup(name_popup){
    if (name_popup === 'crop-photo'){
        photo_input.value = '';
    }
    popup_container.classList.toggle('hidden');
    const popup = document.getElementById(name_popup);
    popup.classList.toggle('hidden');
    document.getElementById('container').classList.toggle('blur');
};

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
    });
});

    // function to show the chill cat   
function toggleLoading(){
document.getElementById("container").classList.toggle("hidden")
document.getElementById('loading').classList.toggle("hidden"); 
}
//show and hide dropdown in notification menu
function showdropdown(div, name_dropdown){
    div.classList.toggle('click');
    const dropdown = document.getElementById(name_dropdown);
    dropdown.classList.toggle('hidden');
}

//get data from form
const form = document.querySelectorAll('form');
form.forEach(form => {
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        const formData = new FormData(form);
        const dataObject = {'type': form.getAttribute('id')};
        if (form.getAttribute('id') === 'otp-confirmation'){
            otp = '';
            formData.forEach((value, key) => {
                if (key !== 'type-otp'){
                    otp += value;
                } else{
                    dataObject['type-otp'] = value;
                }
            })
            dataObject['otp'] = otp;
        }else{
            formData.forEach((value, key) => {
                if (key === 'photo-pic'){
                    dataObject['photo-pic'] = document.getElementById('photo-profile').src;
                    return;
                }
                dataObject[key] = value;
            });
        }
        send_data(dataObject);
    });
});

function delete_account(){
    if (confirm("Apa anda yakin ingin menghapus akun anda?\nTindakan ini tidak bisa dibatalkan!")){
        const data = {'type': 'delete-account'};
        send_data(data);
    };
}

//get data from notification
const notifs = document.querySelectorAll('.dropdown');
notifs.forEach(notif => {
    const checkboxes = notif.querySelectorAll('input');
    checkboxes.forEach(checkbox =>{
        checkbox.addEventListener('change', function(event) {
            event.preventDefault();
            const data = {'type': 'notification',
                'notif': notif.getAttribute('id'),
                [notif.getAttribute('id')] : {[checkbox.id] : checkbox.checked}
            };
            send_data(data);
        });
    });
});

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
                if (msg === 'Profil berhasil diubah'){
                    window.location.reload();
                }
            }, 2000);
        }, 7000);
    }
    
//function to send data
function send_data(data){
    fetch("/settings", {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify(data)
    }).then(response => response.json())
    .then(data => {
        if (data.success) {
            if (data.redirect){
                window.location.href = data.redirect;
            }
            if (data.Message[0] === 'otp-needed'){
                togglePopup(data.Message[1]);
                toggleLoading();
                send_data({'type': 'otp-requested', 'otp_type': data.Message[1]});
            }
            else if (data.Message[0] === 'otp-sended'){
                toggleLoading();
                togglePopup('otp');
                type_otp.value = data.Message[1];
            } else if (data.Message[0] === 'otp-confirmed'){
                togglePopup('otp')
                create_msg('success', data.Message[1]);
            }
            else{
                create_msg('success', data.Message);
            }
        } else {
            create_msg('error', data.Message);
        }
    })
}