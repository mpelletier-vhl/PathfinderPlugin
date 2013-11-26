chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  var my_settings = localStorage["mode"];

  if (request.retrieve == "settings"){
    sendResponse({settings: my_settings});
  }
});
