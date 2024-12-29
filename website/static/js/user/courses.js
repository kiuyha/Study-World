let max_index = 3; 
function toggleShowAll(button){
    const hidden_content = button.parentElement.previousElementSibling.querySelectorAll('li.module-card.hidden');
    const all_content = button.parentElement.previousElementSibling.querySelectorAll('li.module-card');
    if(hidden_content.length > 0){
        hidden_content.forEach(element => {
            element.classList.remove('hidden');
        });
        button.textContent = 'show less';
    }else{
        all_content.forEach((card, index) => {
            if(index > max_index){
                card.classList.add('hidden');
            }
        });
        button.textContent = 'show all';
    }
}
function adjustMaxIndex(){
    const all_section = document.querySelectorAll('.content-section');
    const window_width = window.innerWidth;
    
    if(window_width <= 768){
        max_index = 1;
    } else {
        max_index = 3;
    }
    all_section.forEach(element =>{
        const modules = element.querySelectorAll('.module-card');
        const button = element.querySelector('.button-container button');
        modules.forEach((card, index) => {
            if(button.textContent == 'show less'){
                return;
            }
            if(index > max_index){
                card.classList.add('hidden');
            }
        });
    });
}
window.addEventListener('resize', adjustMaxIndex);
window.addEventListener('load', adjustMaxIndex);