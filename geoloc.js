var id= window.localStorage.getItem("id");
if (!id) {
   id= Math.round(100000*Math.random());
   window.localStorage.setItem("id", id);
}
navigator.geolocation.getCurrentPosition(success, error);

var entry= { id : id, located: false };

function clicked(icon) {
  entry.icon= icon;
  if (entry.located)
    window.location= "showmap.html?lat=" + entry.lat + "&long=" + entry.long 
      + "&id=" + entry.id + "&icon=" + entry.icon ;
}

function success(position) {
  entry.lat= position.coords.latitude;
  entry.long= position.coords.longitude;
  entry.located= true;
  var loc= document.getElementById('location');
  loc.removeChild(loc.firstChild);
  loc.appendChild(document.createTextNode(entry.lat+","+entry.long));
}

function error(msg) {
    window.location= "geoerror.html";
}