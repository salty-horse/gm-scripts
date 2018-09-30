/*
  GreaseMonkey userscript for showing prices in your local currency.
  Customize to your own currency below.

  Exchange rates provided by Fixer @ http://fixer.io/

  New to GreaseMonkey? Visit <http://www.greasespot.net/>

  Visit <https://github.com/salty-horse/gm-scripts/> for updates to this script.

  Author:
    Ori Avtalion  ori <at> avtalion.name

  Modified from work by:
    Carl Henrik Lunde  chlunde+greasemonkey <at> ping.uio.no
    http://www.ping.uio.no/~chlunde/stuff

  Contributors:
    Simon Pope skjpope -> gmail.com
    United600  united600 <at> hotmail.com
*/

// ==UserScript==
// @name          Amazon Local Currency - Dynamic version
// @namespace     https://github.com/salty-horse/gm-scripts/
// @description   Show prices in your local currency
// @grant         GM.getValue
// @grant         GM.setValue
// @grant         GM.xmlHttpRequest
// @include       /https://(www\.)?amazon\.(com|co\.uk|ca|cn|de|fr|it|co\.jp)/.*/
// ==/UserScript==

(async function() {

"use strict";

// EDIT THESE BEFORE USE:
var currencyToDefault = "ILS"; // The target currency (ISO 4217).
var currencyToSymbolDefault = "NIS "; // The symbol to show next to the converted amount.
var prefixCurrencySymbol = true; // Whether to print the currenyTo symbol before (true) or after (false) the amount.
var decimalPlaces = 2; // How many digits to show after the decimal point

// Don't run in iframes - prevent double execution
if (window.top !== window.self) {
	return;
}

// Helper function. From the Prototype Javascript Framework:
String.prototype.endsWith = function (pattern) {
	var d = this.length - pattern.length;
	return d >= 0 && this.lastIndexOf(pattern) === d;
};

var amazonCurrencies = ["USD", "GBP", "CAD"];
var currencyFrom;

// Decimal separator:   .
// Thousands separator: ,
function regularPriceParser(price, currency) {
	return parseFloat(price.replace(/,/g, ""));
}

// Decimal separator:   ,
// Thousands separator: .
function europeanPriceParser(price, currency) {
	// When browsing Amazon.de in English, some prices are in European style and some aren't,
	// so instead we assume the last [,.] is the decimal separator
	for (var i = price.length - 1; i >= 0; i--) {
		if (price[i] == "." || price[i] == ",") {
			return regularPriceParser(
				price.slice(0, i) + "." + price.slice(i+1, price.length),
				currency);
		}
	}

	return regularPriceParser(price, currency);
}

// priceRegex explanation:
// Match a string that begins with the symbol, and then
// has 0 or more spaces, digits, commas and periods, ending with a digit.
// The actual numeric price portion MUST BE enclosed in parentheses.

var currencies = {
	"USD" : {
		symbol: "$",
		priceRegex: /\$\s*([\d,.]+\d)/,
		parser: regularPriceParser
	},

	"GBP" : {
		symbol: "£",
		priceRegex: /£\s*([\d,.]+\d)/,
		parser: regularPriceParser
	},

	"CAD" : {
		symbol: "CDN$",
		priceRegex: /CDN\$\s*([\d,.]+\d)/,
		parser: regularPriceParser
	},

	"EUR" : {
		symbol: "EUR",
		priceRegex: /EUR\s*([\d,.]+\d)/,
		parser: europeanPriceParser
	},

	"JPY" : {
		symbol: "￥",
		priceRegex: /￥\s*([\d,.]+\d)/,
		parser: regularPriceParser
	},

	"CNY" : {
		symbol: "￥",
		priceRegex: /￥\s*([\d,.]+\d)/,
		parser: regularPriceParser
	}
};

// Check which Amazon we're at:
// amazon.com
if (document.domain.endsWith("com")) {
	currencyFrom = "USD";
// amazon.co.uk
} else if (document.domain.endsWith("co.uk")) {
	currencyFrom = "GBP";
// amazon.ca
} else if (document.domain.endsWith("ca")) {
	currencyFrom = "CAD";
// amazon.de
} else if (document.domain.endsWith("de")) {
	currencyFrom = "EUR";
// amazon.fr
} else if (document.domain.endsWith("fr")) {
	currencyFrom = "EUR";
// amazon.it
} else if (document.domain.endsWith("it")) {
	currencyFrom = "EUR";
// amazon.co.jp
} else if (document.domain.endsWith("jp")) {
	currencyFrom = "JPY";
// amazon.cn
} else if (document.domain.endsWith("cn")) {
	currencyFrom = "CNY";
} else {
	return;
}

// Configuration keys (not all of them)
var LAST_RUN = "last_run_";
var CURRENCY_RATE = "currency_rate_";

// Only traverse these elements
var elnames = ["td", "font", "b", "span", "strong", "div", "em", "p", "a", "h5", "strike"];

var rounding = Math.pow(10, decimalPlaces);

// Check last run time
var rate = await GM.getValue(CURRENCY_RATE + currencyFrom);
var lastRun = await GM.getValue(LAST_RUN + currencyFrom, "01/01/0001");
var currencyTo = await GM.getValue("currency_to", currencyToDefault);
var todayString = (new Date()).toISOString().substring(0, 10);
var currencyToSymbol = await GM.getValue("currency_symbol", currencyToSymbolDefault);

function registerMutationObserver() {
	var observer = new window.MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			convertCurrency(mutation.target);
		});
	});

	observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

if (rate === undefined || todayString !== lastRun) {
	await fetchCurrencyData(currencyFrom, async function() {
		rate = await GM.getValue(CURRENCY_RATE + currencyFrom);
		convertCurrency(document);
		registerMutationObserver();
	});
} else {
	convertCurrency(document);
	registerMutationObserver();
}


// Function definitions

async function fetchCurrencyData(coin, callback) {
	GM.xmlHttpRequest({
		method: "GET",
		url: `https://free.currencyconverterapi.com/api/v6/convert?q=${coin}_${currencyTo}&compact=y`,
		onload: function(responseDetails) {
			var rate = JSON.parse(responseDetails.responseText)[`${coin}_${currencyTo}`].val;
			GM.setValue(CURRENCY_RATE + coin, rate);
			GM.setValue(LAST_RUN + coin, todayString);
			callback().then();
		},
		onerror: function(responseDetails) {
			alert(`Error fetching currency data for ${coin}`);
		}
	});
}

// Receives a price, and converts it. Returns "<original price> (<converted price>)"
function appendConversion(price, matched) {
	var originalPrice = currencies[currencyFrom].parser(matched, currencyFrom);

	if (isNaN(originalPrice)) {
		return price;
	}

	var converted = formatCurrency(originalPrice * rate, rounding,
		currencyToSymbol, prefixCurrencySymbol);

	return price + " (" + converted + ")";
}

function formatCurrency(num, rounding, symbol, prefix) {
	var sign = (num == (num = Math.abs(num)));
	num = Math.floor(num*rounding + 0.50000000001);
	var cents = num % rounding;

	num = Math.floor(num / rounding).toString();

	if (cents < 10) {
		cents = "0" + cents;
	}

	for (var i = 0; i < Math.floor((num.length - (1 + i)) / 3); i++) {
		num = num.substring(0, num.length - (4 * i + 3)) + ',' +
		                       num.substring(num.length-(4*i+3));
	}

	if (prefix) {
		return (symbol + ((sign)?'':'-') + num + '.' + cents);
	} else {
		return (((sign)?'':'-') + num + '.' + cents + symbol);
	}
}

// Convert desired currency
function convertCurrency(element) {

	// Match a string that begins with the symbol, and then
	// has 0 or more spaces, digits, commas and periods, ending with a digit
	var currency = currencies[currencyFrom];

	var i,j,k;

	for (i = 0; i < elnames.length; ++i) {
		var elems = element.getElementsByTagName(elnames[i]);

		for (j = 0; j < elems.length; ++j) {
			var price = elems[j];

			for (k = 0; k < price.childNodes.length; ++k) {
				var currNode = price.childNodes[k];
				// Only modify text nodes
				if (currNode.nodeType == 3) {

					// Quick check that the currency symbol exists, and that we didn't already convert this
					if (currNode.nodeValue.indexOf(currency.symbol) != -1 &&
					    currNode.nodeValue.indexOf(currencyToSymbol) == -1) {
						// nbsp replacement done to fix some amazon.de prices (e.g. "EUR&nbsp;1,23")
						currNode.nodeValue = currNode.nodeValue.replace(/&nbsp;/, " ").replace(currency.priceRegex, appendConversion);
					}
				}
			}
		}
	}
}

})();
