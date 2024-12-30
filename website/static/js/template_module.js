const notif_menu = document.querySelectorAll('.notif-list');
const notif_btn = document.querySelectorAll('#dropdown-notif > div button')
const notif_container = document.getElementById('notif-container');

menubar = document.getElementById('menuBar');
menubar.addEventListener('change', () => {
    if(menubar.checked){
        document.querySelector('nav').style.display = 'block';
    } else {
        document.querySelector('nav').style.display = 'none';
    }
});
function toggleFullContent(button){
        notif_container.classList.toggle('hidden')
        document.getElementById(button).classList.toggle('hidden')
    }

function toggleDropdown(name){
    const dropdown = document.getElementById(name)
    dropdown.classList.toggle('hidden');
    if (name === 'dropdown-notif'){
        notif_btn.forEach((btn)=>{
            if(btn.classList.contains('active')){
                name_el = btn.textContent.trim();
                document.getElementById(name_el).classList.remove('hidden');
            }

        })
    }
}

document.addEventListener('click', (event) => {
    if (!document.getElementById('dropdown-notif').contains(event.target) && !document.getElementById('notif-btn').contains(event.target)) {
        document.getElementById('dropdown-notif').classList.add('hidden');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const next_prev_btn = document.getElementById('next-prev-btn');
    const next_btn = document.getElementById('next-btn');
    const prev_btn = document.getElementById('prev-btn');
    if (next_prev_btn) {
        if (next_btn && prev_btn) {
            next_prev_btn.style.justifyContent = 'space-between';
        }else if(next_btn){
            next_prev_btn.style.justifyContent = 'flex-end';
        } else{
            next_prev_btn.style.justifyContent = 'flex-start';
        }
    }
});


function change_notif(button){
    notif_menu.forEach((menu)=>{
        menu.classList.add('hidden')
    })
    notif_btn.forEach((btn) =>{
        btn.classList.remove('active')
    })
    document.getElementById(button.textContent.trim()).classList.remove('hidden')
    button.classList.add('active')
}

document.querySelectorAll('li').forEach(function(item) {
    item.addEventListener('click', function() {
        var radio = item.querySelector('input[type="radio"]');
        if (radio) {
        radio.checked = true;
        }
    });
});

const form = document.getElementById('quiz-form');
form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const data = formData.get('answer');
    send_data(data);
});

let timeout;
let executed = false;
if(!executed){
    window.addEventListener('scroll', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            const scrollableHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrollTop = document.documentElement.scrollTop;
            const tolerance = 80;
            if (scrollTop + tolerance >= scrollableHeight) {
                send_data(null, true);
                executed = true;
            }
        }, 200);
    });
};

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
function delete_el(button){
    button.parentElement.remove();
}

function send_data(data, is_view = false) {
    fetch(`${window.location.href}`, {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({'answer': data, 'is_view': is_view})
    }).then(response => response.json())
        .then(data => {
            if (data.success) {
                if (data.Message) {
                    create_msg("success", data.Message);
                }
            } else {
                if (data.Message) {
                    create_msg("error", data.Message);
                }
            }
            if(!is_view){
                const inject = document.getElementById('inject');
                inject.innerHTML = '';
                inject.innerHTML = data.solution;
            }
        });
}