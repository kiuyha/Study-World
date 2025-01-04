const dropdown_notif = document.getElementById('dropdown-notif');
const notif_container = document.getElementById('notif-container');
const notif_btn = document.querySelectorAll('#dropdown-notif > div button')
const full_content = document.getElementById('full-content');
const aktivitas_list = document.getElementById('Aktivitas');
const pengumuman_list = document.getElementById('Pengumuman');
const have_sending = {}

// dropdown function
function toggleNotifDropdown(){
    if (dropdown_notif.classList.contains('hidden')){
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
    dropdown_notif.classList.toggle('hidden');
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

// variable global for the button
let date = 7;
let graph = {
    'user': true,
    'views' : false,
};

//create graph
const ctx = document.getElementById('myChart').getContext('2d');
const gradient_1 = ctx.createLinearGradient(0, 0, 0, 400);
gradient_1.addColorStop(0, 'rgba(256, 0, 0, 0.38)')
gradient_1.addColorStop(1, 'rgba(256, 0, 0, 0.05)')
const gradient_2 = ctx.createLinearGradient(0, 0, 0, 400);
gradient_2.addColorStop(0, 'rgba(0, 256, 0, 0.38)')
gradient_2.addColorStop(1, 'rgba(0, 256, 0, 0.05)')
const myChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [], 
        datasets: [
        {
            label: 'User',
            data: [], 
            borderColor: 'rgba(256, 0, 0, 1)',
            backgroundColor: gradient_1,
            borderWidth: 2,
            fill: true,
            tension: 0.1,
        },{
            label: 'Views',
            data: [], 
            borderColor: 'rgba(0, 256, 0, 1)',
            backgroundColor: gradient_2,
            borderWidth: 2,
            fill: true,
            tension: 0.1,
        },
    ]
    },
    options: {
        responsive: true,
        plugins: {
            legend :{
                display: false,
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Date',
                    color: '#ffffff',
                },
                ticks: {
                    color: '#ffffff',
                },
                grid: {
                    color: function(context) {
                        if (context.index === 0)
                        return '#ffffff';
                    },
                },
            },
            y: {
                ticks: {
                    color: '#ffffff'
                },
                grid: {
                    color: function(context) {
                        if (context.index === 0)
                        return '#ffffff';
                    },
                },
                beginAtZero: true
            }
        }
    }
});

//function to get the data
async function fetch_data() {
    try {
            const data = {
                'date': date,
                'graph': graph,
            };
            const response = await fetch('/admin/home',{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            return result;
        } catch (error) {
            return {};
        }
    };

async function update_data() {
    const data = await fetch_data();
    // update the box data, the first you see
    const data_box = document.getElementsByClassName('data_box')
    Array.from(data_box).forEach((element, index) => {
        if (data.box_data && data.box_data[index] !== undefined) {
            element.textContent = data.box_data[index].toLocaleString('id-ID');
        }
    });

    // update the graph
    const chart_data = data.chart_data
    function hasemptyarray(obj) {
        return Object.values(obj).some(value => Array.isArray(value) && value.length === 0);
    }

    function fillMissingDates(data) {
        let start = new Date(data[0][0]);
        const end = new Date();
        const dateArray = [];
        let index = 0;
        while (start <= end) {
            const currentDate = new Date(start);
            let value = 0;
            if(data.length > index){
                if(currentDate.getTime() === new Date(data[index][0]).getTime()){
                    value = data[index][1];
                    index += 1;
                }
            }
            currentDate.setHours(0, 0, 0, 0);
            dateArray.push([currentDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric'}), value]);
            start.setDate(currentDate.getDate() + 1);
        }
        return dateArray;
    }
    
    if (Object.keys(chart_data).length === 0 || hasemptyarray(chart_data)) {
        document.getElementById('no-data-message').style.visibility = 'visible';
        document.getElementById('myChart').style.visibility = 'hidden';
    } else{
        document.getElementById('no-data-message').style.visibility = 'hidden';
        document.getElementById('myChart').style.visibility = 'visible';
        let full_data = [];
        let users= [];
        let views= [];
        if ('user' in chart_data){
            full_data = fillMissingDates(chart_data.user);
            users = full_data.map(item => item[1]);
        }
        if ('views' in chart_data){
            full_data = fillMissingDates(chart_data.views)
            views = full_data.map(item => item[1]);
        }
        const labels = full_data.map(item => item[0]);
        myChart.data.labels = labels;
        myChart.data.datasets[0].data = users;
        myChart.data.datasets[1].data = views;
        myChart.update();
    }
};

// initialize the graph when page loaded
window.onload = function() {
    update_data();
};

//function to update graph according to button
function update_date_graph(button, range=false){
    if (range){
        date = range;
        const date_buttons = document.getElementsByClassName("date-btn");
        Array.from(date_buttons).forEach( element =>{
            element.classList.remove('btn-use')
        })
    } else{
        if (button.id === 'user-graph-btn'){
            if (graph['user']){
                graph['user'] = false;
            }else{
                graph['user'] = true;
            }
        }else{
            if (graph['views']){
                graph['views'] = false;
            }else{
                graph['views'] = true;
            }
        }
    }
    button.classList.toggle('btn-use')
    update_data(date, graph)
};

//function to refresh data
function toggleUpdate(button){
    update_data(date,graph);
    const image = button.querySelector('img');
    image.classList.remove('click')
    void image.offsetWidth;
    image.classList.add('click')
};