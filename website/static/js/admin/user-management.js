const totalPages = Number(document.getElementById('total-pages').value);
const currentPage = Number(new URLSearchParams(window.location.search).get('page')) || 1;
const popup_container = document.getElementById('popup-container');
const users_data = document.getElementById('users-data');
const paginationContainer = document.getElementById("pagination");
const notif_btn = document.querySelectorAll('#dropdown-notif > div button')
const dropdown_notif = document.getElementById('dropdown-notif');
const notif_container = document.getElementById('notif-container');
const full_content = document.getElementById('full-content');
const aktivitas_list = document.getElementById('Aktivitas');
const pengumuman_list = document.getElementById('Pengumuman');
const have_sending = {}

// dropdown function
function toggleNotifDropdown() {
    dropdown_notif.classList.toggle('hidden');
    if (!dropdown_notif.classList.contains('hidden')) {
        full_content.classList.add('hidden');
        notif_container.classList.remove('hidden');
        fetch_notif();
    } else {
        if (!have_sending['Aktivitas']) {
            const data = [];
            aktivitas_list.querySelectorAll('li').forEach(li => {
                data.push(Number(li.id.replace('notif-', '')));
            });
            read_notif(data);
        }
        const notif_not_read = Array.from(notif_container.querySelectorAll('li')).some(li => li.classList.contains('not-read'))
        if (!notif_not_read) {
            document.getElementById('notif-btn').classList.remove('have-notif');
        }
    }
}

function fetch_notif() {
    aktivitas_list.innerHTML = '';
    pengumuman_list.innerHTML = '';
    full_content.innerHTML = '';
    fetch('/notifications').then(response => response.json())
        .then(data => {
            data.forEach((notif) => {
                const li = document.createElement('li');
                const span = document.createElement('span');
                const p = document.createElement('p');
                const h6 = document.createElement('h6');
                p.textContent = notif[1];
                h6.textContent = notif[2];
                span.appendChild(p);
                span.appendChild(h6);
                li.appendChild(span);
                if (!notif[4]) {
                    li.classList.add('not-read');
                }
                if (!notif[3]) {
                    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#EAC452"><path d="m354-287 126-76 126 77-33-144 111-96-146-13-58-136-58 135-146 13 111 97-33 143ZM233-120l65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Zm247-350Z"/></svg>'
                    li.insertAdjacentHTML('afterbegin', svg);
                    li.id = `notif-${notif[0]}`;
                    if(notif[5]){
                        const a = document.createElement('a');
                        a.href = notif[5];
                        a.innerHTML = li.innerHTML;
                        li.innerHTML = '';
                        li.appendChild(a);
                    };
                    aktivitas_list.appendChild(li);
                } else {
                    const svg = '<svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 -960 960 960" fill="#FFFFFF"><path d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>'
                    li.insertAdjacentHTML('afterbegin', svg);
                    pengumuman_list.appendChild(li);
                    if (notif[2].length > 70) {
                        h6.textContent = notif[2].slice(0, 70) + '...';
                        li.onclick = () => {
                            read_notif([notif[0]]);
                            li.classList.remove('not-read');
                            full_content.innerHTML = '';
                            const div = document.createElement('div');
                            const div_back = document.createElement('div');
                            const button = document.createElement('button');
                            div.id = 'back-box';
                            button.className = 'back';
                            button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#e8eaed"><path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z"/></svg>
                                            <span>Kembali</span>`
                            button.onclick = () => {
                                notif_container.classList.remove('hidden')
                                div.classList.add('hidden')
                            }
                            const p = document.createElement('p');
                            const h6 = document.createElement('h6');
                            p.textContent = notif[1];
                            h6.textContent = notif[2];
                            div_back.appendChild(button);
                            div.appendChild(div_back);
                            div.appendChild(p);
                            div.appendChild(h6);
                            full_content.appendChild(div);
                            notif_container.classList.add('hidden');
                            full_content.classList.remove('hidden');
                            div.classList.remove('hidden');
                        };
                    } else {
                        li.id = `notif-${notif[0]}`;
                    };
                };
            });
            pengumuman_list.classList.add('hidden');
            aktivitas_list.classList.remove('hidden');
        });
}

function read_notif(ids) {
    ids.forEach((id) => {
        const li = document.getElementById(`notif-${id}`);
        if (li) {
            li.classList.remove('not-read');
        }
    });
    fetch(`/notifications`, {
        method: 'POST',
        headers: {
            "Content-Type": 'application/json'
        },
        body: JSON.stringify({
            'id': ids
        })
    }).then(response => {
        if (!response.ok) {
            return response.text();
        }
    })
}

document.addEventListener('click', (event) => {
    if (!document.getElementById('dropdown-notif').contains(event.target) && !document.getElementById('notif-btn').contains(event.target)) {
        document.getElementById('dropdown-notif').classList.add('hidden');
    }
});

function change_notif(button) {
    notif_btn.forEach((btn) => {
        const menu_notif = document.getElementById(btn.textContent.trim())
        if (btn.classList.contains('active')) {
            if (!have_sending[btn.textContent.trim()]) {
                const data = [];
                menu_notif.querySelectorAll('li').forEach((li) => {
                    if (li.id !== '') {
                        data.push(Number(li.id.replace('notif-', '')));
                    }
                });
                read_notif(data);
                have_sending[btn.textContent.trim()] = true;
            };
            btn.classList.remove('active');
            menu_notif.classList.add('hidden');
        }
    })
    button.classList.add('active');
    const menu_notif = document.getElementById(button.textContent.trim())
    menu_notif.classList.remove('hidden');
}

function togglePopup(){
    popup_container.classList.toggle('hidden');
    document.getElementById('container').classList.toggle('blur');
}

function generatePagination() {
    paginationContainer.innerHTML = "";

    const pageNumbers = [];
    const range = 3;
    if (currentPage !== 1) {
        pageNumbers.push(1);
    }
    if (currentPage - range > 2) {
        pageNumbers.push("...");
    }
    for (let i = Math.max(2, currentPage - range); i < currentPage; i++) {
        pageNumbers.push(i);
    }
    pageNumbers.push(currentPage);
    for (let i = currentPage + 1; i <= Math.min(currentPage + range, totalPages - 1); i++) {
        pageNumbers.push(i);
    }
    if (currentPage + range < totalPages - 1) {
        pageNumbers.push("...");
    }

    if (currentPage !== totalPages) {
        pageNumbers.push(totalPages);
    }

    pageNumbers.forEach(number => {
        const pageButton = document.createElement("button");
        pageButton.textContent = number;
        if (number === "...") {
            pageButton.disabled = true;
        } else {
            pageButton.onclick = () => goToPage(number);
        }
        paginationContainer.appendChild(pageButton);
    });
}
generatePagination();
function goToPage(page) {
    window.location.href = `/admin/user-management?page=${page}`;
}

function create_msg(status, msg) {
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

function delete_el(button) {
    button.parentElement.remove();
}

const roles = document.querySelectorAll('.role')
roles.forEach(role => {
    const original_value = role.value;
    role.addEventListener('change', () => {
        username = role.parentNode.parentNode.children[1].textContent;
        if (confirm("Are you sure to change the role of " + username + "?")) {
            send_data({ "type": "data-role", "username": username, "role": role.value });
        } else {
            role.value = original_value;
        };
    });
});

document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const dataObject = { 'type': 'announcement' };
    formData.forEach((value, key) => {
        dataObject[key] = value;
    });
    send_data(dataObject);
    togglePopup();
    event.target.reset();
})

const users_before_change = users_data.innerHTML;
const pagination_before = paginationContainer.innerHTML;
let controller;
document.getElementById('search-bar').addEventListener('input', async (event) => {
    const search_value = event.target.value.trim().toLowerCase();
    if (controller) {
        controller.abort();
    }
    controller = new AbortController();
    if (search_value.length > 0) {
        result_search = await send_data({ "type": "search", "keywords": search_value }, signal = controller.signal);
        users_data.innerHTML = '';
        paginationContainer.innerHTML = '';
        if (result_search) {
            result_search.forEach(user => {
                Object.entries(user).forEach(([key, value]) => {
                    if (value.toString().toLowerCase().includes(search_value)) {
                        user[key] = value.toString().replace(new RegExp(search_value, 'gi'), match => `<mark>${match}</mark>`);
                    }
                })
                const html = `<tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.points}</td>
                <td>
                    <select class="role" ${user.id == 1 ? 'disabled' : ''}>
                        <option value="admin" ${user.admin ? 'selected' : ''}>Admin</option>                        
                        <option value="user" ${!user.admin ? 'selected' : ''}>User</option>
                        </select>
                        </td>
                        </tr>`;
                users_data.insertAdjacentHTML('beforeend', html);
            });
        } else {
            users_data.innerHTML = users_before_change;
            paginationContainer.innerHTML = pagination_before;
        }
    } else {
        users_data.innerHTML = users_before_change;
        paginationContainer.innerHTML = pagination_before;
    }
});

async function send_data(data_to_send, signal = null) {
    try {
        response = await fetch("/admin/user-management", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data_to_send),
            signal: signal
        })
        const data = await response.json();
        if (data.success) {
            if (data_to_send.type === "search") {
                return data.Message
            }
            create_msg('success', data.Message);
        } else {
            create_msg('error', data.Message);
        }
    } catch (error) {
        console.log(error);
    };
}
