var request= require('request');
var ijp= require('./ijp');
var geocode= require('./geocode');

var url= 'http://events.piratenpartei-bayern.de/events/ical?gid=&cid=&subgroups=0&start=&end=';

function loadCalendar() {
  console.log('loading calendar');
    request(url, function(error, response, body) { 
    if (!error) {
      body= body.replace(/\\/g,'');
      ijp.icalParser.parseIcal(body);
      var events= ijp.icalParser.ical.events;
      geoCodeEvents(events, 0, function() {
      });
    }
  });
}

function geoCodeEvents(events, i, callback) {
  if (i<events.length) {
    if (!events[i].geo && events[i].location) {
      geocode.resolve(events[i].location.value, function(error, address) {
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

exports.loadCalendar= loadCalendar;
loadCalendar();

