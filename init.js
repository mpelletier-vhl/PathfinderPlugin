$(function(){
	$('body').prepend('<div id="pfplugin_characters_container"><div id="pfplugin_characters"><h2>Characters</h2><a class="pfplugin_get"></a><a class="pfplugin_clear">Clear all cached characters</a></div></div>');

	// Arrays for storing information
  var campaign_names = [];
  var my_names = [];
  var characters_array = [];

	// Make arrays, get the urls.
	chrome.runtime.sendMessage({retrieve: "settings"}, function(response) {
		var settings = response.settings;

	  // Retrieve characters from local storage.
	  retrieve_stored_characters(settings);
		set_link_name(settings);

		// Bind link to clear local storage.
		$('a.pfplugin_clear').on("click", function() {
			clear_local_storage();
		});

		// Bind link to get characters.
		$('a.pfplugin_get').on("click", function() {
			if (settings === "gm") {
				var character_page_url = $('a:contains("Characters")').attr('href');
	  		var full_url = "http://paizo.com" + character_page_url;
				
				if (character_page_url === undefined) {
					// If we're on the Characters page, just get the aliases.
					get_characters(('.bb-content'), campaign_names);
				} else {
					// Otherwise, get the aliases from the Characters page.
					get_characters_from_page(full_url, campaign_names);
				}
			} else if (settings === "solo") {
				var profile_url = $('td.functionalNav:contains("Welcome")').find('a').attr('href');
				var alias_url = "http://paizo.com" + profile_url + "/aliases";
				get_characters_from_page(alias_url, my_names);
			} 

			// With each name in each array, get the data and place it onto the page.
			if (campaign_names.length > 0) {
				var campaign = get_campaign_name();
				get_character_data(campaign_names, campaign);
			}
			if (my_names.length > 0) {
				get_character_data(my_names, "my_characters");
			}

			// Store Characters in Local Storage.
	 		chrome.storage.local.set({characters: characters_array}, function (){
      	console.log("Storage Succesful");
  		});

  		// Retrieve Characters
	  	retrieve_stored_characters(settings);
		});
	});

	// General Functions
	function add_to_array(array, item) {
		var found = $.inArray(item, array);

		if (found >= 0) {
		} else {
			array.push(item);
		}
	}

	function parse_names(name) {
		name = name.replace(/ /g,'').replace(/"/g, "").replace(/'/g, "").replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,"");
		return name;
	}

	function get_campaign_name() {
		var url = window.location.pathname;
		var campaign;

		if (url.indexOf('WebObjects') >= 0) {
			campaign = $('.bb-title').find('a').attr('href');
		} else {
			campaign = url.replace(/campaigns/,'').split('/');
			campaign = campaign[2];
		}
		return campaign;
	}

	function set_link_name(settings) {
		if (settings === "gm") {
			$('.pfplugin_get').text('Get campaign characters');
		} else if (settings === "solo") {
			$('.pfplugin_get').text('Get all my characters');
		}
	}

	// Storage Functions
	function clear_local_storage() {
		chrome.storage.local.clear();
		$('.pfplugin.campaign_characters').remove();
		console.log("Local storage cleared");
	}

	function retrieve_stored_characters(settings) {
		console.log("Retrieve called");
		chrome.storage.local.get(null, function(obj) {
			// Check to see if local storage is actually empty.
			if (!$.isEmptyObject(obj)) {
	      var results = JSON.stringify(obj);
	     	var campaign_names = false;
	     	var my_names = false;
	     	var campaign;

	     	if (settings === "gm") {
	     		campaign = get_campaign_name();
	     	} else if (settings === "solo") {
	     		campaign = "my_characters";
	     	}

	    	$.each(obj.characters, function(index, value) {
	    		characters_array.push(value);
	     		if (campaign.indexOf(value.game) >= 0) {
	     			if (value.chartype === "campaign_characters") {
	     				campaign_names = true;
	     			}
	     			if (value.chartype === "my_characters") {
	     				my_names = true;
	     			}
	     		} else if (campaign.indexOf('WebObjects') >= 0) {
	     			var this_campaign = $('.bb-title').find('a').attr('href');
	     			if (this_campaign.indexOf(value.game) >= 0) {
	     				campaign_names = true;
	     			}
	     		} else {
	     			console.log("Other characters");
	     		}
	     	});

	     	if (campaign_names === true) {
	     		$('#pfplugin_characters').append('<div class="pfplugin campaign_characters"><h3>From this Campaign</h3></div>');
	     	}
	     	if (my_names === true) {
	     		$('#pfplugin_characters').append('<div class="pfplugin my_characters"><h3>All My Aliases</h3></div>');
	     	}

	    	$.each(obj.characters, function(index, value) {
	    		// If we are in the same Campaign as the character
	    		if (campaign_names === true) {
	    			var character_name = value.charname;
	    			var data = value.charinfo;
	    			var type = value.chartype;
						$('.' + type).append('<div id="' +  character_name + '" class="pfplugin_character"><a class="pfplugin_toggle">' + character_name + '</a></div>')
				  	$('#' + character_name).append(data);
				  	// Bind Toggling
				  	$('#' + character_name).find('.pfplugin_toggle').on("click", function() {
							$(this).toggleClass('pfplugin_clicked');
							$(this).siblings('.pfplugin_character_content').toggleClass('pfplugin_hidden_helper');
				  	});
		    	} 
	    	});
	    }
    });
	}

	// Character Names / Data Related
	function get_characters_from_page(full_url, array) {
		var xhr = new XMLHttpRequest();
		xhr.open("GET", full_url, false);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
		  	var fullpage = xhr.responseText;
		  	get_characters(fullpage, array)
	  	};
		}
		xhr.send();
	}

	function get_characters(fullpage, array) {
		$(fullpage).find('a[title*="Alias"]').each(function() {
	  	var alias = parse_names($(this).find('b').text());
 	  	add_to_array(array, alias);
		});
	}

	function get_character_data(character_array, campaign) {
		var link_type = "campaign_characters"; 

		if (campaign === "my_characters") {
			link_type = "my_characters";
		}

		character_array.sort();
		$.each(character_array, function(index, item) {
			make_links(link_type, item, campaign);
		});
	}

	// Display Character Data
	function make_links(link_type, character_name, campaign) {
		url = "http://paizo.com/people/" + character_name;

	 	var xhr = new XMLHttpRequest();
		xhr.open("GET", url, false);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
		  	var fullpage = xhr.responseText;
		  	var span = $(fullpage).find('span:contains("About")');
		  	span.find('#busy').remove();
		  	span.find('script').remove();
		  	span.find('table:contains("Edit")').remove();
		  	span.addClass('profile_information');
		  	var char_url = 'http://paizo.com/people/' + character_name
		  	span.prepend('<h2><a href="' + char_url + '">' + character_name + '</a></h2>');
				var div = '<div class="pfplugin_character_content pfplugin_hidden_helper">' + span.html() + '</div>';

		  	// Add character to total array.
		  	var character = {game: campaign, charname: character_name, charinfo: div, chartype: link_type};
		  	characters_array.push(character);
		   }
		 }
		 xhr.send();
	}

});