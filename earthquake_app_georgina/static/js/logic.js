// This function determines the color of the marker based on the depth of the earthquake.
function chooseColor(depth) {
  let color = "#98ee00";
}
  // This function determines the color of the marker based on the depth of the earthquake.
function chooseColor(depth) {
  if (depth > 90) return "#ea2c2c";
  if (depth > 70) return "#ea822c";
  if (depth > 50) return "#ee9c00";
  if (depth > 30) return "#eecc00";
  if (depth > 10) return "#d4ee00";
  return "#98ee00";
}

// Helper function for radius
function getRadius(mag) {
  return mag * 4;
}

// Make Map
function createMap(time_frame) {
  // Delete Map
  let map_container = d3.select("#map_container");
  map_container.html(""); // empties it
  map_container.append("div").attr("id", "map"); //recreate it

  // Step 1: CREATE THE BASE LAYERS
  let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });

  let topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
  });

  // Get Data
  let queryUrl = `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_${time_frame}.geojson`;
  let platesUrl = 'https://raw.githubusercontent.com/fraxen/tectonicplates/refs/heads/master/GeoJSON/PB2002_boundaries.json';

  d3.json(queryUrl).then(function (data) {
    d3.json(platesUrl).then(function (plate_data) {
      console.log(data); // ✅ Now inside the correct scope

      // Step 2: CREATE THE DATA/OVERLAY LAYERS
      let markers = [];
      let heatArray = [];
      for (let i = 0; i < data.features.length; i++) {
        let row = data.features[i];
        let location = row.geometry.coordinates;
        if (location) {
          let latitude = location[1];
          let longitude = location[0];
          let depth = location[2];
          let mag = row.properties.mag;

          // Create Marker
          let marker = L.circleMarker([latitude, longitude], {
            fillOpacity: 0.75,
            color: "white",
            fillColor: chooseColor(depth),
            radius: getRadius(mag)
          }).bindPopup(`<h1>${row.properties.title}</h1><hr><h2>Depth: ${depth}m</h2>`);

          markers.push(marker);
          heatArray.push([latitude, longitude]); // Heatmap point
        }
      }

      // Create Layer Groups
      let markerLayer = L.layerGroup(markers);
      let heatLayer = L.heatLayer(heatArray, { radius: 50, blur: 15 });
      let geoLayer = L.geoJSON(plate_data, { style: { color: "firebrick", weight: 5 } });

      // Step 3: CREATE THE LAYER CONTROL
      let baseMaps = { Street: street, Topography: topo };
      let overlayMaps = { Earthquakes: markerLayer, "Tectonic Plates": geoLayer, Heatmap: heatLayer };

      // Step 4: INITIALIZE THE MAP
      let myMap = L.map("map", {
        center: [40.7, -94.5],
        zoom: 3,
        layers: [street, markerLayer, geoLayer]
      });

      // Step 5: Add the Layer Control, Legend, Annotations as needed
      L.control.layers(baseMaps, overlayMaps).addTo(myMap);

      // Set up the legend
      let legend = L.control({ position: "bottomright" });
      legend.onAdd = function () {
        let div = L.DomUtil.create("div", "info legend");
        div.innerHTML = `<h3>Earthquake <br> Depth</h3>
        <i style="background:#98ee00"></i>-10-10<br>
        <i style="background:#d4ee00"></i>10-30<br>
        <i style="background:#eecc00"></i>30-50<br>
        <i style="background:#ee9c00"></i>50-70<br>
        <i style="background:#ea822c"></i>70-90<br>
        <i style="background:#ea2c2c"></i>90+`;
        return div;
      };
      legend.addTo(myMap);

      let legendOn = true;
      function toggleLegend() {
        if (legendOn) {
          myMap.removeControl(legend);
          legendOn = false;
        } else {
          legend.addTo(myMap);
          legendOn = true;
        }
      }

      // ✅ Define custom control for toggling legend
      let LegendToggleControl = L.Control.extend({
        options: { position: 'topright' },
        onAdd: function () {
          let container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
          container.style.backgroundColor = 'white';
          container.style.padding = '5px';
          container.style.cursor = 'pointer';
          container.style.color = 'black';
          container.title = 'Toggle Legend';
          container.innerHTML = '<b>Toggle Legend</b>';
          container.onclick = toggleLegend;
          return container;
        }
      });

      let legendToggleControl = new LegendToggleControl();
      legendToggleControl.addTo(myMap);
    });
  });
}

function init() {
  let time_frame = d3.select("#time_frame").property("value");
  createMap(time_frame);
}

// Event Listener
d3.select("#filter-btn").on("click", init);

// On page load
init();
