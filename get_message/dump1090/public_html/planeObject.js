var planeObject = {
	oldlat		: null,
	oldlon		: null,
	oldalt		: null,

	// Basic location information
	altitude	: null,
	speed		: null,
	track		: null,
	latitude	: null,
	longitude	: null,

	// Info about the plane
	flight		: null,
	squawk		: null,
	icao		: null,
	is_selected	: false,

	// Data packet numbers
	messages	: null,
	seen		: null,

	// Vaild...
	vPosition	: false,
	vTrack		: false,

	// GMap Details
	marker		: null,
	markerColor	: MarkerColor,
	lines		: [],
	trackdata	: new Array(),
	trackline	: new Array(),

	// When was this last updated?
	updated		: null,
	reapable	: false,

	// Appends data to the running track so we can get a visual tail on the plane
	// Only useful for a long running browser session.
	funcAddToTrack	: function(){
		// TODO: Write this function out
		this.trackdata.push([this.latitude, this.longitude, this.altitude, this.track, this.speed]);
		this.trackline.push(new AMap.LngLat(this.longitude, this.latitude));
	},

	// This is to remove the line from the screen if we deselect the plane
	funcClearLine	: function() {
		if (this.line) {
			this.line.setMap(null);
			this.line = null;
		}
	},

	// Should create an icon for us to use on the map...
	funcGetIcon	: function() {
		const prefix = 'https://file.veryzhun.com/buckets/adsb-dm/keys/';

		this.markerColor = '20200319-105605-zuf2o7rth4mrx6si.png';
		// If this marker is selected we should make it lighter than the rest.
		if (this.is_selected == true) {
			this.markerColor = '20200319-110905-vo88ewef3rsfriws.png';
		}

		// If we have not seen a recent update, change color
		if (this.seen > 15) {
			this.markerColor = '20200319-110918-mnwtkh7wmgpfeo5f.png';
		}

		// If the squawk code is one of the international emergency codes,
		// match the info window alert color.
		if (this.squawk == 7500) {
			this.markerColor = "20200319-110934-hvfg1zzflennvarp.png";
		}
		if (this.squawk == 7600) {
			this.markerColor = "20200319-110951-8mftdhob5fe4ub9h.png";
		}
		if (this.squawk == 7700) {
			this.markerColor = "20200319-110959-xr2mm7mhtt7r9s32.png";
		}

		// If we have not overwritten color by now, an extension still could but
		// just keep on trucking.  :)

		return new AMap.Icon({
			image: prefix + this.markerColor,
			size: new AMap.Size(32, 32),
			imageSize: new AMap.Size(32, 32)
		});
	},

	// TODO: Trigger actions of a selecting a plane
	funcSelectPlane	: function(selectedPlane){
		selectPlaneByHex(this.icao);
	},

	// Update our data
	funcUpdateData	: function(data){
		// So we can find out if we moved
		var oldlat 	= this.latitude;
		var oldlon	= this.longitude;
		var oldalt	= this.altitude;

		// Update all of our data
		this.updated	= new Date().getTime();
		this.altitude	= data.altitude;
		this.speed	= data.speed;
		this.track	= data.track;
		this.latitude	= data.lat;
		this.longitude	= data.lon;
		this.flight	= data.flight;
		this.squawk	= data.squawk;
		this.icao	= data.hex;
		this.messages	= data.messages;
		this.seen	= data.seen;

		// If no packet in over 58 seconds, consider the plane reapable
		// This way we can hold it, but not show it just in case the plane comes back
		if (this.seen > 58) {
			this.reapable = true;
			if (this.marker) {
				this.marker.setMap(null);
				this.marker = null;
			}
			if (this.line) {
				this.line.setMap(null);
				this.line = null;
			}
			if (SelectedPlane == this.icao) {
				if (this.is_selected) {
					this.is_selected = false;
				}
				SelectedPlane = null;
			}
		} else {
			if (this.reapable == true) {
			}
			this.reapable = false;
		}

		// Is the position valid?
		if ((data.validposition == 1) && (this.reapable == false)) {
			this.vPosition = true;

			// Detech if the plane has moved
			changeLat = false;
			changeLon = false;
			changeAlt = false;
			if (oldlat != this.latitude) {
				changeLat = true;
			}
			if (oldlon != this.longitude) {
				changeLon = true;
			}
			if (oldalt != this.altitude) {
				changeAlt = true;
			}
			// Right now we only care about lat/long, if alt is updated only, oh well
			if ((changeLat == true) || (changeLon == true)) {
				this.funcAddToTrack();
				if (this.is_selected) {
					this.line = this.funcUpdateLines();
				}
			}
			this.marker = this.funcUpdateMarker();
			PlanesOnMap++;
		} else {
			this.vPosition = false;
		}

		// Do we have a valid track for the plane?
		if (data.validtrack == 1)
			this.vTrack = true;
		else
			this.vTrack = false;
	},

	// Update our marker on the map
	funcUpdateMarker: function() {
		if (this.marker) {
			this.marker.setPosition(new AMap.LngLat(this.longitude, this.latitude));
			this.marker.setIcon(this.funcGetIcon());
		} else {
			this.marker = new AMap.Marker({
				position: new AMap.LngLat(this.longitude, this.latitude),
				map: aMap,
				anchor: 'center', // Set anchor to middle of plane.
				offset: new AMap.Pixel(0, 0),
				angle: this.track,
				icon: this.funcGetIcon()
			});

			// This is so we can match icao address
			this.marker.icao = this.icao;

			// Trap clicks for this marker.
			this.marker.on('click', this.funcSelectPlane);
		}

		// Setting the marker title
		if (this.flight.length == 0) {
			this.marker.setTitle(this.hex);
		} else {
			this.marker.setTitle(this.flight+' ('+this.icao+')');
		}
		return this.marker;
	},

	// Update our planes tail line,
	// TODO: Make this multi colored based on options
	//		altitude (default) or speed
	funcUpdateLines: function() {
		if (this.line) {
			var path = this.line.getPath();
			path.push(new AMap.LngLat(this.longitude, this.latitude));
		} else {
			this.line = new AMap.Polyline({
				strokeColor: '#000000',
				strokeOpacity: 1.0,
				strokeWeight: 3,
				map: aMap,
				path: this.trackline
			});
		}
		return this.line;
	}
};
