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
  setMessage(entry.lat+","+entry.long);
  var obj= document.getElementById('emoSelect');
  obj.setAttribute('style','');
  openView();
}

function setMessage(msg) {
  var loc= document.getElementById('location');
  while(loc.firstChild)
    loc.removeChild(loc.firstChild);
  loc.appendChild(document.createTextNode(msg));
}

function openView() {
  if (entry.located) {
    if (entry.selected) {
      var loc;
      if (entry.address)
        loc= "address="+entry.address;
      else
        loc= "lat=" + entry.lat + "&long=" + entry.long;
      window.location= "showmap?"+ loc +
        "&id=" + entry.id + "&icon=" + entry.icon ;
    }
  }
  else
    navigator.geolocation.getCurrentPosition(success, setMessage);
}

function setLocation() {
  var address= document.getElementById('addr').value;
  var request= new XMLHttpRequest();
  request.onreadystatechange= function() {
      var loc= eval(request.responseText);
      if (loc)
        success({coords: {latitude: loc[0], longitude: loc[1]}});
      else
        setMessage("Localization faild");
  };
  request.open("GET", "geocode?address="+encodeURI(address), true);
  request.send(null);
}



