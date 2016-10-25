function renderTemplate(name, vars) {
	var tplid = name + '-tpl';
	var rendered = templates[tplid](vars || {});
	var tplnode = $("#" + tplid);
	var target = $(tplnode.data('target') || 'body');
	if(!target.length)
		target = $('body');
	
	rendered = $(rendered);
	
	var method = tplnode.data('method') || 'html';
	target[method](rendered);
	
	// Just to make sure the DOM was updated... Am I paranoid?
	setTimeout(function() {
		if(tplEvents.hasOwnProperty(name)) {
			tplEvents[name](rendered, vars);
		}
	}, 0);
}
