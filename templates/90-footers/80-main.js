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
		
		for(var i = 0 ; i < quizz.questions.length ; i++) {
			quizz.questions[i].choices = arrayShuffle(quizz.questions[i].choices);
		}
		
		quizz.questions = arrayShuffle(quizz.questions);
		
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
		
		Handlebars.registerHelper('isChecked', function(qid, cid, options) {
			qid = 'q' + qid;
			cid = qid + 'c' + cid;
			if(objGet(form, [qid, cid], false))
				return(options.fn(this));
		});
		
		renderTemplate('quizz', {
			title: quizz.title,
			student: students[currentStudent],
			questions: quizz.questions,
		});
		
		Handlebars.unregisterHelper('isChecked');
	});
	
	socket.on('solution', function(okQuizz, form) {
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
		
		Handlebars.registerHelper('isChecked', function(qid, cid, isok) {
			qid = 'q' + qid;
			cid = qid + 'c' + cid;
			var isChecked = objGet(form, [qid, cid], false);
			if(isChecked)
				return('checked');
			return('');
		});
		
		renderTemplate('solution', {
			title: okQuizz.title,
			student: students[currentStudent],
			questions: okQuizz.questions,
		});
		
		Handlebars.unregisterHelper('isGood');
		Handlebars.unregisterHelper('isChecked');
	});
	
	$window = $(window);
	$window.blur(function() {
		socket.emit('blur');
	});
	
	$window.focus(function() {
		socket.emit('focus');
	});
});
