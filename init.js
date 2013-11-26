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
	  retrieve_characters(settings);

		// Change link name.
		if (settings === "gm") {
			$('.pfplugin_get').text('Get campaign characters');
		} else if (settings === "solo") {
			$('.pfplugin_get').text('Get all my characters');
		}

		// Clear local storage.
		$('a.pfplugin_clear').on("click", function() {
			chrome.storage.local.clear();
			$('.pfplugin.campaign_characters').remove();
			console.log("Storage cleared")
		});

		// Clicking the Link will re-get all of the characters.
		$('a.pfplugin_get').on("click", function() {
			var pathname = window.location.pathname;
		  var character_page_url = $('.bordered-box').find('a:contains("Characters")').attr('href');
		  var characters_url;
			var character_name;

			if (settings === "gm") {
				// If we're previewing a post
				if (pathname.indexOf("cgi-bin") >= 0) {
					characters_url = $('span.boxHeaderBig').find('a').attr('href');
					characters_url = characters_url.substr(0, characters_url.lastIndexOf("/"));
					characters_url = characters_url + "/characters";
					console.log("Cannot acquire characters on Preview page");
					// Bug: Does not currently work.
					// get_characters_from_page(characters_url, campaign_names);
				} else {
					if (character_page_url === undefined) {
						// Get the aliases while on the Characters page.
						get_characters(('.bb-content'), campaign_names);
					} else {
						// Get the aliases from the Characters page.
						characters_url = "http://paizo.com" + character_page_url;
						get_characters_from_page(characters_url, campaign_names);
					}
				}
			} else if (settings === "solo") {
				var gamepage = false;

				if (pathname.indexOf("recruiting") > 0) {
					gamepage = true;
				} else if (pathname.indexOf("discussion") > 0) {
					gamepage = true;
				} else if (pathname.indexOf("gameplay") > 0) {
					gamepage = true;
				}

				if (gamepage === true) {
					var username_select = $('select[name="person"]');
					username_select.find('option').each(function() {
						var character_name = parse_names($(this).text());
						add_to_array(my_names, character_name)
					});
				} else {
					var link = $('td.functionalNav:contains("Welcome")').find('a');
					var char_url = link.attr('href');
					var alias_url = "http://paizo.com" + char_url + "/aliases";
					get_characters_from_page(alias_url, my_names);
				}
			}

			// Get the Campaign Name
			var campaign = window.location.pathname;
			campaign = campaign.replace(/campaigns/,'').split('/');
			campaign = campaign[2];

			// With each name in each array, get the data and place it onto the page.
			if (campaign_names.length > 0)  {
				campaign_names.sort();
				$.each(campaign_names, function(index, item) {
					make_links('campaign_characters', item, campaign);
				});
			}

			if (my_names.length > 0) {
				my_names.sort();
				$.each(my_names, function(index, item) {
					make_links('my_characters', item, "my_characters");
				});
			}

			// Store Characters in Local Storage.
	 		chrome.storage.local.set({characters: characters_array}, function (){
      	console.log("Storage Succesful");
  		});

  		// Retrieve Characters
	  	retrieve_characters(settings);
		});
	});

	// Functions
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
		  	characters_array.push(character)
		   }
		 }
		 xhr.send();
	}

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

	function retrieve_characters(settings) {
		console.log("Retrieve called");
		chrome.storage.local.get(null, function(obj) {
			// Check to see if local storage is actually empty.
			if (!$.isEmptyObject(obj)) {
	      var results = JSON.stringify(obj);
	     	var campaign_names = false;
	     	var my_names = false;
	     	var campaign;

	     	if (settings === "gm") {
	     		var url = window.location.pathname;
	     		// If we're previewing our post
	     		if (url.indexOf("cgi-bin") >= 0) {
	     			campaign = $('span.boxHeaderBig').find('a').attr('href');
	     		} else {
	     			campaign = url;
	     		}
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
	    		if (campaign.indexOf(value.game) >= 0) {
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

});
