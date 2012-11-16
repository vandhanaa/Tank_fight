TankClient.js// Load libraries
var lib_path = "./";
console.log("loading files...");
loadScript(lib_path, "Tank.js");
loadScript("", "http://" + Game.SERVER_NAME + ":" + Game.PORT + "/socket.io/socket.io.js");

function TankClient(){
	//NETWORK
	var socket;			// socket used to connect to server
	var delay;			// delay simulated on current client
	var pause = false;
	var clock = new THREE.Clock();
	var cID = 1;
	
	//THREEJS
	var container, stats;
	var camera, scene, renderer, objects, controls,projector;
	var particleLight, pointLight;
	var dae, skin, obj, dae2, skin2, obj2;
	var loader = new THREE.ColladaLoader();
	var sphereMaterial = new THREE.MeshBasicMaterial({color: 0x333333});
	var sphereGeo = new THREE.SphereGeometry(5, 30, 30);
	
	//TANKS
	var sMyTank, sOppTank, cMyTank; //Tank objects in game 
	var tankCloseDistance = 50;
	//for loading tank
	var objects=[];
	var vel=7,velX, velZ;
	
		
	//AI
	var aispeed=10;
	
	//MAP
	var myMap = new Map();
	var WIDTH = window.innerWidth,
		HEIGHT = window.innerHeight,
		ASPECT = WIDTH / HEIGHT;
	var t = 0;
	
	//BULLETS
	var bullets = [];
	
	
	//GAME
	var tanks = [];
	var gameStarted = false;
	var gameStartTime = 0, serverStartTime = 0;
	var disconnected = false;
	var threshX=threshZ=100;
	
	//TO SERVER
	var lastPosX=-500,lastPosZ=-500,lastRotY=0;
	
	var sphereMaterial = new THREE.MeshBasicMaterial({
		color: 0x333333
	});
	var sphereGeo = new THREE.SphereGeometry(5, 30, 30);

	if(document.readyState==="complete")
	{
		
		div=document.createElement('div');
		div.innerHTML="Click to start";
		div.id="intro";
		div.style.width=WIDTH;
		div.style.height=HEIGHT;
		document.getElementById("mybody").appendChild(div);
	}

	loader.options.convertUpAxis = true;
	loader.load('./models/simple_tank1.dae', function(collada) {
		obj = new THREE.Object3D();
		dae = collada.scene;
		dae2 = new THREE.Object3D();
		dae.clone(dae2);
		dae.scale.x = dae.scale.y = dae.scale.z = 30;
		//dae.position.x = dae.startX = -500;
		dae.position.y = 0;
		//dae.position.z = dae.startZ = -500;
		dae.position.x = 0;
		dae.position.z = 0;
		dae.rotation.y = 0;
		dae.startX = dae.startZ = -500;
		dae.updateMatrix();
		dae.id = 1;
		obj.add(dae);
		obj.position.x = -500;
		obj.position.z = -500;
		obj.position.y = 0;
		//dae.rotation.y =  Math.PI/2;
		objects.push(obj);
		obj2 = new THREE.Object3D();
		dae2.scale.x = dae2.scale.y = dae2.scale.z = 30;
		dae2.position.x = dae2.startX = 0;
		dae2.position.y = 0;
		dae2.position.z = dae2.startZ = 0;
		dae2.rotation.y = 0;
		dae2.updateMatrix();
		dae2.id = 2;
		obj2.add(dae2);
		console.log("mobile jq");
		obj2.position.set(0, 0, 0);
		//dae2.rotation.y =  Math.PI/2;
		objects.push(obj2);
		//cloaded = true;
		init();
		setInterval(function() {
			render();
		}, 1000 / 60); //Request animation frame is 60fps
	});
	var spinTank = function (angle,id) {
		new TWEEN.Tween({
			y : objects[id-1].children[0].rotation.y
		})
		.to({
			y : angle
		}, 100)
		.onUpdate(function () {
			objects[id-1].children[0].rotation.y = this.y;
		})
		.start();
	}	
	
	var moveTank = function (pos,id) {
		new TWEEN.Tween({
			x : objects[id-1].position.x,
			z : objects[id-1].position.z
		})
		.to({
			x : pos.x,
			z : pos.z
		}, 100)
		.onUpdate(function () {
			objects[id-1].position.x = this.x;
			objects[id-1].position.z = this.z;
		})
		.start();
	}

	/*=====================
	initNetwork [Private]
	=====================*/

	var initNetwork = function() {
			// Attempts to connect to game server
			try {
				socket = io.connect("http://" + Game.SERVER_NAME + ":" + Game.PORT);
				//pinging and stuff like that.
				// var curTime = Date.now();
				// socket.emit("ping", {x: curTime});)
				// socket.on("ping", function(data) {
				// 	curTime = date.now();
				// 	RTT = curTime - data.oldTime;
				// 	console.log("RTT = " + RTT);
				// });
				// Upon receiving a message tagged with "serverMsg", along with an obj "data"
				socket.on("serverMsg", function(data) {
					console.log("serverMsg " + data.msg);
				});

				// // Getting player info upon connection to server
				socket.on("playerDetails", function(data) {
					cID = data.playerNo;
					if(data.playerNo === 1) {
						sMyTank = new Tank(data.xValue1, data.zValue1);
						sMyTank.cID = 1;
						sOppTank = new Tank(data.xValue2, data.zValue2);
						sOppTank.cID = 2;
						cMyTank = new Tank(data.xValue1, data.zValue1);
						tanks.push(sMyTank);
						tanks.push(sOppTank);
					} else {
						sMyTank = new Tank(data.xValue2, data.zValue2);
						sMyTank.cID = 2;
						sOppTank = new Tank(data.xValue1, data.zValue1);
						sOppTank.cID = 1;
						cMyTank = new Tank(data.xValue2, data.zValue2);
						tanks.push(sMyTank);
						tanks.push(sOppTank);
					}

					if(data.playerNo === 2) {
						controls = new THREE.FirstPersonControls(objects, 2);
						controls.movementSpeed = 0;
						controls.lookSpeed = 0;
						controls.lookVertical = false;
						controls.noFly = true;
						controls.activeLook = false;
					}

					setInterval(function() {
						updateServer();
					}, 50);
				});

				// Upon receiving a message tagged with "update", along with an obj "data"
				socket.on("update", function(data) {
					if(cID === 1) {
						moveTank(new THREE.Vector3(data.oppX,0,data.oppZ), 2);
						spinTank(data.oppRot+Math.PI/2, 2);
						//obj2.position.x = data.oppX;
						//obj2.position.z = data.oppZ;
						//dae2.rotation.y = data.oppRot + Math.PI / 2;
						//dae2.rotation.y = data.oppRot;
					} else
					 {
						
						moveTank(new THREE.Vector3(data.oppX,0,data.oppZ),1);
						spinTank(data.oppRot,1);
						
						//obj.position.x = data.oppX;
						//obj.position.z = data.oppZ;
						//dae.rotation.y = data.oppRot;
					}
				});
				socket.on("startGame", function(data) {
					gameStarted = true;
					controls.movementSpeed = 5000;
					gameStartTime = Date.now();
					//serverStartTime = data.sTime;
					console.log("Game started!");
					document.getElementById("intro").style.display="none";
				});

				socket.on("createBullet", function(data) {
					console.log("Creating bullet for player " +data.playerID);
					createOppBullet(data);
				});

				socket.on("updateBullet", function(data){

				});

				socket.on("endGame", function(data) {});

				// Upon disconnecting from server
				socket.on("disconnect", function() {
					console.log("You have disconnected from game server.");
					disconnected = true;
				});

			} catch(e) {
				console.log("Failed to connect to " + "http://" + Game.SERVER_NAME + ":" + Game.PORT);
				console.log(e);
			}
		}

		//initGame


	function init() {
		container = document.createElement('div');
		document.body.appendChild(container);
		
		Game.HEIGHT = window.innerHeight;
		Game.WIDTH = window.innerWidth;

		console.log("game width:" + Game.HEIGHT + " " + Game.WIDTH);
		camera = new THREE.OrthographicCamera(window.innerWidth / -1, window.innerWidth / 1, window.innerHeight / 1, window.innerHeight / -1, -1000, 1000);
		camera.position.x = 55; //60
		camera.position.y = 45; //45
		camera.position.z = 0;

		scene = new THREE.Scene();

		setupScene();
		projector = new THREE.Projector();

		document.addEventListener("click", function(e) {
			e.preventDefault;
			if(gameStarted) {
				if(e.which === 1) { // Left click only
					createBullet(cID);
					socket.emit("createBullet", {
						playerID: cID
					});
				}
			} else {
				socket.emit("start", {});
			}
		}, false);

		document.addEventListener("keydown", function(e) {
			e.preventDefault;
			//console.log(e.keyCode);
			if(gameStarted && e.keyCode === 32) {
				createBullet(cID);
				socket.emit("createBullet", {
					playerID: cID
				});
			}
		}, false);

		scene.add(obj);
		scene.add(obj2);

		controls = new THREE.FirstPersonControls(objects, 1);
		controls.movementSpeed = 0;
		controls.lookSpeed = 0;
		controls.lookVertical = false;
		controls.noFly = true;
		controls.activeLook = false;

		// Lights
		scene.add(new THREE.AmbientLight(0xcccccc));

		var directionalLight = new THREE.DirectionalLight(0xeeeeee);
		directionalLight.position.x = -150;
		directionalLight.position.y = 150;
		directionalLight.position.z = -150;
		directionalLight.position.normalize();
		scene.add(directionalLight);

		renderer = new THREE.WebGLRenderer();
		renderer.setSize(window.innerWidth, window.innerHeight);
		container.appendChild(renderer.domElement);

		stats = new Stats();
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.top = '0px';
		container.appendChild(stats.domElement);

		//window.addEventListener('resize', onWindowResize, false);
	}

	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize(window.innerWidth, window.innerHeight);
		document.getElementByID("intro").style.width=window.innerWidth;
		document.getElementByID("intro").style.height=window.innerHeight;
		
		document.getElementByID("hurt").style.width=window.innerWidth;
		document.getElementByID("hurt").style.height=window.innerHeight;
		/*$('#intro, #hurt').css({
			width: window.innerWidth,
			height: window.innerHeight
		});*/
	}

	function render() {
		if(disconnected) {
			//$(renderer.domElement).fadeOut();
			//$('#intro').fadeIn();
			//$('#intro').html('You have been disconnected!');
			
			
			renderer.domElement.style.opacity=0;
			document.getElementById("intro").style.display="block";	
			//document.getElementById("intro").style.visibility="visible
			document.getElementById("intro").innerHTML='You have been disconnected!';
			return;
		}
		var timer = Date.now() * 0.0005;
		var delta = clock.getDelta();
		controls.update(0.001);
		camera.lookAt(scene.position);

		TWEEN.update();
			
		//Simple bullet moving
		for(var i = bullets.length - 1; i >= 0; i--) {
			var b = bullets[i];
			var aim = checkTankCollision(b);
			if(myMap.checkWallCollision(b.position) || aim != -1) {
				console.log("endpoint" + b.position);
				console.log("steps " + b.stepX);
				bullets.splice(i, 1);
				scene.remove(b);
				if(aim != -1) {
					for(j = 0; j < tanks.length; j++)
					if(tanks[j].cID == aim + 1) {
						tanks[j].health -= 10;
						console.log("aim is  " + aim + " with health" + tanks[j].health);
					}
				}
				continue;
			} else {
				b.translateX(b.velX);
				b.translateZ(b.velZ);
				b.stepX = b.stepX + 1;
			}
		}
		renderer.render(scene, camera);
		stats.update();
	}

	function createBullet(cID) {
		
		//moveTank(new THREE.Vector3(100,0,100));
		//spinTank(Math.PI);
		var sphere = new THREE.Mesh(sphereGeo, sphereMaterial);
		sphere.position.set(objects[cID - 1].position.x, objects[cID - 1].position.y + 25, objects[cID - 1].position.z);

		sphere.velX = -vel * Math.sin(objects[cID - 1].children[0].rotation.y % (2 * Math.PI));
		sphere.velZ = -vel * Math.cos(objects[cID - 1].children[0].rotation.y % (2 * Math.PI));
		sphere.cID = cID;
		sphere.stepX = 0;

		sMyTank.x = objects[cID - 1].position.x;
		sMyTank.z = objects[cID - 1].position.z;
		sMyTank.rotationY = objects[cID - 1].children[0].rotation.y % (2 * Math.PI);
		sMyTank.endPoint();

		//var corner = sMyTank.getCorners();
		//console.log("corner = " +sMyTank.getCorners());
		//console.log("roty = " + (sMyTank.rotationY % (2 * Math.PI))*180/Math.PI + " x = " + sMyTank.x + " z = " + sMyTank.z);
		setTimeout(function() {
			bullets.push(sphere);
		}, 50);
		scene.add(sphere);
	}

	function createOppBullet(data) {
		var player = data.playerID;
		var sphere = new THREE.Mesh(sphereGeo, sphereMaterial);
		sphere.position.set(objects[player - 1].position.x, objects[player - 1].position.y + 25, objects[player - 1].position.z);
		var curGameTime = Date.now()-gameStartTime;
		var timeToMove = data.predTime - curGameTime;
		var angle;
		if(player === 1) {
			angle = objects[player - 1].children[0].rotation.y;
		} else {
			angle = objects[player - 1].children[0].rotation.y - Math.PI / 2;
		}
		sphere.velX = (data.endX - objects[player - 1].position.x)/(timeToMove/(1000/60));
		sphere.velZ = (data.endZ - objects[player - 1].position.z)/(timeToMove/(1000/60));
		sphere.cID = player;
		sphere.stepX = 0;
		bullets.push(sphere);
		scene.add(sphere);
	}

	function setupScene() {
		var units = myMap.mapW;
		// Geometry: floor
		var floor = new THREE.Mesh(
		new THREE.CubeGeometry(units * (myMap.UNITSIZE), 1, units * (myMap.UNITSIZE)), new THREE.MeshLambertMaterial({
			map: THREE.ImageUtils.loadTexture('wall-2.jpg')
		}));
		scene.add(floor);

		// Geometry: walls
		var cube = new THREE.CubeGeometry(myMap.UNITSIZE, myMap.WALLHEIGHT, myMap.UNITSIZE);
		var materials = [
		new THREE.MeshLambertMaterial({
			map: THREE.ImageUtils.loadTexture('wall-1.jpg')
		}), new THREE.MeshLambertMaterial({
			map: THREE.ImageUtils.loadTexture('wall-1.jpg')
		}), ];

		for(var i = 0; i < myMap.mapW; i++) {
			for(var j = 0, m = myMap.map[i].length; j < m; j++) {
				if(myMap.map[i][j]) {
					var wall = new THREE.Mesh(cube, materials[myMap.map[i][j] - 1]);
					wall.position.x = (i - units / 2) * myMap.UNITSIZE + 100;
					wall.position.y = myMap.WALLHEIGHT / 2;
					wall.position.z = (j - units / 2) * myMap.UNITSIZE + 100;
					scene.add(wall);
				}
			}
		}
		var sphereGeo2 = new THREE.SphereGeometry(30, 30, 30);
		var sphere1 = new THREE.Mesh(sphereGeo2, sphereMaterial);
		sphere1.position.set(800,myMap.WALLHEIGHT, 800);
		scene.add(sphere1);
		var sphere2 = new THREE.Mesh(sphereGeo2, sphereMaterial);
		sphere2.position.set(-800,myMap.WALLHEIGHT, -800);
		scene.add(sphere2);
		var sphere3 = new THREE.Mesh(sphereGeo2, sphereMaterial);
		sphere3.position.set(800,myMap.WALLHEIGHT, -800);
		scene.add(sphere3);
		var sphere4 = new THREE.Mesh(sphereGeo2, sphereMaterial);
		sphere4.position.set(-800,myMap.WALLHEIGHT, 800);
		scene.add(sphere4);
	}

	/*==================
	start [Privileged]
	==================*/
	this.start = function() {
		// Initialize game objects
		//date = new Date();
		//delay = 0;
		// rendInterval = undefined;
		// simInterval = undefined;
		// Initialize network
		initNetwork();
	}

	
	function updateServer() {

		//if(cID===1)
		//	socket.emit("move", {newX: obj.position.x, newZ: obj.position.z, rotY: dae.rotation.y});
		//else
		//	socket.emit("move", {newX: obj2.position.x, newZ: obj2.position.z, rotY: dae2.rotation.y});

		if (cID === 1)
		{
			//if( (Math.abs(obj.position.x-lastPosX)>threshX||Math.abs(obj.position.z-lastPosZ)>threshZ)&&lastRotY!=dae.rotation.y)
			{
				//lastPosX=obj.position.x;lastPosZ=obj.position.z;lastRotY=dae.rotation.y
				//console.log("Updatin server");
				socket.emit("move", {
					newX : obj.position.x,
					newZ : obj.position.z,
					rotY : dae.rotation.y
				});
			}
		}
		else
		{
			//if((Math.abs(obj2.position.x-lastPosX)>threshX||(Math.abs(obj2.position.z-lastPosZ)>threshZ))&&lastRotY!=dae2.rotation.y)	
			{
				//lastPosX=obj2.position.x;lastPosZ=obj2.position.z;lastRotY=dae2.rotation.y
				//console.log("Updatin server");
				socket.emit("move", {
					newX : obj2.position.x,
					newZ : obj2.position.z,
					rotY : dae2.rotation.y
				});
			}
		}

	}

	function getDistance(pos1, pos2) {
		return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.z - pos2.z, 2));
	}

	function checkTankCollision(bullet) {
		for(i = 0; i < objects.length; i++) {
			if(i == bullet.cID - 1) continue;
			else {
				var center = objects[i].position.clone();
				
				if(getDistance(bullet.position, center) < tankCloseDistance) return i;
			}
		}
		return -1;
	}
}

// This will auto run after this script is loaded
// Run Client. Give leeway of 0.1 second for libraries to load
var client = new TankClient();
setTimeout(function() {
	client.start();
}, 1000);
