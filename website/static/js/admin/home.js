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

document.addEventListener('click', (event) => {
    if (!document.getElementById('dropdown-notif').contains(event.target) && !document.getElementById('notif-btn').contains(event.target)) {
        document.getElementById('dropdown-notif').classList.add('hidden');
    }
});

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
            // title:{
            //     display: false
            // },
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
                    callback: function(value) {
                        const date = new Date(this.getLabelForValue(value)); 
                        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric'}); 
                    }
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
                    color: '#ffffff',
                    callback: function(value) {
                        return value.toLocaleString('id-ID');
                    }
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
        
        if (Object.keys(chart_data).length === 0 || hasemptyarray(chart_data)) {
            document.getElementById('no-data-message').style.visibility = 'visible';
            document.getElementById('myChart').style.visibility = 'hidden';
        } else{
            document.getElementById('no-data-message').style.visibility = 'hidden';
            document.getElementById('myChart').style.visibility = 'visible';
            let graph = '';
            let users= [];
            let views= [];
            if ('user' in chart_data){
                users = chart_data.user.map(item => item[1]);
                graph = 'user';
            }
            if ('views' in chart_data){
                views = chart_data.views.map(item => item[1]);
                graph = 'views';
            }
            const labels = chart_data[graph].map(item => item[0]);
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