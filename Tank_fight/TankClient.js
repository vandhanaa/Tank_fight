var container, stats;

var camera, scene, renderer, objects, controls;
var particleLight, pointLight;
var dae, skin, obj;

var loader = new THREE.ColladaLoader();

loader.options.convertUpAxis = true;
loader.load( './models/simple_tank1.dae', function ( collada ) {
	obj = new THREE.Object3D();
	dae = collada.scene;
	skin = collada.skins[1];
	dae.scale.x = dae.scale.y = dae.scale.z = 25;
	dae.position.x = 500;
	dae.position.y = 0;
	dae.position.z = 0;
	dae.updateMatrix();
	obj.add(dae);
	// dae.rotation.x =  Math.PI;
	// dae.rotation.z = - Math.PI/2;
	// dae.rotation.y = - Math.PI/1;
	//dae.
	//obj.matrixAutoUpdate = true;
	
	init();
	animate();

} );

function init() {
	container = document.createElement( 'div' );
	document.body.appendChild( container );

	camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, - 2000, 1000 );
	camera.position.x = 200;
	camera.position.y = 150;
	camera.position.z = 10;

	scene = new THREE.Scene();

	// Grid

	var size = 500, step = 50;

	var geometry = new THREE.Geometry();

	for ( var i = - size; i <= size; i += step ) {

		geometry.vertices.push( new THREE.Vector3( - size, 0, i ) );
		geometry.vertices.push( new THREE.Vector3(   size, 0, i ) );

		geometry.vertices.push( new THREE.Vector3( i, 0, - size ) );
		geometry.vertices.push( new THREE.Vector3( i, 0,   size ) );

	}

	var line = new THREE.Line( geometry, material, THREE.LinePieces );
	scene.add( line );

	particleLight = new THREE.Mesh( new THREE.SphereGeometry( 4, 8, 8 ), new THREE.MeshBasicMaterial( { color: 0x008000 } ) );
	scene.add( particleLight );

	var geometry2 = new THREE.CubeGeometry( 50, 50, 50);
	var material = new THREE.MeshLambertMaterial( { color: 0xfff000, shading: THREE.FlatShading, overdraw: false	 } );

	for ( var i = 0; i < 10; i ++ ) {

		var cube = new THREE.Mesh( geometry2, material );

		cube.scale.y = Math.floor( Math.random() * 2 + 1 );

		cube.position.x = Math.floor( ( Math.random() * 1000 - 500 ) / 50 ) * 50 + 25;
		cube.position.y = ( cube.scale.y * 50 ) / 2;
		cube.position.z = Math.floor( ( Math.random() * 1000 - 500 ) / 50 ) * 50 + 25;

		scene.add( cube );
	}

	scene.add(obj);

		controls = new THREE.FirstPersonControls(obj);
		controls.movementSpeed = 10000;
		controls.lookSpeed = 15;
		controls.lookVertical = false; // Temporary solution; play on flat surfaces only
		controls.noFly = true;

	// Lights

	scene.add( new THREE.AmbientLight( 0xcccccc ) );

	var directionalLight = new THREE.DirectionalLight(/*Math.random() * 0xffffff*/0xeeeeee );
	// directionalLight.position.x = Math.random() - 0.5;
	// directionalLight.position.y = Math.random() - 0.5;
	// directionalLight.position.z = Math.random() - 0.5;
	directionalLight.position.x = -150;
	directionalLight.position.y = 150;
	directionalLight.position.z = -150;
	directionalLight.position.normalize();
	scene.add( directionalLight );

	pointLight = new THREE.PointLight( 0xffffff, 4 );
	pointLight.position = particleLight.position;
	//scene.add( pointLight );

	renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );

	container.appendChild( renderer.domElement );

	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	container.appendChild( stats.domElement );

	window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

var t = 0;
var clock = new THREE.Clock();

function animate() {

	var delta = clock.getDelta();

	requestAnimationFrame( animate );

	if ( t > 1 ) t = 0;

	if ( skin ) {

		// guess this can be done smarter...

		// (Indeed, there are way more frames than needed and interpolation is not used at all
		//  could be something like - one morph per each skinning pose keyframe, or even less,
		//  animation could be resampled, morphing interpolation handles sparse keyframes quite well.
		//  Simple animation cycles like this look ok with 10-15 frames instead of 100 ;)

		for ( var i = 0; i < skin.morphTargetInfluences.length; i++ ) {

			skin.morphTargetInfluences[ i ] = 0;

		}

		skin.morphTargetInfluences[ Math.floor( t * 30 ) ] = 1;

		t += delta;

	}

	render();
	stats.update();

}

function render() {

	var timer = Date.now() * 0.0005;
	var delta = clock.getDelta();
	scene.remove(obj);
	controls.update(delta);
					
	scene.add(obj);
	camera.lookAt( scene.position );

	particleLight.position.x = Math.sin( timer * 4 ) * 3009;
	particleLight.position.y = Math.cos( timer * 5 ) * 4000;
	particleLight.position.z = Math.cos( timer * 4 ) * 3009;

	renderer.render( scene, camera );

}