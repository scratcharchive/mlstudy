if (typeof module !== 'undefined' && module.exports) {
  //using nodejs
  exports.MLSManager=MLSManager;

  JSQObject=require(__dirname+'/../jsq/src/jsqcore/jsqobject.js').JSQObject;
  LocalStorage=require(__dirname+'/../jsutils/localstorage.js').LocalStorage;
}

function MLSManager(O) {
  O=O||this;
  JSQObject(O);

	this.setMLSObject=function(X) {m_study.setObject(X);};
  this.study=function() {return m_study;};
  this.setLoginInfo=function(info) {m_login_info=JSQ.clone(info); O.emit('login-info-changed');};
  this.loginInfo=function() {return JSQ.clone(m_login_info);};
  this.kBucketAuthUrl=function() {return kBucketAuthUrl();};
  this.kBucketUrl=function() {return kBucketUrl();};
  this.user=function() {return user();};
  this.setJobManager=function(JM) {m_job_manager=JM;};
  this.jobManager=function() {return m_job_manager;};
  this.batchJobManager=function() {return m_batch_job_manager;};
  //this.setKuleleClient=function(KC) {m_batch_job_manager.setKuleleClient(KC);};
  //this.kuleleClient=function() {return m_batch_job_manager.kuleleClient();};
  this.setDocStorClient=function(DSC) {m_docstor_client=DSC; m_batch_job_manager.setDocStorClient(DSC);};
  this.docStorClient=function() {return m_docstor_client;};
  this.mlsConfig=function() {return mlsConfig();};
  this.setMLSConfig=function(config) {setMLSConfig(config);};
  this.onConfigChanged=function(handler) {m_config_changed_handlers.push(handler);};
  this.defaultMLSConfig=function() {return JSQ.clone(default_config);};
  this.lariClient=function() {return m_lari_client;};
  this.clear=function() {clear();};

	var m_study=new MLStudy(null);
  var m_batch_job_manager=new BatchJobManager();
  var m_login_info={};
  var m_job_manager=null;
  var m_config_changed_handlers=[];
  var m_docstor_client=null;

  var m_lari_client=new LariClient();
  m_lari_client.setContainerId('child');
  m_batch_job_manager.setLariClient(m_lari_client);

  JSQ.connect(m_batch_job_manager,'results_changed',O,'results_changed');

  var default_config={
    //kulele_url:'https://kulele.herokuapp.com',
    lari_url:'https://lari1.herokuapp.com',
    kbucket_url:'https://kbucket.flatironinstitute.org',
    //kbucket_url:'https://river.simonsfoundation.org',
    kbucketauth_url:'https://kbucketauth.herokuapp.com',
    docstor_url:'https://docstor1.herokuapp.com',
    tidbits_url:'https://tidbits1.herokuapp.com',
    processing_server:'default'
  };

  var obj=mlsConfig();  
  setMLSConfig(obj);
  
  function mlsConfig() {
    var LS=new LocalStorage();
    var obj=LS.readObject('mls_config2')||{};
    var obj2={};
    for (var key in default_config) {
      obj2[key]=obj[key]||default_config[key];
    }
    return obj2;
  }

  function setMLSConfig(obj) {
    for (var key in default_config) {
      if (obj[key]) {
        if (obj[key]==default_config[key])
          obj[key]='';
      }
      else {
        obj[key]='';
      }
    }

    var LS=new LocalStorage();
    LS.writeObject('mls_config2',obj);
    m_batch_job_manager.setKBucketUrl(mlsConfig().kbucket_url);
    m_lari_client.setLariServerUrl(mlsConfig().lari_url);
    m_lari_client.setContainerId(mlsConfig().processing_server);

    for (var i in m_config_changed_handlers) {
      m_config_changed_handlers[i]();
    }
  }

  function kBucketAuthUrl() {
    return mlsConfig().kbucketauth_url;
  }

  function kBucketUrl() {
    return mlsConfig().kbucket_url;
  }
  function user() {
    if (m_login_info.google_profile) {
      return m_login_info.google_profile.U3||'';
    }
    else return '';
  }
  function clear() {
    m_study=new MLStudy(null);
    m_batch_job_manager=new BatchJobManager();
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

  this.batchScriptNames=function() {return batchScriptNames();};
  this.batchScript=function(name) {return batchScript(name);};
  this.setBatchScript=function(name,X) {setBatchScript(name,X);};
  this.removeBatchScript=function(name) {removeBatchScript(name);};
  this.changeBatchScriptName=function(name,new_name) {changeBatchScriptName(name,new_name);};

  var m_object={
    datasets:{},
    scripts:{}
  };

  function setObject(obj) {
    if (JSON.stringify(m_object)==JSON.stringify(obj)) return;
    m_object=JSQ.clone(obj);

    m_object.datasets=m_object.datasets||{};
    m_object.scripts=m_object.scripts||m_object.batch_scripts||{};
    if (m_object.batch_scripts) delete m_object.batch_scripts;
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
  function batchScriptNames() {
    var ret=Object.keys(m_object.scripts);
    ret.sort();
    return ret;
  }
  function batchScript(name) {
    if (!(name in m_object.scripts)) return null;
    var obj=m_object.scripts[name];
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
  function setBatchScript(name,X) {
    m_object.scripts[name]=X.object();
    O.emit('changed');
  }
  function removeBatchScript(name) {
    if (name in m_object.scripts) {
      delete m_object.scripts[name];
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
  //this.setKuleleClient=function(KC) {m_kulele_client=KC;};
  //this.kuleleClient=function() {return m_kulele_client;};
  this.setLariClient=function(LC) {m_lari_client=LC;};
  this.lariClient=function() {return m_lari_client;};
  this.runningJobCount=function() {return m_running_jobs.length;};
  this.setDocStorClient=function(DSC) {return m_docstor_client=DSC;};
  this.setKBucketUrl=function(url) {m_kbucket_url=url;};

  var m_running_jobs=[];
  //var m_kulele_client=null;
  var m_lari_client=null;
  var m_docstor_client=null;
  var m_kbucket_url='';

  function startBatchJob(batch_script,module_scripts,study_object) {
    var has_error=false;
    mlpLog({bold:true,text:'Starting batch job...'});
    var J=new BatchJob(null,m_lari_client);
    J.setDocStorClient(m_docstor_client);
    J.setBatchScript(batch_script.script());
    J.setKBucketUrl(m_kbucket_url);
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
    setTimeout(function() {
      J.start();
    },10);
    return J;
  }
}

