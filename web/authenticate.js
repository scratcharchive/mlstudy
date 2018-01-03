function Authenticate(opts,callback) {

	if (opts.passcode) {
		callback('',{passcode:opts.passcode});
		return;
	}

	var dlg1=new ChooseLoginDlg();
	dlg1.onAccepted(on_accepted);
	dlg1.show();

	function on_accepted() {
		if (dlg1.choice()=='google') {
			var dlg=new GoogleLogInDlg();
			dlg.show(function(tmp) {
				var ret={
					google_id_token:tmp.id_token,
					google_profile:tmp.profile
				}
				callback('',ret);
			});	
		}
		else if (dlg1.choice()=='passcode') {
			var passcode0=prompt('Enter passcode:');
			callback('',{passcode:passcode0});
		}
		else if (dlg1.choice()=='anonymous') {
			callback('',{});
		}
		else {
			callback('Unexpected login choice: '+dlg1.choice(),{});
		}
	}
}

function ChooseLoginDlg(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('ChooseLoginDlg');

	this.onAccepted=function(callback) {onAccepted(callback);};
	this.show=function() {show();};
	this.choice=function() {return m_choice;};

	var m_dialog=$('<div id="dialog"></div>');
	var m_label='Sign in to DocStor';
	var m_choice='';

	O.div().append('<h3>Sign in using one of the following methods:</h3>');
	var ul=$('<ul />');
	ul.append('<li><a href=# id=google>Google</a></li>');
	ul.append('<li><a href=# id=passcode>a passcode</a></li>');
	O.div().append(ul);
	O.div().append('<h3>Or <a href=# id=anonymous>proceed without logging in</a></h3>');

	O.div().find('#google').click(on_google);
	O.div().find('#passcode').click(on_passcode);
	O.div().find('#anonymous').click(on_anonymous);

	function show() {
		O.setSize(450,300);

		var W=O.width();
		var H=O.height();
		m_dialog.css('overflow','hidden');
		m_dialog.append(O.div());
		$('body').append(m_dialog);
		m_dialog.dialog({width:W+20,
		              height:H+60,
		              resizable:false,
		              modal:true,
		              title:m_label});
	}

	function on_google() {
		m_choice='google';
		O.emit('accepted');
		m_dialog.dialog('close');
	}

	function on_passcode() {
		m_choice='passcode';
		O.emit('accepted');
		m_dialog.dialog('close');
	}

	function on_anonymous() {
		m_choice='anonymous';
		O.emit('accepted');
		m_dialog.dialog('close');
	}

	function onAccepted(callback) {
		JSQ.connect(O,'accepted',0,function(evt,args) {
			callback(args);
		});
	}
}

function GoogleLogInDlg(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('GoogleLogInDlg');

	this.show=function(callback) {show(callback);};

	var m_dialog=$('<div id="dialog"></div>');
	var m_label='Sign in using Google';

	function show(callback) {
		//$.getScript("https://apis.google.com/js/platform.js",function() {
		$.getScript("https://apis.google.com/js/api:client.js",function() {
			gapi.load('auth2,signin2',function() {
				gapi.auth2.init({
					client_id: '272128844725-rh0k50hgthnphjnkbb70s0v1efjt0pq3.apps.googleusercontent.com'
				});
				O.div().append('<div id="google-signin2"></div>');
				O.setSize(450,300);

				var W=O.width();
				var H=O.height();
				m_dialog.css('overflow','hidden');
				m_dialog.append(O.div());
				$('body').append(m_dialog);
				m_dialog.dialog({width:W+20,
				              height:H+60,
				              resizable:false,
				              modal:true,
				              title:m_label});

				gapi.signin2.render('google-signin2',{
					onsuccess:on_success,
					onfailure:on_failure
				});
				function on_success(googleUser) {
					var profile = googleUser.getBasicProfile();
					var id_token = googleUser.getAuthResponse().id_token;
					var ret={profile:profile,id_token:id_token};
					O.emit('accepted',ret);
					m_dialog.dialog('close');
					if (callback) callback(ret);
				}
				function on_failure() {
					O.emit('rejected');
					m_dialog.dialog('close');
					if (callback) callback({});
				}
				
			});
		});
	}	
}

