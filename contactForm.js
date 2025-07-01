const scriptURL = 'https://script.google.com/macros/s/AKfycbyln3iD_QZmr5gaycoOhvJfShcVMGTB4O49C_WsW-wTD8udieeCwBon5nfdQuHponnyQQ/exec'
const form = document.forms['contactForm']

form.addEventListener('submit', e => {
    e.preventDefault()
    fetch(scriptURL, { method: 'POST', body: new FormData(form) })
        .then(response => alert("Thanks for Contacting us..! We Will Contact You Soon..."))
        .catch(error => console.error('Error!', error.message))
})
window.onload = checkWeather;
function checkWeather() {
    const weatherDescription = document.querySelector('.weather-description');
    const weatherIcon = document.querySelector('.weather-icons');


    fetch('https://api.openweathermap.org/data/2.5/weather?q=Delhi&appid=5df3ecbd4ba69dd38155557d8620c6c4')
        .then(response => response.json())
        .then(data => {

            const weatherInfo = `Temperature: ${(data.main.temp - 273).toFixed(2)}°C, Condition: ${data.weather[0].description}`;
            weatherDescription.innerHTML = `<h4>${weatherInfo}</h4>`;
            const condition = data.weather[0].description.toLowerCase();
            if (condition.includes('clear')) {
                weatherIcon.innerHTML += '<i class="wi wi-day-sunny"></i>';
            } else if (condition.includes('cloud')) {
                weatherIcon.innerHTML += '<i class="wi wi-cloudy"></i>';
            } else if (condition.includes('rain')) {
                weatherIcon.innerHTML += '<i class="wi wi-rain"></i>';
            } else {
                weatherIcon.innerHTML += '<i class="wi wi-day-cloudy"></i>';
            }
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
            weatherDescription.innerHTML = '<h1>Error fetching weather data</h1>';
        });
}