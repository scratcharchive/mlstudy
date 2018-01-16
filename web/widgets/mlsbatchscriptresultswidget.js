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

function MLSBatchScriptResultsWidget(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('MLSBatchScriptResultsWidget');

	this.setBatchJob=function(BJ) {setBatchJob(BJ);};
	this.setMLSManager=function(MM) {m_mls_manager=MM;};
	this.setKuleleClient=function(KC) {m_kulele_client=KC;};
	
	var m_table=new MLTableWidget();
	var m_batch_job=null;
	var m_kulele_client=null;
	var m_mls_manager=null;

	m_table.setParent(O);

	JSQ.connect(O,'sizeChanged',O,update_layout);
  	function update_layout() {
		var W=O.width();
		var H=O.height();
		
		m_table.setGeometry(0,0,W,H);
	}

	function setBatchJob(BJ) {
		if (BJ==m_batch_job) return;
		m_batch_job=BJ;
		if (BJ) {
			JSQ.connect(BJ,'results_changed',O,function() {
				if (BJ==m_batch_job) { //still the same
					schedule_refresh();
				}
			});
		}
		do_refresh();
	}

	var s_refresh_scheduled=false;
	function schedule_refresh() {
		if (s_refresh_scheduled) return;
		s_refresh_scheduled=true;
		setTimeout(function() {
			s_refresh_scheduled=false;
			do_refresh();
		},100);
	}

	function do_refresh() {
		m_table.setColumnCount(3);
		m_table.headerRow().cell(0).html('Result');
		m_table.headerRow().cell(1).html('Status');
		m_table.headerRow().cell(2).html('Info');
		m_table.clearRows();
		if (!m_batch_job) return;
		var names=m_batch_job.resultNames();
		for (var i in names) {
			var rname=names[i];
			var row=create_result_row(rname,m_batch_job.result(rname));
			m_table.addRow(row);
		}
		check_on_kbucket();
	}

	function create_result_row(rname,result) {
		var row=m_table.createRow();
		row.rname=rname;
		
		var elmt0=$('<span>'+rname+'</span>');
		var elmt1=$('<span>'+result.status+'</span>');
		var elmt2=$('<span></span>');
		if (result.status=='error') {
			elmt2=$('<span>'+result.error+'</span>');
		}
		else if (result.status=='finished') {
			if (typeof(result.value)=='string') {
				elmt0=$('<a href=# title="'+result.value+'">'+rname+'</a>');
			}
			else if (result.value.prv) {
				row.prv=result.value.prv;
			}
			else {
				elmt0=$('<a href=#>'+rname+'</a>');
			}
		}
		row.cell(0).append(elmt0);
		row.cell(1).append(elmt1);
		row.cell(2).append(elmt2);
		return row;
	}

	function check_on_kbucket() {
		//todo: in kbucketclient, don't serve all the requests at once
		for (var i=0; i<m_table.rowCount(); i++) {
			var row=m_table.row(i);
			if (row.prv) {
				check_on_kbucket_2(row);
			}
		}
	}

	function check_on_kbucket_2(row) {
		row.cell(2).html('checking');
		var rname=row.rname;
		check_on_kbucket_3(row.prv,function(err,tmp) {
			if (err) {
				console.error('Error checking kbucket: '+err);
				row.cell(2).html('<span class=unknown>Error checking kbucket</span>');
				return;
			}
			if (tmp.found) {
				var elmt0_download=$('<a href=#>'+rname+'</a>');
				elmt0_download.click(download_result_file);
				row.cell(0).empty();
				row.cell(0).append(elmt0_download);
				row.cell(2).html('<span class=yes>On kbucket</span>');
			}
			else {
				row.cell(0).empty();
				row.cell(0).append('<span>'+rname+'</span>');
				var elmt=$('<span><a href=#><span class=no>Upload to kbucket</span></a></span>');
				if (row.upload_error) {
					elmt.append(' Error uploading: '+row.upload_error);
				}
				elmt.find('a').click(function() {
					row.cell(2).html('<span class=no>Uploading...</span>');
					row.upload_error='';
					upload_to_kbucket(row.prv,function(err) {
						if (err) console.error(err);
						row.upload_error=err;
						check_on_kbucket_2(row);
					});
				})
				row.cell(2).children().detach();
				row.cell(2).empty();
				row.cell(2).append(elmt);
			}
		});
		function download_result_file() {
			var prv=row.prv;
			prv.original_path=rname;
			O.emit('download_original_file_from_prv',{prv:prv});
		}
	}

	function check_on_kbucket_3(prv,callback) {
		var KC=new KBucketClient();
		KC.setKBucketUrl(m_mls_manager.kBucketUrl());
		KC.stat(prv.original_checksum,prv.original_size,function(err,res) {
			callback(err,res);
		});
	}

	function upload_to_kbucket(prv,callback) {
		if (!m_kulele_client) {
			callback('Kulele client has not been set');
			return;
		}
		var process_id='';
		m_kulele_client.queueJob(
			'kbucket.upload',
			{file:prv},
			{},
			{force_run:JSQ.makeRandomId(6)},
			{},
			function(resp) {
			    process_id=resp.process_id||'';
      			handle_process_probe_response(resp);
			}
		);
		function handle_process_probe_response(resp) {
			if (!resp.success) {
		      callback('Error uploading: '+resp.error);
			  return;
		    }
		    if (process_id!=resp.process_id) {
		      callback('Unexpected: process_id does not match response: '+process_id+'<>'+resp.process_id);
		      return;
		    }
		    if (resp.latest_console_output) {
		      var lines=resp.latest_console_output.split('\n');
		      for (var i in lines) {
		        if (lines[i].trim()) {
		          var str0='  |kbucket.upload| ';
		          while (str0.length<35) str0+=' ';
		          mlpLog({text:str0+lines[i]});
		        }
		      }
		    }
		    if (resp.complete) {
		      var err0='';
		      if (!resp.result) {
		        callback('Unexpected: result not found in process response.');
		        return;
		      }
		      var result=resp.result;
		      if (!result.success) {
		        if (!err0)
		          err0=result.error||'Unknown error';
		      }
		      if (err0) {
		        callback(err0);
		        return;
		      }
		      callback('');
		    }
		    else {
		      setTimeout(send_process_probe,5000);
		    }
		}
		function send_process_probe() {
		    var KC=m_kulele_client;
		    KC.probeJob(process_id,function(resp) {
		      handle_process_probe_response(resp);
		    });
		}
	}


	update_layout();
	do_refresh();
}
