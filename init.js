onload = init;

const ORBIT_STEP = 0.01;
const TRANSLATION_FACTOR = 200;
const BACKGROUND_COLOR = [0.3921, 0.5843, 0.9294, 1.0];

class Model {
	fileName;
	g_objDoc;
	g_drawingInfo;
	vertexBuffer;
	normalBuffer;
	colorBuffer;
	indexBuffer;

	constructor(fileName) {
		this.fileName = fileName;
	}
}

function init() {
	var canvas = document.getElementById("c");
	var gl = setupWebGL(canvas);
	if (!gl) {
		return;
	}

	var program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);
	gl.vBuffer = null;
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);

	// === Setup UI ===
	var translation = [0, -2, 0];
	var rotation = [0, 0, 0];
	var scaleValues = [1, 1, 1];
	var orbitRadius = 4.5;
	var orbitAngle = 0;
	var shouldOrbit = false;

	var lightDirection = vec4(0.0, 0.0, -1.0, 0.0);
	var lightEmission = vec4(1.0, 1.0, 1.0, 1.0);
	var lightAmbient = vec4(0.3, 0.3, 0.3, 1.0);
	var materialDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
	var materialSpecular = vec4(0.5, 0.5, 0.5, 1.0);
	var materialShininess = 200.0;
	var emissionCoefficient = vec4(1.0, 1.0, 1.0, 1.0);
	var ambientCoefficient = vec4(1.0, 1.0, 1.0, 1.0);
	var diffuseCoefficient = vec4(1.0, 1.0, 1.0, 1.0);
	var specularCoefficient = vec4(1.0, 1.0, 1.0, 1.0);

	var emissionAll = 1.0;
	var specularAll = 1.0;
	var diffuseAll = 1.0;
	var ambient = 1.0;

	// https://webglfundamentals.org/webgl/lessons/webgl-3d-orthographic.html
	webglLessonsUI.setupSlider("#x", { value: translation[0], slide: updatePosition(0), min: -gl.canvas.width, max: gl.canvas.width });
	webglLessonsUI.setupSlider("#y", { value: translation[1], slide: updatePosition(1), min: -gl.canvas.height, max: gl.canvas.height });
	webglLessonsUI.setupSlider("#z", { value: translation[2], slide: updatePosition(2), min: -gl.canvas.height, max: gl.canvas.height });
	webglLessonsUI.setupSlider("#angleX", { value: rotation[0], slide: updateRotation(0), max: 360 });
	webglLessonsUI.setupSlider("#angleY", { value: rotation[1], slide: updateRotation(1), max: 360 });
	webglLessonsUI.setupSlider("#angleZ", { value: rotation[2], slide: updateRotation(2), max: 360 });
	webglLessonsUI.setupSlider("#scaleX", { value: scaleValues[0], slide: updateScale(0), min: -5, max: 5, step: 0.01, precision: 2 });
	webglLessonsUI.setupSlider("#scaleY", { value: scaleValues[1], slide: updateScale(1), min: -5, max: 5, step: 0.01, precision: 2 });
	webglLessonsUI.setupSlider("#scaleZ", { value: scaleValues[2], slide: updateScale(2), min: -5, max: 5, step: 0.01, precision: 2 });
	webglLessonsUI.setupSlider("#orbitR", { value: orbitRadius, slide: updateOrbitRadius(), min: 0, max: 10, step: 0.01, precision: 2 });
	webglLessonsUI.setupSlider("#dirX", { value: lightDirection[0], slide: updateLightDirection(0), min: -20, max: 20, step: 0.01, precision: 2 });
	webglLessonsUI.setupSlider("#dirY", { value: lightDirection[1], slide: updateLightDirection(1), min: -20, max: 20, step: 0.01, precision: 2 });
	webglLessonsUI.setupSlider("#dirZ", { value: lightDirection[2], slide: updateLightDirection(2), min: -20, max: 20, step: 0.01, precision: 2 });
	webglLessonsUI.setupSlider("#emissionR", { value: lightEmission[0], slide: updateLightEmission(0), min: 0, max: 1, step: 0.01, precision: 2 });
	webglLessonsUI.setupSlider("#emissionG", { value: lightEmission[1], slide: updateLightEmission(1), min: 0, max: 1, step: 0.01, precision: 2 });
	webglLessonsUI.setupSlider("#emissionB", { value: lightEmission[2], slide: updateLightEmission(2), min: 0, max: 1, step: 0.01, precision: 2 });
	webglLessonsUI.setupSlider("#specularR", { value: materialSpecular[0], slide: updateMaterialSpecular(0), min: 0, max: 1, step: 0.01, precision: 2 });
	webglLessonsUI.setupSlider("#specularG", { value: materialSpecular[1], slide: updateMaterialSpecular(1), min: 0, max: 1, step: 0.01, precision: 2 });
	webglLessonsUI.setupSlider("#specularB", { value: materialSpecular[2], slide: updateMaterialSpecular(2), min: 0, max: 1, step: 0.01, precision: 2 });
	webglLessonsUI.setupSlider("#diffuseR", { value: materialDiffuse[0], slide: updateMaterialDiffuse(0), min: 0, max: 1, step: 0.01, precision: 2 });
	webglLessonsUI.setupSlider("#diffuseG", { value: materialDiffuse[1], slide: updateMaterialDiffuse(1), min: 0, max: 1, step: 0.01, precision: 2 });
	webglLessonsUI.setupSlider("#diffuseB", { value: materialDiffuse[2], slide: updateMaterialDiffuse(2), min: 0, max: 1, step: 0.01, precision: 2 });
	webglLessonsUI.setupSlider("#emissionAll", { value: emissionAll, slide: updateEmissionAll(), min: 0, max: 3, step: 0.01, precision: 2 });
	webglLessonsUI.setupSlider("#diffuseAll", { value: diffuseAll, slide: updateDiffuseAll(), min: 0, max: 3, step: 0.01, precision: 2 });
	webglLessonsUI.setupSlider("#specularAll", { value: specularAll, slide: updateSpecularAll(), min: 0, max: 3, step: 0.01, precision: 2 });
	webglLessonsUI.setupSlider("#shininess", { value: materialShininess, slide: updateMaterialShininess(), min: 0, max: 500, step: 0.01, precision: 2 });
	webglLessonsUI.setupSlider("#ambient", { value: ambient, slide: updateAmbient(), min: 0, max: 3, step: 0.01, precision: 2 });

	var toggleOrbitButton = document.getElementById("orbit");
	toggleOrbitButton.addEventListener("click", () => {
		shouldOrbit = !shouldOrbit;
		orbit();
	})

	function updatePosition(index) {
		return function (event, ui) {
			translation[index] = ui.value / TRANSLATION_FACTOR;
			render();
		};
	}

	function updateRotation(index) {
		return function (event, ui) {
			rotation[index] = ui.value;
			render();
		};
	}

	function updateScale(index) {
		return function (event, ui) {
			scaleValues[index] = ui.value;
			render();
		};
	}

	function updateEmissionAll() {
		return function (event, ui) {
			emissionAll = ui.value;
			render();
		};
	}

	function updateSpecularAll() {
		return function (event, ui) {
			specularAll = ui.value;
			render();
		};
	}

	function updateDiffuseAll() {
		return function (event, ui) {
			diffuseAll = ui.value;
			render();
		};
	}

	function updateAmbient() {
		return function (event, ui) {
			ambient = ui.value;
			render();
		};
	}

	function updateLightDirection(index) {
		return function (event, ui) {
			lightDirection[index] = ui.value;
			render();
		};
	}

	function updateLightEmission(index) {
		return function (event, ui) {
			lightEmission[index] = ui.value;
			render();
		};
	}

	function updateMaterialSpecular(index) {
		return function (event, ui) {
			materialSpecular[index] = ui.value;
			render();
		};
	}

	function updateMaterialDiffuse(index) {
		return function (event, ui) {
			materialDiffuse[index] = ui.value;
			render();
		};
	}

	function updateMaterialShininess() {
		return function (event, ui) {
			materialShininess = ui.value;
			render();
		};
	}

	function updateOrbitRadius() {
		return function (event, ui) {
			orbitRadius = ui.value;
			render();
		};
	}

	// === Load model data ===
	var filesToLoad = [
		"models/test1.obj",
		"models/test2.obj"
	];
	var models = [];

	var a_Position = gl.getAttribLocation(program, "a_Position");
	var a_Normal = gl.getAttribLocation(program, "a_Normal");
	var a_Color = gl.getAttribLocation(program, "a_Color");

	for(var i = 0; i < filesToLoad.length; i++) {
		models[i] = new Model(filesToLoad[i]);
		initVertexBuffers(models[i]);
		readOBJFile(models[i], gl, 1, false);
	}

	function initVertexBuffers(model) {
		model.vertexBuffer = createEmptyArrayBuffer(gl, a_Position, 3, gl.FLOAT);
		model.normalBuffer = createEmptyArrayBuffer(gl, a_Normal, 3, gl.FLOAT);
		model.colorBuffer = createEmptyArrayBuffer(gl, a_Color, 4, gl.FLOAT);
		model.indexBuffer = gl.createBuffer();
	}

	function createEmptyArrayBuffer(gl, a_attribute, num, type) {
		var buffer = gl.createBuffer(); // Create a buffer object

		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
		gl.enableVertexAttribArray(a_attribute); // Enable the assignment

		return buffer;
	}

	// Read a file
	function readOBJFile(model, gl, scale, reverse) {
		var request = new XMLHttpRequest();
		request.onreadystatechange = function () {
			if (request.readyState === 4 && request.status !== 404) {
				onReadOBJFile(request.responseText, model.fileName, gl, model, scale, reverse);
			}
		}
		request.open("GET", model.fileName, true); // Create a request to get file
		request.send(); // Send the request
	}

	// OBJ file has been read
	function onReadOBJFile(fileString, fileName, gl, model, scale, reverse) {
		var objDoc = new OBJDoc(model.fileName); // Create a OBJDoc object
		var result = objDoc.parse(fileString, scale, reverse);
		if (!result) {
			model.g_objDoc = null; model.g_drawingInfo = null;
			console.log("OBJ file parsing error for file " + model.fileName);
			return;
		}
		model.g_objDoc = objDoc;
	}

	function onReadComplete(gl, model) {
		// Acquire the vertex coordinates and colors from OBJ file
		var drawingInfo = model.g_objDoc.getDrawingInfo();

		// Write data into the buffer object
		gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);

		// Write the indices to the buffer object
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

		model.g_drawingInfo = drawingInfo;
	}

	function switchBuffers(model) {
		gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
		gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
		gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
		gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
	}

	function updateMatrices() {
		// Last transformation in multiplication is first to be applied
		var mMat = mat4();
		mMat = mult(mMat, translate(translation[0], translation[1], translation[2]));
		mMat = mult(mMat, rotate(rotation[0], vec3(1, 0, 0)));
		mMat = mult(mMat, rotate(rotation[1], vec3(0, 1, 0)));
		mMat = mult(mMat, rotate(rotation[2], vec3(0, 0, 1)));
		mMat = mult(mMat, scale(scaleValues[0], scaleValues[1], scaleValues[2]));
		var mvMat = mult(vMat, mMat);
		var mvpMat = mult(pMat, mvMat);

		var N = normalMatrix(mvMat, false);
		gl.uniformMatrix3fv(uNMatrix, false, flatten(N));
		gl.uniformMatrix4fv(umvMatrix, false, flatten(mvMat));
		gl.uniformMatrix4fv(umvpMatrix, false, flatten(mvpMat));
	}

	function updateLight() {
		gl.uniform4fv(uLightPosition, lightDirection);
		gl.uniform1f(uMaterialShininess, materialShininess);
		var ambientProduct = multVecByScalar(ambient, mult(ambientCoefficient, lightAmbient));
		gl.uniform4fv(uLightAmbinet, ambientProduct);
		var emissionProduct = multVecByScalar(emissionAll, mult(emissionCoefficient, lightEmission));
		gl.uniform4fv(uLightEmission, emissionProduct);
		var diffuseProduct = multVecByScalar(diffuseAll, mult(diffuseCoefficient, materialDiffuse));
		gl.uniform4fv(uMaterialDiffuse, diffuseProduct);
		var specularProduct = multVecByScalar(specularAll, mult(specularCoefficient, materialSpecular));
		gl.uniform4fv(uMaterialSpecular, specularProduct);
	}

	function multVecByScalar(scalar, vector) {
		return vector.map((a) => {
			return scalar * a
		});
	}

	// === Uniforms ===
	var uLightPosition = gl.getUniformLocation(program, "u_LightPosition");
	var uLightEmission = gl.getUniformLocation(program, "u_LightEmission");
	var uLightAmbinet = gl.getUniformLocation(program, "u_LightAmbient");
	var uMaterialDiffuse = gl.getUniformLocation(program, "u_MaterialDiffuse");
	var uMaterialSpecular = gl.getUniformLocation(program, "u_MaterialSpecular");
	var uMaterialShininess = gl.getUniformLocation(program, "u_MaterialShininess");

	var uNMatrix = gl.getUniformLocation(program, "u_NormalMatrix");
	var umvMatrix = gl.getUniformLocation(program, "u_MV");
	var umvpMatrix = gl.getUniformLocation(program, "u_MVP");

	// === Camera ===
	var eye = vec3(orbitRadius * Math.sin(orbitAngle), 0, orbitRadius * Math.cos(orbitAngle));
	var at = vec3(0, 0, 0);
	var up = vec3(0, 1, 0);
	var pMat = perspective(90, 1, 0.1, 100);
	var vMat = lookAt(eye, at, up);

	var then = 0;
	function orbit(now) {
		if (shouldOrbit) {
			// Convert the time to seconds
			now *= 0.001;
			// Subtract the previous time from the current time
			var deltaTime = now - then;
			// Remember the current time for the next frame.
			then = now;

			eye = vec3(orbitRadius * Math.sin(orbitAngle), deltaTime, orbitRadius * Math.cos(orbitAngle))
			console.log(deltaTime);

			vMat = lookAt(eye, at, up);
			render();
			orbitAngle += ORBIT_STEP;
			requestAnimationFrame(orbit);
		} else {
			render();
		}
	}

	// === Start app ===
	function render() {
		gl.clearColor(BACKGROUND_COLOR[0], BACKGROUND_COLOR[1], BACKGROUND_COLOR[2], BACKGROUND_COLOR[3]);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		updateMatrices();
		updateLight();

		for(var i = 0; i < models.length; i++) {
			if (!models[i].g_drawingInfo && models[i].g_objDoc && models[i].g_objDoc.isMTLComplete()) { // OBJ and all MTLs are available
				onReadComplete(gl, models[i]);
			}
			if (models[i].g_drawingInfo) {
				switchBuffers(models[i]);
				gl.drawElements(gl.TRIANGLES, models[i].g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
			}
		}
	}

	function start() {
		render();
		requestAnimationFrame(start);
	}

	start();
}

/**
* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
function setupWebGL(canvas) {
	return WebGLUtils.setupWebGL(canvas);
}