let selectedValue = "published";
let delete_content = null;
let checkbox_data = {};
const type_select = document.getElementById('type-pages');
const notif_btn = document.querySelectorAll('#dropdown-notif > div button')
const notif_container = document.getElementById('notif-container')
const search_bar = document.getElementById('search-bar');
const content_container = document.getElementById('content-container');


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

function change_notif(button){
    const notif_menu = document.querySelectorAll('.notif-list');
    notif_menu.forEach((menu)=>{
        menu.classList.add('hidden')
    })
    notif_btn.forEach((btn) =>{
        btn.classList.remove('active')
    })
    document.getElementById(button.textContent.trim()).classList.remove('hidden')
    button.classList.add('active')
}

document.addEventListener('click', (event) => {
    if (!document.getElementById('dropdown-notif').contains(event.target) && !document.getElementById('notif-btn').contains(event.target)) {
        document.getElementById('dropdown-notif').classList.add('hidden');
    }
});

function toggleFullContent(button){
    notif_container.classList.toggle('hidden')
    document.getElementById(button).classList.toggle('hidden')
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
    fetch("{{ url_for('admin.pages') }}", {
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

const content_boxes_before = content_container.innerHTML;
search_bar.addEventListener('input', (event) => {
    const search_value = event.target.value.trim().toLowerCase();
    if (search_value.length > 0) {
        const all_content = document.querySelectorAll('.content-box');
        content_container.innerHTML = '';
        all_content.forEach(content => {
            const data_content = content.querySelector('button').dataset;
            let is_content_searched = false;
            Object.entries(data_content).forEach(([key, value]) => {
                const key_element = content.querySelector(`.${key}`)
                if (key_element){
                    key_element.innerHTML = value;
                    if (value.toString().toLowerCase().includes(search_value)) {
                        key_element.innerHTML = value.toString().replace(new RegExp(search_value, 'gi'), match => `<mark>${match}</mark>`);
                        is_content_searched = true;
                    }
                }
            });
            if (is_content_searched) {
                content_container.appendChild(content);
            }
        });
    } else{
        content_container.innerHTML = content_boxes_before
    }
});
