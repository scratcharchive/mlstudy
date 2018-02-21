function mlprompt(title,message,val,callback) {
	bootbox.prompt({
		title:title,
		message:message,
		value:val,
		callback:callback
	});
}

function mlinfo(title,message,callback) {
	bootbox.alert({
		title:title,
		message:message,
		callback:callback
	});
}

function mlconfirm(title,message,callback) {
	bootbox.confirm({
		title: title,
	    message: message,
	    buttons: {
	        confirm: {
	            label: 'Yes',
	            className: 'btn-success'
	        },
	        cancel: {
	            label: 'No',
	            className: 'btn-danger'
	        }
	    },
	    callback: function (result) {
	        callback(result);
	    }
	});
}