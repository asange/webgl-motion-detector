/**
 * Copyright (C) 2013-2016, Markus Sprunck
 * 
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met: -
 * Redistributions of source code must retain the above copyright notice, this
 * list of conditions and the following disclaimer. - Redistributions in binary
 * form must reproduce the above copyright notice, this list of conditions and
 * the following disclaimer in the documentation and/or other materials provided
 * with the distribution. - The name of its contributor may be used to endorse
 * or promote products derived from this software without specific prior written
 * permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 * 
 */

/**
 * Global constants
 */
var BORDER_LEFT = 10;
var BORDER_TOP = 10;
var BORDER_RIGHT = 10;
var BORDER_BOTTOM = 60;

/**
 * Global variables for rendering
 */
var g_panelWidthWebGL;
var g_panelHeightWebGL;
var g_scene;
var g_cube_wireframe;
var g_camera;
var g_renderer;
var g_control;
var g_gui;
var detectorPosition = {
	x : 0,
	y : 0
};
var g_stats, g_camera, g_scene, g_renderer;
var g_motionDetector;
var g_teddy;

function init() {

	// Add container
	g_scene = new THREE.Scene();
	var container = document.getElementById('drawingArea');

	// Add camera
	HEIGHT = window.innerHeight;
	WIDTH = window.innerWidth;
	g_camera = new THREE.PerspectiveCamera(50, WIDTH / HEIGHT, 1, 2000);
	g_scene.add(g_camera);
	g_camera.position.set(0, 200, 800);
	g_camera.lookAt(g_scene.position);

	// Add renderer
	g_renderer = new THREE.WebGLRenderer({
		alpha : true,
		antialias : true
	});
	g_renderer.shadowMap.enabled = true;

	// Support window resize
	var resizeCallback = function() {
		g_camera.aspect = window.innerWidth / window.innerHeight;
		g_camera.updateProjectionMatrix();
		g_renderer.setSize(window.innerWidth, window.innerHeight);
	}
	window.addEventListener('resize', resizeCallback, false);
	resizeCallback();
	container.appendChild(g_renderer.domElement);

	// Add motion detector
	g_motionDetector = new SimpleMotionDetector(g_camera);
	g_motionDetector.domElement.style.position = 'absolute';
	g_motionDetector.domElement.style.right = '10px';
	g_motionDetector.domElement.style.bottom = '10px';
	g_motionDetector.init();
	container.appendChild(g_motionDetector.domElement);

	// Add dialog to change parameters
	g_gui = new dat.GUI({
		autoPlace : false
	});
	g_gui.add(g_motionDetector, 'showCanvas').name('show canvas').onChange(function(value) {
		document.getElementById('video_canvas').hidden = !value;
	});
	g_gui.add(g_motionDetector, 'offsetAlpha', -450.0, 450.0, 10).name('offset α');
	g_gui.add(g_motionDetector, 'offsetGamma', -450.0, 450.0, 10).name('offset γ');
	g_gui.add(g_motionDetector, 'amplificationAlpha', 0.1, 2.0, 0.1).name('amplification α');
	g_gui.add(g_motionDetector, 'amplificationGamma', 0.1, 2.0, 0.1).name('amplification γ');
	g_gui.add(g_motionDetector, 'detectionBorder', 0.25, 1.0, 0.05).name('detection border');
	g_gui.add(g_motionDetector, 'pixelThreshold', 50, 250, 10).name('pixel threshold');
	g_gui.add(g_motionDetector.averageX, 'maxLength', 200, 2000, 100).name('averager X');
	g_gui.add(g_motionDetector.averageY, 'maxLength', 200, 2000, 100).name('averager Y');
	g_gui.domElement.style.position = 'absolute';
	g_gui.domElement.style.left = '10px';
	g_gui.domElement.style.top = '10px';
	g_gui.close();
	container.appendChild(g_gui.domElement);

	var resizeCallback = function() {
		g_panelWidthWebGL = window.innerWidth - BORDER_RIGHT - BORDER_LEFT;
		g_panelHeightWebGL = window.innerHeight - BORDER_BOTTOM - BORDER_TOP;
		var devicePixelRatio = window.devicePixelRatio || 1;
		g_renderer.setSize(g_panelWidthWebGL * devicePixelRatio, g_panelHeightWebGL * devicePixelRatio);
		g_renderer.domElement.style.width = g_panelWidthWebGL + 'px';
		g_renderer.domElement.style.height = g_panelHeightWebGL + 'px';
		g_camera.updateProjectionMatrix();
		g_gui.domElement.style.position = 'absolute';
		g_gui.domElement.style.left = '' + (BORDER_LEFT) + 'px';
		g_gui.domElement.style.top = '' + (BORDER_TOP) + 'px';
	};
	window.addEventListener('resize', resizeCallback, false);
	resizeCallback();

	createLights();
	createFloor();
	createTeddy();
}

function createLights() {

	var hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x101010, 0.8)
	g_scene.add(hemisphereLight);

	var ambientLight = new THREE.AmbientLight(0x2f2f2f)
	g_scene.add(ambientLight);

	var sunLight = new THREE.DirectionalLight(0x606060, .3);
	sunLight.position.set(300, 600, 500);
	sunLight.castShadow = true;
	sunLight.shadow = new THREE.LightShadow(new THREE.PerspectiveCamera());
	g_scene.add(sunLight);
}

function createFloor() {

	var groundMaterial = new THREE.MeshPhongMaterial({
		shininess : 80,
		color : 0xafafaf,
		specular : 0xffffff
	});
	floor = new THREE.Mesh(new THREE.PlaneBufferGeometry(1500, 1500), groundMaterial);
	floor.rotation.x = -Math.PI / 2;
	floor.position.y = -40;
	floor.receiveShadow = true;
	g_scene.add(floor);
}

function createTeddy() {

	g_teddy = new Teddy();
	g_scene.add(g_teddy.allGroup);
}

function animate() {

	// Move the bear
	detectorPosition.x = g_motionDetector.offsetAlpha + g_motionDetector.amplificationAlpha * g_motionDetector.averageX.getValue();
	detectorPosition.y = g_motionDetector.offsetGamma + g_motionDetector.amplificationGamma * g_motionDetector.averageY.getValue();
	g_teddy.move(detectorPosition.x, detectorPosition.y, 100, 100);

	// Render scene
	requestAnimationFrame(animate);
	g_renderer.render(g_scene, g_camera);
}

// Now create scene and render
if (Detector.webgl) {
	init();
	animate();
} else {
	document.body.appendChild(Detector.getWebGLErrorMessage());
}
