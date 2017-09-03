var tools = require('./tools.js');

function onAdmin(client, session) {
	client.join('admin');
	
	client.emit('admin', pq.opts.students, pq.opts.quizz);
	
	function handleEvents(evts) {
		client.emit('adminPush', evts);
	}
	
	pq.evts.on('adminPush', handleEvents);
	
	client.on('disconnect', function() {
		pq.evts.removeListener('adminPush', handleEvents);
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
