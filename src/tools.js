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
	var totalPoints = 0;
	for(var i = 0 ; i < quizzq.length ; i++) {
		var curq = quizzq[i];
		var good = 0;
		
		for(var j = 0 ; j < curq.choices.length ; j++) {
			if(curq.choices[j].ok == tools.objGet(studentResponses, ['q' + i, 'q' + i + 'c' + j], false)) {
				good++;
			}
		}
		
		var weight = curq.points || 1;
		totalPoints += weight;
		if(curq.choices.length == good)
			points += weight;
	}
	
	var mark = points / totalPoints;
	mark *= pq.opts.quizz.markBase * 10;
	mark |= 0;
	mark /= 10;
	
	pq.studentData[id].mark = mark;
	
	return(true);
};

/* Thanks to :
 * http://stackoverflow.com/a/14810722
 */
tools.objMap = function(inputObj, cb) {
	var newObj = Object.keys(inputObj).reduce(function(target, key) {
		target[key] = cb(inputObj[key], key);
		return(target);
	}, {});
	return(newObj);
};

tools.objMerge = function() {
	var ret = {};
	for(var i = 0 ; i < arguments.length ; i++) {
		for(var j in arguments[i]) {
			ret[j] = arguments[i][j];
		}
	}
	return(ret);
};

tools.secondsToMMSS = function(dur) {
	dur |= 0;
	return(tools.padString((dur / 60) | 0, 2, '0') + ':' + tools.padString(dur % 60, 2, '0'));
};

tools.randomString = function(length, allowedChars) {
	var ret = '';
	
	for(var i = 0 ; i < length ; i++) {
		var c = (Math.random() * 256) | 0;
		c = String.fromCharCode(c);
		if(c.match(allowedChars))
			ret += c;
		else
			i--;
	}
	
	return(ret);
};

tools.tableFormatter = function tableFormatter() {
	if(!(this instanceof tableFormatter))
		return(new tableFormatter());
	
	this.rows = [];
	this.rowLengths = [];
};

tools.tableFormatter.prototype.add = function(data) {
	var input = data;
	if(!(data instanceof Array))
		input = Array.prototype.slice.call(arguments);
	
	var ins = [];
	for(var i = 0 ; i < input.length ; i++) {
		var str = '' + input[i];
		ins.push(str);
		if(str.length > tools.objGet(this.rowLengths, [i], -1))
			this.rowLengths[i] = str.length;
	}
	
	this.rows.push(ins);
};

tools.tableFormatter.prototype.addSeparator = function() {
	this.rows.push('sep');
};

tools.tableFormatter.prototype.render = function() {
	var ret = '';
	var self = this;
	
	function renderSep() {
		for(var i = 0 ; i < self.rowLengths.length ; i++) {
			ret += "+";
			ret += tools.padString('', self.rowLengths[i] + 2, '-');
		}
		ret += "+";
	}
	
	function renderRow(row) {
		for(var i = 0 ; i < row.length ; i++) {
			ret += "| ";
			ret += tools.padString(row[i], self.rowLengths[i], ' ', 'r');
			ret += " ";
		}
		ret += "|";
	}
	
	for(var i = 0 ; i < this.rows.length ; i++) {
		if(i > 0)
			ret += "\n";
		
		var row = this.rows[i];
		if(row === 'sep')
			renderSep();
		else
			renderRow(row);
	}
	
	return(ret);
};

module.exports = tools;
