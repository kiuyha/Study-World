let selectedValue = "published";
let delete_content = null;
let checkbox_data = {};
const type_select = document.getElementById('type-pages');
const search_bar = document.getElementById('search-bar');
const content_container = document.getElementById('content-container');


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
