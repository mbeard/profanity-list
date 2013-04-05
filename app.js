// Module dependencies.
var express = require('express'),
	fs = require('fs'),
	hbs = require('hbs');

if(process.env.VCAP_SERVICES){
	var env = JSON.parse(process.env.VCAP_SERVICES);
	var mongo = env['mongodb'][0]['credentials'];
}
else{
  	var mongo = {"hostname":"localhost","port":27017,"username":"", "password":"","name":"","db":"test"}
}

var databaseUrl = generate_mongo_url(mongo),
	collections = ["entries"];

// generate the databaseUrl
function generate_mongo_url(obj){
	obj.hostname = (obj.hostname || 'localhost');
	obj.port = (obj.port || 27017);
	obj.db = (obj.db || 'test');

	if(obj.username && obj.password){
		return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db;
	}
	else{
		return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db;
	}
}

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

app.get('/list', function(req, res) {
	db.entries.find().sort({word:1}, function(err, entries) {
		var json = { "words": entries };
		res.render("list", json);
	});
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