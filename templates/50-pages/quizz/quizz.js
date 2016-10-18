(function() {
	tplEvents['quizz'] = function() {
		var $quizz = $('#quizz');
		$quizz.submit(function(evt) {
			evt.preventDefault();
			evt.stopPropagation();
			
			renderTemplate('quizz-confirm-modal');
		});
		
		var saveForm = temporiseCb(function() {
			var formData = serializeQuizzForm($quizz);
			socket.emit('quizz-save', formData);
		}, 1000);
		
		$quizz.mouseup(saveForm);
		$quizz.mousemove(saveForm);
		$quizz.keyup(saveForm);
		
		$timerTarget = $("#quizz #quizz-timer");
		
		startTimer();
	};
	
	function sendQuizzNow() {
		var target = $("#quizz");
		var formData = serializeQuizzForm(target);
		
		target.off('mouseup');
		target.off('mousemove');
		target.off('keyup');
		
		stopTimer();
		socket.emit('quizz-end', formData);
	}
	
	var timerId = null;
	var $timerTarget;
	
	function startTimer() {
		stopTimer();
		
		timerId = setInterval(function() {
			if(remainingTime <= 0) {
				sendQuizzNow();
				return;
			}
			remainingTime -= 1;
			setTimerTxt();
			if(remainingTime == 60)
				$timerTarget.addClass('last-minute');
		}, 1000);
		
		setTimerTxt();
	}
	
	function setTimerTxt() {
		if(remainingTime > 60)
			$timerTarget.text(((remainingTime / 60) | 0) + " min");
		else
			$timerTarget.text(remainingTime);
	}
	
	function stopTimer() {
		if(timerId) {
			clearInterval(timerId);
			timerId = null;
		}
	}
	
	tplEvents['quizz-confirm-modal'] = function() {
		$('#quizz-confirm-modal form').submit(function(event) {
			event.preventDefault();
			event.stopPropagation();
		});
		$('#quizz-confirm-modal .buttons .send').click(function(event) {
			event.preventDefault();
			event.stopPropagation();
			
			sendQuizzNow();
		});
		$('#quizz-confirm-modal .buttons .cancel').click(function(event) {
			$('#quizz-confirm-modal').remove();
		});
	};
})();
