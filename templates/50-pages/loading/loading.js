tplEvents['loading'] = function() {
	var i = 0;
	var l = '-\\|/';
	var interval = setInterval(function() {
		var target = $('#loading .loading-anim');
		if(!target.length)
			return(clearInterval(interval));
		target.html("&nbsp;" + l[i] + "&nbsp;");
		i = (i + 1) % l.length;
	}, 500);
};
