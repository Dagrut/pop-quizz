tplEvents['solution'] = function() {
	if(quizz.onsolve)
		eval(quizz.onsolve);
	Prism.highlightAll();
};
