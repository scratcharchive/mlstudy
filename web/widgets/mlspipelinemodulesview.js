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
function MLSPipelineModulesView(O,options) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('MLSPipelineModulesView');

	if (!options) options={};

	this.setProcessorManager=function(PM) {m_pipeline_module_widget.setProcessorManager(PM);};
	this.setMLSManager=function(M) {setMLSManager(M);};
	this.refresh=function() {refresh();};

	var m_manager=null;

	var m_list_widget=new MLSPipelineModuleListWidget();
	var m_pipeline_module_widget=new MLSPipelineModuleWidget();
	m_list_widget.setParent(O);
	m_pipeline_module_widget.setParent(O);

	m_list_widget.onCurrentPipelineModuleChanged(refresh_pipeline_module);

	JSQ.connect(O,'sizeChanged',O,update_layout);
	function update_layout() {
		var W=O.width();
		var H=O.height();

		var W1=Math.max(200,Math.floor(W/10));
		var W2=W-W1;

		hmarg=5;
		m_list_widget.setGeometry(hmarg,0,W1-hmarg*2,H);
		m_pipeline_module_widget.setGeometry(W1+hmarg,0,W2-hmarg*2,H);
	}

	function refresh() {
		m_list_widget.refresh();
		refresh_pipeline_module();
	}
	function refresh_pipeline_module() {
		var module_name=m_list_widget.currentPipelineModuleName();
		if (!module_name) {
			m_pipeline_module_widget.setPipelineModule(new MLSPipelineModule());
			return;
		}
		var P=m_manager.study().pipelineModule(module_name);
		if (!P) P=new MLSPipelineModule();
		m_pipeline_module_widget.setPipelineModule(P);

		P.onChanged(function() {
			if (module_name) {
				m_manager.study().setPipelineModule(module_name,P);
			}
		});

		/*
		var pname=m_list_widget.currentPipelineModuleName();
		if (!pname) {
			m_pipeline_module_widget.setPipeline(new MLPipeline());
			return;
		}
		var P0=new MLPipeline();
		var P=m_manager.study().pipelineModule(pname);
		if (P) {
			P0.setObject(P.object());
		}
		m_pipeline_module_widget.setPipeline(P0);
		P0.onChanged(function() {
			if (pname) {
				var PP=new MLSPipelineModule();
				PP.setObject(P0.object());
				m_manager.study().setPipelineModule(pname,PP);
			}
		});
		*/
	}

	function setMLSManager(M) {
		m_manager=M;
		m_pipeline_module_widget.setJobManager(M.jobManager());
		m_list_widget.setMLSManager(M);
		refresh();
		//m_pipeline_module_widget.setMLSManager(M);
	}

	update_layout();
}

