define(function (require, exports, module) {
	'use strict';

	var LanguageManager = brackets.getModule("language/LanguageManager");

	CodeMirror.defineMode("packetfilter", function () {
	    // The code below is based on Puppet syntax highlighter from https://github.com/nextrevision/brackets-puppet-syntax
		var words = {};
		// Takes a string of words separated by spaces and adds them as
		// keys with the value of the first argument 'style'
		function define(style, string) {
			var split = string.split(' ');
			for (var i = 0; i < split.length; i++) {
				words[split[i]] = style;
			}
		}
		// Additional themes => https://github.com/MiguelCastillo/Brackets-Themes
		// keyword atom number def variable variable-2 variable-3 property operator comment string string-2
		// meta qualifier builtin bracket tag attribute header quote hr link special
		define('keyword',  'altq anchor antispoof binat nat pass block queue rdr match scrub table set in out rdr-to divert-to route-to reply-to nat-to');
		define('atom',     'all any yes no drop return');
		define('builtin',  'proto inet inet6 tcp udp icmp icmp6 port other carp pfsync');
		define('def',      'label user file timeout limit optimization block-policy loginterface require-order skip synproxy state parent bandwidth static-port');
		define('tag',      'tag tagged');
		define('qualifier','quick persist');
		define('attribute','log');

		// After finding a start of a string ('|") this function attempts to find the end;
		// If a variable is encountered along the way, we display it differently when it
		// is encapsulated in a double-quoted string.
		function tokenString(stream, state) {
			var current, prev, found_var = false;
			while (!stream.eol() && (current = stream.next()) != state.pending) {
				if (current === '$' && prev != '\\' && state.pending == '"') {
					found_var = true;
					break;
				}
				prev = current;
			}
			if (found_var) {
				stream.backUp(1);
			}
			if (current == state.pending) {
				state.continueString = false;
			} else {
				state.continueString = true;
			}
			return "string";
		}

		function tokenize(stream, state) {
			// Matches one whole word
			var word = stream.match(/[\w\-]+/, false);
	  
			// Finally advance the stream
			var ch = stream.next();

			// Have we found a variable ?
			if (ch === '$') {
				if (stream.match(/^[a-zA-Z0-9_\-]+/)) {
					// If so, and its in a string, assign it a different color
					return state.continueString ? 'variable-2' : 'variable';
				}
				// Otherwise return an invalid variable
				return "error";
			}
			// Should we still be looking for the end of a string?
			if (state.continueString) {
				// If so, go through the loop again
				stream.backUp(1);
				return tokenString(stream, state);
			}
			if (word && words.hasOwnProperty(word)) {
				// Negates the initial next()
				stream.backUp(1);
				// Acutally move the stream
				stream.match(/[\w\-]+/);
				return words[word];
			}
			// Match comments
			if (ch == "#") {
				stream.skipToEnd();
				return "comment";
			}
			// Have we found a string?
			if (ch == "'" || ch == '"') {
				// Store the type (single or double)
				state.pending = ch;
				// Perform the looping function to find the end
				return tokenString(stream, state);
			}
			// Match brackets
			if (ch == '{' || ch == '}') {
				return 'bracket';
			}
			// Match tables
			if (ch == '<') {
				if (stream.match(/^[a-zA-Z0-9_\-\.]+>/)) {
				return 'special';
				}
			}
			// Match subnets
			if (ch == '/') {
				stream.match(/[0-9]+/);
				return 'property';
			}
			// Match numbers and IPs
			if (ch.match(/[0-9]/)) {
				stream.eatWhile(/[0-9\.]+/);
				return 'number';
			}
			// Match the '=' operator
			if (ch == '=') {
				return "operator";
			}
			if (ch == ':') {
				return "operator";
			}
			if (ch == '>') {
				return "operator";
			}
			if (ch == '<') {
				return "operator";
			}
			if (ch == '!') {
				return "operator";
			}
			if (ch == ',') {
				return null;
			}
			// Keep advancing through all the rest
			stream.eatWhile(/[\w-]/);
			// Return unformatted for everything else
			return null;
		}
		
		return {
			startState: function () {
				var state = {};
				state.continueString = false;
				state.pending = false;
				return state;
			},
			token: function (stream, state) {
				// Strip the spaces
				if (stream.eatSpace()) return null;
				// Go through the main process
				return tokenize(stream, state);
			}
		};
	});

	LanguageManager.defineLanguage("packetfilter", {
		name: "Packet Filter",
		mode: "packetfilter",
		fileNames: ["pf.conf"],
		lineComment: ["#"]
	});

});
