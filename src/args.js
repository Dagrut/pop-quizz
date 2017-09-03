const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

function parseArgs() {
	var opts = {};
	var studentsFile;
	var quizzFile;
	var dataDir;
	var runNow = false;
	var port = 8080;
	
	for(var i = 0 ; i < process.argv.length ; i++) {
		var cur = process.argv[i];
		if(cur == "-s") {
			i++;
			studentsFile = process.argv[i];
		}
		else if(cur == "-q") {
			i++;
			quizzFile = process.argv[i];
		}
		else if(cur == "-d") {
			i++;
			dataDir = process.argv[i];
		}
		else if(cur == "-p") {
			i++;
			port = process.argv[i];
		}
		else if(cur == "-r")
			runNow = true;
	}
	
	if(!studentsFile || !quizzFile || !dataDir) {
		console.log("Error! Missing at lease one option (-q, -s or -l)");
		process.exit(1);
	}
	
	try {
		mkdirp.sync(dataDir);
	}
	catch(e) {
		console.log('Error! Cannot create directory ' + dataDir);
		process.exit(1);
	}
	
	if(runNow)
		pq.state = pq.STATES.quizz;
	
	port = parseInt(port);
	if(port < 1 || port > 65535)
		opts.port = 8080;
	else
		opts.port = port;
	
	opts.dataDir = dataDir;
	
	var students = fs.readFileSync(studentsFile).toString('utf8').split('\n');
	opts.students = [];
	for(var i = 0 ; i < students.length ; i++) {
		if(students[i])
			opts.students.push(students[i]);
	}
	opts.quizz = require(path.resolve(process.cwd(), quizzFile));
	fillQuizz(opts.quizz);
	opts.pubQuizz = filterQuizz(opts.quizz);
	
	opts.port = port || 8080;
	
	return(opts);
}

function fillQuizz(quizz) {
	for(var i = 0 ; i < quizz.questions.length ; i++) {
		var curq = quizz.questions[i];
		curq.qid = i;
		for(var j = 0 ; j < curq.choices.length ; j++) {
			curq.choices[j].qid = i;
			curq.choices[j].cid = j;
		}
	}
	
	quizz.duration = parseFloat(quizz.duration);
	if(isNaN(quizz.duration) || quizz.duration <= 0)
		quizz.duration = 60;
	
	if(!quizz.notationMode)
		quizz.notationMode = 'allgoodhalf';
	
	quizz.duration = (quizz.duration * 60 * 1000) | 0;
	
	if(!quizz.hasOwnProperty("qshuffle"))
		quizz.qshuffle = true;
	if(!quizz.hasOwnProperty("ashuffle"))
		quizz.ashuffle = true;
	if(!quizz.hasOwnProperty("gshuffle"))
		quizz.gshuffle = false;
	if(typeof quizz.gshuffle == 'boolean') {
		quizz.gshuffleDft = quizz.gshuffle;
		quizz.gshuffle = {};
	}
	else if(typeof quizz.gshuffle == 'object') {
		var keys = Object.keys(quizz.gshuffle);
		if(keys.length > 0) {
			var v = !! quizz.gshuffle[keys[0]];
			for(var i in quizz.gshuffle)
				quizz.gshuffle[i] = v;
			quizz.gshuffleDft = !v;
		}
		else {
			quizz.gshuffleDft = false;
		}
	}
	else {
		throw new Error('Invalid value for quizz.gshuffle!');
	}
	
	if(quizz.oninit)
		quizz.oninit = '(' + quizz.oninit.toString() + ')();';
	if(quizz.onquizz)
		quizz.onquizz = '(' + quizz.onquizz.toString() + ')();';
	if(quizz.onsolve)
		quizz.onsolve = '(' + quizz.onsolve.toString() + ')();';
}

function filterQuizz(quizz) {
	var ret = JSON.parse(JSON.stringify(quizz));
	
	for(var i = 0 ; i < ret.questions.length ; i++) {
		var curq = ret.questions[i];
		for(var j = 0 ; j < curq.choices.length ; j++) {
			delete curq.choices[j].ok;
		}
	}
	
	return(ret);
}

module.exports = parseArgs;
