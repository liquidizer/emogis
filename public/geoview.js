var map;

window.onload= function() {
  initialize();
};

function initialize() {
  var me= getPosition(document.getElementById('me'));
  var latlng = new google.maps.LatLng(me.lat, me.long);
  var myOptions = {
    zoom: me.zoom || 10,
    center: latlng,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  map = new google.maps.Map(document.getElementById("map_canvas"),
      myOptions);
  setPlaceMarks(map);
  overlay(map);
}

// admin function
function searchGoogle(root) {
  var input= document.getElementById('google').value;
  window.open('http://google.com?q='+encodeURI(root+' '+input));
}

function geoCode() {
  console.log('geocoding');
  var request= new XMLHttpRequest();
  request.onreadystatechange= function() {
    console.log(request.responseText);
    var loc= eval(request.responseText);
    if (loc) {
      map.setCenter(
        new google.maps.LatLng(loc[0], loc[1]));
    }
  };
  var address= document.getElementById('google').value;
  request.open("GET", "/geocode?address="+encodeURI(address), true);
  request.send(null);

}

function setPlaceMarks(map) {
  var georssLayer = new google.maps.KmlLayer('http://gis.liquidizer.org/placemarks.kml', {
    preserveViewport : true
  });
  georssLayer.setMap(map);
}

function overlay(map) {
  var data= getData();
  for (var i=0; i<data.length; ++i) {
    var latlng= new google.maps.LatLng(data[i].lat, data[i].long);
    var marker = new google.maps.Marker({
      position: latlng,
      icon: 'icons/overlay/'+data[i].icon+'.png',
      clickable: false
    });
    marker.setMap(map);
  }
}

function getData() {
  var data= [];
  var node= document.getElementById('data');
  if (node) {
    for (var i=0; i<node.childNodes.length; ++i) {
      var child= node.childNodes[i];
      data.push(getPosition(child));
    }
  }
  return data;
}

function getPosition(obj) {
  if (!obj) return {};
  return {
    lat: parseFloat(obj.getAttribute('lat')),
    long: parseFloat(obj.getAttribute('long')),
    zoom: parseInt(obj.getAttribute('zoom'),10),
    icon: obj.getAttribute('icon')
  };
}