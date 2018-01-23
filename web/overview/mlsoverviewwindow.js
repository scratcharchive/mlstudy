function MLSOverviewWindow(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('MLSOverviewWindow');

	this.setDocStorClient=function(DSC) {m_right_window.setDocStorClient(DSC);};
	this.refresh=function() {refresh_right_window();};
	this.setLoginInfo=function(info) {m_right_window.setLoginInfo(info);};

	var m_left_window=new MLSOverviewLeftWindow();
	var m_right_window=new MLSOverviewRightWindow();
	m_left_window.setParent(O);
	m_right_window.setParent(O);

	JSQ.connect(m_right_window,'open_study',O,'open_study');

	JSQ.connect(m_left_window,'selection_changed',O,refresh_right_window);

	JSQ.connect(O,'sizeChanged',O,update_layout);
	function update_layout() {
		var W=O.width();
		var H=O.height();

		var xmarg=5;
		var xspace=20;
		var ymarg=15;

		var W1=200;
		var W2=W-xmarg*2-xspace;

		m_left_window.setGeometry(xmarg,0,W1,H);
		m_right_window.setGeometry(xmarg+W1+xspace,ymarg,W2,H-ymarg*2);
	}

	function refresh_right_window() {
		var sel=m_left_window.currentSelection();
		m_right_window.loadStudies(sel);
	}

	update_layout();
}

function MLSOverviewRightWindow(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('MLSOverviewRightWindow');

	this.setDocStorClient=function(DSC) {m_docstor_client=DSC;};
	this.clear=function() {clear();};
	this.loadStudies=function(mode) {loadStudies(mode);};
	this.setLoginInfo=function(info) {m_login_info=JSQ.clone(info);};

	var m_docstor_client=null;
	var m_studies=[];
	var m_table=new MLTableWidget();
	var m_login_info={};
	m_table.setParent(O);

	O.div().append('<h3><span id=heading style="padding-left:20px"></span></h3>');

	JSQ.connect(O,'sizeChanged',O,update_layout);
	function update_layout() {
		var W=O.width();
		var H=O.height();
		var H1=60;
		xmarg=20;
		m_table.setGeometry(xmarg,H1,W-xmarg*2,H-H1);
	}

	function clear() {
		m_studies=[];
		set_heading('');
		refresh();
	}

	function set_heading(heading) {
		O.div().find('#heading').html(heading);
	}

	function loadStudies(mode) {
		if (mode=='public_studies')
			set_heading('Loading public studies...');
		else if (mode=='my_studies')
			set_heading('Loading studies...');
		else if (mode=='shared_with_me')
			set_heading('Loading studies...');
		else if (mode=='on_this_browser')
			set_heading('Loading studies from browser...');
		m_studies=[];
		refresh();

		var client=m_docstor_client;

		var obj={};
		if (mode=='public_studies') {
			obj={
				shared_with:'[public]',
				filter:'*.mls label:public'
			};
		}
		else if (mode=='my_studies') {
			console.log(m_login_info);
			obj={
				owned_by:m_login_info.user_id,
				filter:'*.mls'
			};
		}
		else if (mode=='shared_with_me') {
			console.log(m_login_info);
			obj={
				shared_with:m_login_info.user_id,
				filter:'*.mls'
			};	
		}
		else if (mode=='on_this_browser') {
			client=new DocStorClient();
			client.setDocStorUrl('browser');
		}
		else {
			alert('Unexpected mode: '+mode);
			return;
		}
		client.findDocuments(obj,function(err,docs) {
			if (err) {
				alert('Error loading documents from cloud: '+err);
				return;
			}
			var docs0=[];
			for (var i in docs) {
				var doc0=docs[i];
				var study0={
					owner:(doc0.permissions||{}).owner||'',
					title:(doc0.attributes||{}).title||''
				};
				m_studies.push(study0);
			}
			if (mode=='public_studies')
				set_heading('Public studies');
			else if (mode=='my_studies')
				set_heading('My studies');
			else if (mode=='shared_with_me')
				set_heading('Shared with me');
			else if (mode=='on_this_browser')
				set_heading('On this browser');
			refresh();
		});
	}

	function refresh() {
		m_table.clearRows();

		m_table.setColumnCount(2);
		m_table.headerRow().cell(0).html('Study');
		m_table.headerRow().cell(1).html('Owner');
		for (var i=0; i<m_studies.length; i++) {
			var study0=m_studies[i];
			var row=create_study_row(study0)
			m_table.addRow(row);
		}
	}

	function create_study_row(study0) {
		var row=m_table.createRow();
		var elmt=$('<a href=#>'+(study0.title||'[untitled]')+'</a>');
		elmt.click(function() {
			open_study(study0);
		});
		row.cell(0).append(elmt);
		row.cell(1).html(study0.owner);
		return row;
	}

	function open_study(study0) {
		O.emit('open_study',{study:study0});
	}

	update_layout();
	refresh();
}

function MLSOverviewLeftWindow(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('MLSOverviewLeftWindow');

	this.currentSelection=function() {return m_current_selection;};

	var m_current_selection='public_studies';

	var ul=$('<ul></ul>');
	ul.append('<li id=public_studies>Public studies</li>');
	ul.append('<li id=my_studies>My studies</li>');
	ul.append('<li id=shared_with_me>Shared with me</li>');
	ul.append('<li id=on_this_browser>On this browser</li>');
	O.div().append(ul);

	ul.find('#public_studies').click(function() {set_current_selection('public_studies')});
	ul.find('#my_studies').click(function() {set_current_selection('my_studies')});
	ul.find('#shared_with_me').click(function() {set_current_selection('shared_with_me')});
	ul.find('#on_this_browser').click(function() {set_current_selection('on_this_browser')});

	JSQ.connect(O,'sizeChanged',O,update_layout);
	function update_layout() {
		var W=O.width();
		var H=O.height();

		var list=ul.find('li');
		for (var i=0; i<list.length; i++) {
			var elmt=$(list[i]);
			if (elmt.attr('id')==m_current_selection) {
				elmt.addClass('MLSOverviewLeftWindow-selected');
			}
			else {
				elmt.removeClass('MLSOverviewLeftWindow-selected');	
			}
		}
	}

	function set_current_selection(selection) {
		if (selection==m_current_selection) return;
		m_current_selection=selection;
		update_layout();
		O.emit('selection_changed');
	}

	update_layout();
}