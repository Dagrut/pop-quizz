const path = require('path');

var tools = {};

tools.objGet = function objGet(obj, path, dft) {
	if(!(path instanceof Array))
		path = path.split('.');
	
	for(var i = 0 ; i < path.length ; i++) {
		var cur = path[i];
		
		try {
			if(obj.hasOwnProperty(cur))
				obj = obj[cur];
			else
				return(dft);
		}
		catch(e) {
			return(dft);
		}
	}
	
	return(obj);
};

tools.padString = function padString(str, len, fill, dir) {
	str += '';
	if(!fill)
		fill = ' ';
	if(dir !== 'l' && dir !== 'm' && dir !== 'r')
		dir = 'l';
	
	if(str.length >= len)
		return(str);
	
	if(dir === 'r') {
		while(str.length < len)
			str = str + fill;
	}
	else if(dir === 'l') {
		while(str.length < len)
			str = fill + str;
	}
	else if(dir === 'm') {
		var i = 0;
		while(str.length < len) {
			if(i % 2 == 0)
				str = str + fill;
			else
				str = fill + str;
			i++;
		}
	}
	
	return(str);
};


tools.computeStudentMark = function computeStudentMark(id) {
	if(!pq.studentData.hasOwnProperty(id))
		return(false);
	
	if(pq.studentData[id].mark !== undefined)
		return(false);
	
	if(!pq.studentData[id].form)
		return(false);
	
	pq.log.studResults("Student " + pq.opts.students[id] + " (" + id + ") answers : " + JSON.stringify(pq.studentData[id].form));
	
	var studentResponses = pq.studentData[id].form;
	
	var points = 0;
	var quizzq = pq.opts.quizz.questions;
	for(var i = 0 ; i < quizzq.length ; i++) {
		var curq = quizzq[i];
		var good = 0;
		
		for(var j = 0 ; j < curq.choices.length ; j++) {
			if(curq.choices[j].ok == tools.objGet(studentResponses, ['q' + i, 'q' + i + 'c' + j], false)) {
				good++;
			}
		}
		
		if(curq.choices.length == good)
			points++;
	}
	
	var mark = points / quizzq.length;
	mark *= pq.opts.quizz.markBase * 10;
	mark |= 0;
	mark /= 10;
	
	pq.studentData[id].mark = mark;
	
	return(true);
};

module.exports = tools;
