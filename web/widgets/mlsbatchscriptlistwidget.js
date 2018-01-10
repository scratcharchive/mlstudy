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
function MLSBatchScriptListWidget(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('MLSBatchScriptListWidget');

	this.setMLSManager=function(M) {m_manager=M;};
	this.refresh=function() {refresh();};
	this.onCurrentBatchScriptChanged=function(handler) {JSQ.connect(m_table,'current_row_changed',O,handler);};
	this.currentBatchScriptName=function() {return currentBatchScriptName();};

	var m_manager=null;
	var m_table=new MLTableWidget();
	m_table.setParent(O);
	m_table.setSelectionMode('single');
	m_table.setRowsMoveable(false);

	var m_button_bar=$('<div><button style="font-size:20px" id=add_batch_script>Add batch script</button></div>');
	O.div().append(m_button_bar);

	m_button_bar.find('#add_batch_script').click(add_batch_script);

	JSQ.connect(O,'sizeChanged',O,update_layout);
	function update_layout() {
		var W=O.width();
		var H=O.height();
		var button_height=40;

		m_button_bar.css({position:'absolute',left:0,top:H-button_height,width:W,height:button_height})

		m_table.setGeometry(0,0,W,H-button_height);
	}

	function currentBatchScriptName() {
		var row=m_table.currentRow();
		if (!row) return null;
		return row.batch_script_name;
	}

	function refresh() {
		var current_batch_script_name=currentBatchScriptName();

		m_table.clearRows();
		m_table.setColumnCount(2);
		m_table.headerRow().cell(1).html('Module');
		var names=m_manager.study().batchScriptNames();
		for (var i=0; i<names.length; i++) {
			var row=m_table.createRow();
			row.batch_script_name=names[i];
			setup_row(row);
			m_table.addRow(row);
		}

		if (current_batch_script_name) {
			set_current_row_by_batch_script_name(current_batch_script_name);
		}

		if (!m_table.currentRow()) {
			if (m_table.rowCount()>0) {
				m_table.setCurrentRow(m_table.row(0));	
			}
		}
	}

	function setup_row(row) {
		var close_link=$('<span class=remove_button title="Delete module"></span>');
		close_link.click(function() {remove_batch_script(row.batch_script_name);});
		row.cell(0).append(close_link);

		var edit_name_link=$('<span class=edit_button title="Edit module name"></span>');
		edit_name_link.click(function(evt) {
			edit_batch_script_name(row.batch_script_name);
			return false; //so that we don't get a click on the row
		});
		row.cell(1).append(edit_name_link);
		row.cell(1).append($('<span>'+row.batch_script_name+'</span>'));
	}

	function add_batch_script() {
		var batch_script_name=prompt('Batch script name:');
		if (!batch_script_name) return;
		m_manager.study().setBatchScript(batch_script_name,new MLSBatchScript());
		refresh();
		set_current_row_by_batch_script_name(batch_script_name);
	}

	function set_current_row_by_batch_script_name(sname) {
		for (var i=0; i<m_table.rowCount(); i++) {
			var row=m_table.row(i);
			if (row.batch_script_name==sname) {
				m_table.setCurrentRow(row);
				return;
			}
		}
	}

	function edit_batch_script_name(sname) {
		var name=sname;
		var name2=prompt('New name for batch script:',name);
		if (!name2) return;
		if (name2==name) return;
		m_manager.study().changeBatchScriptName(name,name2);
		refresh();
	}

	function remove_batch_script(sname) {
		if (confirm('Remove batch script ('+sname+')?')) {
			m_manager.study().removeBatchScript(sname);
			m_table.setCurrentRow(0);
			refresh();	
		}
	}

	update_layout();
}

