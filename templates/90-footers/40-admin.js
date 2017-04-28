function onAdmin(socket) {
	renderTemplate('admin-list', {
		students: students,
		quizz: quizz,
	});
	
	function applyFormTo(student, form) {
		var mark = 0;
		var markTotal = 0;
		
		for(var i = 0 ; i < quizz.questions.length ; i++) {
			var q = quizz.questions[i];
			var goodq = true;
			var tdNode = $('td.td-s'+student+'q'+i);
			var anyChecked = false;
			markTotal += q.points || 1;
			
			for(var j = 0 ; j < q.choices.length ; j++) {
				var c = q.choices[j];
				var resp = objGet(form, ['q'+i, 'q'+i+'c'+j], null);
				if(resp !== null)
					anyChecked = true;
				else
					resp = false;
				if(c.ok != resp)
					goodq = false;
			}
			
			if(goodq)
				mark += q.points || 1;
			
			tdNode.removeClass('question-unchecked question-good question-bad');
			if(!anyChecked)
				tdNode.addClass('question-unchecked');
			else if(goodq)
				tdNode.addClass('question-good');
			else
				tdNode.addClass('question-bad');
		}
		
		tdNode = $('td.td-s'+student+'mark');
		mark = mark * quizz.markBase / markTotal;
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
				applyFormTo(evt.who, form);
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
