var request= require('request');
var ijp= require('./ijp');

var url= 'http://events.piratenpartei-bayern.de/events/ical?gid=&cid=&subgroups=0&start=&end=';

function loadCalendar() {
  console.log('loading calendar');
    request(url, function(error, response, body) { 
    if (!error) {
      ijp.icalParser.parseIcal(body);
      var events= ijp.icalParser.ical.events;
      for (var ev in events) {
        console.log(events[ev]);
      }
    }
  });
}

exports.loadCalendar= loadCalendar;
loadCalendar();

