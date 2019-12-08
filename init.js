onload = init;

const ORBIT_STEP = 1;
const ANIMATION_STEP = 1;
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
	const canvas = document.getElementById("c");
	const gl = setupWebGL(canvas);
	if (!gl) {
		return;
	}

	const program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);
	gl.vBuffer = null;
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);

	// === Setup UI ===
	let translation = [0, 0, 2];
	let rotation = [24, 0, 0];
	let scaleValues = [1, 1, 1];
	let orbitRadius = 4.5;
	let orbitAngle = 0;
	let shouldOrbit = false;
	let step = 0.0;
	let keyframe1Index = 0;
	let keyframe2Index = 1;

	let lightDirection = vec4(0.0, 0.0, -1.0, 0.0);
	let lightEmission = vec4(1.0, 1.0, 1.0, 1.0);
	let lightAmbient = vec4(0.3, 0.3, 0.3, 1.0);
	let materialDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
	let materialSpecular = vec4(0.5, 0.5, 0.5, 1.0);
	let materialShininess = 200.0;
	let emissionCoefficient = vec4(1.0, 1.0, 1.0, 1.0);
	let ambientCoefficient = vec4(1.0, 1.0, 1.0, 1.0);
	let diffuseCoefficient = vec4(1.0, 1.0, 1.0, 1.0);
	let specularCoefficient = vec4(1.0, 1.0, 1.0, 1.0);

	let emissionAll = 1.0;
	let specularAll = 1.0;
	let diffuseAll = 1.0;
	let ambient = 1.0;

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

	let toggleOrbitButton = document.getElementById("orbit");
	toggleOrbitButton.addEventListener("click", () => {
		shouldOrbit = !shouldOrbit
	})

	function updatePosition(index) {
		return function (event, ui) {
			translation[index] = ui.value / TRANSLATION_FACTOR;
		};
	}

	function updateRotation(index) {
		return function (event, ui) {
			rotation[index] = ui.value;
		};
	}

	function updateScale(index) {
		return function (event, ui) {
			scaleValues[index] = ui.value;
		};
	}

	function updateEmissionAll() {
		return function (event, ui) {
			emissionAll = ui.value;
		};
	}

	function updateSpecularAll() {
		return function (event, ui) {
			specularAll = ui.value;
		};
	}

	function updateDiffuseAll() {
		return function (event, ui) {
			diffuseAll = ui.value;
		};
	}

	function updateAmbient() {
		return function (event, ui) {
			ambient = ui.value;
		};
	}

	function updateLightDirection(index) {
		return function (event, ui) {
			lightDirection[index] = ui.value;
		};
	}

	function updateLightEmission(index) {
		return function (event, ui) {
			lightEmission[index] = ui.value;
		};
	}

	function updateMaterialSpecular(index) {
		return function (event, ui) {
			materialSpecular[index] = ui.value;
		};
	}

	function updateMaterialDiffuse(index) {
		return function (event, ui) {
			materialDiffuse[index] = ui.value;
		};
	}

	function updateMaterialShininess() {
		return function (event, ui) {
			materialShininess = ui.value;
		};
	}

	function updateOrbitRadius() {
		return function (event, ui) {
			orbitRadius = ui.value;
		};
	}

	// === Load model data ===
	let filesToLoad = [
		"models/test1.obj",
		"models/test2.obj",
		"models/test3.obj",
		"models/test4.obj",
		"models/test5.obj",
	];
	let models = [];
	let positionAttributes = [];
	let normalAttributes = [];
	// Attributes for keyframe 1
	positionAttributes.push(initAttribute("a_Position1"));
	normalAttributes.push(initAttribute("a_Normal1"));
	// Attributes for keyframe 2
	positionAttributes.push(initAttribute("a_Position2"));
	normalAttributes.push(initAttribute("a_Normal2"));
	// Color attribute is shared 
	let a_Color = initAttribute("a_Color");

	function initAttribute(attributeName) {
		let attribute = gl.getAttribLocation(program, attributeName);
		gl.enableVertexAttribArray(attribute);
		return attribute;
	}

	for (let i = 0; i < filesToLoad.length; i++) {
		models[i] = new Model(filesToLoad[i]);
		initVertexBuffers(models[i]);
		readOBJFile(models[i], gl, 1, false);
	}

	function initVertexBuffers(model) {
		model.vertexBuffer = gl.createBuffer();
		model.normalBuffer = gl.createBuffer();
		model.colorBuffer = gl.createBuffer();
		model.indexBuffer = gl.createBuffer();
	}

	// Read a file
	function readOBJFile(model, gl, scale, reverse) {
		let request = new XMLHttpRequest();
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
		let objDoc = new OBJDoc(model.fileName); // Create a OBJDoc object
		let result = objDoc.parse(fileString, scale, reverse);
		if (!result) {
			model.g_objDoc = null; model.g_drawingInfo = null;
			console.log("OBJ file parsing error for file " + model.fileName);
			return;
		}
		model.g_objDoc = objDoc;
	}

	function onReadComplete(gl, model) {
		// Acquire the vertex coordinates and colors from OBJ file
		let drawingInfo = model.g_objDoc.getDrawingInfo();

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

	function readModels() {
		for (let i = 0; i < models.length; i++) {
			let model = models[i];
			if (!model.g_drawingInfo && model.g_objDoc && model.g_objDoc.isMTLComplete()) { // OBJ and all MTLs are available
				onReadComplete(gl, model);
			}
		}
	}

	function animateAndDraw(deltaTime) {
		if (step >= 1.0) {
			step = 0.0;
			keyframe1Index = (keyframe1Index + 1) % models.length;
			keyframe2Index = (keyframe2Index + 1) % models.length;
		} else {
			step += ANIMATION_STEP * deltaTime;
		}
		gl.uniform1f(uStep, step);
		let keyframe1 = models[keyframe1Index];
		let keyframe2 = models[keyframe2Index];
		if (keyframe1.g_drawingInfo && keyframe2.g_drawingInfo) {
			bindBuffersAndAttributes(keyframe1, 0);
			bindBuffersAndAttributes(keyframe2, 1);
			gl.drawElements(gl.TRIANGLES, keyframe1.g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
		}
	}

	function calculateOrbitAngle(deltaTime) {
		orbitAngle += ORBIT_STEP * deltaTime;
		eye = vec3(orbitRadius * Math.sin(orbitAngle), 0, orbitRadius * Math.cos(orbitAngle))
		vMat = lookAt(eye, at, up);
	}

	function bindBuffersAndAttributes(model, attribute) {
		gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
		gl.vertexAttribPointer(positionAttributes[attribute], 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
		gl.vertexAttribPointer(normalAttributes[attribute], 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
		gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
	}

	function updateMatrices() {
		// Last transformation in multiplication is first to be applied
		let mMat = mat4();
		mMat = mult(mMat, translate(translation[0], translation[1], translation[2]));
		mMat = mult(mMat, rotate(rotation[0], vec3(1, 0, 0)));
		mMat = mult(mMat, rotate(rotation[1], vec3(0, 1, 0)));
		mMat = mult(mMat, rotate(rotation[2], vec3(0, 0, 1)));
		mMat = mult(mMat, scale(scaleValues[0], scaleValues[1], scaleValues[2]));
		let mvMat = mult(vMat, mMat);
		let mvpMat = mult(pMat, mvMat);

		let N = normalMatrix(mvMat, false);
		gl.uniformMatrix3fv(uNMatrix, false, flatten(N));
		gl.uniformMatrix4fv(umvMatrix, false, flatten(mvMat));
		gl.uniformMatrix4fv(umvpMatrix, false, flatten(mvpMat));
	}

	function updateLight() {
		gl.uniform4fv(uLightPosition, lightDirection);
		gl.uniform1f(uMaterialShininess, materialShininess);
		let ambientProduct = multVecByScalar(ambient, mult(ambientCoefficient, lightAmbient));
		gl.uniform4fv(uLightAmbinet, ambientProduct);
		let emissionProduct = multVecByScalar(emissionAll, mult(emissionCoefficient, lightEmission));
		gl.uniform4fv(uLightEmission, emissionProduct);
		let diffuseProduct = multVecByScalar(diffuseAll, mult(diffuseCoefficient, materialDiffuse));
		gl.uniform4fv(uMaterialDiffuse, diffuseProduct);
		let specularProduct = multVecByScalar(specularAll, mult(specularCoefficient, materialSpecular));
		gl.uniform4fv(uMaterialSpecular, specularProduct);
	}

	function multVecByScalar(scalar, vector) {
		return vector.map((a) => {
			return scalar * a
		});
	}

	// === Uniforms ===
	let uLightPosition = gl.getUniformLocation(program, "u_LightPosition");
	let uLightEmission = gl.getUniformLocation(program, "u_LightEmission");
	let uLightAmbinet = gl.getUniformLocation(program, "u_LightAmbient");
	let uMaterialDiffuse = gl.getUniformLocation(program, "u_MaterialDiffuse");
	let uMaterialSpecular = gl.getUniformLocation(program, "u_MaterialSpecular");
	let uMaterialShininess = gl.getUniformLocation(program, "u_MaterialShininess");

	let uNMatrix = gl.getUniformLocation(program, "u_NormalMatrix");
	let umvMatrix = gl.getUniformLocation(program, "u_MV");
	let umvpMatrix = gl.getUniformLocation(program, "u_MVP");

	let uStep = gl.getUniformLocation(program, "u_Step");

	// === Camera ===
	let eye = vec3(orbitRadius * Math.sin(orbitAngle), 0, orbitRadius * Math.cos(orbitAngle));
	let at = vec3(0, 0, 0);
	let up = vec3(0, 1, 0);
	let pMat = perspective(90, 1, 0.1, 100);
	let vMat = lookAt(eye, at, up);

	// === Start app ===
	function render(deltaTime) {
		gl.clearColor(BACKGROUND_COLOR[0], BACKGROUND_COLOR[1], BACKGROUND_COLOR[2], BACKGROUND_COLOR[3]);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		if (models.length < 2) {
			console.log("Error drawing. At least 2 keyframes must be provided in order to animate");
			return;
		}

		if(isNaN(deltaTime)) {
			deltaTime = 0;
		}

		if(shouldOrbit) {
			calculateOrbitAngle(deltaTime);
		}
		updateMatrices();
		updateLight();
		readModels();

		animateAndDraw(deltaTime);
	}

	let then = 0;
	function start(now) {
		//Creating a requestAnimationFrame-based drawing loop 
		//that increments a counter by a time-dependent amount, 
		//so that we end up having the same animation speed no matter what the frame rate is
		// Convert the time to seconds
		now *= 0.001;
		// Subtract the previous time from the current time
		let deltaTime = now - then;
		// Remember the current time for the next frame.
		then = now;

		render(deltaTime);

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