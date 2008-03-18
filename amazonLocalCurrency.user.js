/*
  GreaseMonkey userscript for showing prices in your local currency.
  Customize to your own currency below.

  Exchange rates provided by Yahoo @ www.yahoo.com

  New to GreaseMonkey? Visit <http://www.greasespot.net/>

  2005-04-17  Carl Henrik Lunde  chlunde+greasemonkey <at> ping.uio.no
              http://www.ping.uio.no/~chlunde/stuff

  Maintainer:
    Ori Avtalion  ori <at> avtalion.name

  Contributors:
    Simon Pope skjpope -> gmail.com

  Changelog:

  2005-09-14
    * Added GM menu options to change the local currency coin and
      symbol.
    * Added price rounding.
    * Added option to toggle whether or not to display the
      local currency symbol.
    * Fixed double printing of converted currency

  2005-10-08
    * Fixed occasions where the price would show up several times
    * Prices are now converted even when they're part of a large sentence,
      such as in the check-out process ("total price is $42.13")

  2006-02-25
    * Added handling for prices that are not the first element in a tag,
      such as in amazon UK's wish list: <span><b>Price:</b>$13.37</span>

  2008-03-14
    * The converted price now appears right next to the original price.
    * All of the prices in a piece of text are converted, instead of just the first one.


  TODO:
    * Add GM menu options to change source currency
    * Add option and GUI to choose whether the local currency symbol
      should be prefixed or suffixed to the currency
*/

// ==UserScript==
// @name          Amazon Local Currency - Dynamic version
// @namespace     http://userscripts.org/scripts/show/1476
// @description   Show prices in you local currency
// @include       http://www.amazon.com/*
// @include       https://www.amazon.com/*
// @include       http://amazon.com/*
// @include       https://amazon.com/*
// ==/UserScript==

(function() {

// Customize to fit:
// (Some options are modifiable from the GUI)
var currencyFrom = "USD";
var currencyToDefault = "ILS";

var currencyFromSymbol = "\$"; // When changing this, don't forget the one below
var currencyFromSymbolForRegex = "\\$";

var currencyToSymbolDefault = "NIS ";
var decimalPlaces = 2;
var prefixCurrencySymbol = true;

// Only traverse these elements
var elnames = new Array("td", "font", "b", "span", "strong", "div");

var rounding = Math.pow(10, decimalPlaces);

// Check last run time
var rate = GM_getValue("currency_data");
var lastRun = GM_getValue("last_run", "01/01/0001");
var currencyTo = GM_getValue("currency_to", currencyToDefault);
var todayDate = new Date();
var todayString = todayDate.getDate() + "/" + todayDate.getMonth() + "/" + todayDate.getFullYear();
var currencyToSymbol = GM_getValue("currency_symbol", currencyToSymbolDefault);

GM_registerMenuCommand("Change Local Currency (" + currencyTo + ")", setLocalCurrency);
GM_registerMenuCommand("Change Local Currency Symbol (" + currencyToSymbol + ")", setLocalCurrencySymbol);

if (rate == undefined || todayString != lastRun) {
	// GM_log("Currency data is out-dated. Fetching new information...");
	getCurrencyData();
} else {
	convertCurrency();
}

// Function definitions

function getCurrencyData() {
	GM_xmlhttpRequest({
		method: "GET",
		url: "http://finance.yahoo.com/d/quotes.csv?s=" + currencyFrom + currencyTo + "=X&f=l1&e=.csv",
		onload: function(responseDetails) {
			var rate = responseDetails.responseText.replace(/[\r\n]/g, "");
			GM_setValue("currency_data", rate);
			GM_setValue("last_run", todayString);
			GM_setValue("currency_to", currencyTo);
			// GM_log("Rate: " + currencyFrom + "1 = " + currencyTo + " " + rate);
			convertCurrency();
		},
		onerror: function(responseDetails) {
			alert("Error fetching currency data");
		}
	});
}

// Convert desired currency
function convertCurrency() {
	for (elname in elnames) {
		var elems = document.getElementsByTagName(elnames[elname]);

		for (i = 0; i < elems.length; ++i) {
			var price = elems[i];

			for (j = 0; j < price.childNodes.length; ++j) {
				var currNode = price.childNodes[j];
				// Only modify text nodes
				if (currNode.nodeType == 3) {

					// Quick check before using the regex
					if (currNode.nodeValue.indexOf(currencyFromSymbol) != -1) {
						// Match a string that begins with the symbol, and then
						// has digits, commas and periods, ending with a digit
						var matchRegex = new RegExp(currencyFromSymbolForRegex + "[\\d,.]+\\d", "g");
						currNode.nodeValue = currNode.nodeValue.replace(matchRegex, appendConversion);
					}
				}
			}
		}
	}
}

// Receives a price, and converts it. Returns "<original price> (<converted price>)"
function appendConversion(price) {
	var originalPrice = parseFloat(price.replace(currencyFromSymbol, "").replace(/,/g, ""));

	if (isNaN(originalPrice))
		return price;

	var converted = formatCurrency(originalPrice * rate, rounding,
		currencyToSymbol, prefixCurrencySymbol);

	return result = price + " (" + converted + ")";
}

function formatCurrency(num, rounding, symbol, prefix) {
	sign = (num == (num = Math.abs(num)));
	num = Math.floor(num*rounding + 0.50000000001);
	cents = num % rounding;

	num = Math.floor(num / rounding).toString();
    
	if (cents < 10)
		cents = "0" + cents;
	for (var i = 0; i < Math.floor((num.length - (1 + i)) / 3); i++)
		num = num.substring(0, num.length - (4 * i + 3)) + ',' +
		                       num.substring(num.length-(4*i+3));

	if (prefix)
		return (((sign)?'':'-') + symbol + num + '.' + cents);
	else
		return (((sign)?'':'-') + num + '.' + cents + symbol);
}

function setLocalCurrency() {
	var newCurrencyTo = prompt("Enter the code for your local currency (e.g. AUD, USD, ILS, etc.)", "");

	if (newCurrencyTo == "" || newCurrencyTo == null) {
		alert("Currency code is invalid. Please enter again");
		return;
	}

	alert("Success! Refresh page to see the changes.");

	// GM_log("Currency changed from " + currencyTo + " to " + newCurrencyTo);

	GM_setValue("currency_to", newCurrencyTo);
	currencyTo = newCurrencyTo;

	// Always update the currency data after a change (saves doing it later)
	getCurrencyData();
}

function setLocalCurrencySymbol() {
	var newSymbol = prompt("Enter the symbol for your local currency ( e.g. A$, $, ¥, £, etc.)", "");

	if (newSymbol == '' || newSymbol == null) {
		alert("Symbol is invalid. Please enter again");
		return;
	}

	alert("Success! Refresh page to see the changes.");

	// GM_log("Currency Symbol changed from " + currencyToSymbol + " to " + newSymbol);

	GM_setValue("currency_symbol", newSymbol);
	currencyToSymbol = newSymbol;
}

})();
