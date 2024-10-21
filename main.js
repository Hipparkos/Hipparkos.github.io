const map = L.map("map").setView([64, 25], 5.5);

L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
  maxZoom: 18,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
}).addTo(map);

const api = "4ef2c04204c9c9004933e7705b459cd2";

async function fetchCities() {
  const response = await fetch("cities.json");
  const cities = await response.json();
  return cities;
}

async function updateMap() {
  const cities = await fetchCities();
  const tempData = await fetchTempData(cities);

  const heatPoints = tempData.map(({ lat, lng, temp }) => [lat, lng, temp]);

  const heatLayer = L.heatLayer(heatPoints, {
    radius: 60,
    blur: 100,
    maxZoom: 19,
    gradient: {
      0.0: "#264CFF",
      0.1: "#3FA0FF",
      0.2: "#72D8FF",
      0.3: "#AAF7FF",
      0.4: "#E0FFFF",
      0.5: "#FFFFBF",
      0.6: "#FFE099",
      0.7: "#FFAD72",
      0.8: "#F76D5E",
      0.9: "#D82632",
      1.0: "#A50021",
    }
  }).addTo(map);

  async function fetchTempData(cities) {
    const tempData = [];

    for (const city of cities) {
      const { lat, lng } = city;
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${api}`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.main && data.coord) {
          tempData.push({
            lat: data.coord.lat,
            lng: data.coord.lon,
            temp: data.main.temp,
            name: city.city,
          });
        }
      } catch (error) {
        console.error("Error fetching weather data: ", error);
      }
    }
    return tempData;
  }

  function tempColor(temp) {
    if (temp <= 0) return "#264CFF";
    else if (temp > 0 && temp <= 10) return "#3FA0FF";
    else if (temp > 10 && temp <= 20) return "#72D8FF";
    else if (temp > 20 && temp <= 30) return "#FFFFBF";
    else return "#A50021";
  }

  // Function to show the name of the city and temperature when hovering your cursor over it.
  tempData.forEach(({ lat, lng, temp, name }) => {
    const color = tempColor(temp);
    const marker = L.circleMarker([lat, lng], {
      radius: 3,
      color: color,
      fillColor: color,
      fillOpacity: 1,
    }).addTo(map);

    marker.bindPopup(`Temperature in ${name}: ${temp}°C`);

    marker.on("mouseover", function (e) {
      this.openPopup();
    });
    marker.on("mouseout", function (e) {
      this.closePopup();
    });
  });
}

function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const timeString = `${hours}:${minutes}:${seconds}`;

  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const dateString = `${day}.${month}.${year}`;

  document.getElementById("clock").textContent = timeString;
  document.getElementById("dateDisplay").textContent = dateString;
}

document.getElementById('weatherBtn').addEventListener('click', () =>{
  const userCity = document.getElementById('userCity').value;

  if (userCity === ''){
    alert('Kaupunkia ei löydy!');
    return;
  }

  const cityWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${userCity}&appid=${api}&units=metric`;

  fetch(cityWeatherUrl).then(response => {
    return response.json();
  }).then(data =>{
    const cityWeatherResult = document.getElementById('cityWeatherResult');
    if(data.cod === 200){
      const temp = data.main.temp;
      cityWeatherResult.textContent = `Temperature in ${userCity}: ${temp}°C`;
    } else {
      cityWeatherResult.textContent = `Kaupungin tietoja ei löytynyt.`;
    }
  }).catch (error => {
    console.error("Error fetching weather data: ", error);
  });
});

updateClock();
setInterval(updateClock, 1000);
updateMap();