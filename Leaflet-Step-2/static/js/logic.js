// GeoJSON URLs
var url_USGS = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"
var url_tectonic = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json"

// Generate variables for all USGS earthquakes from past 7 days
var layer_USGS = new L.LayerGroup();

// Generate variables for tectonic plates
var tectonicPlates = new L.LayerGroup();

// Tile Layers from Mapbox for maps
var mapboxSatellite = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 15,
    id: "mapbox/satellite-v9",
    accessToken: API_KEY
});

var mapboxLight = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 15,
    id: "mapbox/light-v10",
    accessToken: API_KEY
});

var mapboxOutdoors = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>',
    tileSize: 512,
    maxZoom: 15,
    zoomOffset: -1,
    id: 'mapbox/outdoors-v11',
    accessToken: API_KEY
});

// Generate control layers
var base = {
    "Satellite": mapboxSatellite,
    "Light": mapboxLight,
    "Outdoors": mapboxOutdoors
};

var overlay = {
    "Earthquakes (Past 7 Days)": layer_USGS,
    "Tectonic Plates": tectonicPlates
};

// Generate the map and add layer control
var myMap = L.map("map", {
    center: [35.91, -79.07],
    zoom: 2,
    layers: [mapboxSatellite, layer_USGS]
});

L.control.layers(base, overlay).addTo(myMap);

// Obtain GeoJSON USGS data
d3.json(url_USGS, function(infoUSGS) {
    // Earthquakes with higher magnitudes appear larger
    function markerSize(magRange) {
        if (magRange === 0) {
          return 1;
        }
        return magRange * 4;
    }
    // Determine style of markers
    function styleInfo(feature) {
        return {
          opacity: 0.5,
          fillOpacity: 0.6,
          fillColor: chooseColor(feature.properties.mag),
          color: "#000000",
          radius: markerSize(feature.properties.mag),
          stroke: true,
          weight: 0.5
        };
    }

    // Earthquakes with higher magnitudes appear darker in color
    function chooseColor(magRange) {
        switch (true) {
        case magRange > 5:
            return "#4B0082";
        case magRange > 4:
            return "#9932CC";
        case magRange > 3:
            return "#8A2BE2";
        case magRange > 2:
            return "#FF00FF";
        case magRange > 1:
            return "#EE82EE";
        default:
            return "#D8BFD8";
        }
    }
    // Generate the GeoJSON layer.
    // Include popups that provide additional information about the earthquake when a marker is clicked.
    L.geoJSON(infoUSGS, {
        pointToLayer: function(feature, latlng) {
            return L.circleMarker(latlng);
        },
        style: styleInfo,
        
        onEachFeature: function(feature, layer) {
            layer.bindPopup(
            "</p><hr><p>Magnitude: " + feature.properties.mag + 
            "</h4><hr><p>Place: " + feature.properties.place + 
            "<p><hr><p>Date & Time: " + new Date(feature.properties.time) + 
            "</p><hr><p>");
        }
    }).addTo(layer_USGS);
    layer_USGS.addTo(myMap);

    // Add tectonic information to the map using d3
    d3.json(url_tectonic, function(infoTectonic) {
        L.geoJson(infoTectonic, {
            color: "#808000",
            weight: 2
        }).addTo(tectonicPlates);
        tectonicPlates.addTo(myMap);
    });

    // Create a legend to provide context for the map data
    var legend = L.control({ position: "bottomright" });
    legend.onAdd = function() {
        var div = L.DomUtil.create("div", "info legend"), 
        mag = [0, 1, 2, 3, 4, 5];

        div.innerHTML += "<h3>Magnitude Level</h3>"

        for (var i = 0; i < mag.length; i++) {
            div.innerHTML +=
                '<i style="background: ' + chooseColor(mag[i] + 1) + '"></i> ' +
                mag[i] + (mag[i + 1] ? '&ndash;' + mag[i + 1] + '<br>' : '+');
        }
        return div;
    };
    
    legend.addTo(myMap);
});