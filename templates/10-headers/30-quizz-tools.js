function serializeQuizzForm(form) {
	var arr = form.serializeArray();
	var ret = {};
	for(var i = 0 ; i < arr.length ; i++) {
		var cur = arr[i];
		
		if(!ret.hasOwnProperty(cur.name))
			ret[cur.name] = {};
		
		ret[cur.name][cur.value] = true;
	}
	return(ret);
}
