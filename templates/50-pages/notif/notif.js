tplEvents['notif'] = function($notif, vars) {
	var duration = vars.duration || 5000;
	
	var curTO = setTimeout(showNotif, 100);
	
	function showNotif() {
		$notif.addClass('notif-visible');
		curTO = setTimeout(hideNotif, duration);
	}
	
	function hideNotif() {
		$notif.removeClass('notif-visible');
		curTO = setTimeout(deleteNotif, 1000);
	}
	
	function deleteNotif() {
		$notif.remove();
	}
	
	$notif.click(function(event) {
		clearTimeout(curTO);
		$notif.off('click');
		hideNotif();
	});
};

function notify(text, duration, style) {
	var opts = {
		text: text,
	};
	
	if(duration)
		opts.duration = duration;
	if(style)
		opts.class = 'notif-style-' + style;
	
	renderTemplate('notif', opts);
}
