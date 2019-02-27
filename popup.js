var TM_URL = "http://www.abc.com/yaniv";
var REQUEST_BODY = '{"{0}": {"useCaseName": "{1}","req": [{2}] }}'

//for communication with background.js
var port = chrome.extension.connect({
      name: "Sample Communication"
 });


// When the popup HTML has loaded
window.addEventListener('load', function(evt) {
	document.getElementById('sendtotm').addEventListener('submit', SendToTM);
	document.getElementById('cleanflow').addEventListener('submit', cleanFlow);
	document.getElementById('mscgen').addEventListener('submit', getMscgenObject);
	document.getElementById('blacklist').addEventListener('submit', addRemoveFromblacklist);
});

function addRemoveFromblacklist(){

	var message = {"id":"4", "description":"blacklist/whitelist domains", "parameters":{"blacklist":blackDomain, "whitelist":whiteDomain}}

	var blackDomain = document.getElementById('blacklistdomain').value
	var whiteDomain = document.getElementById('whitelistdomain').value

	port.postMessage(message)
	port.onMessage.addListener(function(msg){
	})	
}

function getMscgenObject(){
	var message = {"id":"3", "description":"get mscgen object", "parameters":{}}

	port.postMessage(message)
	port.onMessage.addListener(function(msg){
		copyToClipboard(msg)
		alert('Copied to clipboard!')
	})
}

function cleanFlow() {
	var message = {"id":"1", "description":"clean all flows", "parameters":{}}
	port.postMessage(message)
	port.onMessage.addListener(function(msg){
		alert(msg)
	})
}

// POST the data to the server using XMLHttpRequest
function SendToTM() {

	var xmlhttp = new XMLHttpRequest();
	var message = {"id":"2", "description":"get orgenized requests array to send to tmCenter ", "parameters":{}}

	var usecase = document.getElementById('usecase').value
	var company = document.getElementById('company').value
	var feature = document.getElementById('feature').value
	
	port.postMessage(message);
	port.onMessage.addListener(function(msg) {
    	if (msg != null){
    		var requestBody = REQUEST_BODY.format(usecase,usecase,msg.toString())
			xmlhttp.open("POST", TM_URL, true);
			xmlhttp.send(requestBody);
			alert("sent to TM")
    	}
 	});
}

String.prototype.format = function() {
	a = this;
	for (k in arguments) {
		a = a.replace("{" + k + "}", arguments[k])
	}
	return a
}

const copyToClipboard = str => {
  const el = document.createElement('textarea');
  el.value = str;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
};

 