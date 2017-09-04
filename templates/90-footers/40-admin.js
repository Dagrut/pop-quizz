function onAdmin(socket) {
	renderTemplate('admin-list', {
		students: students,
		quizz: quizz,
	});
	
	function computeNoteAndDisplay(student, studentResponses) {
		var quizzq = quizz.questions;
		var points = 0;
		var totalPoints = 0;
		
		for(var i = 0 ; i < quizzq.length ; i++) {
			var curq = quizzq[i];
			var tdNode = $('td.td-s'+student+'q'+i);
			var setClass = '';
			var good = 0;
			var okCount = 0;
			var notOkCount = 0;
			var studentGoods = 0;
			var studentBads = 0;
			var atLeastOneResp = false;
			
			for(var j = 0 ; j < curq.choices.length ; j++) {
				var studResp = objGet(studentResponses, ['q' + i, 'q' + i + 'c' + j], false);
				
				atLeastOneResp = !!(atLeastOneResp || studResp);
				if(curq.choices[j].ok)
					okCount++;
				else
					notOkCount++;
				
				if(curq.choices[j].ok == studResp) {
					good++;
					if(curq.choices[j].ok)
						studentGoods++;
				}
				else {
					if(!curq.choices[j].ok)
						studentBads++;
				}
			}
			
			var weight = curq.points || 1;
			totalPoints += weight;
			
			if(quizz.notationMode == 'allgoodhalf') {
				if(curq.choices.length == good) {
					points += weight;
					setClass = 'question-good';
				}
				else if(studentBads == 0 && studentGoods > 0 && studentGoods < okCount) {
					points += weight / 2;
					setClass = 'question-partial';
				}
				else {
					setClass = 'question-bad';
				}
			}
			else if(quizz.notationMode == 'proportionnal') {
				if(curq.choices.length == good) {
					points += weight;
					setClass = 'question-good';
				}
				else if(studentBads == 0 && studentGoods > 0 && studentGoods < okCount) {
					points += weight * (studentGoods / okCount);
					setClass = 'question-partial';
				}
				else {
					setClass = 'question-bad';
				}
			}
			else { // allgood
				if(curq.choices.length == good) {
					points += weight;
					setClass = 'question-good';
				}
				else {
					setClass = 'question-bad';
				}
			}
			
			if(!atLeastOneResp)
				setClass = 'question-unchecked';
			
			tdNode.removeClass('question-unchecked question-good question-bad question-partial');
			tdNode.addClass(setClass);
		}
		
		tdNode = $('td.td-s'+student+'mark');
		mark = points * quizz.markBase / totalPoints;
		mark *= 10;
		mark |= 0;
		mark /= 10;
		tdNode.text(mark + '/' + quizz.markBase);
	}
	
	function qIs(evt/* , ... */) {
		for(var i = 1 ; i < arguments.length ; i++) {
			if(evt.what == arguments[i])
				return(true);
		}
		return(evt.what == 'studentData');
	}
	
	function timeToMMSS(t) {
		var ret = '';
		t |= 0;
		var m = ((t / 60) | 0) + '';
		var s = ((t % 60) | 0) + '';
		if(m.length < 2)
			m = '0' + m;
		if(s.length < 2)
			s = '0' + s;
		return(m+':'+s);
	}
	
	socket.on('adminPush', function(events) {
		console.log('events', events);
		for(var i = 0 ; i < events.length ; i++) {
			var evt = events[i];
			
			if(qIs(evt, 'studentSave')) {
				var form = objGet(evt, 'data.form', {});
				computeNoteAndDisplay(evt.who, form);
			}
			if(qIs(evt, 'studentConnect', 'studentDisconnect')) {
				var tdNode = $('td.td-s'+evt.who+'connected');
				tdNode.removeClass('student-connected student-disconnected');
				if(evt.data.connected)
					tdNode.addClass('student-connected');
				else
					tdNode.addClass('student-disconnected');
					var cnt = objGet(evt, 'data.discCount', 0);
					var time = objGet(evt, 'data.discTotal', 0);
				tdNode = $('td.td-s'+evt.who+'discCount');
				tdNode.text(cnt + ' fois, '+timeToMMSS(time));
			}
			if(qIs(evt, 'studentBlur', 'studentFocus')) {
				tdNode = $('td.td-s'+evt.who+'blurCount');
				var cnt = objGet(evt, 'data.blurCount', 0);
				var time = objGet(evt, 'data.blurTotal', 0);
				tdNode.text(cnt + ' fois, '+timeToMMSS(time));
			}
		}
	});
	
	$('.student-mark').text('0/' + quizz.markBase);
}
