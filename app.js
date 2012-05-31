// Module dependencies.
var express = require('express'),
	fs = require('fs'),
	hbs = require('hbs');

var databaseUrl = "test",
	collections = ["entries"];

var db = require("mongojs").connect(databaseUrl, collections);
var app = express.createServer();

// configuration
app.configure( function() {
	app.use(express.bodyParser()); // needed to parse form parameters
	app.use(express.static(__dirname + '/public'));
});

// set the view engine to use handlebars
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));

// routes
app.get('/', function(req, res) {
	res.render("index", {});
});

app.post('/', function(req, res) {
	var word = req.body.word;

	// does this word exist
	findWord(word, function(wordExists) {

		if (wordExists===false) {
			saveWord(word, function(wordSaved) {
				var json = {
					"word": word,
					"exists": wordExists,
					"saved": wordSaved
				}
				outputResponse(res, json);
			});
		}
		else {
			var json = {
				"word": word,
				"exists": wordExists,
				"saved": false
			}
			outputResponse(res, json);
		}
	});
});

function outputResponse(res,json) {
	res.render("index", json);
}

function findWord(word, callback) {
	db.entries.find({word:word}, function(err, entries) {
		var exists = false;
		console.log("in findWord");

		if( err || entries.length === 0) {
			console.log("word not found");
			exists = false;
		}
		else {
			console.log("word found");
			exists = true;
		}

		callback(exists);
	});
}

function saveWord(word, callback) {
	console.log("saveWord:" + word);

	db.entries.save({word: word}, function(err, saved) {
		var isSaved = false;
		if( err || !saved ) {
			console.log("word not saved");
			console.log(err);
			isSaved = false;
		}
		else {
			console.log("word saved");
			isSaved = true;
		}

		callback(isSaved);
	});
}

app.listen(3000);