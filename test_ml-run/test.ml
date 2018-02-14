console.log ('Hello, world! From .ml script.');

var A=_MLS.runProcess('pyms.synthesize_random_waveforms',
		{},
		{waveforms_out:true,geometry_out:true},
		{M:12},
		{}
);

_MLS.setResult('waveforms.mda',A.waveforms_out);

//_MLS.upload(A.waveforms_out);
