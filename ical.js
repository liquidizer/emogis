var request= require('request');
var geocode= require('./geocode');
var ijp= require('./ijp');

var eventLists=[];
var sources= [
    { name: 'Bayern',
      url: 'http://events.piratenpartei-bayern.de/events/ical?gid=&cid=&subgroups=0&start=&end=' }, 
    { name. 'Brandenburg'
      url: 'http://kalender.piratenbrandenburg.de/static/lvbb-land.ics',
      locations: [[/LGS/, 'Am Bürohochhaus 2-4, 14478 Potsdam'],
                  [/Alleestraße 9/, 'Alleestraße 9, Potsdam']] },
    { 
      name: 'Thüringen',
      url: 'http://cal.piraten-thueringen.de/calendars/Hauptkalender.ics' },
    { name= 'Hessen',
      url: 'http://www.piratenpartei-hessen.de/calendar/ical' },
    { name= 'Hamburg',
      url: 'http://www.piratenpartei-hamburg.de/calendar/ical' }
    ];

expandDaviCal('http://kalender.piratenpartei-nrw.de','Nordrhein Westfalen');
expandDaviCal('http://bremen.piratenpartei.de/Kalender','Bremen');
grabIcalLinks('http://piratenpartei-mv.de/kalender', 'Mäklenburg Vorpommern',
   [[/Cafe Central/, 'Hinter dem Rathaus 7, Wismar']]);

function expandDaviCal(url) {
  request(url, function(error, response, body) {
    if (!error) {
      var exp = /<select name="cal\[\]"(.|\n)*\/select/;
      var match = body.toString().match(exp);
      var exp2 = /option value="([^"]+)"/g;
      var match2 = match[0].match(exp2);
      for (var i in match2)
        sources.push({
          url : url+'/calendars/'+match2[i].match(/value="([^"]+)"/)[1]+'.ics'
        });
    }
  });
}

function grabIcalLinks(url, locations) {
  request(url, function(error, response, body) {
    if (!error) {
      var exp = /"http:[^"]*ics"[^<]*<\/a>/g;
      var match = body.toString().match(exp);
      for (var i in match) {
        var match2= match[i].match(/"(http:.*ics)"[^>]*>([^<]*)</);
        sources.push({
          name: match2[2],
          url : match2[1],
          locations: locations
        });
      }
    }
  });
}

// loading calendar data
function reloadCalendar(index) {
  if (index<sources.length) {
    var url= sources[index].url;
    console.log('loading ('+index+') : '+url);
    request(url, function(error, response, body) { 
      if (!error && response.statusCode == 200 && body && body.length>0) {
        body= body.replace(/\\/g,'');
        var parser= ijp.icalParser();
        parser.parseIcal(body);
        var events= parser.ical.events;
        geoCodeEvents(events, 0, sources[index], function() {
          eventLists[index]= events;
          reloadCalendar(index+1);
        });
      } else {
        console.log('Could not read: '+url);
        reloadCalendar(index+1);
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
      if (options.locations)
        for (var route in options.locations) 
          if (address.match(options.locations[route][0]))
            address=options.locations[route][1];
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
  var match= date.match(/(....)(..)(..)(T(..)(..)(..))?Z?$/);
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

function getPlaceMarks() {
  var marks={};
  for (var i in eventLists)
    for (var j in eventLists[i]) {
      var event= eventLists[i][j];
      if (event.geo && event.geo.value) {
        var mark= marks[event.geo.value];
        if (!mark) {
          mark= { name: event.location.value, events: [], fixed: {}};
          marks[event.geo.value]= mark;
        }
        var key=event.summary.value.toLowerCase();
        if (!mark.fixed[key]) {
          mark.fixed[key]= true;
          mark.events.push(event);
        }
      }
  }
  return marks;
}

reloadCalendar(0);
setInterval(function() {reloadCalendar(0);}, 7200000);
exports.getPlaceMarks= getPlaceMarks;
