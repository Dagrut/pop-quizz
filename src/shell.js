const readline = require('readline');

const tools = require('./tools.js');

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
		if(pq.state == pq.STATES.idle) {
			pq.state = pq.STATES.quizz;
			pq.io.in('student').emit('init', pq.opts.students, pq.opts.pubQuizz);
			pq.io.in('student').emit('showList');
			console.log('Quizz started!');
			resetPrompt();
		}
		else if(pq.state == pq.STATES.solve) {
			console.log('Quizz is being solved!');
		}
		else {
			console.log('Quizz already started!');
		}
	};
	
	cmds.correct = cmds.solve = cmds.solution = function() {
		if(pq.state == pq.STATES.quizz) {
			pq.state = pq.STATES.solve;
			for(var id in pq.studentData) {
				var cur = pq.studentData[id];
				if(cur.client) {
					if(tools.computeStudentMark(id)) {
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
		else if(pq.state == pq.STATES.solve) {
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
		
		console.log(tools.padString(cnts.idle, 3, ' ') + ' students did not start the test');
		console.log(tools.padString(cnts.quizz, 3, ' ') + ' students started the test');
		console.log(tools.padString(cnts.mark, 3, ' ') + ' students ended the test');
	};
	
	cmds.grep = cmds.find = cmds.search = cmds.list = cmds.l = function(studMatch) {
		if(!studMatch)
			studMatch = '*';
		
		var tf = tools.tableFormatter(5);
		
		tf.add('ID', 'Student name', 'Time', 'Mark', 'IP address');
		tf.addSeparator();
		
		searchStudent(studMatch, function(id, studName) {
			var dur = pq.opts.quizz.duration;
			var ip = '';
			var mark = '';
			
			if(pq.studentData.hasOwnProperty(id)) {
				dur = pq.opts.quizz.duration - (Date.now() - pq.studentData[id].start);
				ip = pq.studentData[id].ip || '-';
				mark = (pq.studentData[id].mark !== undefined ? pq.studentData[id].mark : '-');
			}
			
			dur /= 1000;
			if(dur < 0)
				dur = 0;
			dur = tools.secondsToMMSS(dur);
			
			tf.add(id, studName, dur, mark, ip);
		});
		
		console.log(tf.render());
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
					delete pq.studentData[id].blurTime;
					delete pq.studentData[id].discTime;
					delete pq.studentData[id].blurTotal;
					delete pq.studentData[id].discTotal;
					delete pq.studentData[id].blurCount;
					delete pq.studentData[id].discCount;
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
				var client = tools.objGet(pq.studentData, [id, "client"]);
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
		/* Do not close since it may trigger events inside socketIO and we don't want that. */
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
		if(pq.state == pq.STATES.idle)
			rl.setPrompt('pop-quizz/idle> ');
		else if(pq.state == pq.STATES.quizz)
			rl.setPrompt('pop-quizz/quizz> ');
		else if(pq.state == pq.STATES.solve)
			rl.setPrompt('pop-quizz/solve> ');
	}
	resetPrompt();
	
	rl.prompt();
	
	rl.on('line', onQuery);
}

module.exports = loadShell;
