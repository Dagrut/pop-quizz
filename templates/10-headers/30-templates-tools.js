function renderTemplate(name, vars) {
	var tplid = name + '-tpl';
	var rendered = templates[tplid](vars || {});
	var tplnode = $("#" + tplid);
	var target = $(tplnode.data('target') || 'body');
	if(!target.length)
		target = $('body');
	
	target.html(rendered);
	
	var loadEvts = function(name) {
		if(tplEvents.hasOwnProperty(name)) {
			tplEvents[name]();
		}
	};
	
	target.append('<script>(' + loadEvts.toString() + ')(' + JSON.stringify(name) + ');</script>');
}
