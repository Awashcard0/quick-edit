const newDia = document.getElementById("newNotebook");
const newDiap = document.getElementById("Newp");
const Readme = document.getElementById("Rm");
const pageTools = document.getElementById("PageTools");
const settingsPage = document.getElementById("Setting");
const startPage = document.getElementById("start");
const oldButton = document.getElementById("old");
var saveText = document.getElementById("save");
var text = document.getElementById("text");
let typeElements = document.getElementById('type').elements
var canvas = document.getElementById('myCanvas');
var context = canvas.getContext('2d');
var isPainting = false;
var lastX, lastY;
var color = 'black';
var size = 2;
let sync = false;
var fileThing;
let autoSaveTimer = -1;
let volatileData = false;

startPage.showModal();

var computedStyle = window.getComputedStyle(canvas);
canvas.width = parseInt(computedStyle.getPropertyValue('width'), 10);
canvas.height = parseInt(computedStyle.getPropertyValue('height'), 10);
// welcome
setTimeout(function () {
	notification("Welcome to Quick Edit Notebook", 3000);

	if (localStorage.getItem("hasVisited") !== "true") {
		localStorage.setItem("AutosaveBox", true);
		localStorage.setItem("hasVisited", true);
	}

	document.getElementById("autosave").checked = (localStorage.getItem("AutosaveBox") === "true");
	document.getElementById("saveToLocal").checked = (localStorage.getItem("saveToLocalBox") === "true");
	UpdateSetting();

	if (JSON.parse(localStorage.getItem("nbSave"))) {

	} else {
		oldButton.setAttribute("disabled", "true");
	}
}, 250);

window.addEventListener('resize', updateCanvasSize);


function UpdateSetting() {
	let Asavebox = document.getElementById("autosave");
	let normSave = document.getElementById("normSave");
	let saveToLocal = document.getElementById("saveToLocal");
	localStorage.setItem("AutosaveBox", Asavebox.checked);
	localStorage.setItem("saveToLocalBox", saveToLocal.checked);
	if (Asavebox.checked) {
		normSave.style.display = "none";
	} else {
		normSave.style.display = "";
	}
}

function autoSave() {
	volatileData = true;
	let Asavebox = document.getElementById("autosave");
	if (Asavebox.checked) {
		autoSaveTimer = 5;
	} else {
		// not auto save
	}
}
if (!navigator.userAgent.includes("Firefox")) {
	setInterval(() => {
		if (autoSaveTimer === 0) {
			saveText.innerHTML = "Saving...";
			autoSaveTimer = autoSaveTimer - 1;
			updateSelectedItem();
		} else if (autoSaveTimer > 0) {
			saveText.innerHTML = "Save in " + autoSaveTimer;
			autoSaveTimer = autoSaveTimer - 1;
		}
	}, 1000);
} else {
	saveText.innerHTML = "Sync disabled";
}

window.addEventListener('beforeunload', function (e) {
	if (volatileData) {
		e.preventDefault();
		e.returnValue = 'Your notebook may not be saved.';
	}
});

const textArea = document.getElementById("text")

textArea.addEventListener("keydown", async (event) => {
	if (event.key === "Tab") {
		event.preventDefault();
		const pageCtx = textArea.value;
		const cursorPos = textArea.selectionStart;
		textArea.value = pageCtx.slice(0, cursorPos) + "\t" + pageCtx.slice(cursorPos);
	
		textArea.selectionStart = cursorPos + 1;
		textArea.selectionEnd = cursorPos + 1;
	} else if (event.key === "Enter" && !event.shiftKey) {
		event.preventDefault();
		const pageCtx = textArea.value;
		
		const cursorPos = textArea.selectionStart;
		const text = pageCtx.slice(0, cursorPos);

		const lastIndex = pageCtx.lastIndexOf("\n", cursorPos - 1) + 1;
		const currentLine = pageCtx.slice(lastIndex, cursorPos);

		const match = currentLine.match(/^\t*/);
		const tabCount = match ? match[0].length : 0;
		const count = "\t".repeat(tabCount);
		textArea.setRangeText("\n" + count, cursorPos, textArea.selectionEnd, "end");
	}
})

function notification(notaName, notaTime) {
	var x = document.getElementById("notification");
	x.innerHTML = notaName;
	x.className = "show";
	setTimeout(function () {
		x.className = x.className.replace("show", "");
	}, notaTime);
}

function error(notaName, notaTime) {
	console.error(notaName);
	var x = document.getElementById("error");
	x.innerHTML = notaName;
	x.className = "show";
	setTimeout(function () {
		x.className = x.className.replace("show", "");
	}, notaTime);
}

let selectedFile = null;
let selectedData = [];
let fileName = "";
let selectedId = "";
let selectedType = "text";

function readFile(file) {
	const reader = new FileReader();

	reader.onload = event => {
		const data = JSON.parse(event.target.result);
		const name = file.name;
		fileName = name.split(".")[0].split(" (")[0];
		notification(`Loaded file: ${fileName}, To load a new reload the page`, 5000);
		document.getElementById("json-file-input").style.display = "none";

		if (!selectedData || selectedData.length < data.length) {
			autoSaveTimer = 5;
			selectedData = data;
			updateItemNames();
			sync = false;
			saveText.innerHTML = "Sync disabled";

		}
	};

	reader.onerror = error => error(`Error with reader: ${error}`);

	reader.readAsText(file);

	startPage.close();
}

function createNewFile() {
	const filename = document.getElementById('new-file-name').value;
	const id = 0;
	const name = "First page (Use page tools to rename)";
	const text = "This is a page with text";
	const type = "text";
	const data = selectedData ? [...selectedData, { id, name, type, text }] : [{ id, name, type, text }];
	const json = JSON.stringify(data);
	const blob = new Blob([json], { type: 'application/json' });
	const link = document.createElement('a');
	link.href = URL.createObjectURL(blob);
	link.download = `${filename}.qenotebook`;
	link.click();
	newDia.close();
	startPage.showModal();
	notification("Open the file to continue", 3000);
}

function addItem() {
	const name = document.getElementById('name-input').value;
	const text = "";
	let type = "";
	const id = selectedData ? selectedData[selectedData.length - 1].id + 1 : 1;
	if (typeElements[0].checked == true) {
		type = "text";
	} else if (typeElements[1].checked == true) {
		type = "draw";
	}

	const newItem = { id, name, type, text };
	selectedData.push(newItem);
	document.getElementById('name-input').value = '';
	document.getElementById('text').value = '';
	updateItemNames();
	newDiap.close();
	setItemSelectedData(id);
	autoSaveTimer = 5;
}

function deleteSelectedItem() {
	if (confirm("This action cannot be undone!")) {
		pageTools.close();
		const index = selectedData.findIndex(item => item.id === selectedId);

		if (index >= 0) {
			selectedData.splice(index, 1);
			updateItemNames();
			autoSaveTimer = 5;
		} else {
			error('Error: Page not found', 3000);
		}
	}
}

async function updateSelectedItem() {
	let saveToLocal = document.getElementById("saveToLocal");
	const nameInput = document.getElementById('name-input');

	const itemToUpdate = selectedData.find(item => item.id === selectedId);

	if (itemToUpdate) {
		if (selectedType == "oldtext" || selectedType == "text") {
			const textInput = document.getElementById('text');

			// const newName = itemToUpdate.name
			const newText = text.value;

			if (newText) {
				// itemToUpdate.name = newName;
				itemToUpdate.text = newText;
				// nameInput.value = newName;
				textInput.value = newText;
				// updateItemNames();
				if (selectedType == "oldtext") {
					itemToUpdate.type = "text";
				}
			}
		} else if (selectedType == "draw") {
			var data = canvas.toDataURL();
			itemToUpdate.text = data;
		}

		if (saveToLocal.checked) {
			const stuffToSave = { "name": fileName, "data": selectedData };
			localStorage.setItem("nbSave", JSON.stringify(stuffToSave));
		}

		writeFile();
	} else {
		console.log(itemToUpdate)
		error('Error: Page not found', 3000);
		saveText.innerHTML = "Sync disabled";
	}
}

async function renameSelectedItem() {
	pageTools.close();
	await updateSelectedItem();
	let saveToLocal = document.getElementById("saveToLocal");
	const nameInput = document.getElementById('rename-input');
	const textInput = document.getElementById('text');


	const itemToUpdate = selectedData.find(item => item.id === selectedId);

	if (itemToUpdate) {
		const newName = nameInput.value;
		const newText = itemToUpdate.text;

		if (newName && newText) {
			itemToUpdate.name = newName;
			itemToUpdate.text = newText;
			nameInput.value = newName;
			textInput.value = newText;
			updateItemNames();
			setItemSelectedData(selectedId);

			if (saveToLocal.checked) {
				const stuffToSave = { "name": fileName, "data": selectedData };
				localStorage.setItem("nbSave", JSON.stringify(stuffToSave));
			}
		}
	} else {
		error('Error: Page not found', 3000);
	}
}

function updateItemNames() {
	const ids = selectedData.map(item => item.id);
	const names = selectedData.map(item => item.name);
	const selectBox = document.getElementById('page-list');

	selectBox.innerHTML = "";

	for (let i = 0; i < ids.length; i++) {
		let option = document.createElement('li');
		option.innerHTML = names[i];
		option.setAttribute("onclick", `setItemSelectedData(${ids[i]});`);
		// console.log(option)
		selectBox.appendChild(option);
	}

	updateCanvasSize();
	writeFile();
}

async function writeFile() {
	if (sync) {
		const writable = await fileThing.createWritable();
		const encoder = new TextEncoder();
		const encodedData = encoder.encode(JSON.stringify(selectedData));

		await writable.write(encodedData);

		// Close the file and write the contents to disk.
		await writable.close();
		// Write the contents of the file to the stream.
		saveText.innerHTML = "Saved to disk";
		volatileData = false;
	} else {
		// saveText.innerHTML = "Auto Save Error";
		saveText.title = "The file can't be autosaved in legacy mode. Open the file with sync to autosave"
	}
}

async function setItemSelectedData(id) {
	await updateSelectedItem();
	selectedId = id;
	const item = selectedData.find(item => item.id === selectedId);
	const textTool = document.getElementById("textToolbar");
	const drawTool = document.getElementById("drawToolbar");

	if (item.type == "text") {
		// Get ready for text
		textTool.style.display = "inline-block";
		drawTool.style.display = "none";
		document.getElementById("text").style.display = "";
		document.getElementById("myCanvas").style.display = "none";
		document.getElementById("imgUpload").style.display = "none";

		selectedType = "text";
		document.getElementById('rename-input').value = item.name;
		document.getElementById('text').value = item.text;
		document.getElementById('file').innerText = item.name;
		document.title = item.name + " - " + fileName + " - Quick edit notebook";
		notification(`Selected page: ${item.name}`, 3000);
	} else if (item.type == "draw") {
		// Get ready for draw
		drawTool.style.display = "inline-block";
		textTool.style.display = "none";
		document.getElementById("myCanvas").style.display = "";
		document.getElementById("imgUpload").style.display = "";
		document.getElementById("text").style.display = "none";

		context.clearRect(0, 0, canvas.width, canvas.height); // Clear the context to stop picture roll ovrt

		var savedCanvasData = item.text;
		if (savedCanvasData) {
			var img = new Image();
			img.onload = function () {
				context.clearRect(0, 0, canvas.width, canvas.height);
				context.drawImage(img, 0, 0);
			};
			img.src = savedCanvasData;
		}

		selectedType = "draw";
		document.getElementById('rename-input').value = item.name;
		document.getElementById('file').innerText = item.name;
		document.title = item.name + " - " + fileName + " - Quick edit notebook";
		notification(`Selected page: ${item.name}`, 3000);
	} else {
		if (item.name) {
			selectedType = "oldtext";
			document.getElementById('rename-input').value = item.name;
			document.getElementById('text').value = item.text;
			document.getElementById('file').innerText = item.name;
			document.title = item.name + " - " + fileName + " - Quick edit notebook";
			alert("This page version is not up to date\nIt will be updated when you save it");
			notification(`Selected page: ${item.name}`, 3000);
		} else {
			error('Error: Page not found', 3000);
		}
	}
}

function downloadFile() {
	updateSelectedItem();
	const jsonData = JSON.stringify(selectedData);
	const blob = new Blob([jsonData], { type: 'application/json' });
	const url = URL.createObjectURL(blob);

	const a = document.createElement('a');
	a.download = `${fileName}.qenotebook`;
	a.href = url;
	a.click();

	URL.revokeObjectURL(url);
	volatileData = false;
}

async function getTheFile() {
	const pickerOpts = {
		types: [
			{
				description: "Quick edit notebook",
				accept: {
					'text/json': ['.qenotebook'],
				},
			},
		],
		excludeAcceptAllOption: true,
		multiple: false,
	};

	// open file picker
	const [fileHandle] = await window.showOpenFilePicker(pickerOpts);

	fileThing = fileHandle;
	// get file contents
	const fileData = await fileHandle.getFile();
	const textThatGot = await fileData.text();

	fileName = fileHandle.name.split(".")[0].split(" (")[0];
	notification(`Loaded file: ${fileName}, To load a new reload the page`, 5000);
	document.getElementById("json-file-input").style.display = "none";

	if (!selectedData || selectedData.length < textThatGot.length) {
		selectedData = JSON.parse(textThatGot);
		updateItemNames();
		sync = true;
		saveText.innerHTML = "Sync enabled";
		writeFile();
	}
	startPage.close();
}


function getOld() {
	let data = JSON.parse(localStorage.getItem("nbSave"));
	const jsonData = JSON.stringify(data.data);
	const blob = new Blob([jsonData], { type: 'application/json' });
	const url = URL.createObjectURL(blob);

	const a = document.createElement('a');
	a.download = `${data.name}.qenotebook`;
	a.href = url;
	a.click();

	URL.revokeObjectURL(url);
}

function newNb() {
	newDia.showModal();
}

function nonew() {
	newDia.close();
}

function newnbp() {
	newDiap.showModal();
}

function nonewp() {
	newDiap.close();
}

function cle() {
	text = document.getElementById("text");
	text.value = "";
	text.select();
	notification("Cleared", 3000);
}

function savedoc() {
	var filenamey = prompt("File name?\nex. filename.fileextension")
	let t = document.getElementById("text");
	if (confirm("You are saving the file as " + filenamey) == true) {
		var textFileAsBlob = new Blob([t.value], {
			type: 'text/plain'
		});
		var downloadLink = document.createElement("a");
		downloadLink.download = filenamey;
		downloadLink.innerHTML = "Download File";
		if (window.webkitURL != null) {
			// Chrome allows the link to be clicked
			// without actually adding it to the DOM.
			downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
		} else {
			// Firefox requires the link to be added to the DOM
			// before it can be clicked.
			downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
			downloadLink.onclick = destroyClickedElement;
			downloadLink.style.display = "none";
			document.body.appendChild(downloadLink);
		}
		downloadLink.click();
		notification("Downloaded", 3000);
	} else {
		notification("Cancelled", 30000);
	}
}

function print() {
	childWindow = window.open('/print', 'childWindow', 'location=yes, menubar=yes, toolbar=yes');
	childWindow.document.open();
	childWindow.document.write(' <html> <head> <title> Print - Quick edit - quick-edit.pages.dev </title> </head> <body> ');
	childWindow.document.write(document.getElementById('text').value.replace(/\n/gi, ' <br> '));

	childWindow.print();
	setTimeout(function () {
		childWindow.document.close();
		childWindow.close();
	}, 1500);
}

function copy() {
	text = document.getElementById("text");
	text.select();
	text.setSelectionRange(0, 99999);
	navigator.clipboard.writeText(text.value);
	notification("Copied to clipboard", 3000);
}

// Drawing stuff

canvas.addEventListener('mousedown', function (e) {
	isPainting = true;
	lastX = e.offsetX;
	lastY = e.offsetY;
});

canvas.addEventListener('mousemove', function (e) {
	if (isPainting) {
		var x = e.offsetX;
		var y = e.offsetY;

		context.strokeStyle = color;
		context.lineWidth = size;
		context.lineCap = 'round';

		context.beginPath();
		context.moveTo(lastX, lastY);
		context.lineTo(x, y);
		context.stroke();

		lastX = x;
		lastY = y;
	}
});

canvas.addEventListener('mouseup', function () {
	isPainting = false;
	autoSave();
});

function clearCanvas() {
	context.clearRect(0, 0, canvas.width, canvas.height);
}

function changeColor(newColor) {
	color = newColor;
}

function changeSize(newSize) {
	console.log(newSize)
	if (newSize == "me") {
		document.getElementById("num").style.display = "";
	} else {
		document.getElementById("num").style.display = "none";
		size = newSize;
	}
}

function changeSizeInput(newSize) {
	size = newSize;
}

function uploadImage(event) {
	var reader = new FileReader();
	reader.onload = function (event) {
		var img = new Image();
		img.onload = function () {
			context.drawImage(img, 0, 0);
		};
		img.src = event.target.result;
		autoSave();
	};
	reader.readAsDataURL(event.target.files[0]);
}

function updateCanvasSize() {
	var data = canvas.toDataURL();

	canvas.width = parseInt(computedStyle.getPropertyValue('width'), 10);
	canvas.height = parseInt(computedStyle.getPropertyValue('height'), 10);

	var img = new Image();
	img.onload = function () {
		context.clearRect(0, 0, canvas.width, canvas.height);
		context.drawImage(img, 0, 0);
	};
	img.src = data;
}