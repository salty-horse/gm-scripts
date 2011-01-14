/*
  GreaseMonkey userscript for making the news on Ynet more relevant.
  Inspired by http://room404.net/?p=37303

  Author:
    Ori Avtalion <ori@avtalion.name>

  Source:
    https://github.com/salty-horse/gm-scripts/blob/master/ynet-facebook.user.js

*/

// ==UserScript==
// @name          Ynet Facebooker
// @namespace     https://github.com/salty-horse/gm-scripts/blob/master/ynet-facebook.user.js
// @description   Make Ynet headlines more relevant to the modern age
// @include       http://www.ynet.co.il/home/*
// ==/UserScript==

(function() {

var BRAND_WEBSITE = "בפייסבוק";

function addFacebook(str) {

	// Replace text before question mark, period or comma
	if (str.match(/[?,.:]/) !== null) {
		return str.replace(/([?,.:])/, " " + BRAND_WEBSITE + "$1");
	}

	// Add word at end of first quotation
	if (str.match(/".*"/) !== null) {
		return str.replace(/(^[^"]*"[^"]*)"/, "$1 " + BRAND_WEBSITE + "\"");
	}

	// Add before parentheses
	if (str.match(/\(/) !== null) {
		return str.replace(/\(/, BRAND_WEBSITE + " (");
	}

	// Nothing found? Tack at the end, before parentheses
	return str + " " + BRAND_WEBSITE;
}

var selectors = [
	"a.whtbigheader",
	"a.blkbigheader span",
	"a .text12",
	"a.text12",
	"#CdaSlideShowMain1titlelink a",
	"#CdaSlideShowMain1titlesublink a",
	"a.blkbigheader",
	".smallheader",
	"font.text16 b"
];

var elems = document.querySelectorAll(selectors.join(","));

var i;
for (i = 0; i < elems.length; ++i) {
	var elem = elems[i];

	if (elem.textContent.trim() !== "") {
		elem.textContent = addFacebook(elem.textContent.trim());
	}
}


})();
