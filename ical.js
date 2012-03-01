var request= require('request');
var ijp= require('./ijp');
var geocode= require('./geocode');


var eventList=[];
var url= 'http://events.piratenpartei-bayern.de/events/ical?gid=&cid=&subgroups=0&start=&end=';

// loading calendar data
function reloadCalendar() {
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
}

// add missing geo information
function geoCodeEvents(events, i, callback) {
  if (i<events.length) {
    updateEventData(events[i]);
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

function convertDate(date) {
  var match= date.match(/^(....)(..)(..)(T(..)(..)(..))?$/);
  if (!match)
    console.log('Invalid time format: '+date);
  if (match[4])
    return new Date(match[1],match[2],match[3],match[5],match[6]);
  else
    return new Date(match[1],match[2],match[3],0,0);
}

function formatDate(date) {
  var month= ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  var datestr= date.getDate()+'. '+month[date.getMonth()];
  if (date.getHours()>0)
    datestr+= ' '+date.getHours()+':'+date.getMinutes();
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

reloadCalendar();
setInterval(function() {reloadCalendar();}, 3600000);
exports.getPlaceMarks= getPlaceMarks;
