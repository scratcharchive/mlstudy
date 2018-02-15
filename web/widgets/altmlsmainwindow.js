function AltMLSMainWindow(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('AltMLSMainWindow');

	this.setMLSManager=function(manager) {setMLSManager(manager);};
	this.mlsManager=function() {return m_mls_manager;};
	this.loadFromDocStor=function(owner,title,callback) {loadFromDocStor(owner,title,callback);};
	this.loadFromFileContent=function(path,content,callback) {loadFromFileContent(path,content,callback);};
	
	var m_mls_manager=null;
	var m_processing_server_widget=new ProcessingServerWidget();
	var m_advanced_configuration_widget=new AdvancedConfigurationWidget();
	var m_datasets_view=new AltMLSDatasetsView();
	var m_file_source=''; //e.g., docstor
	var m_file_path=''; //when m_file_source=='file_content'
	var m_file_info={};
	var m_original_study_object={};

	O.div().append($('#template-AltMLSMainWindow').children().clone());
	O.div().find('#processing_server').append(m_processing_server_widget.div());
	O.div().find('#advanced_configuration').append(m_advanced_configuration_widget.div());
	O.div().find('#datasets').append(m_datasets_view.div());

	////////////////////////////////////////////////////////////////////////////////////
	O.div().find('.bd-toc-item').addClass('active');
	O.div().find('.bd-toc-item ul > li > a').click(function() {
		//O.div().find('.bd-toc-item').removeClass('active');
		O.div().find('.bd-toc-item ul > li > a').parent().removeClass('active bd-sidenav-active');
		$(this).parent().addClass('active bd-sidenav-active');
		$(this).parent().parent().parent().addClass('active');
		update_visible_content();
	});
	O.div().find('.bd-toc-link').click(function() {
		//O.div().find('.bd-toc-link').parent().removeClass('active');
		$(this).parent().addClass('active');
		O.div().find('.bd-toc-item ul > li > a').parent().removeClass('active bd-sidenav-active');
		$(this).parent().find('ul > li').first().addClass('active bd-sidenav-active');
		update_visible_content();
	});
	function current_content_id() {
		var active_item=O.div().find('.bd-toc-item ul > li.active').first();
		var content_id=active_item.attr('data-content-id');
		return content_id;
	}
	function update_visible_content() {
		var content_id=current_content_id();
		O.div().find('#content .tab-pane').removeClass('show active');
		O.div().find('#content .tab-pane#'+content_id).addClass('show active');
		m_datasets_view.refresh(); //todo: only when necessary
	}


	function loadFromDocStor(owner,title,callback) {
		download_document_content_from_docstor(m_mls_manager.docStorClient(),owner,title,function(err,content,doc_id) {
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
	        set_mls_object(obj);
	        refresh_views();
	        set_file_info('docstor',{owner:owner,title:title})
	        set_original_study_object(get_mls_object());
	        callback(null);
		});
	}
	function loadFromFileContent(path,content,callback) {
		callback(); //todo
	}

	function set_original_study_object(obj) {
		m_original_study_object=JSQ.clone(obj);
		//todo:
		//update_menus();
	}

	function get_mls_object() {
		var obj=m_mls_manager.study().object();

		//todo:	
		//obj.results_by_script=m_batch_scripts_view.getResultsByScript();

		return obj;
	}

	function set_mls_object(obj) {
		m_mls_manager.setMLSObject(obj);

		// todo: 
		// m_batch_scripts_view.setResultsByScript(obj.results_by_script||{});
	}

	function refresh_views() {
		m_datasets_view.refresh();
	}

	function try_parse_json(str) {
      try {
        return JSON.parse(str);
      }
      catch(err) {
        return null;
      }
    }

	function set_file_info(source,info) {
		m_file_source=source;
		m_file_info=JSQ.clone(info);
		update_url();
	}

	function reset_url() {
		var query=parse_url_params0();
		var querystr='';
		if ('passcode' in query) {
			querystr+='&passcode='+query.passcode;
		}
		if ('login' in query) {
			querystr+='&login='+query.login;
		}
		try {
			history.pushState(null, null, '?'+querystr);
		}
		catch(err) {
			console.log ('Unable to update url');
		}
	}

	function update_url() {
		var query=parse_url_params0();
		var querystr='';
		if (m_file_source=='docstor') {
			querystr='source=docstor&owner='+m_file_info.owner+'&title='+m_file_info.title;
		}
		else if (m_file_source=='browser_storage') {
			querystr='source=browser_storage&title='+m_file_info.title;	
		}
		if ('passcode' in query) {
			querystr+='&passcode='+query.passcode;
		}
		if ('login' in query) {
			querystr+='&login='+query.login;
		}
		if ('alt' in query) {
			querystr+='&alt='+query.alt;
		}
		try {
			history.pushState(null, null, '?'+querystr);
		}
		catch(err) {
			console.log ('Unable to update url');
		}
	}

	function parse_url_params0() {
		var match,
		pl     = /\+/g,  // Regex for replacing addition symbol with a space
		search = /([^&=]+)=?([^&]*)/g,
		decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
		query  = window.location.search.substring(1);
		url_params = {};
		while (match = search.exec(query))
			url_params[decode(match[1])] = decode(match[2]);
		return url_params;
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

	function setMLSManager(manager) {
		m_mls_manager=manager; 
		m_datasets_view.setMLSManager(manager);
		m_processing_server_widget.setMLSManager(manager);
		m_advanced_configuration_widget.setMLSManager(manager);
		refresh_views();
	}

}

function AltMLSDatasetsView(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('AltMLSDatasetsView');

	this.setMLSManager=function(manager) {setMLSManager(manager);};
	this.refresh=function() {refresh();};

	var m_dataset_list=new MLSDatasetListWidget();
	var m_dataset_widget=new AltMLSDatasetWidget();

	O.div().append($('#template-AltMLSDatasetsView').children().clone());
	O.div().find('#dataset_list').append(m_dataset_list.div());
	O.div().find('#dataset_widget').append(m_dataset_widget.div());

	m_dataset_list.onCurrentDatasetChanged(update_current_dataset);

	function refresh() {
		m_dataset_list.refresh();
		update_current_dataset();
		/*
		m_dataset_list.setColumnCount(2);
		m_dataset_list.headerCell(0).html('test');
		m_dataset_list.header()Cell(1).html('test2');
		*/
	}

	function update_current_dataset() {
		m_dataset_widget.setDatasetId(m_dataset_list.currentDatasetId());
		m_dataset_widget.refresh();
	}

	function setMLSManager(manager) {
		m_mls_manager=manager;
		m_dataset_list.setMLSManager(manager);
		m_dataset_list.refresh();
		m_dataset_widget.setMLSManager(manager);
		m_dataset_widget.refresh();
		refresh();
	}
}
