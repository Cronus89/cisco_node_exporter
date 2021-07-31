const rp = require('request-promise');
const cheerio = require('cheerio');
const fs = require('fs');

//Config values
const port = 5000; 
const urlToFetch = 'http://192.168.100.1/Docsis_system.asp';
//End config values

var data = "";
var downstreamChannels = [];
var upstreamChannels = [];
var downstreamChannelsObjects = [];
var upstreamChannelsObjects = [];
var response = "";

String.prototype.replaceAll = function(str1, str2, ignore) {
    return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
}

function cleanElement(element, index, array) {
	array[index] = element.replaceAll("\t", "");
}

function removeWhitespace(element, index, array) {
  	array[index] = element.replace(/\s/g, '');
}

function removeNonLetters(element, index, array) {
	array[index] = element.replace(/:/g,'')
}

function logOut(element, index) {
	console.log(`[${index}] ${element}`);
}

function addDownToResponse(element, index) {
	if (index == 0)
		response = `Downstream_PowerLevel_${element.ChannelName} ${element.PowerLevel}`;
	else
		response = `${response}\nDownstream_PowerLevel_${element.ChannelName} ${element.PowerLevel}`;
}

function addDownToResponse2(element, index) {
	response = `${response}\nDownstream_SignalRatio_${element.ChannelName} ${element.SignalRatio}`;
}

function addUpToResponse(element, index) {
	response = `${response}\nUpstream_PowerLevel_${element.ChannelName} ${element.PowerLevel}`;
}

var http = require('http');

var server = http.createServer(function (req, res) {
    if (req.url == '/metrics') {

        // Fetch the page
		rp(urlToFetch)
		  .then(function(html) {
		    // Load page into Cheerio
		    const $ = cheerio.load(html);

		    response = "";
		    downstreamChannelsObjects.length = 0;
		    upstreamChannelsObjects.length = 0;
		    downstreamChannels.length = 0;
		    upstreamChannels.length = 0;
		
		    // Format/parse the result a bit
		    //7800
		    data = $('tr').text().split("\n")
		   	data = data.filter(e => !e.includes("\t"));
		    data = data.filter(e => !e == "" || !e == "  ");
		    data = data.filter(e => !e.includes("Cisco"));
		    data.forEach(removeWhitespace);
		    data.forEach(cleanElement);
		    data = data.filter(e => e.replace(/\s/g, '').length > 0);

		    data.forEach(removeNonLetters);
		
		    downstreamChannels = data.slice(0, 24);
		    upstreamChannels = data.slice(24, 32);
		
		    while (downstreamChannels.length > 0) {
		    	let newObject = new Object();
		
		    	newObject.ChannelName = downstreamChannels[0];
		    	newObject.PowerLevel = downstreamChannels[1].replace(/[^\d.-]/g, '');
		    	newObject.SignalRatio = downstreamChannels[2].replace(/[^\d.-]/g, '');
		
		    	downstreamChannelsObjects.push(newObject);
		
		    	downstreamChannels = downstreamChannels.slice(3);
		    }
		
		    while (upstreamChannels.length > 0) {
		    	let newObject = new Object();
		
		    	newObject.ChannelName = upstreamChannels[0];
		    	newObject.PowerLevel = upstreamChannels[1].replace(/[^\d.-]/g, '');
		
		    	upstreamChannelsObjects.push(newObject);
		
		    	upstreamChannels = upstreamChannels.slice(2);
		    }
		
		    console.log(downstreamChannelsObjects);
		    console.log(upstreamChannelsObjects);

		    downstreamChannelsObjects.forEach(addDownToResponse);
		    downstreamChannelsObjects.forEach(addDownToResponse2);
		    upstreamChannelsObjects.forEach(addUpToResponse);
			
			// set response header
       		res.writeHead(200, { 'Content-Type': 'text/plain' }); 
       		
       		// set response content    
//       		res.write(`<html><body>${response}</body></html>`);
       		res.write(`${response}`);
       		res.end();
		}).catch(function(err) {
			console.log(err);
		});
    }
});

server.listen(port);

console.log(`Node.js web server at port ${port} is running`)
