let selectedValue = "published";
let delete_content = null;
let checkbox_data = {};
const type_select = document.getElementById('type-pages');
const search_bar = document.getElementById('search-bar');
const content_container = document.getElementById('content-container');
const notif_btn = document.querySelectorAll('#dropdown-notif > div button')
const dropdown_notif = document.getElementById('dropdown-notif');
const notif_container = document.getElementById('notif-container');
const full_content = document.getElementById('full-content');
const aktivitas_list = document.getElementById('Aktivitas');
const pengumuman_list = document.getElementById('Pengumuman');
const have_sending = {}

// dropdown function
async function toggleNotifDropdown(){
    if (dropdown_notif.classList.contains('hidden')){
       await fetch_notif();
       dropdown_notif.classList.remove('hidden');
    } else{
        if (!have_sending['Aktivitas']){
            const data = [];
            aktivitas_list.querySelectorAll('li').forEach(li => {
                data.push(Number(li.id.replace('notif-', '')));
            });
            read_notif(data);
        }
        dropdown_notif.classList.add('hidden');
    }
    const notif_not_read = Array.from(notif_container.querySelectorAll('li')).some(li => li.classList.contains('not-read'))
    const notif_icon = document.getElementById('notif-btn')
    if (!notif_not_read){
        notif_icon.classList.remove('have-notif');
    }else{
        notif_icon.classList.add('have-notif');
    }
}

async function fetch_notif(){
    aktivitas_list.innerHTML = '';
    pengumuman_list.innerHTML = '';
    full_content.innerHTML = '';
    const data = await (await fetch('/notifications')).json();
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
        if (!notif[4]){
            li.classList.add('not-read');
        }
        if (!notif[3]){
            const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#EAC452"><path d="m354-287 126-76 126 77-33-144 111-96-146-13-58-136-58 135-146 13 111 97-33 143ZM233-120l65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Zm247-350Z"/></svg>'
            if(notif[5]){
                const a = document.createElement('a');
                a.href = notif[5];
                a.innerHTML = li.innerHTML;
                a.insertAdjacentHTML('afterbegin', '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed"><path d="M240-400h320v-80H240v80Zm0-120h480v-80H240v80Zm0-120h480v-80H240v80ZM80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z"/></svg>');
                li.innerHTML = '';
                li.appendChild(a);
            }else{
                li.insertAdjacentHTML('afterbegin', svg);
            }
            li.id = `notif-${notif[0]}`;
            aktivitas_list.appendChild(li);   
        } else{
            const svg = '<svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 -960 960 960" fill="#FFFFFF"><path d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>'
            li.insertAdjacentHTML('afterbegin', svg);
            pengumuman_list.appendChild(li);
            if (notif[2].length > 70){
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
            } else{
                li.id = `notif-${notif[0]}`;
            };
        };
    });
    pengumuman_list.classList.add('hidden');
    aktivitas_list.classList.remove('hidden');
    notif_btn[1].classList.remove('active');
    notif_btn[0].classList.add('active');
    full_content.classList.add('hidden');
    notif_container.classList.remove('hidden');
}

function read_notif(ids){
    ids.forEach((id) => {
        const li = document.getElementById(`notif-${id}`);
        if(li){
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
    }).then((response) => {
        if (!response.ok) {
            return response.text();
        }
    })
}
document.addEventListener('click', async (event) => {
    if (!dropdown_notif.contains(event.target) && !document.getElementById('notif-btn').contains(event.target)) {
        if (!dropdown_notif.classList.contains('hidden')){
           await toggleNotifDropdown();
        }
    }
});

function change_notif(button){
    notif_btn.forEach((btn) =>{
        const menu_notif = document.getElementById(btn.textContent.trim())
        if (btn.classList.contains('active')){
            if (!have_sending[btn.textContent.trim()]){
                const data = [];
                menu_notif.querySelectorAll('li').forEach((li)=>{
                    if (li.id !== ''){
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


type_select.addEventListener("change",() =>{
    send_data(type_select.value)
})


function remove_content(button){
    let classe = button.getAttribute('data-class');
    let course = button.getAttribute('data-course');
    let modul = button.getAttribute('data-module');
    let id_module = button.getAttribute('data-id')
    if(confirm(`Are you sure you want to remove the content for module ${modul}, class ${classe}, course ${course}?`)){
        delete_content = id_module
        send_data()
    }
}
const button = document.getElementById('filter-btn')
button.addEventListener("click", () =>{
    button.classList.toggle('click');
    const filter_check = document.getElementById('filter-box')
    if(filter_check.classList.contains('hidden')){
        filter_check.classList.remove('hidden');
    }else{
        filter_check.classList.add('hidden');
        send_data()
    }
});

function getcheckboxdata(){
    const filter_check = document.getElementById('filter-box')
    filter_check.querySelectorAll("ul").forEach(ul => {
        ul.querySelectorAll('li').forEach(li => {
            const label = li.querySelector('label');
            if (label) {
                const category = label.textContent.trim();
                const checkbox = li.querySelector('input[type="checkbox"]');
                if (checkbox && checkbox.checked) {
                    if (!checkbox_data[selectedValue][ul.id]) {
                        checkbox_data[selectedValue][ul.id] = [];
                    }
                    checkbox_data[selectedValue][ul.id].push(category);
                };
            };
        });
    });
}

function send_data(select_value= null){
    checkbox_data[selectedValue] = {};
    getcheckboxdata()
    if (select_value !== null){
        selectedValue = select_value;
    }
    let data = {[selectedValue] : checkbox_data[selectedValue] || {'new' : true}};
    if (delete_content){
        data[selectedValue]['delete'] = delete_content
    }
    fetch("/admin/page-management", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data),
    }).then(response => response.text())
    .then(html => {
        document.getElementById('update-content').outerHTML = html;
        delete_content = null
    }).catch(error => {
        alert(`error sending data: ${error}`);
    });
}

const all_content = Array.from(document.getElementsByClassName('content-box'));
search_bar.addEventListener('input', (event) => {
    const search_value = event.target.value.trim().toLowerCase();
    content_container.innerHTML = '';
    if (search_value.length > 0) {
        all_content.forEach(content => {
            const new_content = content.cloneNode(true);
            const data_content = new_content.querySelector('button').dataset;
            let is_content_searched = false;
            Object.entries(data_content).forEach(([key, value]) => {
                const key_element = new_content.querySelector(`.${key}`)
                if (key_element){
                    key_element.innerHTML = value;
                    if (value.toString().toLowerCase().includes(search_value)) {
                        key_element.innerHTML = value.toString().replace(new RegExp(search_value, 'gi'), match => `<mark>${match}</mark>`);
                        is_content_searched = true;
                    }
                }
            });
            if (is_content_searched) {
                content_container.appendChild(new_content);
            }
        });
    } else{
        all_content.forEach(content => {
            content_container.appendChild(content);
        });
    }
});
