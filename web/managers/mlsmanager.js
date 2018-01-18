function MLSManager() {
	this.setMLSObject=function(X) {m_study.setObject(X);};
  this.study=function() {return m_study;};
  this.setLoginInfo=function(info) {m_login_info=JSQ.clone(info);};
  this.loginInfo=function() {return JSQ.clone(m_login_info);};
  this.kBucketAuthUrl=function() {return kBucketAuthUrl();};
  this.kBucketUrl=function() {return kBucketUrl();};
  this.user=function() {return user();};
  this.setJobManager=function(JM) {m_job_manager=JM;};
  this.jobManager=function() {return m_job_manager;};
  this.batchJobManager=function() {return m_batch_job_manager;};
  this.setKuleleClient=function(KC) {m_batch_job_manager.setKuleleClient(KC);};
  this.kuleleClient=function() {return m_batch_job_manager.kuleleClient();};

	var m_study=new MLStudy(null);
  var m_login_info={};
  var m_job_manager=null;
  var m_batch_job_manager=new BatchJobManager();

  function kBucketAuthUrl() {
    return 'https://kbucketauth.herokuapp.com';
    /*
    var on_localhost=(jsu_starts_with(window.location.href,'http://localhost'));
    if (on_localhost) return 'http://localhost:5057';
    else return 'https://kbucketauth.herokuapp.com';
    */
  }

  function kBucketUrl() {
    return 'https://kbucket.org';
    /*
    var on_localhost=(jsu_starts_with(window.location.href,'http://localhost'));
    if (on_localhost) return 'http://localhost:5031';
    //else return 'https://river.simonsfoundation.org';
    else return 'https://kbucket.org';
    */
  }
  function user() {
    if (m_login_info.google_profile) {
      return m_login_info.google_profile.U3||'';
    }
    else return '';
  }
}

function MLStudy(O) {
  O=O||this;
  JSQObject(O);

  var that=this;
  
  this.object=function() {return JSQ.clone(m_object);};
  this.setObject=function(obj) {setObject(obj);};

  this.description=function() {return description();};
  this.setDescription=function(str) {setDescription(str);};

  this.datasetIds=function() {return datasetIds();};
  this.dataset=function(id) {return dataset(id);};
  this.setDataset=function(id,X) {setDataset(id,X);};
  this.removeDataset=function(id) {removeDataset(id);};
  this.changeDatasetId=function(id,id_new) {changeDatasetId(id,id_new);};

  this.pipelineModuleNames=function() {return pipelineModuleNames();};
  this.pipelineModule=function(name) {return pipelineModule(name);};
  this.setPipelineModule=function(name,X) {setPipelineModule(name,X);};
  this.removePipelineModule=function(name) {removePipelineModule(name);};
  this.changePipelineModuleName=function(name,new_name) {changePipelineModuleName(name,new_name);};

  this.batchScriptNames=function() {return batchScriptNames();};
  this.batchScript=function(name) {return batchScript(name);};
  this.setBatchScript=function(name,X) {setBatchScript(name,X);};
  this.removeBatchScript=function(name) {removeBatchScript(name);};
  this.changeBatchScriptName=function(name,new_name) {changeBatchScriptName(name,new_name);};

  var m_object={
    datasets:{},
    pipeline_modules:{},
    batch_scripts:{}
  };

  function setObject(obj) {
    if (JSON.stringify(m_object)==JSON.stringify(obj)) return;
    m_object=JSQ.clone(obj);

    if ('pipelines' in m_object) {
      m_object.pipeline_modules=m_object.pipelines;
      delete m_object['pipelines'];
    }

    m_object.datasets=m_object.datasets||{};
    m_object.pipeline_modules=m_object.pipeline_modules||{};
    m_object.batch_scripts=m_object.batch_scripts||{};
    O.emit('changed');
  }

  function datasetIds() {
    var ret=Object.keys(m_object.datasets);
    ret.sort();
    return ret;
  }
  function dataset(id) {
    if (!(id in m_object.datasets)) return null;
    var obj=m_object.datasets[id];
    var ret=new MLSDataset(obj);
    return ret;
  }
  function pipelineModuleNames() {
    var ret=Object.keys(m_object.pipeline_modules);
    ret.sort();
    return ret;
  }
  function pipelineModule(name) {
    if (!(name in m_object.pipeline_modules)) return null;
    var obj=m_object.pipeline_modules[name];
    var ret=new MLSPipelineModule(obj);
    return ret;
  }
  function batchScriptNames() {
    var ret=Object.keys(m_object.batch_scripts);
    ret.sort();
    return ret;
  }
  function batchScript(name) {
    if (!(name in m_object.batch_scripts)) return null;
    var obj=m_object.batch_scripts[name];
    var ret=new MLSBatchScript(obj);
    return ret;
  }
  function setDataset(id,X) {
    m_object.datasets[id]=X.object();
    O.emit('changed');
  }
  function removeDataset(id) {
    if (id in m_object.datasets) {
      delete m_object.datasets[id];
      O.emit('changed');
    }
  }
  function changeDatasetId(id,id_new) {
    if (id==id_new) return;
    var X=dataset(id);
    if (!X) return;
    removeDataset(id);
    setDataset(id_new,X); 
  }
  function setPipelineModule(name,X) {
    m_object.pipeline_modules[name]=X.object();
    O.emit('changed');
  }
  function removePipelineModule(name) {
    if (name in m_object.pipeline_modules) {
      delete m_object.pipeline_modules[name];
      O.emit('changed');
    }
  }
  function changePipelineModuleName(name,new_name) {
    if (name==new_name) return;
    var X=pipelineModule(name);
    if (!X) return;
    removePipelineModule(name);
    setPipelineModule(new_name,X); 
  }
  function setBatchScript(name,X) {
    m_object.batch_scripts[name]=X.object();
    O.emit('changed');
  }
  function removeBatchScript(name) {
    if (name in m_object.batch_scripts) {
      delete m_object.batch_scripts[name];
      O.emit('changed');
    }
  }
  function changeBatchScriptName(name,new_name) {
    if (name==new_name) return;
    var X=batchScript(name);
    if (!X) return;
    removeBatchScript(name);
    setBatchScript(new_name,X); 
  }
  function description() {
    return m_object.description||'';
  }
  function setDescription(str) {
    if (m_object.description==str) return;
    m_object.description=str;
    O.emit('changed');
  }

}

function MLSDataset(obj) {
  var that=this;
  this.setObject=function(obj) {m_object=JSQ.clone(obj);};
  this.object=function() {return JSQ.clone(m_object);};

  this.id=function() {return m_object.id||'';};
  this.fileNames=function() {return fileNames();};
  this.file=function(name) {return file(name);};
  this.setFile=function(name,file0) {return setFile(name,file0);};
  this.removeFile=function(name) {removeFile(name);};
  this.parameters=function() {return JSQ.clone(m_object.parameters||{});};
  this.setParameters=function(params) {m_object.parameters=JSQ.clone(params);};
  this.properties=function() {return JSQ.clone(m_object.properties||{});};
  this.setProperties=function(props) {m_object.properties=JSQ.clone(props);};

  var m_object={};

  function fileNames() {
    var files=m_object.files||{};
    var ret=[];
    for (var key in files) {
      ret.push(key);
    }
    return ret;
  }

  function file(name) {
    return (m_object.files||{})[name]||null;
  }
  function setFile(name,file0) {
    if (!m_object.files) m_object.files={};
    m_object.files[name]=JSQ.clone(file0);
  }
  function removeFile(name) {
    if (!m_object.files) m_object.files={};
    if (name in m_object.files) {
      delete m_object.files[name];
    }
  }

  that.setObject(obj||{});
}

function MLSPipelineModule(obj) {
  var that=this;
  this.setObject=function(obj) {setObject(obj);};
  this.object=function() {return JSQ.clone(m_object);};
  this.onChanged=function(handler) {m_changed_handlers.push(handler);};
  this.pipelineCount=function() {return pipelineCount();};
  this.pipeline=function(i) {return pipeline(i);};
  this.pipelineByName=function(name) {return pipelineByName(name);};
  this.setPipelineByName=function(X) {setPipelineByName(X);};
  this.removePipelineByName=function(name) {removePipelineByName(name);};
  this.reorderPipelines=function(new_pipeline_order) {reorderPipelines(new_pipeline_order);};
  this.addPipeline=function(X) {addPipeline(X);};

  var m_object={};
  var m_changed_handlers=[];

  function setObject(obj) {
    if (JSON.stringify(obj)==JSON.stringify(m_object)) return;
    m_object=JSQ.clone(obj);
    for (var i in m_changed_handlers) {
      m_changed_handlers[i]();
    }
  }

  function pipelineCount() {
    var pipelines=m_object.pipelines||[];
    return pipelines.length;
  }
  function pipeline(i) {
    var pipelines=m_object.pipelines||[];
    var obj=pipelines[i]||{};
    var MLP=pipeline_from_object(obj);
    return MLP;
  }

  function pipeline_from_object(obj) {
    var MLP;
    if (obj.script)
      MLP=new MLPipelineScript();
    else
      MLP=new MLPipeline();
    MLP.setObject(obj);
    return MLP;
  }

  function pipelineByName(name) {
    var pipelines=m_object.pipelines||[];
    var found=false;
    for (var i=0; i<pipelines.length; i++) {
      var MLP=pipeline_from_object(pipelines[i]);
      if (MLP.name()==name) {
        return MLP;
      }
    }
    return null;
  }

  function removePipelineByName(name) {
    var pipelines=JSQ.clone(m_object.pipelines||[]);
    for (var i=0; i<pipelines.length; i++) {
      var MLP=pipeline_from_object(pipelines[i]);
      if (MLP.name()==name) {
        pipelines.splice(i,1);
        break;
      }
    }
    var obj=JSQ.clone(m_object);
    obj.pipelines=pipelines;
    setObject(obj);
  }

  function addPipeline(X) {
    setPipelineByName(X);
  }

  function setPipelineByName(X) {
    var pipelines=JSQ.clone(m_object.pipelines||[]);
    var found=false;
    for (var i=0; i<pipelines.length; i++) {
      var MLP=pipeline_from_object(pipelines[i]);
      if (MLP.name()==X.name()) {
        pipelines[i]=X.object();
        found=true;
        break;
      }
    }
    if (!found) {
      pipelines.push(X.object());
    }
    var obj=JSQ.clone(m_object);
    obj.pipelines=pipelines;
    setObject(obj);
  }

  function reorderPipelines(new_pipeline_order) {
    var pipelines=JSQ.clone(m_object.pipelines||[]);
    if (new_pipeline_order.length!=pipelines.length) {
      console.error('Incorrect length of new_pipeline_order in reorderPipelines');
      return;
    }
    var new_pipelines=[];
    for (var i=0; i<new_pipeline_order.length; i++) {
      new_pipelines.push(pipelines[new_pipeline_order[i]]);
    }
    var obj=JSQ.clone(m_object);
    obj.pipelines=new_pipelines;
    setObject(obj);
  }

  that.setObject(obj||{});
}

function MLSBatchScript(obj) {
  var that=this;
  this.setObject=function(obj) {setObject(obj);};
  this.object=function() {return JSQ.clone(m_object);};
  this.setScript=function(script) {setScript(script);};
  this.script=function() {return m_object.script||'';};
  this.onChanged=function(handler) {m_changed_handlers.push(handler);};

  var m_object={};
  var m_changed_handlers=[];

  function setObject(obj) {
    if (JSON.stringify(obj)==JSON.stringify(m_object)) return;
    m_object=JSQ.clone(obj);
    for (var i in m_changed_handlers) {
      m_changed_handlers[i]();
    }
  }

  function setScript(script) {
    var obj=JSQ.clone(m_object);
    obj.script=script;
    setObject(obj);
  }

  that.setObject(obj||{});
}

function BatchJobManager(O) {
  O=O||this;
  JSQObject(O);

  this.startBatchJob=function(batch_script,module_scripts,study_object) {return startBatchJob(batch_script,module_scripts,study_object);};
  this.setKuleleClient=function(KC) {m_kulele_client=KC;};
  this.kuleleClient=function() {return m_kulele_client;};
  this.runningJobCount=function() {return m_running_jobs.length;};

  var m_running_jobs=[];
  var m_kulele_client=null;

  function startBatchJob(batch_script,module_scripts,study_object) {
    var has_error=false;
    mlpLog({bold:true,text:'Starting batch job...'});
    var J=new BatchJob(null,m_kulele_client);
    J.setBatchScript(batch_script.script());
    var all_scripts={};
    for (var name0 in module_scripts) {
      all_scripts[name0]=module_scripts[name0].script();
    }
    J.setAllScripts(all_scripts);
    J.setStudyObject(study_object);
    JSQ.connect(J,'error',O,function(sender,err) {
      has_error=true;
      mlpLog({error:true,text:'Error in batch job: '+err});
    });
    JSQ.connect(J,'completed',O,function() {
      var txt='Batch job completed';
      if (has_error) txt+=' with error.';
      else txt+=' without error.';
      mlpLog({bold:true,text:txt,error:has_error});
      for (var i in m_running_jobs) {
        if (m_running_jobs[i]==J) {
          m_running_jobs.splice(i,1);
          break;
        }
      }
    });
    
    m_running_jobs.push(J);
    J.start();
    return J;
  }
}

function BatchJob(O,kulele_client) {
  O=O||this;
  JSQObject(O);

  this.setBatchScript=function(script) {m_script=script;};
  this.setAllScripts=function(scripts) {m_all_scripts=scripts;};
  this.setStudyObject=function(obj) {m_study_object=obj;};
  this.id=function() {return m_id;};
  this.start=function() {start();};
  this.resultNames=function() {return resultNames();};
  this.result=function(name) {return result(name);};

  var m_id=JSQ.makeRandomId(6);
  var m_script='';
  var m_all_scripts={};
  var m_study_object={};
  var m_queued_processes=[];
  var m_outputs={};
  var m_results={};
  var m_max_simultaneous_processor_jobs=10;

  function start() {
    var _MLS={
      study:JSQ.clone(m_study_object),
      runProcess:_run_process,
      setResult:_set_result
    };

    var require=function(str) {
      if (!(str in m_all_scripts)) {
        throw new Error('Error in require, script not found: '+str);
      }

      var script0='(function() {var exports={};'+m_all_scripts[str]+'\n return exports;})()';
      try {
        var ret=eval(script0);
        return ret;
      }
      catch(err) {
        throw new Error('Error in module '+str+': '+err.message);
        return;
      }
    }

    var script2='(function() {'+m_script+'\n})()';

    try {
      eval(script2);
    }
    catch(err) {
      console.error(err);
      report_error('Error evaluating script: '+err.message);
      return;
    }

    setTimeout(check_queued_processes,100);
  }

  function resultNames() {
    var ret=[];
    for (var rname in m_results) {
      ret.push(rname);
    }
    return ret;
  }

  function result(name) {
    return JSQ.clone(m_results[name]||null);
  }

  function check_queued_processes() {
    var done_with_all=true;
    var num_running=0;
    for (var i in m_queued_processes) {
      var P=m_queued_processes[i];
      if ((P.job)&&(!P.job.isCompleted())) {
        num_running++;
        done_with_all=false;
      }
      if ((P.job)&&(P.job.isCompleted())) {
        if (!P.handled_outputs) {
          //completed but have not handled outputs yet
          done_with_all=false;
        }
      }
      if (!P.job) {
        done_with_all=false;
      }
    }
    for (var rname in m_results) {
      var rr=m_results[rname];
      if ((rr.assigned_output)&&(!rr.value)) {
        if (rr.assigned_output in m_outputs) {
          var aa=m_outputs[rr.assigned_output];
          if (aa.status=='finished') {
            rr.value=JSQ.clone(aa.value);
            rr.status='finished';
            O.emit('results_changed');  
          }
          else if (aa.status=='error') {
            rr.status='error';
            rr.error=aa.error;
            rr.processor_name=aa.processor_name;
            O.emit('results_changed');  
          }
          else if (aa.status=='running') {
            rr.status='running';
            rr.processor_name=aa.processor_name;
            O.emit('results_changed');  
            done_with_all=false;
          }
        }
        else {
          done_with_all=false;
        }
      }
    }
    if (done_with_all) {
      O.emit('completed');
      return;
    }
    for (var i in m_queued_processes) {
      var P=m_queued_processes[i];
      if (!P.job) {
        //not yet started
        if (num_running<m_max_simultaneous_processor_jobs) {
          if (processor_job_ready_to_run(P)) {
            start_processor(P);
            num_running++;
          }
        }
      }
      else if (!P.job.isCompleted()) {
        //running
      }
      else if (P.job.error()) {
        //process completed with error
        report_error('Error running process ('+P.processor_name+'): '+P.job.error());
        if (!P.handled_outputs) {
          var output_files=P.job.outputFiles();
          for (var oname in P.outputs) {
            m_outputs[P.outputs[oname]]={status:'error',error:P.job.error(),processor_name:P.processor_name};
          }
          P.handled_outputs=true;
        }
      }
      else {
        //process completed successfully -- so set the outputs
        if (!P.handled_outputs) {
          var output_files=P.job.outputFiles();
          for (var oname in P.outputs) {
            var ofile=output_files[oname]||null;
            if (!ofile) {
              report_error('Unexpected missing output file '+oname+'  for processor '+P.processor_name);
              return;
            }
            m_outputs[P.outputs[oname]]={value:JSQ.clone(ofile),status:'finished'};
          }
          P.handled_outputs=true;
        }
      }
    }
    setTimeout(check_queued_processes,100);
  }

  function report_error(err) {
    O.emit('error',err);
    stop_all_jobs();
    O.emit('completed');
  }

  function stop_all_jobs() {
    for (var i in m_queued_processes) {
      var P=m_queued_processes[i];
      if (P.job) {
        if (!P.job.isCompleted()) {
          P.job.stop();
        }
      }
    }
  }

  function processor_job_ready_to_run(P) {
    for (var iname in P.inputs) {
      var input=P.inputs[iname];
      if (is_array(input)) {
        for (var ii=0; ii<input.length; ii++) {
          var ifile=get_file_from_input(input[ii]);
          if (!ifile) {
            return false;
          }
        }
      }
      else {
        var ifile=get_file_from_input(input);
        if (!ifile) {
          return false;
        }
      }
    }
    return true;
  }

  function start_processor(P) {
    var X=new ProcessorJob(null,kulele_client);
    P.job=X;
    X.setProcessorName(P.processor_name);
    var input_files={};
    for (var iname in P.inputs) {
      var input=P.inputs[iname];
      if (is_array(input)) {
        var list0=[];
        for (var ii=0; ii<input.length; ii++) {
          var ifile=get_file_from_input(input[ii]);
          if (!ifile) {
            console.error('Unexpected: unable to get file from input: '+input[ii]);
            return;
          }
          list0.push(ifile);
        }
        input_files[iname]=list0;
      }
      else {
        var ifile=get_file_from_input(input);
        if (!ifile) {
          console.error('Unexpected: unable to get file from input: '+input);
          return;
        }
        input_files[iname]=ifile;
      }
    }
    X.setInputFiles(input_files);
    var outputs_to_return={};
    for (var oname in P.outputs) {
      outputs_to_return[oname]=true;
      m_outputs[P.outputs[oname]]={status:'running',processor_name:P.processor_name,processor:P};
    }
    X.setOutputsToReturn(outputs_to_return);
    X.setParameters(P.parameters);
    X.start();
  }

  function is_array(a) {
    if (typeof(a)=='object') {
      return ('length' in a);
    }
    else return false;
  }

  function get_file_from_input(input) {
    if (typeof(input)=='string') {
      if ((input in m_outputs)&&(m_outputs[input].status=='finished')) {
        return JSQ.clone(m_outputs[input].value);
      }
      else {
        return null;
      }
    }
    else {
      return JSQ.clone(input);
    }
  }

  function _run_process(processor_name,inputs,outputs,parameters) {
    if (!parameters) {
      throw new Error('Improper call to runProcess.');
      return;
    }
    for (var oname in outputs) {
      if (outputs[oname]===true) {
        outputs[oname]='unspecified_'+oname+'_'+JSQ.makeRandomId(10);
      }
    }
    var PP={
      processor_name:processor_name,
      inputs:JSQ.clone(inputs),
      outputs:JSQ.clone(outputs),
      parameters:JSQ.clone(parameters)
    };
    m_queued_processes.push(PP);
    return JSQ.clone(outputs);
  }

  function _set_result(obj,fname,file) {
    if (!file) {
      file=fname;
      fname=obj;
      obj=null;
    }
    if (obj) fname=obj.id+'/'+fname;
    if (typeof(file)=='string') {
      m_results[fname]={assigned_output:file,status:'pending'};
    }
    else {
      m_results[fname]={value:JSQ.clone(file),status:'finished'};
    }
    O.emit('results_changed');
  }
}

function ProcessorJob(O,kulele_client) {
  O=O||this;
  JSQObject(O);

  this.setProcessorName=function(name) {m_processor_name=name;};
  this.setInputFiles=function(input_files) {m_input_files=JSQ.clone(input_files);};
  this.setOutputsToReturn=function(outputs_to_return) {m_outputs_to_return=JSQ.clone(outputs_to_return);};
  this.setParameters=function(parameters) {m_parameters=JSQ.clone(parameters);};
  this.outputFiles=function() {return JSQ.clone(m_output_files);};
  this.id=function() {return m_id;};
  this.start=function() {start();};
  this.stop=function() {stop();};
  this.isCompleted=function() {return m_is_completed;};
  this.error=function() {return m_error;};

  var m_id=JSQ.makeRandomId(6);
  var m_processor_name='';
  var m_input_files={};
  var m_outputs_to_return={};
  var m_parameters={};
  var m_is_completed=false;
  var m_error='';
  var m_process_id=''; //returned from kulele

  var m_output_files={};

  function start() {
    var KC=kulele_client;
    var spec=KC.processorSpec(m_processor_name);
    if (!spec) {
      report_error('Unable to find processor: '+m_processor_name);
      return;
    }
    var inputs={};
    for (var i in spec.inputs) {
      var spec_input=spec.inputs[i];
      if (m_input_files[spec_input.name]) {
        var tmp=m_input_files[spec_input.name];
        if (tmp.prv)
          inputs[spec_input.name]=tmp.prv;
        else {
          var tmp2=[];
          for (var i in tmp) tmp2.push(tmp[i].prv);
          inputs[spec_input.name]=tmp2;
        }
      }
      else {
        if (spec_input.optional!=true) {
          report_error('Missing required input: '+spec_input.name);
          return;
        }
      }
    }
    var outputs_to_return={};
    for (var i in spec.outputs) {
      var spec_output=spec.outputs[i];
      if (m_outputs_to_return[spec_output.name]) {
        outputs_to_return[spec_output.name]=true;
      }
      else {
        if (spec_output.optional!=true) {
          report_error('Missing required output: '+spec_output.name);
          return;
        }
      }
    }
    outputs_to_return.console_out=true;
    plog('----------------------------------------------------------------------------');
    plog('Queueing job: '+m_processor_name);
    {
      var inputs_str='INPUTS: ';
      for (var iname in inputs) {
        inputs_str+=iname+'='+inputs[iname]+'  ';
      }
      plog('  '+inputs_str);
    }
    {
      var params_str='PARAMS: ';
      for (var pname in m_parameters) {
        params_str+=pname+'='+m_parameters[pname]+'  ';
      }
      plog('  '+params_str);
    }
    plog('----------------------------------------------------------------------------');
    KC.queueJob(m_processor_name,inputs,outputs_to_return,m_parameters,{},function(resp) {
      if (!resp.success) {
        report_error(resp.error);
        return;
      }
      m_process_id=resp.process_id;
      handle_process_probe_response(resp);
    });
  }
  function handle_process_probe_response(resp) {
    if (!resp.success) {
      report_error(resp.error);
      return;
    }
    if (m_process_id!=resp.process_id) {
      report_error('Unexpected: process_id does not match response: '+m_process_id+'<>'+resp.process_id);
      return;
    }
    if (resp.latest_console_output) {
      var lines=resp.latest_console_output.split('\n');
      for (var i in lines) {
        if (lines[i].trim()) {
          var str0='  |'+m_processor_name+'| ';
          while (str0.length<35) str0+=' ';
          plog(str0+lines[i],{side:'server'});
        }
      }
    }
    if (resp.complete) {
      var err0='';
      if (!resp.result) {
        report_error('Unexpected: result not found in process response.');
        return;
      }
      var result=resp.result;
      if (!result.success) {
        if (!err0)
          err0=result.error||'Unknown error';
      }
      if (result.outputs) {
        for (var okey in m_outputs_to_return) {
          if (!result.outputs[okey]) {
            if (!err0)
              err0='Output not found in process response: '+okey;
          }
          else {
            var prv0=result.outputs[okey];
            m_output_files[okey]={prv:prv0};
          }
        }
        if (result.outputs['console_out']) {
          var prv0=result.outputs['console_out'];
          m_output_files['console_out']={prv:prv0};
        }
      }
      else {
        if (!err0)
          err0='Unexpected: result.outputs not found in process response';
      }
      if (err0) {
        report_error(err0);
        return;
      }
      report_finished();
    }
    else {
      setTimeout(send_process_probe,5000);
    }
  }
  
  function send_process_probe() {
    var KC=kulele_client;
    KC.probeJob(m_process_id,function(resp) {
      handle_process_probe_response(resp);
    });
  }
  function stop() {
    plog('Canceling job');
    var KC=kulele_client;
    KC.cancelJob(m_process_id,function(resp) {
      if (!resp.success) {
        plog('Error canceling job: '+resp.error,{error:true});
        return;
      }
    })
  }
  function plog(str,obj) {
    obj=obj||{};
    obj.text=m_processor_name+'::::: '+str;
    mlpLog(obj);
  }
  function report_error(err) {
    m_is_completed=true;
    m_error=err;
  }
  function report_finished() {
    m_is_completed=true;
  }
}