/*
  Userscript for showing prices in your local currency.
  Customize to your own currency below.

  New to GreaseMonkey? Visit <http://www.greasespot.net/>
  New to Scriptish? Visit <http://scriptish.org/>

  2005-04-17
    Carl Henrik Lunde chlunde+greasemonkey <at> ping.uio.no
    http://www.ping.uio.no/~chlunde/stuff

  Maintainer:
    Ori Avtalion ori <at> avtalion.name

  Contributors:
    Simon Pope skjpope <at> gmail.com
    User600 united600 <at> hotmail.com

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

  2008-12-15
    * Added support for Amazon.ca
    * The regex now matches 0 or more spaces after the currency symbol. Useful for amazon.ca
	  (I could just add the single space to the canadian dollar currency regex pattern, but
	  other websites might behave differently).

  2009-05-02
    * Added support for Amazon.de (Euros).
    * Refactored a bit to allow for different price parsers.

  2011-09-08
    * Added support for Amazon.fr, Amazon.it and Amazon.cn.
    * Added new Metadata @keys (All supported by Scriptish).

  TODO:
    * Add GM menu options to change source currency
    * Add option and GUI to choose whether the local currency symbol
      should be prefixed or suffixed to the currency
    * Figure out the local currency automatically, so one would be able to use this script
      on every website, even if it's using GBP on a .com domain
*/

// ==UserScript==
// @name          Amazon Local Currency - Dynamic version
// @namespace     http://userscripts.org/scripts/show/1476
// @id            amazonlocalcurrency@amazon
// @description   Show prices in your local currency. Exchange rates provided by Yahoo! Finance.
// @author        Ori Avtalion <ori@avtalion.name> http://ori.avtalion.name/
// @developer     Carl Henrik Lunde
// @contributor   Simon Pope <skjpope@gmail.com>
// @contributor   United600 <united600@hotmail.com>
// @version       0.9.11
// @icon          data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41Ljg3O4BdAAAExUlEQVRYR9WXfWhVZRzHn6m7E7c5p6YbzdQMnVCRQ1TIllmKkEaUWJJW0JKUQjL0D0NNEPKl2M5uc85//EMMXxDHiArT0vxD3AIt35o630Hn65RN3ap7/HwPz7nde7nznEVCXfjwe+65v+f38jy/5/eca8z/7eOWmwzXMZFYpekFOZbsmGOyIOOh5eNWmm44K4XljHfAYThjOYr8Blby+2R3ncn81wKJVZClY97CeD3chT+gCfbCd5afkI3QDvcI4jDMZZzvB8Kq5fH9ZWTf0MFhZJTNrBV5ju81GJhIQIOR+W7U5HhUmj78NohnzzKugBPQBnugVA6RU+yzNwIDwIGWe5Kcwm0M1/D9qcCJVgHdYcz7Am5AM99fF4xdeDfQjnV+3ZvsmJnIHsvqGkQZ9A80oIy/Mt2xM9UmcYuxAgoOAIclKJ63zkvkDKelcABcOAdvQ7dQgTimGFtn4VZgADjPtUV1m4i9vcJRITRAM1yC03AevOA6+2DnS/BOCbYu2f1/8AqgqGpvRVZp2W0AY3F2FZZBHcyCvTAjIIDPsHHQB5u/MW4gyUlp58WqTSYKOmpNsagp9pVwNAxOwM/wCzwJaRsOz7PhNVgH6yG44n1HRPYSzu9BNDFC7TUsgFZbA0eQn0BOil4Rz3ZbHdWK+DZdtiSYnIBb5R27VTjv4MiNT52Eoe4w3K6AivGOgkpYpUy+V0MHLIUCeBRGhylUg/MsnH8PjWooKZkNxNDzMAhUA2PgOGywNaLgpsEZOAaTYQKMh7ywAWTj/DjsZiuSJmFkIrTAFvgRZsNFWG0DGMD4V/jL6ikQsR9GhA1Ax+8qbOO2i6SsgAprI/j7KnkWnrEBRBir4NpB21NumY/0TlK6D43q7zog6944v5kuAOskC2PToQmWQLwbMu4HUZu9mpQfwDtpC5Aix4/ae0H8d/a9Jw9r4FPd6+kmKhtYDCqukfAKTIF8yIEf4Ca8aHWlPzTRFhdXD3x8raaUutWhtsquxlwMqwh1HFULu2CIdXwBeQXUMzwSDXO15+NcN+QRks4O7TThuKngLsN2yAU1HbXmNyEDxsEmq6PWXZMUQKUZgfPLsAW6/tKCwRJog+Vdjp4JZD0Px3/qZeWfzNfFVAzqiFsh1G3oO3K1/I7ZrxVg/wu7HAAOe9n91nlXEIdgZVhDZP2BvRG9/tHph+iGo7gZWYfUy6dHRzSiFqsup+JS8b0PoVottp7Gxmn4nfHjQQG8iqLu7VTU2dTzdQLqIf7C+SCDNLY8sm/wjl7UzApcMRRfsM47vIijZqy7wajCda5Xg7ZAlT4DeoMunqTz7jtR5jg/gJ125AKC6bQzxgNDeYICYMJmZAtchEU31hbK0QrYA7WglxKtht6O1mh14gXHfcL8OXbZ2zznFaZnYPZS8ANAfkwG05CH4A7UN1cPWXhq/eiSlqoBfcu31+qW1M343KodOwvocrk4egK992Af6FW+UcseKvN49LzH66zCh3pGEEWMV9iV0J+SK6A/IptgDU4/R26EnVZHc6+Bo4BCZZ3Urx3Th8llnNmipC7mmEcwWMZv6mInQf+S/EJVvajKa+EjWu5jXXYcdgIOMtXHkXkEOVjHSmOe6Y9qRH9ew9r6T+jdB8voNXbpiHNpAAAAAElFTkSuQmCC
// @icon64        data:image/png;base64,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
// @include       http://www.amazon.com/*
// @include       https://www.amazon.com/*
// @include       http://amazon.com/*
// @include       https://amazon.com/*
// @include       http://www.amazon.ca/*
// @include       https://www.amazon.ca/*
// @include       http://amazon.ca/*
// @include       https://amazon.ca/*
// @include       http://www.amazon.co.uk/*
// @include       https://www.amazon.co.uk/*
// @include       http://amazon.co.uk/*
// @include       https://amazon.co.uk/*
// @include       http://www.amazon.de/*
// @include       https://www.amazon.de/*
// @include       http://amazon.de/*
// @include       https://amazon.de/*
// @include       http://www.amazon.fr/*
// @include       https://www.amazon.fr/*
// @include       http://amazon.fr/*
// @include       https://amazon.fr/*
// @include       http://www.amazon.it/*
// @include       https://www.amazon.it/*
// @include       http://amazon.it/*
// @include       https://amazon.it/*
// @include       http://www.amazon.co.jp/*
// @include       https://www.amazon.co.jp/*
// @include       http://amazon.co.jp/*
// @include       https://amazon.co.jp/*
// @include       http://www.amazon.cn/*
// @include       https://www.amazon.cn/*
// @include       http://amazon.cn/*
// @include       https://amazon.cn/*
// ==/UserScript==

(function() {

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
	function replacer(character) {
		var translate = {".":"", ",":"."};
		return translate[character];
	}
	return regularPriceParser(price.replace(/[,.]/g, replacer), currency);
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
// amazon.ca
} else if (document.domain.endsWith("ca")) {
	currencyFrom = "CAD";
// amazon.co.uk
} else if (document.domain.endsWith("co.uk")) {
	currencyFrom = "GBP";
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

// Customize to fit:
// (Some options are modifiable from the GUI)
var currencyToDefault = "ILS";
var currencyToSymbolDefault = "NIS ";
var decimalPlaces = 2;
var prefixCurrencySymbol = true;

// Only traverse these elements
var elnames = ["td", "font", "b", "span", "strong", "div"];

var rounding = Math.pow(10, decimalPlaces);

// Check last run time
var rate = GM_getValue(CURRENCY_RATE + currencyFrom);
var lastRun = GM_getValue(LAST_RUN + currencyFrom, "01/01/0001");
var currencyTo = GM_getValue("currency_to", currencyToDefault);
var todayDate = new Date();
var todayString = todayDate.getDate() + "/" + todayDate.getMonth() + "/" + todayDate.getFullYear();
var currencyToSymbol = GM_getValue("currency_symbol", currencyToSymbolDefault);

// Function definitions

function fetchCurrencyData(coin, callback) {
	GM_xmlhttpRequest({
		method: "GET",
		url: "http://download.finance.yahoo.com/d/quotes.csv?s=" + coin + currencyTo + "=X&f=l1&e=.csv",
		onload: function(responseDetails) {
			var rate = responseDetails.responseText.replace(/[\r\n]/g, "");
			GM_setValue(CURRENCY_RATE + coin, rate);
			GM_setValue(LAST_RUN + coin, todayString);
			callback();
		},
		onerror: function(responseDetails) {
			alert("Error fetching currency data for " + coin);
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
	sign = (num == (num = Math.abs(num)));
	num = Math.floor(num*rounding + 0.50000000001);
	cents = num % rounding;

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
function convertCurrency() {

	// Match a string that begins with the symbol, and then
	// has 0 or more spaces, digits, commas and periods, ending with a digit
	var currency = currencies[currencyFrom];

	var i,j,k;

	for (i = 0; i < elnames.length; ++i) {
		var elems = document.getElementsByTagName(elnames[i]);

		for (j = 0; j < elems.length; ++j) {
			var price = elems[j];

			for (k = 0; k < price.childNodes.length; ++k) {
				var currNode = price.childNodes[k];
				// Only modify text nodes
				if (currNode.nodeType == 3) {

					// Quick check before using the regex
					if (currNode.nodeValue.indexOf(currency.symbol) != -1) {
						// nbsp replacement done to fix some amazon.de prices (e.g. "EUR&nbsp;1,23")
						// GM_log(currNode.nodeValue.replace(/&nbsp;/, " "));
						currNode.nodeValue = currNode.nodeValue.replace(/&nbsp;/, " ").replace(currency.priceRegex, appendConversion);
					}
				}
			}
		}
	}
}


function setLocalCurrency() {
	var newCurrencyTo = prompt("Enter the code for your local currency (e.g. AUD, USD, ILS, etc.)", "");

	if (newCurrencyTo === "" || newCurrencyTo === null) {
		alert("Currency code is invalid. Please enter again");
		return;
	}

	// GM_log("Currency changed from " + currencyTo + " to " + newCurrencyTo);

	GM_setValue("currency_to", newCurrencyTo);
	currencyTo = newCurrencyTo;

	// Reset the various conversion rates
	for (var i = 0; i < amazonCurrencies.length; ++i) {
		GM_setValue(LAST_RUN + amazonCurrencies[i], "01/01/0001");
	}

	// Not really.. at this point, the fetching isn't done yet
	alert("Success! Refresh page to see the changes.");
}

function setLocalCurrencySymbol() {
	var newSymbol = prompt("Enter the symbol for your local currency ( e.g. A$, $, ¥, £, etc.)", "");

	if (newSymbol === '' || newSymbol === null) {
		alert("Symbol is invalid. Please enter again");
		return;
	}

	alert("Success! Refresh page to see the changes.");

	// GM_log("Currency Symbol changed from " + currencyToSymbol + " to " + newSymbol);

	GM_setValue("currency_symbol", newSymbol);
	currencyToSymbol = newSymbol;
}


GM_registerMenuCommand("Change Local Currency (" + currencyTo + ")", setLocalCurrency);
GM_registerMenuCommand("Change Local Currency Symbol (" + currencyToSymbol + ")", setLocalCurrencySymbol);


if (rate === undefined || todayString !== lastRun) {
	// GM_log("Currency data is out-dated. Fetching new information...");
	fetchCurrencyData(currencyFrom, function() {
		rate = GM_getValue(CURRENCY_RATE + currencyFrom);
		convertCurrency();
	});
} else {
	convertCurrency();
}

})();