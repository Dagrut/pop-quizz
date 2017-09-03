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
	
	socket.emit('ready', document.location.pathname, getCookie('popquizz'));
	
	socket.on('init', function(students_, quizz_) {
		students = students_;
		quizz = quizz_;
		onStudent(socket);
	});
	
	socket.on('admin', function(students_, quizz_) {
		students = students_;
		quizz = quizz_;
		onAdmin(socket);
	});
});
