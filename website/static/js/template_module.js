const notif_btn = document.querySelectorAll('#dropdown-notif > div button')
const dropdown_notif = document.getElementById('dropdown-notif');
const notif_container = document.getElementById('notif-container');
const full_content = document.getElementById('full-content');
const aktivitas_list = document.getElementById('Aktivitas');
const pengumuman_list = document.getElementById('Pengumuman');
const have_sending = {}

// dropdown function
function toggleNotifDropdown(){
    dropdown_notif.classList.toggle('hidden');
    if (!dropdown_notif.classList.contains('hidden')){
        fetch_notif();
    } else{
        if (!have_sending['Aktivitas']){
            const data = [];
            aktivitas_list.querySelectorAll('li').forEach(li => {
                data.push(Number(li.id.replace('notif-', '')));
            });
            read_notif(data);
        }
        const notif_not_read = Array.from(notif_container.querySelectorAll('li')).some(li => li.classList.contains('not-read'))
        if (!notif_not_read){
            document.getElementById('notif-btn').classList.remove('have-notif');
        }
    }
}

function fetch_notif(){
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
    });
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
    }).then(response => {
        if (!response.ok) {
            return response.text();
        }
    })
}

document.addEventListener('click', (event) => {
    if (!dropdown_notif.contains(event.target) && !document.getElementById('notif-btn').contains(event.target)) {
        if (!dropdown_notif.classList.contains('hidden')){
            toggleNotifDropdown();
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

menubar = document.getElementById('menuBar');
menubar.addEventListener('change', () => {
    if(menubar.checked){
        document.querySelector('nav').style.display = 'block';
    } else {
        document.querySelector('nav').style.display = 'none';
    }
});


// function change module
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

//function for radio-button
document.querySelectorAll('li').forEach(function(item) {
    item.addEventListener('click', function() {
        var radio = item.querySelector('input[type="radio"]');
        if (radio) {
        radio.checked = true;
        }
    });
});

//function for quiz
const form = document.getElementById('quiz-form');
form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const data = formData.get('answer');
    send_data(data);
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


// comment function
let page = 1;

function textarea_inputed(textarea){
    const submit_btn = textarea.nextElementSibling.querySelector('.submit-btn');
    if (textarea.value === '') {
        submit_btn.style.cssText = '';
    } else{
        textarea.style.cursor = 'text';
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
        submit_btn.style.backgroundColor = '#0056b3';
        submit_btn.style.cursor = 'pointer';
        submit_btn.style.color = 'white';
    }
}

function textarea_focused(textarea){
    textarea.nextElementSibling.style.cssText = '';
}

function cancel_button(button, reply=false){
    if (reply){
        button.closest('.comment-form').remove();
    }
    button.parentElement.previousElementSibling.value = '';
    button.parentElement.previousElementSibling.style.cssText = '';
    button.closest('.button-group').style.display = 'none';
    button.nextElementSibling.style.cssText = '';
}

//function for textarea
document.querySelectorAll('textarea').forEach((textarea) => {
    textarea.addEventListener('input', () => textarea_inputed(textarea));
    textarea.addEventListener('focus', () => textarea_focused(textarea));
})

//hide textarea
document.querySelectorAll('.cancel-btn').forEach((button) => {
    button.addEventListener('click', () => cancel_button(button));
})

function reply_button(button){
    const reply_btn = document.querySelectorAll('.reply-btn');
    reply_btn.forEach((btn) => {
        if (btn.nextElementSibling.classList.contains('comment-form') && btn !== button){
            btn.nextElementSibling.remove();
        }
    })
    if (!button.closest('.comment-form')){
        const comment_form = document.querySelector('.comment-form').cloneNode(true);
        button.insertAdjacentElement('afterend', comment_form);
        comment_form.querySelector('textarea').addEventListener('input', () => textarea_inputed(comment_form.querySelector('textarea')));
        comment_form.querySelector('textarea').addEventListener('focus', () => textarea_focused(comment_form.querySelector('textarea')));
        comment_form.querySelector('.cancel-btn').addEventListener('click', () => cancel_button(comment_form.querySelector('.cancel-btn'), true));
        comment_form.querySelector('form').addEventListener('submit', send_comment);
    }
}

document.getElementById('show-comments').addEventListener('click', async () => {
    await fetch_comments();
    document.getElementById('comments').classList.remove('hidden');
    document.getElementById('show-comments').remove();
})

function add_comments(datas, target){
    const div = document.createElement('div');
    div.classList.add('comment-list');
    datas.forEach((data) => {
        const date = new Date(data[3]);
        const formatted_date = date.toLocaleString('id-ID', {
            day: '2-digit',
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z"/></svg>';
        const reply = data[5] !== 0 ? `${svg}<span>${data[5]} Balasan</span>` : '';
        const html = `
        <div class="comment" id="comment-${data[0]}">
            <img src="/static/${data[1]}" alt="Profile Picture">
            <div class="comment-content">
                <div class="comment-header">
                    <strong>@${data[2]}</strong>
                    <span>${formatted_date}</span>
                </div>
                <p>${data[4]}</p>
                <button class="reply-btn" onclick="reply_button(this)">Balas</button>
                <button class="open-reply" onclick="fetch_comments(${data[0]}, this)">
                    ${reply}
                </button>
            </div>
        </div>`
        div.insertAdjacentHTML('beforeend', html);
    })
    document.querySelector(target).appendChild(div);
}

async function fetch_comments(parent_id=null, button=null ,refresh=false){
    let url;
    let target;
    if (refresh){
        page = 1;
    }
    if (parent_id){
        url = `/comments/${document.title}?parent_id=${parent_id}`;
        target = `#comment-${parent_id} .comment-content`;
    }else{
        url = `/comments/${document.title}?page=${page}`;
        target = '#comments';
    }
    const response = await fetch(url)
    const data = await response.json();
    if (refresh){
        const comment_list = document.querySelector(`${target} .comment-list`)
        if(comment_list){
            comment_list.remove();
        };
    }else{
        if(!parent_id){
            page += 1;
        } else if (button){
            button.remove();
        }
    }
    if (data[1]){
        add_comments(data[0], target);
        return true;
    } else{
        return false;
    }
}

function send_comment(event){
    event.preventDefault();
    if (!event.target.querySelector('textarea').value){
        return
    }
    const commentValue = event.target.querySelector('textarea').value;
    let parent_id = null;
    const parentElem = event.target.closest('[id^="comment-"]');
    if (parentElem) {
        parent_id = parentElem.id.split('-')[1];
        event.target.parentElement.remove();
    } else{
        event.target.querySelector('textarea').value = '';
        event.target.querySelector('textarea').style.cssText = '';
        event.target.querySelector('.button-group').style.display = 'none';
        event.target.querySelector('.submit-btn').style.cssText = '';
    }
    const data = {
        'parent_id': parent_id,
        'comment': commentValue
    };
    fetch(`/comments/${document.title}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if(data.success){
            create_msg('success', data.Message);
            if (parent_id){
                const button = parentElem.querySelector(`.open-reply`);
                if(button){
                    button.remove();
                }
                fetch_comments(parent_id,null, false);
            }
            else{
                fetch_comments(null,null, true);
            }
        }else{
            create_msg('error', data.Message);
        }
    })
}
document.querySelector('#comments form').addEventListener('submit', send_comment);

function scroll_bottom(){
    const scrollPosition = window.scrollY + window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    if (scrollPosition >= documentHeight - 100) {
        return true;
    }else{
        return false;
    }
}

let executed = false;
let loading = false;
const comments_container = document.getElementById('comments-container');
document.addEventListener('DOMContentLoaded', () => {
    search_comment();
    window.addEventListener('scroll', async () =>{
        const comment_button = document.getElementById(`show-comments`);
        if (comment_button){
            if(!executed){
                if(scroll_bottom()){
                    send_data(null, true);
                    executed = true;
                }
            }
        }else{
            if (loading) return;
            const loadingIndicator = document.getElementById('loading-comments');
            if(scroll_bottom()){
                loadingIndicator.classList.remove('hidden');
                loading = true;
                is_continue =  await fetch_comments();
                if(is_continue){
                    loadingIndicator.classList.add('hidden');
                    loading = false;
                }else{
                    loadingIndicator.querySelector('img').remove();
                    loadingIndicator.textContent = 'Ini akhir dari komentar'
                }
            }
        };
    });
});

function search_comment(target_id = null){
    const hash = window.location.hash
    if(hash){
        const commentId = hash.substring(1);
        const comment_button = document.getElementById(`show-comments`);
        if (comment_button) {
            comment_button.click();
        }
        const header_height = document.querySelector('header').offsetHeight;
        let targetComment = document.getElementById(commentId);
        if (!targetComment) {
            const scrollInterval = setInterval(() => {
                document.querySelectorAll('.open-reply').forEach((btn) => {
                    btn.click();
                });
                targetComment = document.getElementById(commentId);
                if (targetComment) {
                    targetComment.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                    window.scrollBy(0, -header_height);
                    clearInterval(scrollInterval);
                } else {
                    comments_container.scrollTop = comments_container.scrollHeight;
                }
            }, 500);
        }else{
            targetComment = document.getElementById(target_id);
            targetComment.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            window.scrollBy(0, -header_height);
        }
    };
}
window.addEventListener('hashchange', search_comment);