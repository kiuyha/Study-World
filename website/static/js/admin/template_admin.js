const toggleButton = document.getElementsByClassName('toggle-btn')[0];
const sidebar = document.getElementById('sidebar');
const main = document.querySelector('main');
function toggleSidebar() {
    sidebar.classList.toggle('close');
    toggleButton.classList.toggle('rotate');;
    if(window.innerWidth <= 768){
        if (sidebar.classList.contains('close')){
            main.style.display = 'flex';
        } else{
            main.style.display = 'none';
        }
    }
}
if(window.innerWidth <= 768){
    toggleSidebar()
}
