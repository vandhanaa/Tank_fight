/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author paulirish / http://paulirish.com/
 */

THREE.FirstPersonControls = function ( object, domElement ) {

	this.object = object;
	this.target = new THREE.Vector3( 0, 0, 0 );

	this.domElement = ( domElement !== undefined ) ? domElement : document;

	this.movementSpeed = 1.0;
	this.lookSpeed = 0.005;

	this.lookVertical = true;
	this.autoForward = false;
	// this.invertVertical = false;

	this.activeLook = true;

	this.heightSpeed = false;
	this.heightCoef = 1.0;
	this.heightMin = 0.0;
	this.heightMax = 1.0;

	this.constrainVertical = false;
	this.verticalMin = 0;
	this.verticalMax = Math.PI;

	this.autoSpeedFactor = 0.0;

	this.mouseX = 0;
	this.mouseY = 0;

	this.lat = 0;
	this.lon = 0;
	this.phi = 0;
	this.theta = 0;
	this.shoot = false;
	this.moveForward = false;
	this.moveBackward = false;
	this.moveLeft = false;
	this.moveRight = false;
	this.freeze = false;

	this.mouseDragOn = false;

	this.viewHalfX = 0;
	this.viewHalfY = 0;

	if ( this.domElement !== document ) {

		this.domElement.setAttribute( 'tabindex', -1 );

	}

	//

	this.handleResize = function () {

		if ( this.domElement === document ) {

			this.viewHalfX = window.innerWidth / 2;
			this.viewHalfY = window.innerHeight / 2;

		} else {

			this.viewHalfX = this.domElement.offsetWidth / 2;
			this.viewHalfY = this.domElement.offsetHeight / 2;

		}

	};

	this.onMouseDown = function ( event ) {

		if ( this.domElement !== document ) {

			this.domElement.focus();

		}

		event.preventDefault();
		event.stopPropagation();

		if ( this.activeLook ) {

			switch ( event.button ) {

				case 0: this.moveForward = true; break;
				case 2: this.moveBackward = true; break;

			}

		}

		this.mouseDragOn = true;

	};

	this.onMouseUp = function ( event ) {

		event.preventDefault();
		event.stopPropagation();

		if ( this.activeLook ) {

			switch ( event.button ) {

				case 0: this.moveForward = false; break;
				case 2: this.moveBackward = false; break;

			}

		}

		this.mouseDragOn = false;

	};

	this.onMouseMove = function ( event ) {

		if ( this.domElement === document ) {

			this.mouseX = event.pageX - this.viewHalfX;
			this.mouseY = event.pageY - this.viewHalfY;

		} else {

			this.mouseX = event.pageX - this.domElement.offsetLeft - this.viewHalfX;
			this.mouseY = event.pageY - this.domElement.offsetTop - this.viewHalfY;

		}

	};

	this.onKeyDown = function ( event ) {

		//event.preventDefault();
		console.log(event.keyCode);
		switch ( event.keyCode ) {

			case 38: /*up*/
			case 87: /*W*/ this.moveForward = true; break;

			case 37: /*left*/
			case 65: /*A*/ this.moveLeft = true; break;

			case 40: /*down*/
			case 83: /*S*/ this.moveBackward = true; break;

			case 39: /*right*/
			case 68: /*D*/ this.moveRight = true; break;

			case 82: /*R*/ this.moveUp = true; break;
			case 70: /*F*/ this.moveDown = true; break;

			case 81: /*Q*/ this.freeze = !this.freeze; break;

			case 32: /*space*/this.shoot = true;break;

		}

	};

	this.spinAvatar = function(angle){
		new TWEEN.Tween( { y: this.object.rotation.y } )
      		.to( { y: angle }, 100 )
      		.onUpdate( function () {
         		 this.object.rotation.y = this.y;
      		} )
      		.start();
	}

	this.onKeyUp = function ( event ) {

		switch( event.keyCode ) {
			case 38: /*up*/
			case 87: /*W*/ this.moveForward = false; break;

			case 37: /*left*/
			case 65: /*A*/ this.moveLeft = false; break;

			case 40: /*down*/
			case 83: /*S*/ this.moveBackward = false; break;

			case 39: /*right*/
			case 68: /*D*/ this.moveRight = false; break;

			case 82: /*R*/ this.moveUp = false; break;
			case 70: /*F*/ this.moveDown = false; break;
			case 32: /*space*/this.shoot = false;break;
		}

	};

	this.update = function( delta ) {
		var actualMoveSpeed = 0;

		if ( this.freeze ) {
			console.log("this.freeze");
			return;

		} else {

			if ( this.heightSpeed ) {

				var y = THREE.Math.clamp( this.object.position.y, this.heightMin, this.heightMax );
				var heightDelta = y - this.heightMin;

				this.autoSpeedFactor = delta * ( heightDelta * this.heightCoef );

			} else {

				this.autoSpeedFactor = 0.0;

			}

			actualMoveSpeed = delta * this.movementSpeed;
			//console.log("actualMoveSpeed = "+actualMoveSpeed);
			var cd=this.object.children[0].rotation.y;
			var quadrant=getRegion(cd);
			var da=5*Math.PI/180;
			var pai=Math.PI;
			if ( this.moveForward || ( this.autoForward && !this.moveBackward ) ){
				
				if((cd<pai/2+da&&cd>pai/2-da)||(cd<-1.5*pai+da&&cd>-1.5*pai-da))
					this.object.translateZ( - ( actualMoveSpeed + this.autoSpeedFactor ) );
				else
				{			
					if(quadrant==1||quadrant==4)
						this.object.children[0].rotation.y=(this.object.children[0].rotation.y+10*Math.PI/180)%(2*pai);
					else 
						this.object.children[0].rotation.y=(this.object.children[0].rotation.y-10*Math.PI/180)%(2*pai);
				}		
				console.log("angle = "+cd+"quadratn="+quadrant);	
				
				console.log("actualMoveSpeed = "+actualMoveSpeed);
			 	console.log("delta = "+delta);
				console.log("moveForward " + this.object.z);
			} 
			
			if ( this.moveBackward ) 
			{				
				if((cd>1.5*pai-da&&cd<1.5*pai+da)||(cd<-0.5*pai+da&&cd>-0.5*pai-da))
					this.object.translateZ( actualMoveSpeed );
			 	else
			 	{			
					if(quadrant==2||quadrant==3)
						this.object.children[0].rotation.y=(this.object.children[0].rotation.y+10*Math.PI/180)%(2*pai);
					else 
						this.object.children[0].rotation.y=(this.object.children[0].rotation.y-10*Math.PI/180)%(2*pai);
				}	
			 	console.log("angle = "+cd+"quadratn="+quadrant);	
			 	console.log("actualMoveSpeed = "+actualMoveSpeed);
			 	console.log("delta = "+delta);
			 	console.log("move backward " + this.object.z);
			}

			if ( this.moveRight ) {
				
				if((cd>0&&(cd<da||cd>2*pai-da))||(cd<0&&(cd>-da||cd<-2*pai+da))||cd==0)
					this.object.translateX( actualMoveSpeed );
				else
			 	{			
					if(quadrant==1||quadrant==2)
						this.object.children[0].rotation.y=(this.object.children[0].rotation.y-10*Math.PI/180)%(2*pai);
					else 
						this.object.children[0].rotation.y=(this.object.children[0].rotation.y+10*Math.PI/180)%(2*pai);
				}	
			
			
			
				console.log("angle = "+cd+"quadratn="+quadrant);
			 	console.log("actualMoveSpeed = "+actualMoveSpeed);
			 	console.log("direction = "+this.object.children[0].rotation.y);
			 	console.log("delta = "+delta);
			 	
				 
					
			}
			if ( this.moveLeft ){
				if((cd>pai-da&&cd<pai+da)||(cd>-pai-da&&cd<-pai+da)||cd==pai||cd==-pai)
					this.object.translateX( -actualMoveSpeed );
				else
			 	{			
					if(quadrant==3||quadrant==4)
						this.object.children[0].rotation.y=(this.object.children[0].rotation.y-10*Math.PI/180)%(2*pai);
					else 
						this.object.children[0].rotation.y=(this.object.children[0].rotation.y+10*Math.PI/180)%(2*pai);
				}	
			
			
			
				console.log("angle = "+cd+"quadratn="+quadrant);
			 	console.log("actualMoveSpeed = "+actualMoveSpeed);
			 	console.log("direction = "+this.object.children[0].rotation.y);
<<<<<<< HEAD
			 	console.log("delta = "+delta);

			
			
			
			
			
			
			
			
				console.log("actualMoveSpeed = "+actualMoveSpeed);
				console.log("direction = "+this.object.children[0].rotation.y);
			 	console.log("delta = "+delta);
=======
			 	console.log("delta = "+delta);	
>>>>>>> Map adjustments + clean up
			} 

			if ( this.moveUp ) this.object.translateY( actualMoveSpeed );
			if ( this.moveDown ) this.object.translateY( - actualMoveSpeed );

			var actualLookSpeed = delta * this.lookSpeed;

			if ( !this.activeLook ) {

				actualLookSpeed = 0;

			}

			this.lon += this.mouseX * actualLookSpeed;
			if( this.lookVertical ) this.lat -= this.mouseY * actualLookSpeed; // * this.invertVertical?-1:1;

			this.lat = Math.max( - 85, Math.min( 85, this.lat ) );
			this.phi = ( 90 - this.lat ) * Math.PI / 180;
			this.theta = this.lon * Math.PI / 180;

			var targetPosition = this.target,
				position = this.object.position;

			targetPosition.x = position.x + 100 * Math.sin( this.phi ) * Math.cos( this.theta );
			targetPosition.y = position.y + 100 * Math.cos( this.phi );
			targetPosition.z = position.z + 100 * Math.sin( this.phi ) * Math.sin( this.theta );

		}

		var verticalLookRatio = 1;

		if ( this.constrainVertical ) {

			verticalLookRatio = Math.PI / ( this.verticalMax - this.verticalMin );

		}

		this.lon += this.mouseX * actualLookSpeed;
		if( this.lookVertical ) this.lat -= this.mouseY * actualLookSpeed * verticalLookRatio;

		this.lat = Math.max( - 85, Math.min( 85, this.lat ) );
		this.phi = ( 90 - this.lat ) * Math.PI / 180;

		this.theta = this.lon * Math.PI / 180;

		if ( this.constrainVertical ) {

			this.phi = THREE.Math.mapLinear( this.phi, 0, Math.PI, this.verticalMin, this.verticalMax );

		}

		var targetPosition = this.target,
			position = this.object.position;

		targetPosition.x = position.x + 100 * Math.sin( this.phi ) * Math.cos( this.theta );
		targetPosition.y = position.y + 100 * Math.cos( this.phi );
		targetPosition.z = position.z + 100 * Math.sin( this.phi ) * Math.sin( this.theta );

		this.object.lookAt( targetPosition );
	};


	this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );

	this.domElement.addEventListener( 'mousemove', bind( this, this.onMouseMove ), false );
	this.domElement.addEventListener( 'mousedown', bind( this, this.onMouseDown ), false );
	this.domElement.addEventListener( 'mouseup', bind( this, this.onMouseUp ), false );
	this.domElement.addEventListener( 'keydown', bind( this, this.onKeyDown ), false );
	this.domElement.addEventListener( 'keyup', bind( this, this.onKeyUp ), false );

	function getRegion(angle)
	{
		if(((angle>0&&angle<Math.PI/2)||(angle<0&&angle>-2*Math.PI&&angle<-1.5*Math.PI))||angle==0||angle==-2*Math.PI)
			return 1;
		else if(((angle>0&&angle<Math.PI&&angle>0.5*Math.PI)||(angle<0&&angle<-Math.PI&&angle>-1.5*Math.PI))||angle==Math.PI/2||angle==-1.5*Math.PI)
			return 2;
		else if(((angle>0&&angle>Math.PI&&angle<1.5*Math.PI)||(angle<0&&angle>-Math.PI&&angle<-0.5*Math.PI))||angle==Math.PI||angle==-Math.PI)
			return 3;
		else 
			return 4;	
			
	};
	function bind( scope, fn ) {

		return function () {

			fn.apply( scope, arguments );

		};

	};

	this.handleResize();

};