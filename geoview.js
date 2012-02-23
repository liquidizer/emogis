
window.onload= function() {
  initialize();
  setTimeout(function() {
      window.location= "/index.html";
  }, 50000);
};

function initialize() {
  var me= getPosition(document.getElementById('me'));
  var latlng = new google.maps.LatLng(me.lat, me.long);
  var myOptions = {
    zoom: 11,
    center: latlng,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  var map = new google.maps.Map(document.getElementById("map_canvas"),
      myOptions);
  overlay(map);
}

function overlay(map) {
  var data= getData();
  for (var i=0; i<data.length; ++i) {
    var latlng= new google.maps.LatLng(data[i].lat, data[i].long);
    var marker = new google.maps.Marker({
      position: latlng,
      icon: 'icons/'+data[i].icon
    });
    marker.setMap(map);
  }
}

function getData() {
  console.log('getting data');
  var data= [];
  var node= document.getElementById('data');
  for (var i=0; i<node.childNodes.length; ++i) {
    var child= node.childNodes[i];
    data.push(getPosition(child));
  }
  console.log(data);
  return data;
}

function getPosition(obj) {
    return {
      lat: parseFloat(obj.getAttribute('lat')),
      long: parseFloat(obj.getAttribute('long')),
      icon: obj.getAttribute('icon')
    };
}