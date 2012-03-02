var request= require('request');
var geocode= require('./geocode');
var ijp= require('./ijp');

var eventLists=[];
var sources= [
    { url: 'http://events.piratenpartei-bayern.de/events/ical?gid=&cid=&subgroups=0&start=&end=' }, 
    { url: 'http://kalender.piratenbrandenburg.de/static/lvbb-land.ics',
      locations: [/LGS/, 'Am Bürohochhaus 2-4, 14478 Potsdam']},
    { url: 'http://www.piratenpartei-hessen.de/calendar/ical' }
    ];

// loading calendar data
function reloadCalendar(index) {
  if (index<sources.length) {
    var url= sources[index].url;
    console.log('loading ('+index+') : '+url);
    request(url, function(error, response, body) { 
      if (!error) {
        body= body.replace(/\\/g,'');
        var parser= ijp.icalParser();
        parser.parseIcal(body);
        var events= parser.ical.events;
        geoCodeEvents(events, 0, sources[index], function() {
          eventLists[index]= events;
          reloadCalendar(index+1);
        });
      }
    });
  } else {
    console.log('all events loaded');
  }
}

// add missing geo information
function geoCodeEvents(events, i, options, callback) {
  if (i<events.length) {
    updateEventData(events[i]);
    if (!events[i].geo && events[i].location) {
      var address= events[i].location.value;
      if (address.match(options.locations[0]))
        address=options.locations[1];
      geocode.resolve(address, function(error, location) {
        if (!error) {
          events[i].geo= { value: location };
        }
        geoCodeEvents(events, i+1, options, callback);
      });
    } else
      geoCodeEvents(events, i+1, options, callback);
  } else {
    callback();
  }
}

function convertDate(date) {
  var match= date.match(/^(....)(..)(..)(T(..)(..)(..))?Z?$/);
  if (!match)
    console.log('Invalid time format: '+date);
  if (match[4])
    return new Date(match[1],match[2]-1,match[3],match[5],match[6]);
  else
    return new Date(match[1],match[2],match[3],0,0);
}

function formatDate(date) {
  var month= ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  var datestr= date.getDate()+'. '+month[date.getMonth()];
  if (date.getHours()>0)
    datestr+= ' '+date.getHours()+':'+date.getMinutes().toString().replace(/^(.)$/,'0$1');
  return datestr;
}

function updateEventData(event) {
  if (!event.url && event.description) {
    var match= event.description.value.match(/.*(https?:\/\/[^ ";]+).*/);
    if (match)
      event.url= { value : match[1] };
  }
  if (event.dtstart) {
    event._dtstart= convertDate(event.dtstart.value);
    event._datestr= formatDate(event._dtstart);
    if (event.dtend)
      event._dtend= convertDate(event.dtend.value);
  } else {
    event._datestr='???';
  }
  return event;
}

function getPlaceMarks(days) {
  var now = new Date().getTime();
  var marks={};
  for (var i in eventLists)
    for (var j in eventLists[i]) {
      var event= eventLists[i][j];
      var dt= (event._dtstart.getTime()- now)/3600000/24;
      if (event.geo && dt<days) {
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

reloadCalendar(0);
setInterval(function() {reloadCalendar(0);}, 3600000);
exports.getPlaceMarks= getPlaceMarks;
