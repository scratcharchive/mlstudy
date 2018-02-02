function BatchJob(O,kulele_client) {
  O=O||this;
  JSQObject(O);

  this.setBatchScript=function(script) {m_script=script;};
  this.setAllScripts=function(scripts) {m_all_scripts=scripts;};
  this.setStudyObject=function(obj) {m_study_object=obj;};
  this.id=function() {return m_id;};
  this.start=function() {start();};
  this.stop=function() {stop();};
  this.resultNames=function() {return resultNames();};
  this.result=function(name) {return result(name);};
  this.results=function() {return JSQ.clone(m_results);};
  this.setResults=function(X) {m_results=JSQ.clone(X);};
  this.setDocStorClient=function(DSC) {m_docstor_client=DSC;};

  var m_id=JSQ.makeRandomId(6);
  var m_script='';
  var m_all_scripts={};
  var m_study_object={};
  var m_queued_processes=[];
  var m_outputs={};
  var m_results={};
  var m_max_simultaneous_processor_jobs=10;
  var m_is_completed=false;
  var m_load_study_tasks=[];
  var m_load_file_tasks=[];
  var m_docstor_client=null;

  function start() {
    var _MLS={
      study:JSQ.clone(m_study_object),
      runProcess:_run_process,
      setResult:_set_result,
      loadStudy:_load_study,
      loadFile:_load_file
    };

    var require=function(str) {
      var script_text='';
      if (typeof(str)=='object') {
        script_text=str.script||'';
      }
      else {
        if (!(str in m_all_scripts)) {
          throw new Error('Error in require, script not found: '+str);
        }
        script_text=m_all_scripts[str];
      }
      var script0='(function() {var exports={};'+script_text+'\n return exports;})()';
      try {
        var ret=eval(script0);
        return ret;
      }
      catch(err) {
        console.error(err);
        report_error('Error in module '+str+': '+err.message);
        return;
      }
    }

    function stop() {
      report_error('Stopped.');
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

  function set_pending_output_if_available(rr) {
    if (typeof(rr)!='object') return true;
    if (!rr.value._mls_pending_output) {
      if (typeof(rr.value)!='object') {
        rr.status='finished';
        return;
      }
      rr.status='pending';
      var all_fields_finished=true;
      for (var field in rr.value) {
        var tmp={
          value:rr.value[field]
        };
        set_pending_output_if_available(tmp);
        rr.value[field]=tmp.value;
        if (tmp.status=='error') {
          rr.status='error';
          rr.error=tmp.error;
          rr.processor_name=tmp.processor_name;
          O.emit('results_changed');
        }
        else if (tmp.status=='running') {
          if (rr.status=='pending')
            rr.status='running';
          if (!rr.processor_name)
              rr.processor_name=tmp.processor_name;
        }
        if (tmp.status!='finished') {
          all_fields_finished=false;
        }
      }
      if (all_fields_finished) {
        rr.status='finished';
        O.emit('results_changed');
      }
      return;
    }
    if (rr.value._mls_pending_output in m_outputs) {
      var aa=m_outputs[rr.value._mls_pending_output];
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
      if (rr.value) {
        if (rr.status!='finished')
          set_pending_output_if_available(rr);
        if (rr.status!='finished')
          done_with_all=false;
      }
    }
    for (var i=0; i<m_load_study_tasks.length; i++) {
      if (m_load_study_tasks[i].isFinished()) {
        if (m_load_study_tasks[i].error()) {
          report_error('Error loading study: '+m_load_study_tasks[i].error());
          return;
        }
      }
      else {
        done_with_all=false;
      }
    }
    for (var i=0; i<m_load_file_tasks.length; i++) {
      if (m_load_file_tasks[i].isFinished()) {
        if (m_load_file_tasks[i].error()) {
          report_error('Error loading file: '+m_load_file_tasks[i].error());
          return;
        }
      }
      else {
        if (!m_load_file_tasks[i].isRunning()) {
          if (check_load_file_task_ready_to_run(m_load_file_tasks[i])) {
            m_load_file_tasks[i].start();
          }
        }
        done_with_all=false;
      }
    }
    if (done_with_all) {
      if (!m_is_completed) {
        m_is_completed=true;
        O.emit('completed');
      }
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
            m_outputs[P.outputs[oname]._mls_pending_output]={status:'error',error:P.job.error(),processor_name:P.processor_name};
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
            m_outputs[P.outputs[oname]._mls_pending_output]={value:JSQ.clone(ofile),status:'finished'};
          }
          P.handled_outputs=true;
        }
      }
    }
    if (!m_is_completed)
      setTimeout(check_queued_processes,100);
  }

  function report_error(err) {
    if (m_is_completed) return;
    O.emit('error',err);
    stop_all_jobs();
    m_is_completed=true;
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
      if (!input) {
        report_error('Input '+iname+' is null for processor '+P.processor_name);
        return false;
      }
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

  function check_load_file_task_ready_to_run(LFT) {
    var file_obj=LFT.fileObject();
    if (file_obj._mls_pending_output) {
      var file0=get_file_from_input(file_obj);
      if (!file0) return false;
      console.log('setFileObject: '+JSON.stringify(file0));
      LFT.setFileObject(file0);
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
      m_outputs[P.outputs[oname]._mls_pending_output]={status:'running',processor_name:P.processor_name,processor:P};
    }
    X.setOutputsToReturn(outputs_to_return);
    X.setParameters(P.parameters);
    X.setOptions(P.opts);
    X.start();
  }

  function is_array(a) {
    if (!a) return false;
    if (typeof(a)=='object') {
      return ('length' in a);
    }
    else return false;
  }

  function get_file_from_input(input) {
    if (input._mls_pending_output) {
      if ((input._mls_pending_output in m_outputs)&&(m_outputs[input._mls_pending_output].status=='finished')) {
        return JSQ.clone(m_outputs[input._mls_pending_output].value);
      }
      else {
        return null;
      }
    }
    else {
      if (typeof(input)!='object') {
        return input;
      }
      else {
        var ret={};
        for (var field in input) {
          var tmp=get_file_from_input(input[field]);
          if (!tmp) return null;
          ret[field]=tmp;
        }
        return ret;
      }
    }
  }

  function _run_process(processor_name,inputs,outputs,parameters,opts) {
    if (!parameters) {
      throw new Error('Improper call to runProcess.');
      return;
    }
    if (!opts) opts={};
    for (var oname in outputs) {
      if (outputs[oname]===true) {
        outputs[oname]={_mls_pending_output:'unspecified_'+oname+'_'+JSQ.makeRandomId(10)};
      }
    }
    var PP={
      processor_name:processor_name,
      inputs:JSQ.clone(inputs),
      outputs:JSQ.clone(outputs),
      parameters:JSQ.clone(parameters),
      opts:JSQ.clone(opts)
    };
    m_queued_processes.push(PP);
    return JSQ.clone(outputs);
  }

  function object_has_pending_outputs(obj) {
    if (typeof(obj)!='object') return false;
    if (obj._mls_pending_output) return true;
    for (var field in obj) {
      if (object_has_pending_outputs(obj[field])) {
        return true;
      }
    }
    return false;
  }

  function _set_result(obj,fname,file) {
    if (!file) {
      file=fname;
      fname=obj;
      obj=null;
    }
    if (obj) fname=obj.id+'/'+fname;
    if (object_has_pending_outputs(file)) {
      m_results[fname]={value:file,status:'pending'};
    }
    else {
      m_results[fname]={value:JSQ.clone(file),status:'finished'};
    }
    O.emit('results_changed');
  }
  function _load_study(opts,callback) {
    var LST=new LoadStudyTask(opts,m_docstor_client);
    m_load_study_tasks.push(LST);
    LST.onFinished(function(err,study0) {
      if (err) {
        console.error('Error loading study: '+err);
        report_error('Error loading study: '+err);
        return;
      }
      try {
        callback(study0);
      }
      catch(err) {
        console.error(err);
        report_error(err.message);
        return;
      }
    });
    LST.start();
  }
  function _load_file(file_obj,opts,callback) {
    var LFT=new LoadFileTask(opts,kulele_client);
    LFT.setFileObject(file_obj);
    m_load_file_tasks.push(LFT);
    LFT.onFinished(function(err,resp) {
      if (err) {
        console.error('Error loading file: '+err);
        report_error('Error loading file: '+err);
        return;
      }
      try {
        callback(resp);
      }
      catch(err) {
        console.error(err);
        report_error(err.message);
        return;
      }
    });
  }
}

function LoadStudyTask(opts,docstor_client) {
  this.onFinished=function(handler) {m_finished_handlers.push(handler);};
  this.start=function() {start();};
  this.isFinished=function() {return m_is_finished;};
  this.error=function() {return m_error;};

  var m_finished_handlers=[];
  var m_error=null;
  var m_is_finished=false;

  function start() {
    if (!docstor_client) {
      finalize('docstor_client is null.');
      return;
    }
    download_document_content_from_docstor(docstor_client,opts.owner,opts.title,function(err,content) {
      if (err) {
        finalize(err);
        return;
      }
      var obj=try_parse_json(content);
      if (!obj) {
        console.log (content);
        finalize('Unable to parse mls file content');
        return;
      }
      obj.scripts=obj.scripts||obj.batch_scripts||{};
      finalize(null,obj);
    });

    function try_parse_json(str) {
      try {
        return JSON.parse(str);
      }
      catch(err) {
        return null;
      }
    }
  }

  function finalize(err,study0) {
    for (var i=0; i<m_finished_handlers.length; i++) {
      m_finished_handlers[i](err,study0);
    }
    m_error=err;
    m_is_finished=true;
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

}

function LoadFileTask(opts,kulele_client) {
  this.onFinished=function(handler) {m_finished_handlers.push(handler);};
  this.start=function() {start();};
  this.isFinished=function() {return m_is_finished;};
  this.isRunning=function() {return ((m_is_started)&&(!m_is_finished));};
  this.error=function() {return m_error;};
  this.setFileObject=function(obj) {m_file_object=JSQ.clone(obj);};
  this.fileObject=function() {return JSQ.clone(m_file_object);};

  var m_finished_handlers=[];
  var m_error=null;
  var m_is_started=false;
  var m_is_finished=false;

  function start() {
    if (!kulele_client) {
      finalize('kulele_client is null.');
      return;
    }
    var format=opts.format||'text';
    if (!m_file_object.prv) {
      finalize('LoadFileTask: file object is not a prv.');
      return;
    }
    m_is_started=true;
    kulele_client.prvLocate(m_file_object.prv,function(tmp) {
      if (!tmp.success) {
        finalize('Error locating prv file: '+tmp.error);
        return;
      }
      if (!tmp.found) {
        finalize('Prv file not found.');
        return;  
      }
      if (!tmp.url) {
        finalize('prvLocate: unexpected... url is empty.');
        return;
      }
      jsu_http_get_text(tmp.url,{},function(tmp2) {
        if (!tmp2.success) {
          finalize('Failed to download prv file: '+tmp2.error);
          return;
        }
        var txt=tmp2.text;
        if (format=='text') {
          finalize(null,txt);
          return;
        }
        else if (format=='json') {
          var obj=try_parse_json(txt);
          if (!obj) {
            finalize('Error parsing JSON in prv file.');
            return;
          }
          finalize(null,obj);
          return;
        }
      });
    });

    function try_parse_json(str) {
      try {
        return JSON.parse(str);
      }
      catch(err) {
        return null;
      }
    }
  }

  function finalize(err,study0) {
    for (var i=0; i<m_finished_handlers.length; i++) {
      m_finished_handlers[i](err,study0);
    }
    m_error=err;
    m_is_finished=true;
  }
}

function ProcessorJob(O,kulele_client) {
  O=O||this;
  JSQObject(O);

  this.setProcessorName=function(name) {m_processor_name=name;};
  this.setInputFiles=function(input_files) {m_input_files=JSQ.clone(input_files);};
  this.setOutputsToReturn=function(outputs_to_return) {m_outputs_to_return=JSQ.clone(outputs_to_return);};
  this.setParameters=function(parameters) {m_parameters=JSQ.clone(parameters);};
  this.setOptions=function(options) {m_options=JSQ.clone(options);};
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
  var m_options={};
  var m_is_completed=false;
  var m_error='';
  var m_process_id=''; //returned from kulele

  var m_output_files={};

  function start() {
    var KC=kulele_client;
    var spec=KC.processorSpec(m_processor_name);
    
    if ((!spec)&&(!m_options.package_uri)) {
      report_error('Unable to find processor (and no package_uri has been specified): '+m_processor_name);
      return;
    }

    var inputs={};
    if (spec) {
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
    }
    else {
      for (var input_name in m_input_files) {
        var tmp=m_input_files[input_name];
        if (tmp.prv)
          inputs[input_name]=tmp.prv;
        else {
          var tmp2=[];
          for (var i in tmp) tmp2.push(tmp[i].prv);
          inputs[input_name]=tmp2;
        }   
      }
    }

    var outputs_to_return={};
    if (spec) {
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
    }
    else {
      for (var output_name in m_outputs_to_return) {
        if (m_outputs_to_return[output_name]) {
          outputs_to_return[output_name]=true;
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
    plog('queueJob: '+m_processor_name);
    plog(JSON.stringify(m_options));
    KC.queueJob(m_processor_name,inputs,outputs_to_return,m_parameters,m_options,function(resp) {
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