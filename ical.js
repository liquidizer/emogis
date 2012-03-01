var request= require('request');
var ijp= require('./ijp');
var geocode= require('./geocode');


var eventList=[];
var url= 'http://events.piratenpartei-bayern.de/events/ical?gid=&cid=&subgroups=0&start=&end=';

// loading calendar data
request(url, function(error, response, body) { 
  if (!error) {
    body= body.replace(/\\/g,'');
    ijp.icalParser.parseIcal(body);
    var events= ijp.icalParser.ical.events;
    geoCodeEvents(events, 0, function() {
      eventList= events;
    });
  }
});

// add missing geo information
function geoCodeEvents(events, i, callback) {
  if (i<events.length) {
    if (!events[i].geo && events[i].location) {
      geocode.resolve(events[i].location.value, function(error, location) {
        if (!error) {
          events[i].geo= { value: location };
        }
        geoCodeEvents(events, i+1, callback);
      });
    } else
      geoCodeEvents(events, i+1, callback);
  } else {
    callback();
  }
}

function getPlaceMarks() {
  var marks={};
  for (var i in eventList) {
    var event= eventList[i];
    if (event.geo) {
      var mark= marks[event.geo.value];
      if (!mark) {
        mark= { name: event.location.value, events: [] };
        marks[event.geo.value]= mark;
      }
      mark.events.push(event);
    }
  }
  return marks;
}

exports.getPlaceMarks= getPlaceMarks;
