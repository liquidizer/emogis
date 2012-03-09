// admin function
function mapToInput(id) {
  var pos= map.getCenter();
  document.getElementById(id).value=
    (pos.lat()+','+pos.lng());
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
