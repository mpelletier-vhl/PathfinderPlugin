chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  var my_settings = localStorage["mode"];

  // Default setting for first time users.
  if (my_settings === undefined) {
  	my_settings = "gm";
  }

  if (request.retrieve == "settings"){
    sendResponse({settings: my_settings});
  }
});
