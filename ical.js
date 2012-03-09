var request= require('request');
var geocode= require('./geocode');
var ijp= require('./ijp');

var eventLists=[];
var sources= [
    { 
      name: 'Bayern',
      home: 'http://events.piratenpartei-bayern.de/',
      url: 'http://events.piratenpartei-bayern.de/events/ical?gid=&cid=&subgroups=0&start=&end=' }, 
    { 
      name: 'Brandenburg',
      home: 'http://kalender.piratenbrandenburg.de',
      url: 'http://kalender.piratenbrandenburg.de/static/lvbb-land.ics' },
//      locations: [[/LGS/, 'Am Bürohochhaus 2-4, 14478 Potsdam'],
//                  [/Alleestraße 9/, 'Alleestraße 9, Potsdam']] 
    { 
      name: 'Thüringen',
      home: 'http://cal.piraten-thueringen.de',
      url: 'http://cal.piraten-thueringen.de/calendars/Hauptkalender.ics' },
    { 
      name: 'Hessen',
      home: 'http://www.piratenpartei-hessen.de',
      url: 'http://www.piratenpartei-hessen.de/calendar/ical' },
    { 
      name: 'Hamburg',
      home: 'http://www.piratenpartei-hamburg.de',
      url: 'http://www.piratenpartei-hamburg.de/calendar/ical' }
    ];

//expandDaviCal('http://kalender.piratenpartei-nrw.de','Nordrhein Westfalen');
//expandDaviCal('http://bremen.piratenpartei.de/Kalender','Bremen');
grabIcalLinks('http://piratenpartei-mv.de/kalender', 'Mäklenburg Vorpommern');
//   [[/Cafe Central/, 'Hinter dem Rathaus 7, Wismar']]);

function expandDaviCal(url, name) {
  request(url, function(error, response, body) {
    if (!error) {
      var exp = /<select name="cal\[\]"(.|\n)*\/select/;
      var match = body.toString().match(exp);
      var exp2 = /option[^>]*>([^<]*)<\/option>/g;
      var match2 = match[0].match(exp2);
      for (var i in match2) {
        var match3= match2[i].match(/value="([^"]+)"[^>]*>([^<]*)</);
        sources.push({
          home: url,
          name: name, // +'/'+match3[2].replace(/ *$/,''),
          url : url+'/calendars/'+match3[1]+'.ics'
        });
      }
    }
  });
}

function grabIcalLinks(url, name) {
  request(url, function(error, response, body) {
    if (!error) {
      var exp = /"http:[^"]*ics"[^<]*<\/a>/g;
      var match = body.toString().match(exp);
      for (var i in match) {
        var match2= match[i].match(/"(http:.*ics)"[^>]*>([^<]*)</);
        sources.push({
          home: url,
          name: name, // +'/'+, match2[2]],
          url : match2[1]
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
        console.warn('Could not read: '+url);
        reloadCalendar(index+1);
      }
    });
  } else {
    console.log('all events loaded');
  }
}

// add missing geo information
function geoCodeEvents(events, j, options, callback) {
  if (j<events.length) {
    updateEventData(events[j], options);
    if (!events[j].geo && events[j].location) {
      var address= events[j].location.value;
      geocode.resolve(address, { name : options.name, persist: true },
      function(error, location) {
        if (location && location.lng && location.lat) {
          events[j].geo= { value: location.lng.toFixed(5)+','+location.lat.toFixed(5) };
        }
        geoCodeEvents(events, j+1, options, callback);
      });
    } else {
      geoCodeEvents(events, j+1, options, callback);
    }
  } else {
    callback();
  }
}

function convertDate(date, isStart) {
  var match= date.match(/(....)(..)(..)(T(..)(..)(..))?Z?$/);
  if (!match)
    console.log('Invalid time format: '+date);
  if (match[4])
    return new Date(match[1],match[2]-1,match[3],match[5],match[6]);
  else
    if (isStart)
      return new Date(match[1],match[2],match[3],0,0);
    else
      return new Date(match[1],match[2],match[3],23,59);
}

function formatDate(date) {
  var month= ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  var datestr= date.getDate()+'. '+month[date.getMonth()];
  if (date.getHours()>0)
    datestr+= ' '+date.getHours()+':'+date.getMinutes().toString().replace(/^(.)$/,'0$1');
  return datestr;
}

function updateEventData(event, options) {
  if (!event.url && event.description) {
    var match= event.description.value.match(/.*(https?:\/\/[^ ";]+).*/);
    if (match)
      event.url= { value : match[1] };
  }
  event._home= options.home;
  event._src= options.name;
  if (event.dtstart) {
    event._dtstart= convertDate(event.dtstart.value, true);
    event._datestr= formatDate(event._dtstart);
    if (event.dtend)
      event._dtend= convertDate(event.dtend.value, false);
    else
      event._dtend= convertDate(event.dtstart.value, false);
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
      var isActive= new Date().getTime()- 4*3600*1000 < event._dtend;
      if (isActive && event.geo && event.geo.value) {
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

function getByLocation(location) {
  var list=[];
  for (var i in eventLists)
    for (var j in eventLists[i]) {
      var event= eventLists[i][j];
      var isActive= new Date().getTime()- 4*3600*1000 < event._dtend;
      if (isActive && event.location &&
          location.toLowerCase()==event.location.value.toLowerCase()) {
            list.push(event);
          }
    }
  return list;
}

reloadCalendar(0);
setInterval(function() {reloadCalendar(0);}, 7200000);

exports.getPlaceMarks= getPlaceMarks;
exports.getByLocation= getByLocation;

