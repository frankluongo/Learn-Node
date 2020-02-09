import axios from "axios";
import { $ } from "./bling";

const DEFAULT_COORDS = {
  lat: 43.2,
  lng: -79.8
};

const mapOptions = {
  center: {
    lat: DEFAULT_COORDS.lat,
    lng: DEFAULT_COORDS.lng
  },
  zoom: 12
};

export default function makeMap(mapDiv) {
  if (!mapDiv) return;
  window.navigator.geolocation.getCurrentPosition(getDefaultCoords);
  const map = new google.maps.Map(mapDiv, mapOptions);
  loadPlaces(map);
  const input = $('[name="geolocate"]');
  const autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace().geometry.location;
    loadPlaces(
      map,
      place.location.geometry.location.lat(),
      place.location.geometry.location.lng()
    );
  });
}

async function loadPlaces(
  map,
  lat = DEFAULT_COORDS.lat,
  lng = DEFAULT_COORDS.lng
) {
  try {
    const { data: places } = await axios.get(
      `/api/v1/stores/near?lat=${lat}&lng=${lng}`
    );
    if (!places.length) {
      alert("no places found");
      return;
    }
    // Create Bound
    const bounds = new google.maps.LatLngBounds();
    // Create Info Window
    const infoWindow = new google.maps.InfoWindow();
    const markers = places.map(place => {
      const [lng, lat] = place.location.coordinates;
      const position = { lat, lng };
      bounds.extend(position);
      const marker = new google.maps.Marker({ map, position });
      marker.place = place;
      return marker;
    });
    // Listen for marker clicks
    markers.forEach(marker =>
      marker.addListener("click", function() {
        const html = `
          <div className="popup" style="max-width: 200px">
            <a href="${this.place.slug}" title="${this.place.name}">
              <img src="/uploads/${this.place.photo || "store.png"}" alt="${
          this.place.name
        }" width="200">
              <p>${this.place.name} - ${this.place.location.address}</p>
              <p>${this.place.description}</p>
            </a>
          </div>
        `;
        infoWindow.setContent(html);
        infoWindow.open(map, this);
      })
    );
    // Center the map
    map.setCenter(bounds.getCenter());
    map.fitBounds(bounds);
  } catch (error) {
    alert("Oh no!, something has gone wrong!");
    throw new Error(error);
  }
}

function getDefaultCoords({ coords }) {
  DEFAULT_COORDS.lat = coords.latitude;
  DEFAULT_COORDS.lng = coords.longitude;
}
