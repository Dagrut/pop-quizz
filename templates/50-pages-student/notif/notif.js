tplEvents['notif'] = function($notif, vars) {
	var duration = vars.duration || 5000;
	
	var curTO = setTimeout(showNotif, 100);
	var animDur = 300;
	
	function showNotif() {
		var notifh = $notif.height();
		var margtop = $notif.css('margin-top');
		$notif.height(0).css("opacity", 0);
		$notif.addClass('notif-visible');
		$notif.animate({ height: notifh, opacity: 1 }, animDur);
		curTO = setTimeout(hideNotif, duration);
	}
	
	function hideNotif() {
		$notif.animate({ height: 0, opacity: 0 }, animDur, function() {
			$notif.removeClass('notif-visible');
			$notif.remove();
		});
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
