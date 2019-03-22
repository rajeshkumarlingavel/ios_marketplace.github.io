/* Contants */
var types = {
	'GET_DATA': 'get',
	'SET_DATA': 'set',
	'DELETE_DATA': 'delete'
}

/* Mobile Interactor */
var ZDMobileInteractor = {
	sendHelperRequestToMobile: function (helperReqObj) {
		ZDMobile.get(helperReqObj);
	},
	sendRequest: function (widgetId, promiseId, id, property, formData) {
		ZDMobile.request(widgetId, promiseId, id, property, formData);
	},
	sendResponseToWidget: function (responseObj) {

		//responseObj = JSON.parse(responseObj);

		var response = {};
		response[responseObj.property] = responseObj.data;
		if (responseObj.property == 'database') {
			response = processDataBaseHelpersRespose(responseObj);
		} else if (responseObj.property === 'extension.config') {
			response[responseObj.property] = JSON.parse(responseObj.data).data;
		} else if (responseObj.property === 'commonRequest') {
			response = processReuestResponse(responseObj);
		}
		if (responseObj.result) {
			PromiseQ[responseObj.widgetId][responseObj.promiseId] ? PromiseQ[responseObj.widgetId][responseObj.promiseId].resolve(response) : null;
		} else {
			PromiseQ[responseObj.widgetId][responseObj.promiseId] ? PromiseQ[responseObj.widgetId][responseObj.promiseId].reject(response) : null;
		}
	},
	renderWidget: function (extensionDetails) {
		// 		extensionDetails = JSON.parse(extensionDetails);
		renderExtension(extensionDetails.extensionData, extensionDetails.widgetId);
		// renderExtension(extensionDetails, widgetId)
	}
};

/* Promise Queue */

var PromiseQ = {}

var ZDPromiseQManager = {
	addPromise: function (widgetID, promiseID, promise) {
		PromiseQ[widgetID] ? PromiseQ[widgetID][promiseID] = promise : PromiseQ[widgetID] = { [promiseID]: promise };
	},
	deletePromise: function (widgetID, promiseID) {
		PromiseQ[widgetID][promiseID] = null;
	}
}

/* Desk Event Handler */

var deskEventHandler = function (event) {
	var extensionID = ZApp.GetExtensionInstance(event.extension_id).id;
	var helperObj = {
		widgetID: event.widgetID,
		promiseID: event.promiseID,
		property: event.data.property,
		extensionID: extensionID,
		payLoad: event.data.value,
		type: event.data.type
	}
	ZDPromiseQManager.addPromise(event.widgetID, event.promiseID, event.promise);
	ZDMobileInteractor.sendHelperRequestToMobile(JSON.stringify(helperObj));
};

/* Render Extension */
var renderExtension = function (extensionData, widgetID) {
	var widgets = extensionData.manifest.modules.widgets;
	var widgetHeaderDetails = {};
	for (var i = 0; i < widgets.length; i++) {
		if (widgets[i].widgetId == widgetID) {
			extensionData.manifest.modules.widgets = [widgets[i]];
			extensionData.location = widgets[i].location;
			widgetHeaderDetails.name = widgets[i].name;
			widgetHeaderDetails.logo = widgets[i].logo;
			widgetHeaderDetails.manifest = extensionData.manifest;
			break;
		}
	}

	var extensionManifest = extensionData.manifest;
	extensionManifest.version = extensionData.version;
	extensionManifest.id = extensionData.installationId;
	extensionManifest.hashkey = extensionData.hashkey;
	extensionManifest.zappid = extensionData.zAppId;
	extensionManifest.locale = extensionData.zslocale;
	extensionManifest.storage = extensionData.storage;
	extensionManifest.installationParams = extensionManifest.config;
	extensionManifest.extensionType = extensionData.extensionType;

	// if(!extensionManifest.connectors.length > 0){
	ZApp.LoadExtension(extensionManifest);
	renderWidgetHeader(widgetHeaderDetails);
	ZApp.RenderWidgets(extensionData.location, {});
	// }else{
	//   renderAuthorizeUI(extensionManifest, extensionData.location);
	// }
};

/* Render Widget Header */

var renderWidgetHeader = function (widgetHeaderDetails) {
	var logoBaseURL = ZApp.GetExtensionBaseURL(widgetHeaderDetails.manifest);
	var logoUrl = widgetHeaderDetails.logo ? widgetHeaderDetails.logo.split("/") : [];
	logoUrl = logoUrl.splice(1, logoUrl.length).join("/");
	document.getElementById('widgetlogo').src = logoBaseURL + '/' + logoUrl;
	document.getElementById('widgettitle').innerText = widgetHeaderDetails.name;
}

/* Render Config UI */

/* Render Auhtorize UI */

var renderAuthorizeUI = function (extensionManifest, location) {
	if (!extensionManifest.connectors[0].isAuthorised) {
		var rootEle = document.getElementById('root');
		var authoriseUrl = extensionManifest.connectors[0].extensionManifest;
		rootEle.appendChild('<button onclick="openAuth(authoriseUrl)">Authorize</button>')
	} else {
		ZApp.LoadExtension(extensionManifest);
		ZApp.RenderWidgets(location, {});
	}
};


var openAuth = function (url) {
	let authoriseUrl = url;
	var regex = new RegExp("^(http|https)://", "i");
	var match = regex.test(authoriseUrl);
	if (match) {
		authoriseUrl = authoriseUrl
	}
	var options = "toolbar=no,menubar=no,scrollbars=no,location=no,status=no";
	window.open(authoriseUrl, 'authoriseWindow_' + widgetId, options);

	window.addEventListener("messages", function (response) {
		var dataObj = typeof (response.data) == "object" ? response.data : JSON.parse(response.data);
		if (dataObj && dataObj.status) {
			if (!dataObj.hasOwnProperty("authType") || dataObj.authType !== "oauth") {
				//MObile call to update connector
			}
			handleAfterAuthorisation(connector, extnManifest, widget);
		}
	});
};

/* Respose Handlers */

function processDataBaseHelpersRespose(responseObj) {
	var response = {};
	var data = null;
	if (responseObj.type == 'GET_DATA') {
		data = responseObj.data;
		data = data.data.length > 0 ? data : {}
		response[responseObj.property + '.' + types[responseObj.type]] = data;
	}
	else if (responseObj.type == 'DELETE_DATA') {
		response[responseObj.property + '.' + types[responseObj.type]] = { delete: 'success' };
	} else {
		data = responseObj.data;
		response[responseObj.property + '.' + types[responseObj.type]] = data;
	}
	return response;
}

function processReuestResponse(responseObj) {
	return JSON.stringify(responseObj.data);
}
