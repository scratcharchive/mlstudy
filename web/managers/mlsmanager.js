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

	var m_study=new MLStudy();
  var m_login_info={};
  var m_job_manager=null;

  function kBucketAuthUrl() {
    var on_localhost=(jsu_starts_with(window.location.href,'http://localhost'));
    if (on_localhost) return 'http://localhost:5057';
    else return 'https://kbucketauth.herokuapp.com';
  }

  function kBucketUrl() {
    var on_localhost=(jsu_starts_with(window.location.href,'http://localhost'));
    if (on_localhost) return 'http://localhost:5031';
    else return 'https://river.simonsfoundation.org';
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
    var MLP=new MLPipeline();
    MLP.setObject(obj);
    return MLP;
  }

  function pipelineByName(name) {
    var pipelines=m_object.pipelines||[];
    var found=false;
    for (var i=0; i<pipelines.length; i++) {
      var MLP=new MLPipeline();
      MLP.setObject(pipelines[i]);
      if (MLP.name()==name) {
        return MLP;
      }
    }
    return null;
  }

  function removePipelineByName(name) {
    var pipelines=JSQ.clone(m_object.pipelines||[]);
    for (var i=0; i<pipelines.length; i++) {
      var MLP=new MLPipeline();
      MLP.setObject(pipelines[i]);
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
      var MLP=new MLPipeline();
      MLP.setObject(pipelines[i]);
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
