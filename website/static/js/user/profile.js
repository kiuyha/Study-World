const ctx = document.getElementById('myChart').getContext('2d');
const myChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: [],  
        datasets: [
        {
            data: [], 
            backgroundColor:'#ff1616',
            barThickness: 40,
        }
    ]
    },
    options: {
        responsive: true,
        plugins: {
            datalabels:{
                color: 'white',
                font: {
                    weight: 'bold',
                    size: 14,
                },
                anchor:'end',
                align: 'end',
                offset: 2,
                clip: true,
                padding:{
                    top: 10,
                },
                formatter: (value) =>
                    value.toLocaleString('id-ID'),
            },
            legend :{
                display: false,
            }
        },
        scales: {
            x: {
                display: true,
                ticks: {
                    color: 'white',
                    font: {
                        weight: 'bold',
                        size: 14,
                    },
                    callback: function(value) {
                        const date = new Date(this.getLabelForValue(value)); 
                        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }); 
                    }
                },
                grid: {
                    display: false
                },
            },
            y: {
                display:false,
                beginAtZero: true,
                suggestedMin: 0,
            }
        }
    },
    plugins: [ChartDataLabels],
});

function update_data(){
    fetch('/profile', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify('okay')
    }).then(response => response.json()).then(data => {
        const user_point = data[0];
        const leaderboard_data = data[1];
        const chart_data = data[2];

        document.getElementById('user_point').textContent = user_point;
        const leaderboard = document.getElementById('leaderboard');
        leaderboard.innerHTML = '';
        const username = document.getElementById('username').textContent;
        let div_top_five = '';
        leaderboard_data.forEach((user, index) => {
            const id_user_rank = user[1] == username ? 'user_rank' : '';
            const img_rank = user[0] <= 3 ? `<img src="/static/img/top${user[0]}.svg">` : `<p class="rank">${user[0]}</p>`;
            const dot = (index !== 0 && user[0] !== leaderboard_data[index - 1][0] + 1) ? `<div class="line-break"></div>` : '';
            const html = `
                ${dot}
                <div class="users-rank" id="${id_user_rank}">
                    <div class="left-box">
                        ${img_rank}
                        <img src="/static/${user[3]}">
                        <p>${user[1]}</p>
                    </div>
                    <div class="right-box">
                        <p>${user[2]}</p>
                    </div>
                </div>`
            if (index < 5) {
                div_top_five += html;
            }else{
                leaderboard.insertAdjacentHTML('beforeend', html);
            }
        })
        leaderboard.insertAdjacentHTML('afterbegin', `<div id="top-five">${div_top_five}</div>`);

        if(chart_data.length == 0){
            document.getElementById('no-data-message').style.visibility = 'visible';
            document.getElementById('myChart').style.visibility = 'hidden';
        } else{
            document.getElementById('no-data-message').style.visibility = 'hidden';
            document.getElementById('myChart').style.visibility = 'visible';
            myChart.data.labels = chart_data.map(item => item[0]);
            const value = chart_data.map(item => item[1])
            myChart.data.datasets[0].data = value;
            let MaxValue = Math.max(...value);
            let suggestedMax = MaxValue + (MaxValue * 0.3);
            myChart.options.scales.y.suggestedMax = suggestedMax; 
            myChart.update();
        }
    })
}

window.onload = function() {
    update_data();
};
function refresh(button){
    update_data();
    const image = button.querySelector('img');
    image.classList.remove('click');
    void image.offsetWidth;
    image.classList.add('click');
}