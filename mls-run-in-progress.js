#!/usr/bin/env nodejs

var MLSManager=require(__dirname+'/web/managers/mlsmanager.js').MLSManager;

function print_usage() {
	console.log ('mls-run [study.mls] [name of script] --[key1]=[val1] --[key2]=[val2] ...');
	console.log ('mls-spec [study.mls]');
	console.log ('Use the MLS_PATH environment variable to specify search paths for finding studies.');
	return;
}

var CLP=new CLParams(process.argv);
var arg1=CLP.unnamedParameters[0]||'';
var arg2=CLP.unnamedParameters[1]||'';
if (!arg1) {
	print_usage();
	return;
}

if (arg1=='spec') {
	print_spec();
	return;
}

if ('_params' in CLP.namedParameters) {
	var str=require('fs').readFileSync(CLP.namedParameters['_params'],'utf-8');
	var pp=JSON.parse(str);
	for (var key in pp) {
		CLP.namedParameters[key]=pp[key];
	}
}

var mls_path=find_mls_file(arg1);
if (!mls_path) {
	console.error('Not found: '+arg1);
	console.error('You may want to use the MLS_PATH environment variable.');
	return;
}

var txt=require('fs').readFileSync(mls_path,'utf-8');
var obj=JSON.parse(txt);

var manager=new MLSManager();
manager.setMLSObject(obj);
console.log(manager.study().datasetIds());
run_script();

function run_script() {
	var BJM=manager.batchJobManager();
	if (BJM.runningJobCount()>0) {
		alert('Cannot start job. A job is already running.');
		return;
	}
	var module_scripts={};
	var names0=manager.study().batchScriptNames();
	for (var i in names0) {
		module_scripts[names0[i]]=manager.study().batchScript(names0[i]);
	}
	var job=BJM.startBatchJob(m_batch_script_widget.batchScript(),module_scripts,manager.study().object());
	/*JSQ.connect(job,'results_changed',O,function() {O.emit('results_changed');});
	JSQ.connect(job,'completed',O,function() {m_batch_script_widget.setScriptIsRunning(false);});
	var batch_script_name=m_list_widget.currentBatchScriptName();
	m_batch_jobs_by_batch_script_name[batch_script_name]=job;
	update_results_widget();
	m_batch_script_widget.setScriptIsRunning(true);
	*/
}

function print_spec() {
	var mls_path=find_mls_file(CLP.unnamedParameters[1]||'');
	if (!mls_path) {
		console.log ('Unable to find pipeline document: '+(CLP.unnamedParameters[1]||''));
		return;
	}
	var txt=require('fs').readFileSync(mls_path,'utf-8');
	var obj=JSON.parse(txt);

	var scripts=obj.scripts||obj.batch_scripts||{};
	for (var sname in scripts) {
		console.log (sname);
	}
}


function find_mls_file(fname) {
	if (require('fs').existsSync(fname)) {
		return fname;
	}
	if (fname.slice(0,1)=='/') return '';
	var str=process.env.MLS_PATH;
	if (!str) return '';
	var list=str.split(':');
	for (var i in list) {
		var path0=list[i];
		if (require('fs').existsSync(path0+'/'+fname)) {
			return path0+'/'+fname;
		}
	}
	return fname;
}


function CLParams(argv) {
	this.unnamedParameters=[];
	this.namedParameters={};

	var args=argv.slice(2);
	for (var i=0; i<args.length; i++) {
		var arg0=args[i];
		if (arg0.indexOf('--')===0) {
			arg0=arg0.slice(2);
			var ind=arg0.indexOf('=');
			if (ind>=0) {
				this.namedParameters[arg0.slice(0,ind)]=arg0.slice(ind+1);
			}
			else {
				var next0=args[i+1]||'';
				if ((next0)&&(!starts_with(next0,'--'))) {
					this.namedParameters[arg0]=next0;	
					i++;
				}
				else {
					this.namedParameters[arg0]='';
				}
			}
		}
		else if (arg0.indexOf('-')===0) {
			arg0=arg0.slice(1);
			this.namedParameters[arg0]='';
		}
		else {
			this.unnamedParameters.push(arg0);
		}
	}
	function starts_with(str,str2) {
		return (str.slice(0,str2.length)==str2);
	}
};
