chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  var my_settings = localStorage["mode"];
  var answer = "getting characters"

  if (request.retrieve == "settings"){
    sendResponse({settings: my_settings});
  }

  if (request.retrieve == "characters") {
  	sendResponse({response_text: answer})
  }
});
