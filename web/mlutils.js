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

function download_document_content_from_docstor(DSC,owner,title,callback) {
    var query={owned_by:owner,filter:{"attributes.title":title}};
    if (DSC.user()!=owner)
    	query.and_shared_with=DSC.user();
    DSC.findDocuments(query,function(err,docs) {
        if (err) {
            callback('Problem finding document: '+err);
            return;
        }
        if (docs.length==0) {
            callback('Document not found.');
            return; 
        }
        if (docs.length>1) {
            callback('Error: more than one document with this title and owner found.');
            return; 
        }
        DSC.getDocument(docs[0]._id,{include_content:true},function(err,doc0) {
            if (err) {
                callback('Problem getting document content: '+err);
                return;
            }
            callback(null,doc0.content,docs[0]._id);
        });
    });
}

function set_document_content_to_docstor(DSC,owner,title,content,callback) {
	var query={owned_by:owner,filter:{"attributes.title":title}};
    if (DSC.user()!=owner)
    	query.and_shared_with=DSC.user();
    DSC.findDocuments(query,function(err,docs) {
        if (err) {
            callback('Problem finding document: '+err);
            return;
        }
        if (docs.length==0) {
            DSC.createDocument({owner:owner,attributes:{title:title},content:content},function(err) {
            	callback(err);
            });
            return; 
        }
        if (docs.length>1) {
            callback('Error: more than one document with this title and owner found.');
            return; 
        }
        set_document_content_to_docstor_by_doc_id(DSC,docs[0]._id,content,callback);
    });
}

function set_document_content_to_docstor_by_doc_id(DSC,doc_id,content,callback) {
	DSC.setDocument(doc_id,{content:content},function(err) {
		callback(err);
	});
}