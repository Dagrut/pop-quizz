const path = require('path');
const fs = require('fs');
const readline = require('readline');
const socketio = require('socket.io');
const express = require('express');
const winston = require('winston');
const mkdirp = require('mkdirp');

const STATES = {
	idle: 'idle',
	quizz: 'quizz',
	solve: 'solve',
}

function objGet(obj, path, dft) {
	if(!(path instanceof Array))
		path = path.split('.');
	
	for(var i = 0 ; i < path.length ; i++) {
		var cur = path[i];
		
		try {
			if(obj.hasOwnProperty(cur))
				obj = obj[cur];
			else
				return(dft);
		}
		catch(e) {
			return(dft);
		}
	}
	
	return(obj);
}

function padString(str, len, fill, dir) {
	str += '';
	if(!fill)
		fill = ' ';
	if(dir !== 'l' && dir !== 'm' && dir !== 'r')
		dir = 'l';
	
	if(str.length >= len)
		return(str);
	
	if(dir === 'r') {
		while(str.length < len)
			str = str + fill;
	}
	else if(dir === 'l') {
		while(str.length < len)
			str = fill + str;
	}
	else if(dir === 'm') {
		var i = 0;
		while(str.length < len) {
			if(i % 2 == 0)
				str = str + fill;
			else
				str = fill + str;
			i++;
		}
	}
	
	return(str);
}

function loadArguments() {
	var opts = {};
	var studentsFile;
	var quizzFile;
	var logDir;
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
		else if(cur == "-l") {
			i++;
			logDir = process.argv[i];
		}
		else if(cur == "-p") {
			i++;
			port = process.argv[i];
		}
		else if(cur == "-r")
			runNow = true;
	}
	
	if(!studentsFile || !quizzFile || !logDir) {
		console.log("Error! Missing at lease one option (-q, -s or -l)");
		process.exit(1);
	}
	
	try {
		mkdirp.sync(logDir);
	}
	catch(e) {
		console.log('Error! Cannot create directory ' + logDir);
		process.exit(1);
	}
	
	if(runNow)
		pq.state = STATES.quizz;
	
	port = parseInt(port);
	if(port < 1 || port > 65535)
		opts.port = 8080;
	else
		opts.port = port;
	
	opts.logDir = logDir;
	
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
	
	quizz.duration = (quizz.duration * 60 * 1000) | 0;
	
	if(!quizz.hasOwnProperty("qshuffle"))
		quizz.qshuffle = true;
	if(!quizz.hasOwnProperty("ashuffle"))
		quizz.ashuffle = true;
	
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

function loadIo() {
	/* Hash studentID => quizz mark + form data backup + quizz start time + socketIO client + IP address */
	pq.studentData = {};
	/* Hash IP address => student ID */
	pq.studentIpPool = {};
	/* Hash socketIO client ID => student ID */
	pq.ioStudents = {};
	
	pq.io.on('connection', function(client) {
		var clientUid = client.id;
		var clientIP = objGet(client, 'handshake.address', 'NOIP');
		pq.ioStudents[clientUid] = false;
		
		pq.log.ioconn("Connection from " + clientIP);
		
		client.on('disconnect', function() {
			pq.log.ioconn("Disconnection from " + clientIP);
			if(pq.ioStudents[clientUid] !== false) {
				var id = pq.ioStudents[clientUid];
				pq.log.studLogs("Student " + pq.opts.students[id] + " (" + id + ") disconnected from " + clientIP)
				pq.studentData[id].disctime = Date.now();
				delete pq.studentData[id].client;
			}
			delete pq.ioStudents[clientUid];
		});
		
		client.on('error', function(e) {
			console.log('Error received on socket.io :', e);
		});
		
		client.on('iam', function(id) {
			if(pq.state == STATES.idle)
				return;
			
			if(!pq.opts.students.hasOwnProperty(id)) {
				client.emit('bad-student', id);
				return;
			}
			
			if(pq.studentIpPool[clientIP] !== undefined)
				id = pq.studentIpPool[clientIP];
			
			if(!pq.studentData.hasOwnProperty(id))
				pq.studentData[id] = {};
			
			if(objGet(pq.studentData, [id, 'client'])) {
				client.emit('student-taken', id);
				return;
			}
			
			pq.studentIpPool[clientIP] = id;
			pq.ioStudents[clientUid] = id;
			
			if(!pq.studentData[id].start)
				pq.studentData[id].start = Date.now();
			
			pq.studentData[id].ip = clientIP;
			pq.studentData[id].client = client;
			
			pq.log.studLogs("Student " + pq.opts.students[id] + " (" + id + ") connected from " + clientIP);
			
			client.emit('youare', id);
			
			if(pq.state == STATES.solve) {
				computeStudentMark(id);
				client.emit('solution', pq.opts.quizz, pq.studentData[id].form, pq.studentData[id].mark);
			}
			else if(pq.studentData[id].mark !== undefined)
				client.emit('mark', pq.studentData[id].mark, pq.opts.quizz.markBase);
			else
				client.emit('quizz', pq.studentData[id].form, pq.opts.quizz.duration / 1000);
		});
		
		client.on('quizz-save', function(data) {
			if(pq.state != STATES.quizz)
				return;
			
			var id = pq.ioStudents[clientUid];
			if(!pq.studentData.hasOwnProperty(id))
				return;
			
			pq.studentData[id].form = data;
		});
		
		client.on('quizz-end', function(data) {
			if(pq.state != STATES.quizz)
				return;
			
			var id = pq.ioStudents[clientUid];
			if(!pq.studentData.hasOwnProperty(id))
				return;
			
			if(pq.studentData[id].mark !== undefined)
				return(client.emit('mark', mark, pq.opts.quizz.markBase));
			
			pq.studentData[id].form = data;
			
			computeStudentMark(id);
			var mark = pq.studentData[id].mark;
			
			var timeLeft = pq.opts.quizz.duration - (Date.now() - pq.studentData[id].start);
			timeLeft /= 1000;
			timeLeft |= 0;
			var timeLeftStr = ((timeLeft / 60) | 0) + ':' + (timeLeft % 60);
			
			pq.log.studLogs("Student " + pq.opts.students[id] + " (" + id + ") terminated quizz with mark " + mark + " with " + timeLeftStr + " minutes left")
			
			client.emit('mark', mark, pq.opts.quizz.markBase);
		});
		
		client.on('blur', function() {
			if(pq.studentIpPool.hasOwnProperty(clientIP)) {
				var id = pq.studentIpPool[clientIP];
				pq.studentData[id].blurtime = Date.now();
				pq.log.studLogs("Student " + pq.opts.students[id] + " (" + id + ") went away");
			}
		});
		
		client.on('focus', function() {
			if(pq.studentIpPool.hasOwnProperty(clientIP)) {
				var id = pq.studentIpPool[clientIP];
				var blurDur = (Date.now() - pq.studentData[id].blurtime) / 1000;
				blurDur = blurDur.toFixed(1);
				pq.log.studLogs("Student " + pq.opts.students[id] + " (" + id + ") came back " + blurDur + " seconds later");
			}
		});
		
		if(pq.state == STATES.idle)
			return;
		
		client.emit('init', pq.opts.students, pq.opts.pubQuizz);
		
		if(pq.studentIpPool.hasOwnProperty(clientIP)) {
			var id = pq.studentIpPool[clientIP];
			
			if(objGet(pq.studentData, [id, "client"])) {
				client.emit('student-taken', id);
				return;
			}
			
			var discDur = (Date.now() - pq.studentData[id].disctime) / 1000;
			discDur = discDur.toFixed(1);
			pq.log.studLogs("Student " + pq.opts.students[id] + " (" + id + ") reconnected from " + clientIP + " " + discDur + " seconds later");
			
			pq.ioStudents[clientUid] = id;
			pq.studentData[id].client = client;
			
			client.emit('youare', id, discDur);
			
			var timeLeft = pq.opts.quizz.duration - (Date.now() - pq.studentData[id].start);
			timeLeft /= 1000;
			timeLeft |= 0;
			
			if(pq.state == STATES.solve)
				client.emit('solution', pq.opts.quizz, pq.studentData[id].form, pq.studentData[id].mark);
			else if(pq.studentData[id].mark !== undefined)
				client.emit('mark', pq.studentData[id].mark, pq.opts.quizz.markBase);
			else
				client.emit('quizz', pq.studentData[id].form, timeLeft);
		}
		else {
			client.emit('showList');
		}
	});
}

function computeStudentMark(id) {
	if(!pq.studentData.hasOwnProperty(id))
		return(false);
	
	if(pq.studentData[id].mark !== undefined)
		return(false);
	
	if(!pq.studentData[id].form)
		return(false);
	
	pq.log.studResults("Student " + pq.opts.students[id] + " (" + id + ") answers : " + JSON.stringify(pq.studentData[id].form));
	
	var studentResponses = pq.studentData[id].form;
	
	var points = 0;
	var quizzq = pq.opts.quizz.questions;
	for(var i = 0 ; i < quizzq.length ; i++) {
		var curq = quizzq[i];
		var good = 0;
		
		for(var j = 0 ; j < curq.choices.length ; j++) {
			if(curq.choices[j].ok == objGet(studentResponses, ['q' + i, 'q' + i + 'c' + j], false)) {
				good++;
			}
		}
		
		if(curq.choices.length == good)
			points++;
	}
	
	var mark = points / quizzq.length;
	mark *= pq.opts.quizz.markBase * 10;
	mark |= 0;
	mark /= 10;
	
	pq.studentData[id].mark = mark;
	
	return(true);
}

function loadLogs() {
	pq.log = {};
	
	function timestamp() {
		var d = new Date();
		var ret = padString(d.getFullYear(), 4, '0') + '/' +
				padString((d.getMonth() + 1), 2, '0') + '/' +
				padString(d.getDate(), 2, '0') + 'T' +
				padString(d.getHours(), 2, '0') + ':' +
				padString(d.getMinutes(), 2, '0') + ':' +
				padString(d.getSeconds(), 2, '0');
		
		return(ret);
	}
	
	function formatter(options) {
		return options.timestamp()+'|'+ options.level +'|'+ (undefined !== options.message ? options.message : '') +
		(options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
	}
	
	var list = ["access", "ioconn", "studLogs", "studResults"];
	for(var i = 0 ; i < list.length ; i++) {
		var type = list[i];
		
		var opts = {
			levels: {},
			level: type,
			transports: [
				new (winston.transports.File)({
					name: type +'-file',
					filename: path.join(pq.opts.logDir, 'filelog-' + type + '.log'),
					level: type,
					timestamp: timestamp,
					formatter: formatter,
					json: false,
				}),
			],
		};
		opts.levels[type] = 0;
		
		var curLogger = new (winston.Logger)(opts);
		
		pq.log[type] = (function(type, str) {
			this[type](str);
		}).bind(curLogger, type);
	}
}

function loadRoutes() {
	pq.app.use('/static', express.static(path.join(__dirname, 'static')));
	pq.app.use('/jquery', express.static(path.join(__dirname, 'node_modules/jquery/dist/')));
	pq.app.use('/handlebars', express.static(path.join(__dirname, 'node_modules/handlebars/dist')));
	pq.app.use('/showdown', express.static(path.join(__dirname, 'node_modules/showdown/dist')));
	pq.app.use('/prismjs/js', express.static(path.join(__dirname, 'node_modules/prismjs')));
	pq.app.use('/prismjs/css', express.static(path.join(__dirname, 'node_modules/prismjs/themes')));
	
	pq.app.get('/', function(req, res) {
		pq.log.access("Access from " + req.client.remoteAddress);
		var fileStream = fs.createReadStream(path.join(__dirname, 'static', 'main.html'));
		fileStream.pipe(res);
		fileStream.on('error', function() {
			res.end();
		});
	});
}

function loadShell() {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	
	function searchStudent(nameOrId, respCb) {
		var id = parseInt(nameOrId);
		
		if(!isNaN(id)) {
			if(pq.opts.students.hasOwnProperty(id)) {
				respCb(id, pq.opts.students[id]);
				return(1);
			}
			return(0);
		}
		
		var name = nameOrId.toLowerCase();
		
		if(name == '*')
			name = '';
		
		var found = 0;
		var studs = pq.opts.students;
		for(var i = 0 ; i < studs.length ; i++) {
			if(studs[i].toLowerCase().indexOf(name) >= 0) {
				respCb(i, pq.opts.students[i]);
				found++;
			}
		}
		
		return(found);
	}
	
	var cmds = {};
	cmds.help = cmds.h = cmds['?'] = function() {
		console.log('Available commands :');
		var kvs = {};
		for(var i in cmds) {
			var k = cmds[i].toString();
			if(kvs.hasOwnProperty(k))
				kvs[k].push(i);
			else
				kvs[k] = [i];
		}
		for(var i in kvs) {
			console.log('- ' + kvs[i].join(' '));
		}
	};
	
	cmds.start = cmds.run = cmds.r = cmds.go = function() {
		if(pq.state == STATES.idle) {
			pq.state = STATES.quizz;
			pq.io.emit('init', pq.opts.students, pq.opts.pubQuizz);
			pq.io.emit('showList');
			console.log('Quizz started!');
			resetPrompt();
		}
		else if(pq.state == STATES.solve) {
			console.log('Quizz is being solved!');
		}
		else {
			console.log('Quizz already started!');
		}
	};
	
	cmds.correct = cmds.solve = cmds.solution = function() {
		if(pq.state == STATES.quizz) {
			pq.state = STATES.solve;
			for(var id in pq.studentData) {
				var cur = pq.studentData[id];
				if(cur.client) {
					if(computeStudentMark(id)) {
						var timeLeft = pq.opts.quizz.duration - (Date.now() - cur.start);
						timeLeft /= 1000;
						timeLeft |= 0;
						var timeLeftStr = ((timeLeft / 60) | 0) + ':' + (timeLeft % 60);
						
						pq.log.studLogs("Student " + pq.opts.students[id] + " (" + id + ") was forced to terminate quizz (correction) with mark " + cur.mark + " with " + timeLeftStr + " minutes left")
					}
					cur.client.emit('solution', pq.opts.quizz, cur.form, cur.mark);
				}
			}
			resetPrompt();
			console.log('Quizz solved!');
		}
		else if(pq.state == STATES.solve) {
			console.log('Quizz already being solved!');
		}
		else {
			console.log('Quizz not started, start it before correcting!');
		}
	};
	
	cmds.summary = cmds.recap = cmds.sumup = cmds.state = function() {
		var cnts = {
			idle: 0,
			quizz: 0,
			mark: 0,
		};
		
		for(var id = 0 ; id < pq.opts.students.length ; id++) {
			if(!pq.studentData.hasOwnProperty(id))
				cnts.idle++;
			else if(pq.studentData[id].mark !== undefined)
				cnts.mark++;
			else if(pq.studentData[id].ip !== undefined)
				cnts.quizz++;
			else
				cnts.idle++;
		}
		
		console.log(padString(cnts.idle, 3, ' ') + ' students did not start the test');
		console.log(padString(cnts.quizz, 3, ' ') + ' students started the test');
		console.log(padString(cnts.mark, 3, ' ') + ' students ended the test');
	};
	
	cmds.grep = cmds.find = cmds.search = cmds.list = cmds.l = function(studMatch) {
		if(!studMatch)
			studMatch = '*';
		
		function prt(id, name, time, mark, ip) {
			var prt = [];
			prt.push(padString(id, 4, ' ', 'r'));
			prt.push(padString(name, 45, ' ', 'r'));
			prt.push(padString(time, 7, ' ', 'r'));
			prt.push(padString(mark, 5, ' ', 'r'));
			prt.push(padString(ip, 30, ' ', 'r'));
			console.log('| ' + prt.join(' | ') + ' |');
		}
		
		prt('ID', 'Student name', 'Time', 'Mark', 'IP address');
		
		searchStudent(studMatch, function(id, studName) {
			var dur = pq.opts.quizz.duration;
			var ip = '-';
			var mark = '-';
			
			if(pq.studentData.hasOwnProperty(id)) {
				dur = pq.opts.quizz.duration - (Date.now() - pq.studentData[id].start);
				ip = pq.studentData[id].ip || '-';
				mark = (pq.studentData[id].mark !== undefined ? pq.studentData[id].mark : '-');
			}
			
			dur /= 1000;
			dur |= 0;
			if(dur < 0)
				dur = 0;
			dur = padString((dur / 60) | 0, 2, '0') + ':' + padString(dur % 60, 2, '0');
			
			prt(id, studName, dur, mark, ip);
		});
	};
	cmds.l.mandatoryArgs = 0;
	
	cmds.reset = cmds.kill = cmds.disconnect = function(studMatch) {
		if(!studMatch)
			return(console.log('Search string too short!'));
		
		searchStudent(studMatch, function(id, studName) {
			if(pq.studentData.hasOwnProperty(id)) {
				if(pq.studentData.hasOwnProperty(id)) {
					delete pq.studentData[id].start;
					delete pq.studentData[id].form;
					delete pq.studentData[id].mark;
					delete pq.studentData[id].blurtime;
					delete pq.studentData[id].disctime;
					delete pq.studentData[id].ip;
					if(pq.studentData[id].client)
						pq.studentData[id].client.disconnect();
				}
				
				for(var i in pq.studentIpPool) {
					if(pq.studentIpPool[i] == id)
						delete pq.studentIpPool[i];
				}
				
				console.log('Student ' + studName + ' (' + id + ') reset');
			}
			else {
				console.log('Student ' + studName + ' (' + id + ') never connected');
			}
		});
	};
	
	cmds.addtime = cmds.timeadd = function(studMatch, time) {
		if(!studMatch)
			return(console.log('Search string too short!'));
		
		time = parseInt(time);
		if(!time)
			return(console.log("Invalid time!"));
		
		time *= 60;
		searchStudent(studMatch, function(id, studName) {
			if(pq.studentData.hasOwnProperty(id)) {
				pq.studentData[id].start += time * 1000;
				var client = objGet(pq.studentData, [id, "client"]);
				if(client)
					client.emit('quizz-extend', time);
				console.log('Student ' + studName + ' (' + id + ') time increased');
			}
			else {
				console.log('Student ' + studName + ' (' + id + ') did not start yet');
			}
		});
	};
	
	cmds.exit = cmds.quit = cmds.close = cmds.q = function() {
		console.log('Quitting...');
		rl.close();
		pq.io.close();
		pq.server.close();
		process.exit(0);
	};
	
	function onQuery(input) {
		var args = input.split(/\s+/);
		var cmd = args.shift();
		
		if(cmds.hasOwnProperty(cmd)) {
			var argsCnt = cmds[cmd].mandatoryArgs !== undefined ? cmds[cmd].mandatoryArgs : cmds[cmd].length;
			if(argsCnt > args.length)
				console.log('Not enough arguments for command ' + cmd + ', ' + cmds[cmd].length + ' required');
			else
				cmds[cmd].apply(null, args);
			
		}
		else if(input.trim().length > 0)
			console.log('Unknown command "' + input + '"');
		
		console.log('');
		rl.prompt();
	}
	
	function resetPrompt() {
		if(pq.state == STATES.idle)
			rl.setPrompt('pop-quizz/idle> ');
		else if(pq.state == STATES.quizz)
			rl.setPrompt('pop-quizz/quizz> ');
		else if(pq.state == STATES.solve)
			rl.setPrompt('pop-quizz/solve> ');
	}
	resetPrompt();
	
	rl.prompt();
	
	rl.on('line', onQuery);
}

function main() {
	global.pq = {};
	pq.state = STATES.idle;
	pq.opts = loadArguments();
	
	pq.app = express();
	
	pq.server = require('http').createServer(pq.app);
	pq.io = socketio(pq.server);
	
	loadLogs();
	loadRoutes();
	
	pq.server.listen(pq.opts.port);
	
	loadIo();
	loadShell();
}

main();
