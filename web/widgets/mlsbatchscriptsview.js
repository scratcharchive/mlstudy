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
function MLSBatchScriptsView(O,options) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('MLSBatchScriptsView');

	if (!options) options={};

	this.setProcessorManager=function(PM) {m_batch_script_widget.setProcessorManager(PM);};
	this.setMLSManager=function(M) {setMLSManager(M);};
	this.refresh=function() {refresh();};

	var m_manager=null;

	var m_list_widget=new MLSBatchScriptListWidget();
	var m_batch_script_widget=new MLSBatchScriptWidget();
	m_list_widget.setParent(O);
	m_batch_script_widget.setParent(O);

	m_list_widget.onCurrentBatchScriptChanged(refresh_batch_script);

	JSQ.connect(O,'sizeChanged',O,update_layout);
	function update_layout() {
		var W=O.width();
		var H=O.height();

		var W1=Math.max(200,Math.floor(W/10));
		var W2=W-W1;

		hmarg=5;
		m_list_widget.setGeometry(hmarg,0,W1-hmarg*2,H);
		m_batch_script_widget.setGeometry(W1+hmarg,0,W2-hmarg*2,H);
	}

	function refresh() {
		m_list_widget.refresh();
		refresh_batch_script();
	}
	function refresh_batch_script() {
		var script_name=m_list_widget.currentBatchScriptName();
		if (!script_name) {
			m_batch_script_widget.setBatchScript(new MLSBatchScript());
			return;
		}
		var S=m_manager.study().batchScript(script_name);
		if (!S) S=new MLSBatchScript();
		m_batch_script_widget.setBatchScript(S);

		S.onChanged(function() {
			if (script_name) {
				m_manager.study().setBatchScript(script_name,S);
			}
		});
	}

	function setMLSManager(M) {
		m_manager=M;
		m_batch_script_widget.setJobManager(M.jobManager());
		m_list_widget.setMLSManager(M);
		refresh();
	}

	update_layout();
}

