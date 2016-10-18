tplEvents['names-list'] = function() {
	$('#names-list li').click(function(event) {
		var target = $(event.currentTarget);
		socket.emit('iam', target.data('id'));
	});
	
	$('#names-list-filter').keyup(function(event) {
		var target = $(event.currentTarget);
		var str = target.val().toLowerCase();
		
		var itms = $('#names-list li');
		for(var i = 0 ; i < students.length ; i++) {
			var curItm = itms.filter('.student-' + i);
			if(students[i].toLowerCase().indexOf(str) >= 0)
				curItm.removeClass('hidden');
			else
				curItm.addClass('hidden');
		}
	});
};
