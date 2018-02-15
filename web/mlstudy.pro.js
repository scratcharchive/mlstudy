#!/usr/bin/env nodejs
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

//////////////////////////////////////////////////////////////////////
var opts={PROJECTPATH:__dirname, SOURCEPATH:['.'], SCRIPTS:[], STYLESHEETS:[], HTML_SNIPPETS:[]};

//////////////////////////////////////////////////////////////////////
//require('../../jsqcore/jsqcore.pri').load(opts);
opts.SOURCEPATH.push('jsq/src/jsqcore');
opts.SCRIPTS.push(
	/*'jquery.min.js',*/'jsq.js','jsqobject.js','jsqwidget.js','jsqcanvaswidget.js'/*,'jquery-ui.min.js'*/
);
opts.STYLESHEETS.push(
	'jsq.css'/*,'jquery-ui.min.css'*/
);

//////////////////////////////////////////////////////////////////////
//require('jsq/jsqwidgets/jsqwidgets.pri').load(opts);
opts.SOURCEPATH.push('jsq/src/jsqwidgets')
opts.SCRIPTS.push(
	'jsqcanvaswidget.js','jsqtabwidget.js'
);

//////////////////////////////////////////////////////////////////////
opts.SOURCEPATH.push('jsutils')
opts.SCRIPTS.push(
	'jsutils.js','fileuploader.js','localstorage.js','url4text.js'
);
opts.SOURCEPATH.push('jsutils/3rdparty')
opts.SCRIPTS.push(
	'download.js','sha1.js'
);

//////////////////////////////////////////////////////////////////////
// codemirror
opts.SCRIPTS.push('CodeMirror/lib/codemirror.js');
opts.STYLESHEETS.push('CodeMirror/lib/codemirror.css');
opts.SCRIPTS.push('CodeMirror/mode/javascript/javascript.js');
opts.SCRIPTS.push('jshint/jshint.js','CodeMirror/addon/lint/lint.js',
				  'CodeMirror/addon/lint/javascript-lint.js');
opts.STYLESHEETS.push('CodeMirror/addon/lint/lint.css');


//////////////////////////////////////////////////////////////////////
opts.SOURCEPATH.push('jsoneditor/dist')
opts.SCRIPTS.push(
	'jsoneditor.min.js'
);
opts.STYLESHEETS.push(
	'jsoneditor.min.css'
);


//////////////////////////////////////////////////////////////////////
opts.TARGET = 'index.html';
opts.SCRIPTS.push(
	'mlstudy_main.js','authenticate.js'
);
opts.STYLESHEETS.push('create.css');

opts.SOURCEPATH.push('overview');
opts.SCRIPTS.push(
	'mlsoverviewwindow.js','altmlsoverviewwindow.js'
);
opts.STYLESHEETS.push('mlsoverviewwindow.css','bootstrap_docs.css');
opts.HTML_SNIPPETS.push('altmlsoverviewwindow.html');

opts.SOURCEPATH.push('widgets');
opts.SCRIPTS.push(
	'edittextdlg.js','mlsdatasetlistwidget.js','mlsdatasetwidget.js','mlsdatasetsview.js',
	'mlsmainwindow.js','mltablewidget.js','docselectdialog.js','docsharedialog.js',
	'mlshomeview.js','descriptionwidget.js','mlspipelinemodulesview.js','mlspipelinemodulelistwidget.js',
	'mlspipelinemodulewidget.js',
	'mlsbatchscriptsview.js','mlsbatchscriptlistwidget.js','mlsbatchscriptwidget.js',
	'mlsbatchscriptresultswidget.js','mlsbatchscriptjobswidget.js','mlsprocessorswidget.js'
);
opts.STYLESHEETS.push(
	'mltablewidget.css',
	'mlsdatasetwidget.css','mlsmainwindow.css','descriptionwidget.css'
);

//////////////////////////////////////////////////////////////////////
opts.SOURCEPATH.push('mlpipeline')
opts.SCRIPTS.push(
	'editmlpipelinewidget.js','editmlpipelinetablewidget.js','mlpipeline.js',
	'newstepdialog.js','jobmanager.js','processormanager.js','kuleleclient.js',
	'editstepdialog.js','mlpipelinelistwidget.js','mlplogwidget.js'
);
opts.STYLESHEETS.push(
	'mlplogwidget.css'
);

//// MLMenuBar
opts.SCRIPTS.push(
	'mlmenubar.js'/*,'jquery.dropdown.min.js'*/
);
opts.STYLESHEETS.push(
	/*'jquery.dropdown.min.css',*/'mlmenubar.css'
);

opts.SOURCEPATH.push('managers')
opts.SCRIPTS.push(
	'mlsmanager.js','batchjob.js'
);

opts.SOURCEPATH.push('clients')
opts.SCRIPTS.push(
	'docstorclient.js','kbucketclient.js','lariclient.js'
);

opts.SOURCEPATH.push('kbucket');
opts.SCRIPTS.push(
        'kbucketuploaddialog.js','resumable.js','kbucketauthclient.js'
);
opts.STYLESHEETS.push(
        'kbucketuploaddialog.css'
);


//////////////////////////////////////////////////////////////////////
require(__dirname+'/jsq/jsqmake/jsqmake.js').jsqmake(opts);
