var MSCGEN_BROWSER_OBJECT		= 'Browser[label="Browser", textbgcolour="#ccf", textcolor="#909", linecolor="#ccf"]';
var REQUEST_SENT_FROM_BROWSER	= 'Browser => {0} [label = "{1} {2}({3})"]'
var RESPONSE_SENT_TO_BROWSER	= 'Browser << {0} [label = " Response Code: {1}"]'
var DOMAIN_OBJECT_FOR_MSCGEN	= '{0}[label="{1}", textcolor="white", textbgcolor="orange", linecolor="orange"]'
var TMMessage					= '{ "src": "{0}", "dst": "{1}", "transport": "REST", "function": "{2}", "params": "{3}", "comment": "" }';

var domainBlackList 			= ["r7---sn-oxu8pnpvo-ua8z.googlevideo.com","googleads.g.doubleclick.net","manlomhmablkfdjpckmbgabaedodipho","rs.fullstory.com","d2x3xhvgiqkx42.cloudfront.net","static.parastorage.com","frog.wix.com","calendar-pa.clients6.google.com","fonts.googleapis.com","13.client-channel.google.com","3.client-channel.google.com","plus.google.com","ci6.googleusercontent.com","accounts.google.com","ogs.google.com","11.client-channel.google.com","clients2.google.com","contacts.google.com","lh3.googleusercontent.com","notifications.google.com","clients6.google.com","people-pa.clients6.google.com","ci3.googleusercontent.com","ci5.googleusercontent.com","www.gstatic.com","mail.google.com","play.google.com","apis.google.com","hangouts.google.com","csi.gstatic.com","jira.wixpress.com","calendar.google.com","ssl.gstatic.com","2.client-channel.google.com","www.youtube.com","www.google-analytics.com","www.google.co.il","www.google.com","fonts.gstatic.com"];
var requests 					= [];
var responses 					= [];
var allowedDomains				= [];
var MscGenMessages 				= [];
var MscGenDomains 				= [MSCGEN_BROWSER_OBJECT];
var TMMessages					= [];



chrome.webRequest.onBeforeRequest.addListener(function(details){
	requests.push({ "requestId":"" + details.requestId, req : details })

	var domain = getDomainFromURL(details.url)
	if( allowedDomains.indexOf(domain) == -1 ){
		if (!isDomainBlackListed(domain)){
			allowedDomains.push(domain)
			addDomainToMscGen(domain)
		}					
	}
}, {urls: [ "<all_urls>" ]},['requestBody','blocking']);


chrome.webRequest.onBeforeSendHeaders.addListener(function(details){
	for( var i = 0; i < requests.length; i++ ){
		if( requests[i].requestId == details.requestId ){
			requests[i].req.requestHeaders = details.requestHeaders
			var domain = getDomainFromURL(requests[i].req.url)
			if ( !isDomainBlackListed(domain) ){			
				addRequestToMscGen(requests[i])
				addRequestToTM(requests[i])
			}
		}
	}	
}, {urls: [ "<all_urls>" ]},['requestHeaders','blocking']);


chrome.webRequest.onResponseStarted.addListener(function(details){
	responses.push({"requestId":"" + details.requestId, res : details})
	var domain = getDomainFromURL(details.url)
	if ( !isDomainBlackListed(domain) ){
		addResponseToMscGen(details)
		addResponseToTM(details)
	}
}, {urls: [ "<all_urls>" ]},['responseHeaders']);


function sendToTM(){
	var xmlhttp = new XMLHttpRequest();
	var url = "http://www.abc.com/yaniv";
	var requestBody = '{"SentFromBrowser": {"useCaseName": "SentFromBrowser","req": TMMessages }}'
    xmlhttp.open("POST", url, true);
    xmlhttp.send(requestBody);
}

function getDomainsBlackList(){
	return domainBlackList;
}

function addDomainToBlackList(domain){
	if (domain != '') {
		domainBlackList.push(domain)
		return domainBlackList;
	}
}

//TODO: test this it works because there is {} missing in for loop
function deleteDomainToBlackList(domain){
	if (domain != '') {
		for (i = 0; i<domainBlackList.length; i++)
			if( domainBlackList[i] == domain ){
				domainBlackList.splice(i,1)
			}
		return domainBlackList;
	}
}

function addRequestToTM(request){
	var domain 		= getDomainFromURL(request.req.url)
	var path 		= getLocation(request.req.url).pathname	
	var parameters 	= getParametersFromRequest(request.req)
	
	TMMessages.push(TMMessage.format("Browser",domain,path,parameters))
}

function addResponseToTM(response){
	var domain = getLocation(response.url).host
	TMMessages.push(TMMessage.format(domain,"Browser","Response",response.statusLine))
}

function addRequestToMscGen(request){
	var domain 		= deleteDotAndDash(getDomainFromURL(request.req.url))
	var protocol 	= getLocation(request.req.url).protocol.toUpperCase()
	var path 		= getLocation(request.req.url).pathname
	var parameters 	= getParametersFromRequest(request.req)

	MscGenMessages.push(REQUEST_SENT_FROM_BROWSER.format(domain,protocol,path,parameters))
}

function addResponseToMscGen(response){
	var domain = deleteDotAndDash(getDomainFromURL(response.url))

	MscGenMessages.push( RESPONSE_SENT_TO_BROWSER.format(domain, response.statusCode) )
}

function addDomainToMscGen(domain){
	var domain = deleteDotAndDash(domain)
	MscGenDomains.push( DOMAIN_OBJECT_FOR_MSCGEN.format(domain,domain))
}

function getMSCGenJson(){
	var objectsArray=[];
	var msgesArray=[];

	MscGenDomains.forEach(function(elem){
			objectsArray += elem + ','
		})
	objectsArray = objectsArray.toString().slice(0,-1)
	objectsArray += ";";

	MscGenMessages.forEach(function(elem){
			msgesArray += elem + ';'
		})
	

	
	return("msc{ hscale=\"2.8\"; " + objectsArray + " " + msgesArray + " } ");
}

function isDomainBlackListed(domain) {
  if (domainBlackList.indexOf(domain) == -1){
  	return false
  }
  else{
  	return true
  }
}

function getDomainFromURL(url) {
    var hostname;
    
    //find & remove protocol (http, ftp, etc.) and get hostname
    if (url.indexOf("//") > -1) {
        hostname = url.split('/')[2];
    }
    else {
        hostname = url.split('/')[0];
    }

    //find & remove port number
    hostname = hostname.split(':')[0];
    //find & remove "?"
    hostname = hostname.split('?')[0];

    return hostname;
}

function getLocation(href) {
    var match = href.match(/^([a-z,A-Z]+?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)([\/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/);
    return match && {
        href: href,
        protocol: match[1],
        host: match[2],
        hostname: match[3],
        port: match[4],
        pathname: match[5],
        search: match[6],
        hash: match[7]
    }
}

function getParametersFromRequest(req){
	var params = [];
	var queryParams = getLocation(req.url).search.split("&")
	
	//handle GET request params
	queryParams.forEach(function(element){
		if( element.indexOf("?") == -1){
			params.push(element.split("=")[0])	
		}
		else{
			params.push(element.split("=")[0].substring(1))		
		}
		
	})
	
	//handle POST request with formData params
	if( req.hasOwnProperty("requestBody") && req.requestBody.hasOwnProperty("formData") ){
			params.push(Object.keys(req.requestBody.formData))		
	}
	
	return params.toString()

}

function deleteDotAndDash(string){
	return string.replace(/\./g,"_").replace(/\-/g,"_")
}

String.prototype.format = function() {
  a = this;
  for (k in arguments) {
    a = a.replace("{" + k + "}", arguments[k])
  }
  return a
}

 chrome.extension.onConnect.addListener(function(port) {
           
      port.onMessage.addListener(function(msg) {

      		//sendToTM button pressed
           if (msg.id == 2){
           		port.postMessage(TMMessages); 
           	}
           
           //clean flow button pressed
           if (msg.id == 1) { 
				requests 			= [];
				responses 			= [];
				allowedDomains		= [];
				MscGenMessages 		= [];
				MscGenDomains 		= [MSCGEN_BROWSER_OBJECT];
				TMMessages			= [];

	           	port.postMessage("Done");
           }

           //'get mscgen object' button preseed
           if (msg.id == 3) {
           		port.postMessage(getMSCGenJson())
           }

           //blacklist button was pressed
           if (msg.id == 4) {
           		addDomainToBlackList(msg.parameters.blacklist)
           		deleteDomainToBlackList(msg.parameters.whitelist)

           		port.postMessage("Done");
           }
      });
 })