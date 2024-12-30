const toggleButton = document.getElementsByClassName('toggle-btn')[0];
const sidebar = document.getElementById('sidebar');
const main = document.querySelector('main');
const notif_menu = document.querySelectorAll('.notif-list');
const notif_btn = document.querySelectorAll('#dropdown-notif > div button')
const notif_container = document.getElementById('notif-container');

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

function closeAllSubMenu(){
    Array.from(sidebar.getElementsByClassName('show')).forEach(ul => {
        ul.classList.remove('show');
        ul.previousElementSibling.classList.remove('rotate');
    })
}

function toggleSidebar() {
    sidebar.classList.toggle('close');
    toggleButton.classList.toggle('rotate');
    if(window.innerWidth <= 768){
        if (sidebar.classList.contains('close')){
            main.style.display = 'flex';
        } else{
            main.style.display = 'none';
        }
    }
    closeAllSubMenu();
    
}
if(window.innerWidth <= 768){
    toggleSidebar()
}
function toggleSubMenu(button){
    if(!button.nextElementSibling.classList.contains('show')){
        closeAllSubMenu();
    };

    button.nextElementSibling.classList.toggle("show");
    button.classList.toggle('rotate');

    if(sidebar.classList.contains('close')){
        sidebar.classList.toggle('close');
        toggleButton.classList.toggle('rotate');
    }
}
document.addEventListener('click', (event) => {
    if (!document.getElementById('dropdown-notif').contains(event.target) && !document.getElementById('notif-btn').contains(event.target)) {
        document.getElementById('dropdown-notif').classList.add('hidden');
    }
    if (!document.getElementById('dropdown-search').contains(event.target) && !document.getElementById('search-bar').contains(event.target)) {
        document.getElementById('dropdown-search').classList.add('hidden');
    }
});

const search = document.getElementById('search-bar');
let controller;
search.addEventListener('input', (event) => {
    search_results = document.getElementById('search-results');
    search_value = event.target.value.trim().toLowerCase();
    if (controller){
        controller.abort();
    }
    controller = new AbortController();
    if(search_value.length > 0){
        document.getElementById('dropdown-search').classList.remove('hidden');
        try{
            fetch(`/search_module/${search_value}`, {signal: controller.signal })
            .then(response => response.json())
            .then(data => {
                search_results.innerHTML = '';
                data.forEach((module_data) => {
                    const search_result = `${module_data.module} - ${module_data.course} - ${module_data.class}`;
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.href = module_data.url;
                    a.innerHTML = search_result.replace(new RegExp(search_value, 'gi'), match => `<mark>${match}</mark>`);
                    li.appendChild(a);
                    search_results.appendChild(li);
                });
            });
        } catch{
            search_result.innerHTML='';
        };
    } else {
        search_results.innerHTML = '';
    };
});
