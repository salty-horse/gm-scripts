// ==UserScript==
// @name            Google Shruggie
// @id              google_shruggie
// @version         0.1
// @author          Ori Avtalion <ori@avtalion.name>
// @namespace       name.avtalion.ori.google_shruggie
// @description     Enriches Google searches with Unicode emoticons based on queries
// @license         Public Domain
// @downloadURL     https://github.com/salty-horse/gm-scripts/raw/master/google-shruggie.user.js
// @updateURL       https://github.com/salty-horse/gm-scripts/raw/master/google-shruggie.user.js
// @run-at          document-end
// @grant           none
// @require         http://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js

// @include         *://www.google.*/search?*
// @include         *://ipv6.google.*/search?*
// @include         *://www.google.*/webhp?*
// @include         *://ipv6.google.*/webhp?*
// ==/UserScript==

(function() {

"use strict";

const EMOTICONS = {
	"shruggie": "¯\\_(ツ)_/¯",
	"look of disapproval": "ಠ_ಠ",
};

// Function taken from <http://commons.oreilly.com/wiki/index.php/Greasemonkey_Hacks/Those_Not_Included_in_This_Classification#Refine_Your_Google_Search>
function getCurrentSearchText(isPageLoad) {
	if (isPageLoad) {
		const hash = window.location.hash;
		if (hash) {
			const hash_match = hash.match(/&?\bq=([^&]*)/);
			if (hash_match && hash_match.length > 1) {
				return hash_match[1];
			}
		}
	}
	var elmForm = document.forms.namedItem('tsf');
	if (!elmForm) { return; }
	var elmSearchBox = elmForm.elements.namedItem('q');
	if (!elmSearchBox) { return; }
	var usQuery = elmSearchBox.value;
	if (!usQuery) { return; }
	return usQuery;
}

function checkQuery(isPageLoad) {
	var search_term = getCurrentSearchText(isPageLoad);
	if (search_term) {
		search_term = search_term.toLowerCase().replace(/\+/g, ' ');
	}
	$('#salty_shruggie').remove();
	const emoticon = EMOTICONS[search_term];
	if (emoticon) {
		var elem = $('<div id="salty_shruggie" class="lr_container_mod"><div class="vk_ans">' + emoticon + '</div></div>');
		// HACK: Wait a bit for the element to load
		if (isPageLoad) {
			window.setTimeout(function(){$('#center_col').prepend(elem);}, 500)
		} else {
			$('#center_col').prepend(elem);
		}
	}
}

// Page load
checkQuery(/*isPageLoad=*/true);

// Listen to changes to query
$('#lst-ib').on('input', function() {
    checkQuery(/*isPageLoad=*/false);
});

})();
