var ZappImpl = {};
var widgetPromiseMapping = {};

ZappImpl = {
	commonRequestHandler: function (urlObject, promise) {
		console.log(urlObject)
		var widget = ZApp.GetWidgetInstance(urlObject.widgetID);
		var extensionInstance = ZApp.GetExtensionInstance(widget.getExtensionID());
		ZDPromiseQManager.addPromise(urlObject.widgetID, urlObject.promiseID, promise);

		//WhiteListedDomain Check
		var whiteListedDomains = extensionInstance.whiteListedDomains || [];
		var parserElement = document.createElement('a');
		parserElement.href = urlObject.url;
		var domain = parserElement.protocol + '//' + parserElement.host;
		if (whiteListedDomains.includes(domain)) {
			var connectorsList = ZApp.GetConnectors(widget && widget.getExtensionID());
			var formData = {};
			var installationId = extensionInstance.id ? extensionInstance.id : '0';
			formData.requestURL = urlObject.url
			formData.requestType = urlObject.type
			formData.headers = urlObject.headers

			if (urlObject.data && Object.keys(urlObject.data).length > 0) {
				formData.queryParams = urlObject.data
			}

			if (Object.keys(urlObject.postBody).length > 0) {
				formData.postBody = urlObject.postBody
			}

			urlObject.connectionLinkName ? formData.connectionLinkName = urlObject.connectionLinkName : null;
			ZDMobileInteractor.sendRequest(urlObject.widgetID, urlObject.promiseID, installationId, "commonRequest", JSON.stringify(formData));
		} else {
			promise.reject({ errMessage: 'No entry found in plugin-manifest whiteListedDomains for requested URL' })
		}
	},
	CommonRequestResponseHandler: function (widgetId, promiseId, data, ) {
		var wPromise = widgetPromiseMapping[widgetId][promiseId];
		var widgetPromise = widgetPromiseMapping[widgetId];
		delete widgetPromise[promiseId];
		wPromise.resolve(data);
	}
}

// //Desk-Marketplace client API Handler
// var deskEventHandler = function(event) {
//   var eventInfo = event.data;
// 	var eventPromise = event.promise;
// 	var eventPromiseId = event.promiseID
//   var appId = ZApp.GetExtensionInstance(event.extension_id).id;
// 	mapWidgetPromises(event.widgetID, eventPromiseId, eventPromise);
// 	var helperReqObj = {
// 		widgetId: event.widgetID,
// 		promiseId: eventPromiseId,
// 		property: eventInfo.property,
// 		extensionId: appId
// 	};
//   mobileInteractor.sendHelperRequestToMobile(JSON.stringify(helperReqObj));
// };

//Widget Rendering TODO:
var DeskPluginManager = {
	WidgetHandler: function (location, instance, modelData) {
		let widgetId = instance.getProp('widgetId');
		let frameElement = document.createElement('iframe');
		frameElement.setAttribute('class', 'appIframe');
		frameElement.setAttribute('src', instance.getResolvedURL());
		frameElement.setAttribute('allow', "geolocation *");

		let widgetElement = null;

		widgetElement = document.getElementById('root');
		if (widgetElement) {
			if (!document.getElementById(widgetId + '_frame')) {
				let containerElement = document.createElement('div');
				containerElement.setAttribute('id', widgetId + '_frame');
				containerElement.setAttribute('class', 'iframeMain');
				containerElement.appendChild(frameElement);
				document.getElementById('root').appendChild(containerElement);
			}
		}
		return frameElement;
	}
}

/* Render Extension */
// var LoadAndRenderExtension = function(extensionData, widgetId){
// 	var widgets = extensionData.manifest.modules.widgets;

// 	for(var i=0; i< widgets.length; i++){
// 		if(widgets[i].widgetId == widgetId){
// 			extensionData.manifest.modules.widgets = [widgets[i]];
// 			extensionData.location = widgets[i].location;
// 			break;
// 		}
// 	}

// 	var extensionManifest = extensionData.manifest;
// 	extensionManifest.version = extensionData.version;
// 	extensionManifest.id = extensionData.installationId;
// 	extensionManifest.hashkey = extensionData.hashkey;
// 	extensionManifest.zappid = extensionData.zAppId;
// 	extensionManifest.locale = extensionData.zslocale;
// 	extensionManifest.storage = extensionData.storage;
// 	extensionManifest.installationParams = extensionManifest.config;
// 	// extensionManifest.config = null;
// 	extensionManifest.extensionType = extensionData.extensionType;

// 	ZApp.LoadExtension(extensionManifest);
// 	ZApp.RenderWidgets(extensionData.location, {});
// };

/* Promise mapping for widgets */

// var mapWidgetPromises = function(widgetID, promiseId, promise){
// 	widgetPromiseMapping[widgetID] ? (widgetPromiseMapping[widgetID][promiseId] = promise) : (widgetPromiseMapping[widgetID] = {[promiseId] : promise})
// }

// /* Getters and Setter to Interact with Mobile */
// var mobileInteractor = {
// 	sendHelperRequestToMobile: function(helperReqObj){
// 		ZDMobile.get(helperReqObj);		
// 	},
// 	sendResponseToWidget: function(widgetID, promiseID, property, data, isReqSuccess){
// 		var helperResObj = {};
// 		var response = {
// 			[property] : data
// 		}
// 		if(isReqSuccess == 'true'){
// 			console.log(data, 'Data')
// 			property === 'commonRequest' ? widgetPromiseMapping[widgetID][promiseID].resolve(data) : widgetPromiseMapping[widgetID][promiseID].resolve(response)
// 		}else{
// 			property === 'commonRequest' ? widgetPromiseMapping[widgetID][promiseID].reject(data) : widgetPromiseMapping[widgetID][promiseID].reject(response)
// 		}
// 	},
// 	renderWidget: function(extensionData, widgetId){
// 		LoadAndRenderExtension(JSON.parse(extensionData), widgetId);
// 	}
// };

// window.onload = function(){

// 	/* Window On error block to send it to logs */
// 	window.onerror = function(message, source, lineno, colno, error){
// 		console.log(message, "message");
// 		console.log(source, "source");
// 		console.log(lineno, "lineno");
// 		console.log(colno, "colno")
// 		console.log(error, 'error');
// 	}

// 	/* Initiate ZFramework */
// 	var zappsHost = {
// 		host: "{{zappid}}.zappsusercontent.com",
// 		port: '',
// 		path: '/appfiles/{{zappid}}/{{version}}/{{hashkey}}'
// 	};

// 	ZApp.Bootstrap({
// 		RenderHandlers: DeskPluginManager,
// 		serverConfig: {
// 		zappsHost : zappsHost
// 		},
// 		EventListeners: {
// 				DESK_EVENT: function(event) {
// 				return deskEventHandler(event);
// 			}
// 		},
// 		RequestHandler: ZappImpl.commonRequestHandler
// 	});

// 	/* Extension Deatils Request to Render */
// 	ZDMobile.getExtensionDetails();	
// }


window.onresize = function () {
	document.getElementById('root').children[0].children[0].style.height = '100vh'
}