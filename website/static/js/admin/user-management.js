const totalPages = Number(document.getElementById('total-pages').value);
const currentPage = Number(new URLSearchParams(window.location.search).get('page')) || 1;
const popup_container = document.getElementById('popup-container');
const users_data = document.getElementById('users-data');
const paginationContainer = document.getElementById("pagination");

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
