var tools = require('./tools.js');

function onAdmin(client, session) {
	client.join('admin');
	
	client.emit('admin', pq.opts.students, pq.opts.quizz);
	
	client.on('disconnect', function() {
		
	});
	
	var data = tools.objGet(pq.savedState, 'studentData', {});
	for(var id in data) {
		pq.evts.emit('studentEvent', {
			what: 'studentData',
			who: id,
			data: data[id],
		}, 'studentData' + id);
	}
	
	for(var id in pq.studentData) {
		pq.evts.emit('studentEvent', {
			what: 'studentData',
			who: id,
			data: pq.studentData[id],
		}, 'studentData' + id);
	}
}

module.exports = onAdmin;
