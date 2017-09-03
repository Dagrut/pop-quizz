function temporiseCb(cb, delay) {
	var timeout, context, args;
	var previous = 0;
	
	var later = function() {
		previous = Date.now();
		timeout = null;
		cb.apply(context, args);
		if(!timeout)
			context = args = null;
	};
	
	var throttled = function() {
		var now = Date.now();
		var remaining = delay - (now - previous);
		context = this;
		args = arguments;
		if(remaining <= 0 || remaining > delay) {
			if(timeout) {
				clearTimeout(timeout);
				timeout = null;
			}
			previous = now;
			cb.apply(context, args);
			if(!timeout)
				context = args = null;
		}
		else if(!timeout) {
			timeout = setTimeout(later, remaining);
		}
	};
	
	return throttled;
}

function objGet(obj, path, dft) {
	if(!(path instanceof Array))
		path = path.split('.');
	
	for(var i = 0 ; i < path.length ; i++) {
		var cur = path[i];
		
		try {
			if(!obj.hasOwnProperty(cur))
				return(dft);
			obj = obj[cur];	
		}
		catch(e) {
			return(dft);
		}
	}
	
	return(obj);
}

function arrayShuffle(arr) {
	var ret = [];
	while(arr.length > 0) {
		var i = (Math.random() * arr.length) | 0;
		ret.push(arr.splice(i, 1)[0]);
	}
	return(ret);
}

function arrayGrpShuffle(arr, toShuffle, toShuffleDefault) {
	var ret = [];
	var groups = {};
	var grpHash = {};
	
	for(var i = 0 ; i < arr.length ; i++) {
		var cur = arr[i];
		var grp = 'nogrp-' + i;
		
		if(cur.grp) {
			grp = 'grp-' + cur.grp;
			grpHash[grp] = cur.grp;
		}
		
		if(groups.hasOwnProperty(grp))
			groups[grp].push(cur);
		else
			groups[grp] = [cur];
	}
	
	var keys = arrayShuffle(Object.keys(groups));
	
	while(keys.length > 0) {
		var key = keys.pop();
		var grp = groups[key];
		if(grpHash.hasOwnProperty(key)) {
			var truegrp = grpHash[key];
			if(toShuffle.hasOwnProperty(truegrp)) {
				if(toShuffle[truegrp])
					grp = arrayShuffle(grp);
			}
			else if(toShuffleDefault) {
				grp = arrayShuffle(grp);
			}
		}
		ret = ret.concat(grp);
	}
	
	return(ret);
}

function setCookie(key, val, days) {
	if(!days)
		days = 30;
	var d = new Date();
	d.setTime(d.getTime() + (days*24*60*60*1000));
	var expires = "expires="+ d.toUTCString();
	document.cookie = key + "=" + val + ";" + expires + ";path=/";
}

function getCookie(getKey) {
	var ckarr = document.cookie.split(/\s;\s/);
	
	for(var i = 0 ; i < ckarr.length ; i++) {
		var eqid = ckarr[i].split('=');
		var key = decodeURIComponent(ckarr[i].substring(0, eqid));
		var vak = decodeURIComponent(ckarr[i].substring(eqid+1));
		if(key == getKey)
			return(val);
	}
	
	return(null);
}
