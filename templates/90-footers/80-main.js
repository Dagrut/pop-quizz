$(function() {
	var templatesMarks = $('.tpl-script');
	for(var i = 0 ; i < templatesMarks.length ; i++) {
		var tpl = $(templatesMarks[i]);
		var id = tpl.attr('id');
		templates[id] = Handlebars.compile(tpl.html());
	}
	
	var showdownCnv = new showdown.Converter();
	Handlebars.registerHelper('fmt', function(text) {
		return(showdownCnv.makeHtml(text).replace(/^<p>|<\/p>$/g, ''));
	});
	
	renderTemplate('loading');
	
	socket = io();
	
	socket.on('init', function(students_, quizz_) {
		students = students_;
		quizz = quizz_;
		
		if(quizz.oninit)
			eval(quizz.oninit);
	});
	
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
	
	socket.on('youare', function(userId) {
		currentStudent = userId;
	});
	
	socket.on('student-taken', function(uid) {
		renderTemplate('student-taken', {
			student: students[uid],
		});
	});
	
	socket.on('quizz-extend', function(duration) {
		remainingTime += duration;
	});
	
	socket.on('quizz', function(form, duration) {
		remainingTime = duration;
		
		if(quizz.ashuffle) {
			for(var i = 0 ; i < quizz.questions.length ; i++) {
				quizz.questions[i].choices = arrayShuffle(quizz.questions[i].choices);
			}
		}
		
		if(quizz.qshuffle) {
			quizz.questions = arrayShuffle(quizz.questions);
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
});
