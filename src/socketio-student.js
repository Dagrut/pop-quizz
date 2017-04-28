var tools = require('./tools.js');

function onStudent(client) {
	var clientUid = client.id;
	var clientIP = tools.objGet(client, 'handshake.address', 'NOIP');
	
	client.join('students');
	
	pq.ioStudents[clientUid] = false;
	
	client.on('disconnect', function() {
		pq.log.ioconn("Disconnection from " + clientIP);
		if(pq.ioStudents[clientUid] !== false) {
			var id = pq.ioStudents[clientUid];
			pq.log.studLogs("Student " + pq.opts.students[id] + " (" + id + ") disconnected from " + clientIP);
			if(pq.studentData[id].mark === undefined) {
				pq.studentData[id].discTime = Date.now();
				pq.studentData[id].discCount = tools.objGet(pq.studentData[id], ['discCount'], 0) + 1;
			}
			delete pq.studentData[id].client;
			
			pq.evts.emit('studentEvent', {
				what: 'studentDisconnect',
				who: id,
				data: pq.studentData[id],
			});
		}
		delete pq.ioStudents[clientUid];
	});
	
	client.on('error', function(e) {
		console.log('Error received on socket.io :', e);
	});
	
	client.on('iam', function(id) {
		if(pq.state == pq.STATES.idle)
			return;
		
		if(!pq.opts.students.hasOwnProperty(id)) {
			client.emit('bad-student', id);
			return;
		}
		
		if(pq.studentIpPool[clientIP] !== undefined)
			id = pq.studentIpPool[clientIP];
		
		if(!pq.studentData.hasOwnProperty(id))
			pq.studentData[id] = tools.objGet(pq.savedState, ['studentData', id], {});
		
		if(tools.objGet(pq.studentData, [id, 'client'])) {
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
		
		if(pq.state == pq.STATES.solve) {
			tools.computeStudentMark(id);
			client.emit('solution', pq.opts.quizz, pq.studentData[id].form, pq.studentData[id].mark);
		}
		else if(pq.studentData[id].mark !== undefined)
			client.emit('mark', pq.studentData[id].mark, pq.opts.quizz.markBase);
		else {
			var timeLeft = pq.opts.quizz.duration - (Date.now() - pq.studentData[id].start);
			timeLeft /= 1000;
			timeLeft |= 0;
			client.emit('quizz', pq.studentData[id].form, timeLeft);
		}
		
		pq.evts.emit('studentEvent', {
			what: 'studentConnect',
			who: id,
			data: pq.studentData[id],
		});
	});
	
	client.on('quizz-save', function(data) {
		if(pq.state != pq.STATES.quizz)
			return;
		
		var id = pq.ioStudents[clientUid];
		if(!pq.studentData.hasOwnProperty(id))
			return;
		
		pq.studentData[id].form = data;
		
		pq.evts.emit('studentEvent', {
			what: 'studentSave',
			who: id,
			data: pq.studentData[id],
		}, 'studentSave' + id);
	});
	
	client.on('quizz-end', function(data) {
		if(pq.state != pq.STATES.quizz)
			return;
		
		var id = pq.ioStudents[clientUid];
		if(!pq.studentData.hasOwnProperty(id))
			return;
		
		if(pq.studentData[id].mark !== undefined)
			return(client.emit('mark', mark, pq.opts.quizz.markBase));
		
		pq.studentData[id].form = data;
		
		tools.computeStudentMark(id);
		var mark = pq.studentData[id].mark;
		
		var timeLeft = pq.opts.quizz.duration - (Date.now() - pq.studentData[id].start);
		timeLeft /= 1000;
		timeLeft |= 0;
		var timeLeftStr = ((timeLeft / 60) | 0) + ':' + (timeLeft % 60);
		
		pq.log.studLogs("Student " + pq.opts.students[id] + " (" + id + ") terminated quizz with mark " + mark + " with " + timeLeftStr + " minutes left")
		
		client.emit('mark', mark, pq.opts.quizz.markBase);
		
		pq.evts.emit('studentEvent', {
			what: 'studentEnd',
			who: id,
			data: pq.studentData[id],
		});
	});
	
	client.on('blur', function() {
		if(pq.studentIpPool.hasOwnProperty(clientIP)) {
			var id = pq.studentIpPool[clientIP];
			if(pq.studentData[id].mark !== undefined)
				return;
			pq.studentData[id].blurTime = Date.now();
			pq.studentData[id].blurCount = tools.objGet(pq.studentData[id], ['blurCount'], 0) + 1;
			pq.log.studLogs("Student " + pq.opts.students[id] + " (" + id + ") went away");
			
			pq.evts.emit('studentEvent', {
				what: 'studentBlur',
				who: id,
				data: pq.studentData[id],
			});
		}
	});
	
	client.on('focus', function() {
		if(pq.studentIpPool.hasOwnProperty(clientIP)) {
			var id = pq.studentIpPool[clientIP];
			if(pq.studentData[id].mark !== undefined)
				return;
			var blurDur = (Date.now() - pq.studentData[id].blurTime) / 1000;
			pq.studentData[id].blurTotal = tools.objGet(pq.studentData[id], ['blurTotal'], 0) + blurDur;
			blurDur = blurDur.toFixed(1);
			pq.log.studLogs("Student " + pq.opts.students[id] + " (" + id + ") came back " + blurDur + " seconds later");
			
			pq.evts.emit('studentEvent', {
				what: 'studentFocus',
				who: id,
				data: pq.studentData[id],
			});
		}
	});
	
	if(pq.state == pq.STATES.idle)
		return;
	
	client.emit('init', pq.opts.students, pq.opts.pubQuizz);
	
	if(pq.studentIpPool.hasOwnProperty(clientIP)) {
		var id = pq.studentIpPool[clientIP];
		
		if(tools.objGet(pq.studentData, [id, "client"])) {
			client.emit('student-taken', id);
			return;
		}
		
		if(pq.studentData[id].mark === undefined) {
			var discDur = (Date.now() - pq.studentData[id].discTime) / 1000;
			pq.studentData[id].discTotal = tools.objGet(pq.studentData[id], ['discTotal'], 0) + discDur;
			discDur = discDur.toFixed(1);
			pq.log.studLogs("Student " + pq.opts.students[id] + " (" + id + ") reconnected from " + clientIP + " " + discDur + " seconds later");
		}
		
		pq.ioStudents[clientUid] = id;
		pq.studentData[id].client = client;
		
		client.emit('youare', id, discDur);
		
		var timeLeft = pq.opts.quizz.duration - (Date.now() - pq.studentData[id].start);
		timeLeft /= 1000;
		timeLeft |= 0;
		
		if(pq.state == pq.STATES.solve)
			client.emit('solution', pq.opts.quizz, pq.studentData[id].form, pq.studentData[id].mark);
		else if(pq.studentData[id].mark !== undefined)
			client.emit('mark', pq.studentData[id].mark, pq.opts.quizz.markBase);
		else
			client.emit('quizz', pq.studentData[id].form, timeLeft);
		
		pq.evts.emit('studentEvent', {
			what: 'studentConnect',
			who: id,
			data: pq.studentData[id],
		});
	}
	else {
		client.emit('showList');
	}
}

module.exports = onStudent;
