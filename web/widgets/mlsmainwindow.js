function MLSMainWindow(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('MLSMainWindow');

	this.setDocStorClient=function(DSC) {m_docstor_client=DSC;};
	this.loadFromDocStor=function(owner,title,callback) {loadFromDocStor(owner,title,callback);};
	this.loadFromFileContent=function(path,content,callback) {loadFromFileContent(path,content,callback);};
	this.loadFromBrowserStorage=function(title,callback) {loadFromBrowserStorage(title,callback);};
	this.setLoginInfo=function(info) {m_mls_manager.setLoginInfo(info);};

	var m_mls_manager=new MLSManager();
	var m_docstor_client=null;
	var m_file_source=''; //e.g., docstor
	var m_file_path=''; //when m_file_source=='file_content'
	var m_file_info={};
	var m_mls_widget=new MLSWidget();
	m_mls_widget.setParent(O);
	m_mls_widget.setMLSManager(m_mls_manager);
	var m_top_widget=new MLSTopWidget();
	m_top_widget.setParent(O);
	m_top_widget.setMLSManager(m_mls_manager);

	JSQ.connect(O,'sizeChanged',O,update_layout);
	function update_layout() {
		var W=O.width();
		var H=O.height();

		var top_height=40;

		m_top_widget.setGeometry(0,0,W,top_height);
		m_mls_widget.setGeometry(0,top_height,W,H-top_height);
	}

	function loadFromDocStor(owner,title,callback) {
		download_document_content_from_docstor(m_docstor_client,owner,title,function(err,content,doc_id) {
			if (err) {
				callback(err);
				return;
			}
			var obj=try_parse_json(content);
	        if (!obj) {
	        	console.log (content);
	            callback('Unable to parse mls file content');
	            return;
	        }
	        m_mls_manager.setMLSObject(obj);
	        m_mls_widget.refresh();
	        m_file_source='docstor';
	        m_file_info={owner:owner,title:title,doc_id:doc_id};
	        m_top_widget.setOriginalStudyObject(m_mls_manager.study().object());
	        callback(null);
		});
	}

	function loadFromFileContent(path,content,callback) {
		var obj=try_parse_json(window.mls_file_content);
        if (!obj) {
        	console.log (window.mls_file_content);
            callback('Unable to parse mls file content');
            return;
        }
        m_mls_manager.setMLSObject(obj);
        m_mls_widget.refresh();
        m_file_source='file_content';
        m_file_path=path;
        m_top_widget.setOriginalStudyObject(m_mls_manager.study().object());
        callback(null);
	}

	function loadFromBrowserStorage(title,callback) {
		var LS=new LocalStorage();
		var obj=LS.readObject('mlstudy--'+title);
		if (!obj) {
			obj={};
		}
		m_mls_manager.setMLSObject(obj);
		m_mls_widget.refresh();
        m_file_source='browser_storage';
        m_file_info={title:title};
        m_top_widget.setOriginalStudyObject(m_mls_manager.study().object());
        callback(null);
	}

	JSQ.connect(m_top_widget,'save_changes',O,save_changes);
	function save_changes() {
		var obj=m_mls_manager.study().object();
		var content=JSON.stringify(obj,null,4);
		if (m_file_source=='docstor') {
			set_document_content_to_docstor(m_docstor_client,m_file_info.doc_id,content,function(err) {
				if (err) {
					alert('Unable to save document: '+err);
					return;
				}
				m_top_widget.setOriginalStudyObject(obj);
			});
		}
		else if (m_file_source=='browser_storage') {
			var LS=new LocalStorage();
			LS.writeObject('mlstudy--'+m_file_info.title,obj);
			m_top_widget.setOriginalStudyObject(obj);
		}
		else if (m_file_source=='file_content') {
			download(content,'',m_file_path);
			m_top_widget.setOriginalStudyObject(obj);
		}
	}

	JSQ.connect(m_top_widget,'download_study',O,download_study);
	function download_study() {
		var obj=m_mls_manager.study().object();
		var content=JSON.stringify(obj,null,4);
		if (m_file_source=='docstor') {
			fname=m_file_info.title;
		}
		else if (m_file_source=='browser_storage') {
			fname=m_file_info.title;
		}
		else {
			fname=m_file_path;
		}
		download(content,fname);
	}

	update_layout();
}

function set_document_content_to_docstor(DSC,doc_id,content,callback) {
	DSC.setDocument(doc_id,{content:content},function(err) {
		callback(err);
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

function MLSTopWidget(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('MLSTopWidget');

	this.setOriginalStudyObject=function(obj) {m_original_study_object=JSQ.clone(obj); refresh();};
	this.setMLSManager=function(M) {setMLSManager(M);};
	this.refresh=function() {refresh();};

	var m_original_study_object={};
	var m_mls_manager=null;
	var m_content=$('<div><button id=save_changes>Save changes</button></div>');
	if (window.mlpipeline_mode!='local') {
		var link0=$('<button>Download study</button>');
		m_content.append(link0);
		link0.click(function() {console.log('aaa'); O.emit('download_study');});
	}
	O.div().append(m_content);

	m_content.find('#save_changes').click(function() {
		O.emit('save_changes');
	});

	JSQ.connect(O,'sizeChanged',O,update_layout);
	function update_layout() {
		var W=O.width();
		var H=O.height();
		
		m_content.css({position:'absolute',left:0,top:0,width:W,height:H});
	}

	function setMLSManager(M) {
		m_mls_manager=M; 
		JSQ.connect(M.study(),'changed',O,refresh);
		refresh();
	}

	function refresh() {
		//m_content.find('#title').html(m_dataset_id);
		if (is_modified()) {
			m_content.find('#save_changes').removeAttr('disabled');
		}
		else {
			m_content.find('#save_changes').attr('disabled','disabled');	
		}
	}

	function is_modified() {
		var obj1=m_original_study_object;
		var obj2=m_mls_manager.study().object();
		return (JSON.stringify(obj1)!=JSON.stringify(obj2));
	}

	update_layout();
}