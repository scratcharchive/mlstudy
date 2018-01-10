/*
 * Copyright 2016-2017 Flatiron Institute, Simons Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function MLSPipelineModuleListWidget(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('MLSPipelineModuleListWidget');

	this.setMLSManager=function(M) {m_manager=M;};
	this.refresh=function() {refresh();};
	this.onCurrentPipelineModuleChanged=function(handler) {JSQ.connect(m_table,'current_row_changed',O,handler);};
	this.currentPipelineModuleName=function() {return currentPipelineModuleName();};

	var m_manager=null;
	var m_table=new MLTableWidget();
	m_table.setParent(O);
	m_table.setSelectionMode('single');
	m_table.setRowsMoveable(false);

	var m_button_bar=$('<div><button style="font-size:20px" id=add_pipeline_module>Add pipeline module</button></div>');
	O.div().append(m_button_bar);

	m_button_bar.find('#add_pipeline_module').click(add_pipeline_module);

	JSQ.connect(O,'sizeChanged',O,update_layout);
	function update_layout() {
		var W=O.width();
		var H=O.height();
		var button_height=40;

		m_button_bar.css({position:'absolute',left:0,top:H-button_height,width:W,height:button_height})

		m_table.setGeometry(0,0,W,H-button_height);
	}

	function currentPipelineModuleName() {
		var row=m_table.currentRow();
		if (!row) return null;
		return row.pipeline_module_name;
	}

	function refresh() {
		var current_pipeline_module_name=currentPipelineModuleName();

		m_table.clearRows();
		m_table.setColumnCount(2);
		m_table.headerRow().cell(1).html('Module');
		var names=m_manager.study().pipelineModuleNames();
		for (var i=0; i<names.length; i++) {
			var row=m_table.createRow();
			row.pipeline_module_name=names[i];
			setup_row(row);
			m_table.addRow(row);
		}

		if (current_pipeline_module_name) {
			set_current_row_by_pipeline_module_name(current_pipeline_module_name);
		}

		if (!m_table.currentRow()) {
			if (m_table.rowCount()>0) {
				m_table.setCurrentRow(m_table.row(0));	
			}
		}
	}

	function setup_row(row) {
		var close_link=$('<span class=remove_button title="Delete module"></span>');
		close_link.click(function() {remove_pipeline_module(row.pipeline_module_name);});
		row.cell(0).append(close_link);

		var edit_name_link=$('<span class=edit_button title="Edit module name"></span>');
		edit_name_link.click(function(evt) {
			edit_pipeline_module_name(row.pipeline_module_name);
			return false; //so that we don't get a click on the row
		});
		row.cell(1).append(edit_name_link);
		row.cell(1).append($('<span>'+row.pipeline_module_name+'</span>'));
	}

	function add_pipeline_module() {
		var pipeline_module_name=prompt('Pipeline module name:');
		if (!pipeline_module_name) return;
		m_manager.study().setPipelineModule(pipeline_module_name,new MLSPipelineModule());
		refresh();
		set_current_row_by_pipeline_module_name(pipeline_module_name);
	}

	function set_current_row_by_pipeline_module_name(pname) {
		for (var i=0; i<m_table.rowCount(); i++) {
			var row=m_table.row(i);
			if (row.pipeline_module_name==pname) {
				m_table.setCurrentRow(row);
				return;
			}
		}
	}

	function edit_pipeline_module_name(pname) {
		var name=pname;
		var name2=prompt('New name for pipeline module:',name);
		if (!name2) return;
		if (name2==name) return;
		m_manager.study().changePipelineModuleName(name,name2);
		refresh();
	}

	function remove_pipeline_module(pname) {
		if (confirm('Remove pipeline module ('+pname+')?')) {
			m_manager.study().removePipelineModule(pname);
			m_table.setCurrentRow(0);
			refresh();	
		}
	}

	update_layout();
}

