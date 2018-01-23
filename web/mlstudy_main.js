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
function jsqmain(query) {

    // The url query
    query=query||{};

    // Determine whether we are in local mode (i.e., whether we launched this as a desktop Qt GUI)
    var local_mode=(window.mlpipeline_mode=='local'); 

    // Determine whether we are running on localhost (development mode)
    var on_localhost=jsu_starts_with(window.location.href,'http://localhost');

    if (!local_mode) {
        // Switch to https protocol if needed
        if ((!on_localhost)&&(location.protocol != 'https:')) {
            location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
        }
    }

    //Set up the DocStorClient, which will either be directed to localhost or the heroku app, depending on how we are running it.
    var DSC=new DocStorClient();
    if (on_localhost)
        DSC.setDocStorUrl('http://localhost:5011');
    else
        DSC.setDocStorUrl('https://docstor1.herokuapp.com');

    show_full_browser_message('MLStudy','Logging in...');
    Authenticate({passcode:query.passcode||'',login_method:query.login||''},function(err,login_info) {
        if (err) {
            show_full_browser_message('MLStudy','Error logging in: '+err);
            return;
        }
        DSC.login(login_info,function(err00,result) {
            //note: at this time, we don't check the error here
            
            login_info.user_id=result.user_id||'';

            show_full_browser_message('','');

            var OO=new MLSOverviewWindow();
            OO.setDocStorClient(DSC);
            OO.setLoginInfo(login_info);
            OO.refresh();

            var Y=new MLSMainWindow();
            Y.setDocStorClient(DSC);
            Y.setLoginInfo(login_info);

            JSQ.connect(OO,'open_study',null,function(sender,args) {
                console.log('open_study');
                open_study(args.study);
            });

            JSQ.connect(Y,'goto_overview',null,function() {
                Y.hide();
                show_full_browser_message('','');
                OO.showFullBrowser();
            });

            {
                var storage_method=query.storage||'';
                if (!storage_method) {
                    if (query.owner) storage_method='docstor';
                }
                if (storage_method=='docstor') {
                    DSC.login(login_info,function(err1) {
                        if (err1) {
                            show_full_browser_message('MLStudy','Error logging in to docstor: '+err1);
                            return;       
                        }
                        open_study({storage:'docstor',owner:query.owner,title:query.title});
                    });
                }
                else if (storage_method=='browser') {
                    var title=query.title||'default.mls';
                    Y.loadFromBrowserStorage(title,function(err) {
                        if (err) {
                            alert(err);
                            return;
                        }
                        Y.showFullBrowser();
                    })
                }
                else {
                    show_full_browser_message('','');
                    OO.showFullBrowser();
                }
            }
            function open_study(study0) {
                OO.hide();
                show_full_browser_message('Loading...','Opening study...');
                if (!study0.storage) study0.storage='docstor';

                if (study0.storage=='docstor') {
                    show_full_browser_message('Loading...','Opening study from docstor...');
                    Y.loadFromDocStor(study0.owner,study0.title,function(err) {
                        if (err) {
                            alert(err);
                            return;
                        }
                        show_full_browser_message('','');
                        Y.showFullBrowser();
                    });
                }
                else {
                    alert('Unexpected storage method: '+study0.storage);
                }
            }
        });
    });



}

function MessageWidget(O) {
    O=O||this;
    JSQWidget(O);
    O.div().addClass('MessageWidget');

    this.setMessage=function(msg) {m_message=msg; refresh();};
    this.setSubmessage=function(msg) {m_submessage=msg; refresh();};
    this.message=function() {return m_message;};
    this.submessage=function() {return m_submessage;};

    var m_message='';
    var m_submessage;

    function refresh() {
        O.div().html('<h2>'+m_message+'</h2><h3>'+m_submessage+'</h3>');
    }
}

var s_message_widget=new MessageWidget();
function show_full_browser_message(msg,submessage) {
    var X=s_message_widget;
    X.setMessage(msg);
    X.setSubmessage(submessage);
    X.showFullBrowser();
}

function try_parse_json(str) {
    try {
        return JSON.parse(str);
    }
    catch(err) {
        return null;
    }
}

function ends_with(str,str2) {
    return (str.slice(str.length-str2.length)==str2);
}

//window.callbacks={};
//var s_last_cb_code=0;
