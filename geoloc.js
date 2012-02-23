var id= window.localStorage.getItem("id");
if (!id) {
   id= Math.round(100000*Math.random());
   window.localStorage.setItem("id", id);
}

var entry= { id : id, located: false, selected: false };
openView();

function clicked(icon) {
  entry.icon= icon;
  entry.selected= true;
  openView();
}

function success(position) {
  entry.lat= position.coords.latitude;
  entry.long= position.coords.longitude;
  entry.located= true;
  var loc= document.getElementById('location');
  loc.removeChild(loc.firstChild);
  loc.appendChild(document.createTextNode(entry.lat+","+entry.long));
  openView();
}

function error(msg) {
    window.location= "geoerror.html";
}

function openView() {
  if (entry.located) {
    if (entry.selected) {
      window.location= "showmap.html?lat=" + entry.lat + "&long=" + entry.long +
        "&id=" + entry.id + "&icon=" + entry.icon ;
    }
  }
  else
    navigator.geolocation.getCurrentPosition(success, error);
}