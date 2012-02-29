
window.onload= function() {
  initialize();
  setInterval(function() {
    window.history.back()
  }, 50000);
};

function initialize() {
  var me= getPosition(document.getElementById('me'));
  var latlng = new google.maps.LatLng(me.lat, me.long);
  var myOptions = {
    zoom: 13,
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
      icon: 'icons/overlay/'+data[i].icon+'.png'
    });
    marker.setMap(map);
  }
}

function getData() {
  var data= [];
  var node= document.getElementById('data');
  for (var i=0; i<node.childNodes.length; ++i) {
    var child= node.childNodes[i];
    data.push(getPosition(child));
  }
  return data;
}

function getPosition(obj) {
    return {
      lat: parseFloat(obj.getAttribute('lat')),
      long: parseFloat(obj.getAttribute('long')),
      icon: obj.getAttribute('icon')
    };
}