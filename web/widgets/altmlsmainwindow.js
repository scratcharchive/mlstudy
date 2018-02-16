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
	var m_home_view=new AltMLSHomeView();
	var m_datasets_view=new AltMLSDatasetsView();
	var m_scripts_view=new AltMLSScriptsView();
	var m_output_view=new MLSOutputView();
	var m_file_source=''; //e.g., docstor
	var m_file_path=''; //when m_file_source=='file_content'
	var m_file_info={};
	var m_original_study_object={};

	JSQ.connect(m_scripts_view,'current-batch-job-changed',O,on_batch_job_changed);

	JSQ.connect(m_home_view,'open-datasets',O,function() {open_content('datasets');});
	JSQ.connect(m_home_view,'open-scripts',O,function() {open_content('scripts');});

	O.div().append($('#template-AltMLSMainWindow').children().clone());
	O.div().find('#processing_server').append(m_processing_server_widget.div());
	O.div().find('#advanced_configuration').append(m_advanced_configuration_widget.div());
	O.div().find('#home').append(m_home_view.div());
	O.div().find('#datasets').append(m_datasets_view.div());
	m_scripts_view.div().addClass('h-100');
	O.div().find('#scripts').append(m_scripts_view.div());
	m_output_view.div().addClass('h-100');
	O.div().find('#output').append(m_output_view.div());

	O.div().find('#save_changes').click(save_changes);

	O.div().find('#home_button').click(function() {O.emit('goto_overview');});

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
		m_home_view.refresh(); //todo: only when necessary
		m_datasets_view.refresh(); //todo: only when necessary
		m_scripts_view.refresh(); //todo: only when necessary
	}

	function open_content(content_id) {
		var items=O.div().find('.bd-toc-item ul > li').first();
		items.removeClass('active bd-sidenav-active');
		O.div().find(`.bd-toc-item ul > li[data-content-id='${content_id}']`).addClass('active bd-sidenav-active');
		update_visible_content();
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
	        update_document_info();
	        callback(null);
		});
	}
	function loadFromFileContent(path,content,callback) {
		callback(); //todo
	}

	function set_original_study_object(obj) {
		m_original_study_object=JSQ.clone(obj);
		update_document_info();
		//todo:
		//update_menus();
	}

	function update_document_info() {
		var info=`${m_file_info.title} (${m_file_info.owner})`;
		O.div().find('#document_info').html(info);

		if (JSON.stringify(get_mls_object())!=JSON.stringify(m_original_study_object)) {
			O.div().find('#save_changes').removeAttr('disabled');
		}
		else {
			O.div().find('#save_changes').attr('disabled','disabled');	
		}
	}

	function save_changes() {
		if (m_file_source=='docstor') {
			save_changes_docstor({prompt:false});
		}
		else {
			alert('Unexpected file source: '+m_file_source);
		}
	}

	function save_changes_docstor(opts) {
		if (!opts) opts={};
		if (!('prompt' in opts)) opts.prompt=true;
		var owner=m_file_info.owner||m_mls_manager.user();
		var title=m_file_info.title||'study.mls';
		if (opts.prompt) {
			owner=prompt('Saving to cloud. Owner of document:',owner);
			if (!owner) return;
			title=prompt('Saving to cloud. Title of document:',title);
			if (!title) return;
		}
		var obj=get_mls_object();
		var content=JSON.stringify(obj,null,4);
		set_document_content_to_docstor(m_mls_manager.docStorClient(),owner,title,content,function(err) {
			if (err) {
				alert('Unable to save document: '+err);
				return;
			}
			set_file_info('docstor',{owner:owner,title:title});
			set_original_study_object(obj);
			alert('Changes saved to cloud document: '+m_file_info.title+' ('+owner+')');
		});
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
		m_home_view.refresh();
		m_datasets_view.refresh();
		m_scripts_view.refresh();
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

	function on_batch_job_changed() {
		m_output_view.setBatchJob(m_scripts_view.currentBatchJob());
	}

	function setMLSManager(manager) {
		m_mls_manager=manager; 
		m_home_view.setMLSManager(manager);
		m_datasets_view.setMLSManager(manager);
		m_scripts_view.setMLSManager(manager);
		m_output_view.setMLSManager(manager);
		m_processing_server_widget.setMLSManager(manager);
		m_advanced_configuration_widget.setMLSManager(manager);
		JSQ.connect(manager.study(),'changed',O,update_document_info);
		refresh_views();
		update_document_info();
	}

}

function AltMLSHomeView(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('AltMLSHomeView');

	this.setMLSManager=function(manager) {setMLSManager(manager);};
	this.setFileInfo=function(info) {m_file_info=info;};
	this.refresh=function() {refresh();};

	var m_mls_manager=null;
	var m_file_info={owner:'',title:'',source:''};

	O.div().append($('#template-AltMLSHomeView').children().clone());
	O.div().find('#open_datasets').click(function() {O.emit('open-datasets');});
	O.div().find('#open_scripts').click(function() {O.emit('open-scripts');});

	O.div().find('#edit_description').click(edit_description);

	function refresh() {
		O.div().find('#study_title').html(m_file_info.title);
		O.div().find('#description_content').html(m_mls_manager.study().description());
		O.div().find('#num_datasets').html(m_mls_manager.study().datasetIds().length);
		O.div().find('#num_scripts').html(m_mls_manager.study().batchScriptNames().length);
	}

	function setMLSManager(manager) {
		m_mls_manager=manager;
		JSQ.connect(m_mls_manager.study(),'changed',O,refresh);
		refresh();
	}

	function edit_description() {
		var elmt=$('#template-EditDescriptionDlg').children().first().clone();
		$('body').append(elmt);
		elmt.find('textarea').val(m_mls_manager.study().description());
		elmt.find('#save_button').click(function() {
			var descr=elmt.find('textarea').val();
			m_mls_manager.study().setDescription(descr);
			elmt.modal('hide');
		});
		elmt.modal({show:true,focus:true});
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
	var m_mls_manager=null;

	O.div().append($('#template-AltMLSDatasetsView').children().clone());
	O.div().find('#dataset_list').append(m_dataset_list.div());
	O.div().find('#dataset_widget').append(m_dataset_widget.div());

	O.div().find("#add_dataset").click(add_dataset);

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

	function add_dataset() {
		var dataset_id=prompt('Dataset ID:');
		if (!dataset_id) return;
		if (m_mls_manager.study().dataset(dataset_id)) {
			alert('Error: Dataset with this id already exists.');
			return;
		}
		m_mls_manager.study().setDataset(dataset_id,new MLSDataset());
		refresh();
		m_dataset_list.setCurrentDatasetId(dataset_id);
	}
}

function AltMLSScriptsView(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('AltMLSScriptsView');

	this.setMLSManager=function(manager) {setMLSManager(manager);};
	this.refresh=function() {refresh();};
	this.currentBatchJob=function() {return currentBatchJob();};

	var m_script_list=new MLSBatchScriptListWidget();
	var m_script_widget=new AltMLSScriptWidget();
	var m_mls_manager=null;
	var m_script_job_lookup=new ScriptJobLookup();
	var m_current_script_name='';
	m_script_widget.setScriptJobLookup(m_script_job_lookup);

	JSQ.connect(m_script_widget,'script-job-started',O,'current-batch-job-changed');

	O.div().append($('#template-AltMLSScriptsView').children().clone());
	O.div().find('#script_list').append(m_script_list.div());
	m_script_widget.div().addClass('h-100');
	O.div().find('#script_widget').append(m_script_widget.div());

	O.div().find("#add_script").click(add_script);

	m_script_list.onCurrentBatchScriptChanged(update_current_script);

	function refresh() {
		m_script_list.refresh();
		update_current_script();
	}

	function update_current_script() {
		var batch_script_name=m_script_list.currentBatchScriptName();
		var P=m_mls_manager.study().batchScript(batch_script_name);
		m_script_widget.setScript(P,batch_script_name);
		m_current_script_name=batch_script_name;
		O.emit('current-batch-job-changed');
	}

	function currentBatchJob() {
		if (!m_current_script_name) return null;
		return m_script_job_lookup.job(m_current_script_name);
	}

	function setMLSManager(manager) {
		m_mls_manager=manager;
		m_script_list.setMLSManager(manager);
		m_script_list.refresh();
		m_script_widget.setMLSManager(manager);
		//m_script_widget.refresh();
		refresh();
	}

	function add_script() {
		var script_name=prompt('New script name:');
		if (!script_name) return;
		m_mls_manager.study().setBatchScript(script_name,new MLSBatchScript());
		refresh();
		m_script_list.setCurrentBatchScriptName(script_name);
	}
}

function MLSOutputView(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('MLSOutputView');

	this.setMLSManager=function(manager) {setMLSManager(manager);};
	this.setBatchJob=function(job) {setBatchJob(job);};

	var m_mls_manager=null;
	var m_results_widget=new AltMLSBatchScriptResultsWidget();
	var m_jobs_widget=new MLSBatchScriptJobsWidget();
	var m_log_widget=new MLPLogWidget(null,true);

	m_log_widget.div().css({height:'100%'});

	O.div().append($('#template-MLSOutputView').children().clone());
	
	O.div().find('#results_widget').append(m_results_widget.div());
	O.div().find('#jobs_widget').append(m_jobs_widget.div());
	O.div().find('#log_widget').append(m_log_widget.div());
	
	m_results_widget.div().css({"font-size":"12px",height:"100%"});
	m_jobs_widget.div().css({"font-size":"12px",height:"100%"});

	function setMLSManager(manager) {
		m_mls_manager=manager;
		m_results_widget.setMLSManager(manager);
		m_jobs_widget.setMLSManager(manager);
	}

	function setBatchJob(job) {
		m_results_widget.setBatchJob(job);
		m_jobs_widget.setBatchJob(job);
	}
}

function ScriptJobLookup() {
	this.setJob=function(script_name,job) {setJob(script_name,job);};
	this.job=function(script_name) {return job(script_name);};

	var m_script_jobs={};

	function setJob(script_name,job) {
		m_script_jobs[script_name]=job;
	}

	function job(script_name) {
		return m_script_jobs[script_name]||null;
	}
}
