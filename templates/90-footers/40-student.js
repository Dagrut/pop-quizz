function onStudent(socket) {
	if(quizz.oninit)
		eval(quizz.oninit);
	
	socket.on('showList', function() {
		var mappedStudents = students.map(function(name, id) {
			return({ id: id, name: name });
		});
		
		mappedStudents.sort(function(x, y) {
			if(x.name > y.name)
				return(1);
			if(x.name < y.name)
				return(-1);
			return(0);
		});
		
		renderTemplate('names-list', {
			names: mappedStudents,
		});
	});
	
	socket.on('bad-student', function() {
		renderTemplate('bad-student', {});
	});
	
	socket.on('mark', function(mark, markBase) {
		renderTemplate('mark', {
			nom: students[currentStudent],
			mark: mark,
			markBase: markBase,
		});
	});
	
	socket.on('youare', function(userId, discTime, session) {
		currentStudent = userId;
		
		setCookie('popquizz', session);
		
		if(discTime > 0) {
			var strDiscTime = '**' + discTime + '**';
			var msg = students[userId] + ", vous ";
			
			msg += "vous êtes déconnecté du QCM pendant ";
			msg += strDiscTime;
			msg += " secondes.<br> ";
			msg += "Cela a été enregistré et pourra être pris en compte dans la notation si vous en abusez!";
			
			notify(msg, 8000, (discTime >= 30 ? "error" : "warn"));
		}
	});
	
	socket.on('student-taken', function(uid) {
		renderTemplate('student-taken', {
			student: students[uid],
		});
	});
	
	socket.on('student-try-reco', function(uid) {
		setTimeout(function() {
			socket.emit('iam', uid);
		}, 500);
	});
	
	socket.on('quizz-extend', function(duration) {
		remainingTime += duration;
	});
	
	socket.on('quizz', function(form, duration) {
		remainingTime = duration;
		
		if(quizz.ashuffle) {
			for(var i = 0 ; i < quizz.questions.length ; i++) {
				quizz.questions[i].choices = arrayGrpShuffle(quizz.questions[i].choices, quizz.gshuffle, quizz.gshuffleDft);
			}
		}
		
		if(quizz.qshuffle) {
			quizz.questions = arrayGrpShuffle(quizz.questions, quizz.gshuffle, quizz.gshuffleDft);
		}
		
		Handlebars.registerHelper('isChecked', function(qid, cid, options) {
			qid = 'q' + qid;
			cid = qid + 'c' + cid;
			if(objGet(form, [qid, cid], false))
				return(options.fn(this));
		});
		Handlebars.registerHelper('getType', function(parentid) {
			var q = quizz.questions[parentid];
			if(q.radio)
				return('radio');
			else
				return('checkbox');
		});
		
		renderTemplate('quizz', {
			title: quizz.title,
			student: students[currentStudent],
			questions: quizz.questions,
		});
		
		Handlebars.unregisterHelper('getType');
		Handlebars.unregisterHelper('isChecked');
	});
	
	socket.on('solution', function(okQuizz, form, mark) {
		Handlebars.registerHelper('isGood', function(qid, cid, isok) {
			var ret = '';
			qid = 'q' + qid;
			cid = qid + 'c' + cid;
			var isChecked = objGet(form, [qid, cid], false);
			
			if(isChecked != isok)
				return('bad-response');
			else
				return('good-response');
		});
		Handlebars.registerHelper('isChecked', function(qid, cid) {
			qid = 'q' + qid;
			cid = qid + 'c' + cid;
			var isChecked = objGet(form, [qid, cid], false);
			if(isChecked)
				return('checked');
			return('');
		});
		Handlebars.registerHelper('getType', function(parentid) {
			var q = okQuizz.questions[parentid];
			if(q.radio)
				return('radio');
			else
				return('checkbox');
		});
		
		renderTemplate('solution', {
			title: okQuizz.title,
			student: students[currentStudent],
			questions: okQuizz.questions,
			mark: mark,
			markBase: okQuizz.markBase,
		});
		
		Handlebars.unregisterHelper('getType');
		Handlebars.unregisterHelper('isGood');
		Handlebars.unregisterHelper('isChecked');
	});
	
	var blurTime;
	var $window = $(window);
	$window.blur(function() {
		socket.emit('blur');
		blurTime = Date.now();
	});
	
	$window.focus(function() {
		socket.emit('focus');
		if(!blurTime)
			return;
		var diff = (Date.now() - blurTime) / 1000;
		var strdiff = '**' + diff.toFixed(1) + '**';
		
		var msg = "";
		if(currentStudent !== false)
			msg = students[currentStudent] + ", vous ";
		else
			msg = "Vous "
		
		msg += "avez quitté la fenêtre du QCM pendant ";
		msg += strdiff;
		msg += " secondes.<br> ";
		msg += "Cela a été enregistré et pourra être pris en compte dans la notation si vous en abusez!";
		
		notify(msg, 8000, (diff >= 30 ? "error" : "warn"));
	});
}
