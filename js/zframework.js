var ZAppUtil = (function (ZAppUtil) { // eslint-disable-line no-unused-vars, no-shadow

  // Global Logger instance which will be acquired and shared by other modules.
  var GlobalLogger;

  // minimal Logging utility.
  function ZLogger() {}
  ZLogger.prototype.Info = function () {
    if (ZAppUtil.isDevMode() || ZAppUtil.isLogEnabled()) {
      // eslint-disable-next-line no-console
      console.info.apply(console, arguments);
    }
  };
  ZLogger.prototype.Error = function () {
    // console.log.apply(console, arguments); // eslint-disable-line no-console
    // console.error(new Error()); // eslint-disable-line no-console
  };
  function getLogger() {
    if ( !GlobalLogger || !(GlobalLogger instanceof ZLogger)) {
      GlobalLogger = new ZLogger(); // Logging instance for Core Framework
    }

    return GlobalLogger;
  }

  // Patching string with the params passed
  function patchString(string, params) {

    var paramsMap = {};
    if (!string || typeof string !== 'string') {
      throw new Error('Invalid String'); // NO I18N
    }
    if ( Array.isArray(params) ) {
      params.forEach(function (param) {
        paramsMap[param.name] = param.value;
      });
    } else {
      paramsMap = params;
    }

    var patchedString =
      string.
        replace(/\$\{\w{1,}\}/g,
          function (match) {
            var key = match.replace(/[${}]/g, '');
            return paramsMap[key];
          });

    return patchedString;
  }

  // TODO: Handle for case when URL contains hashfragment in it !Important.
  function getQueryParams(URL) {
    var qParams = {};
    var locationURL = URL || window.location.href;
    var aEle = document.createElement('a');
    aEle.setAttribute('href', locationURL);
    var paramsString =
      typeof aEle.search === 'string'
        ? aEle.search.substr(1)
        : locationURL.substr(locationURL.indexOf('?') + 1);

    var splittedParams = paramsString.length > 1 ? paramsString.split('&') : [];
    splittedParams.forEach(function (ele) {
      var miniSplit = ele.split('=');
      qParams[miniSplit[0]] = miniSplit[1];
    });

    return qParams;
  }

  function constructQueryParamsString(qpMap) {
    var qpPairs = [];
    for ( var k in qpMap ) {
      if ( k && qpMap[k] ) {
        qpPairs.push(k + '=' + qpMap[k]);
      }
    }
    return qpPairs.join('&');
  }

  function getURLOrigin(URL) {
    var currentLocation = URL || document.location.href;
    var aEle = document.createElement('a');
    aEle.setAttribute('href', currentLocation);

    return aEle.protocol + '//' + aEle.host;
  }

  function isURL(URL) {
    return URL.indexOf('http') !== -1;
  }

  function isDevMode() {
    return localStorage && !!localStorage.getItem('isDevMode');
  }
  function isLogEnabled() {
    return localStorage && !!localStorage.getItem('isLogEnabled');
  }

  // Custom Error function.
  function AuthenticationError(message) {
    this.name = 'AuthenticationError';
    this.message = message;
    this.stack = (new Error()).stack;
  }
  AuthenticationError.prototype = Object.create(Error.prototype);
  AuthenticationError.prototype.constructor = AuthenticationError;

  ZAppUtil.getPatchedString = patchString;
  ZAppUtil.getURLOrigin = getURLOrigin;
  ZAppUtil.getQueryParams = getQueryParams;
  ZAppUtil.isURL = isURL;
  ZAppUtil.isDevMode = isDevMode;
  ZAppUtil.isLogEnabled = isLogEnabled;
  ZAppUtil.getLogger = getLogger;
  ZAppUtil.constructQueryParamsString = constructQueryParamsString;
  ZAppUtil.AuthenticationError = AuthenticationError;

  return ZAppUtil;
})(window.ZAppUtil || {});

/* eslint-disable */
function ZWidgetRuntime(widgetProps) {
    this.__WIDGET__ = widgetProps;
    this._hasLoaded = false;
    this._isActive = false;
    this._bindedEvents = {};
    this._hasRegistered = false;
    this._origin;
    this._type;
}
ZWidgetRuntime.prototype.getWidgetInfo = function() {
    var info = {
        'url': this.getURL(),
        'location': this.getLocation(),
        'widgetID': this.getUniqueID(),
        'name': this.getProp('name')
    };
    return info;
}
ZWidgetRuntime.prototype.hasLoaded = function () {
    return !!this._hasLoaded;
};
ZWidgetRuntime.prototype.isActive = function () {
    return this._isActive;
};
ZWidgetRuntime.prototype.getOrigin = function () {
    return this._origin;
};
ZWidgetRuntime.prototype.activate = function (shouldSendEvent) {
    this._isActive = true;
    // TODO: Send Event to the App if shouldSendEvent is set

    return this._isActive;
};
ZWidgetRuntime.prototype.deActivate = function (shouldSendEvent) {
    this._isActive = false;
    // TODO: Send Event to the App if shouldSendEvent is set

    return this._isActive;
};
ZWidgetRuntime.prototype.getConfig = function () {
    return this.__WIDGET__ && this.__WIDGET__.config;
};
ZWidgetRuntime.prototype.getURL = function() {
    return this.__WIDGET__.url;
}
ZWidgetRuntime.prototype.getLocation = function () {
    return this.__WIDGET__.location;
}
ZWidgetRuntime.prototype.getExtensionID = function () {
    return this.__WIDGET__ && this.__WIDGET__.extension_id;
}
ZWidgetRuntime.prototype.getExtensionVersion = function () {
    return this.__WIDGET__ && this.__WIDGET__.extension_version;
}
ZWidgetRuntime.prototype.getZAppID = function() {
    return this.__WIDGET__ && this.__WIDGET__.zappid;
}
ZWidgetRuntime.prototype.getResolvedURL = function () {
    return this._resolvedURL;
}
ZWidgetRuntime.prototype.getUniqueID = function () {
    return this._uniqueID;
}
ZWidgetRuntime.prototype.getProp = function(propName) {
    return this.__WIDGET__ && this.__WIDGET__[propName];
}
ZWidgetRuntime.prototype.getIFrame = function () { return document.getElementById(this._uniqueID); };
ZWidgetRuntime.prototype.getWindow = function () {
    var _iframe = document.getElementById(this._uniqueID);
    return _iframe && _iframe.contentWindow;
};
ZWidgetRuntime.prototype.SendEvent = function (eventName, data, isPromise) {
    var eventObj = {
        type: '__EVENT__',
        data: data,
        uniqueID: this.getUniqueID(),
        widgetID: this.getUniqueID(),
        eventName: eventName,
        isPromise: isPromise
    };
    var bindedEvents = this._bindedEvents[eventName];
    var widgetInstance, returnVal = [];
    if( typeof bindedEvents !== 'undefined' ) {
        for( var k in bindedEvents) {
            if( bindedEvents.hasOwnProperty(k)) {

                widgetInstance = ZApp.GetWidgetInstance(k);
                if (widgetInstance && widgetInstance.isActive()) {
                    if(isPromise) {
                        returnVal.push(MessageManager.SendMessage(widgetInstance, eventObj));
                    } else {
                        MessageManager.SendMessage(widgetInstance, eventObj);
                    }
                }
            }
        }
    }
    if(isPromise){
        return returnVal;
    }
};
ZWidgetRuntime.prototype.addEventInfo = function () { }
ZWidgetRuntime.prototype.removeEventInfo = function () { }
ZWidgetRuntime.prototype.getEvents = function() {
    return Object.keys(this._bindedEvents);
}
var MessageManager = (function (MessageManager) { // eslint-disable-line no-unused-vars, no-shadow

  var Context;
  var Logger = ZAppUtil.getLogger();
  var promiseIDCtr = 100;
  var PromiseQueue = {};

  function Init(ctx, config) { // config for any future use
    if ( !ctx || typeof ctx !== 'object' ) {
      throw Error('Invalid Context object passed');
    }
    if ( config && typeof config !== 'object') {
      throw Error('Invalid Configuration Passed to MessageHandler');
    }

    Context = ctx;

    return MessageHandler.bind(MessageManager);
  }

  function SendMessage(widgetInstance, message) {
    var isPromiseEvent = message.isPromise;
    var PromiseID;
    if ( isPromiseEvent ) {
      PromiseID = getNextPromiseID();
      message.promiseID = PromiseID; // eslint-disable-line
    }

    var frameURL = getURLWithPath(widgetInstance.getResolvedURL());
    var ctxWindow = widgetInstance.getWindow();

    if ( !ctxWindow || !frameURL ) {
      Logger.Error('Invalid IFrame object. Can\'t send Message to Widget');
      return;
    }
    message.__time__ = new Date().getTime();

    ctxWindow.postMessage(message, frameURL);

    if ( isPromiseEvent ) {
      return AddToPromiseQueue(PromiseID);
    }
  }

  function getNextPromiseID() {
    return 'Promise' + promiseIDCtr++;
  }
  function AddToPromiseQueue(promiseID) {

    var promise = new Promise(function (resolve, reject) {

      // Adding the promise to queue.
      PromiseQueue[promiseID] = {
        resolve: resolve,
        reject: reject,
        time: new Date().getTime()
      };
    });

    return promise;
  }

  function BroadcastEvent(eventName, data, isPromise) {
    var widgetInstances = Context.GetAllWidgetInstance(), widgetInstance;
    var returnArr = [];

    for ( var k in widgetInstances ) {
      if ( widgetInstances.hasOwnProperty(k) ) {
        widgetInstance = widgetInstances[k];
        if (widgetInstance && widgetInstance.isActive()) {
          var eventPromise = widgetInstance.SendEvent(eventName, data, isPromise);
          if (isPromise && eventPromise) {
            for (var i = 0; i < eventPromise.length; i++) {
              returnArr.push(eventPromise[i]);
            }
          }
        }
      }
    }
    return isPromise ? returnArr : Promise.resolve();
  }


  // Event Handlers
  function MessageHandler(MessageEvent) {
    /* Added for backward compatibility support */
    var data;
    try {
      data = typeof MessageEvent.data === 'string' ? JSON.parse(MessageEvent.data) : MessageEvent.data;
    } catch (e) {
      data = MessageEvent.data;
    }
    var messageType = data.type;
    try {

      if ( ['__REGISTER__', '__DEREGISTER__'].indexOf(messageType) !== -1 || isAuthorizedMessage(MessageEvent, data) ) {

        switch (messageType) {

        case '__REGISTER__':
          HandleRegister(MessageEvent, data); break;
        case '__DEREGISTER__':
          HandleDeRegister(MessageEvent, data); break;
        case '__EVENT_BIND__':
          HandleEventBind(MessageEvent, data); break;
        case '__EMIT__':
          HandleEmitEvent(MessageEvent, data); break;
        case '__EVENT_RESPONSE__':
          HandleEventResponse(MessageEvent, data); break;
        default:
          HandleInternalEvent(MessageEvent, data); break;

        }
      }

    } catch (e) {
      if ( !(e instanceof ZAppUtil.AuthenticationError) ) {
        Logger.Error('[MessageHandler] => ', e.stack);
      }
    }
  }

  function isAuthorizedMessage(MessageEvent, data) {

    var widgetInstance = Context.GetWidgetInstance(data.uniqueID);
    var WindowRef = widgetInstance && widgetInstance.getWindow();

    if ( typeof data.uniqueID !== 'string' && !WindowRef ) {
      throw new ZAppUtil.AuthenticationError('Message from Invalid window from received');
    }
    var Origin = getURLWithPath(widgetInstance.getResolvedURL());
    var widgetUniqueID = widgetInstance.getUniqueID();

    var MessageWindowRef = MessageEvent.source;
    var MessageUniqueID = data.uniqueID;
    var MessageOrigin = getURLWithPath(decodeURIComponent(data.widgetOrigin));

    if ( WindowRef !== MessageWindowRef || Origin !== MessageOrigin || widgetUniqueID !== MessageUniqueID ) {
      throw new Error('Message from UnAuthorized Source');
    }

    return true;
  }

  // Register SDK
  function HandleRegister(MessageEvent, data) {

    var sourceWindow = MessageEvent.source;
    var origin = MessageEvent.origin;
    var uniqueID = data.uniqueID;
    var widgetInstance = Context.GetWidgetInstance(uniqueID);
    if ( !widgetInstance || ( widgetInstance && sourceWindow !== widgetInstance.getWindow()) ) {
      Logger.Error('Message from Invalid IFrame arrived.');
      return;
    }

    widgetInstance._origin = origin;
    widgetInstance._isActive = true;
    widgetInstance._hasRegistered = true;

  }
  function WidgetLoadHandler(widgetInstance) {
    var widgetLocation = widgetInstance.getIFrame() && widgetInstance.getIFrame().getAttribute('data-location');
    var metaData = Context.GetMeta(widgetLocation);
    var extensionID = widgetInstance.getExtensionID();

    var PluginContext = {
      type: '__REGISTER__',
      uniqueID: widgetInstance.getUniqueID(),
      data: {
        meta: metaData, // NO I18N
        uniqueID: widgetInstance.getUniqueID(),
        extensionID: extensionID,
        location: widgetInstance.getLocation()
      }
    };

    Context
      .FetchLocaleResource(extensionID)
      .then(function (localeResponse) {
        if ( typeof localeResponse !== 'undefined' ) {
          PluginContext.data.locale = localeResponse.locale;
          PluginContext.data.localeResource = localeResponse.content;
        }
        SendRegisterEvent(widgetInstance, PluginContext);
      })
      .catch(function (error) {
        Logger.Info('Error occured while fetching I18NResource ', error);
        SendRegisterEvent(widgetInstance, PluginContext);
      });
  }
  function SendRegisterEvent(widgetInstance, contextObject) {
    if ( !widgetInstance ) {
      Logger.Info('Invalid WidgetInstance passed');
    }
    widgetInstance._hasLoaded = true;
    widgetInstance.activate();
    SendMessage(widgetInstance, contextObject);

    // In case Modal box
    if ( widgetInstance.getLocation() === '__MODAL__') {
      setTimeout(function () { widgetInstance.SendEvent('modal.opened'); }, 0);
    }
    // Invoking the App Lifecycle event : Onload
    if ( typeof widgetInstance.getProp('onload') === 'function' ) {
      setTimeout( widgetInstance.getProp('onload').bind(null, [ widgetInstance.getConfig() ]), widgetInstance.AppOnLoadDelay || 0);
    }

  }

  function HandleDeRegister(MessageEvent, data) {
    Context.DeleteWidgetInstance(data.uniqueID);
  }

  function HandleEventBind(MessageEvent, data) {
    var sourceWidgetID = data.uniqueID;
    var targetWidgetID = data.widgetID;
    var eventName = data.eventName;

    var targetWidget = ZApp.GetWidgetInstance(targetWidgetID);
    var eventObj;
    if ( targetWidget && !targetWidget._bindedEvents[eventName] ) {
      targetWidget._bindedEvents[eventName] = {};
    }
    eventObj = targetWidget._bindedEvents[eventName];
    eventObj[sourceWidgetID] = data.count;
  }
  function HandleCreateInstance(MessageEvent, data) {
    var uniqueID = data.uniqueID;
    var widgetInstance = ZApp.GetWidgetInstance(uniqueID);

    var modalProps = {
      extension_id: widgetInstance.getExtensionID(),
      extension_version: widgetInstance.getExtensionVersion()
    };

    for ( var k in data.options ) {
      if ( data.options.hasOwnProperty(k)) {
        modalProps[k] = data.options[k];
      }
    }

    var eventObj = {
      type: '__EVENT_RESPONSE__',
      eventName: '__INVOKE_MODAL__',
      promiseID: data.promiseID,
      time: new Date().getTime()
    };
    try {
      var ModalRuntime = new ZWidgetRuntime(modalProps); // eslint-disable-line
      Context.RenderWidget(modalProps.location, ModalRuntime);
      eventObj.isSuccess = true;
      eventObj.data = ModalRuntime.getWidgetInfo();
    } catch (e) {
      eventObj.isSuccess = false;
      eventObj.data = e.message;
    }

    SendMessage(widgetInstance, eventObj);
  }
  function HandleWidgetInfo(MessageEvent, data) {
    var uniqueID = data.uniqueID;
    var widgetInstance = ZApp.GetWidgetInstance(uniqueID);
    var extensionID = widgetInstance.getExtensionID();
    var instanceList = [];
    var eventObj = {
      type: '__EVENT_RESPONSE__',
      eventName: '__WIDGETS_INFO__',
      promiseID: data.promiseID,
      time: new Date().getTime()
    };

    try {
      var allWidgets = ZApp.GetAllWidgetInstance();
      for ( var k in allWidgets) {
        if ( allWidgets.hasOwnProperty(k)) {
          var instance = allWidgets[k];
          if (
            instance &&
            instance.getUniqueID() !== uniqueID &&
            instance.getExtensionID() === extensionID &&
            instance.isActive()
          ) {
            instanceList.push(instance.getWidgetInfo());
          }
        }
      }
      eventObj.isSuccess = true;
      eventObj.data = instanceList;

    } catch (e) {
      Logger.Error(e.message);
      eventObj.isSuccess = false;
    }
    SendMessage(widgetInstance, eventObj);
  }
  function HandleEmitEvent(MessageEvent, data) {
    var targetWidgetID = data.widgetID;
    var eventName = data.eventName;

    var eventObj = {
      widgetID: targetWidgetID,
      data: data.data,
      eventName: eventName,
      type: '__EMIT__'
    };
    var targetWidget = ZApp.GetWidgetInstance(targetWidgetID);
    var bindedEvents = targetWidget._bindedEvents[eventName];
    var targetWidgetKeys = bindedEvents && Object.keys(targetWidget._bindedEvents[eventName]);
    if (Array.isArray(targetWidgetKeys)) {
      targetWidgetKeys.forEach(function (widgetID) {
        var widgetInstance = ZApp.GetWidgetInstance(widgetID);
        if (widgetInstance && widgetInstance.isActive()) {
          SendMessage(widgetInstance, eventObj);
        }
      });
    }
  }
  function HandleInternalEvent(MessageEvent, data) {
    var eventHandlerMap = {
      '__HTTP__': HandleHTTPRequest,
      '__WIDGETS_INFO__': HandleWidgetInfo,
      '__CREATE_INSTANCE__': HandleCreateInstance
    };
    var handleFn = eventHandlerMap[data.eventName];
    if ( handleFn ) {
      handleFn(MessageEvent, data);
      return;
    }

    // In case if its custome Event
    HandleCustomEvent(MessageEvent, data);
  }
  function HandleCustomEvent(MessageEvent, data) {
    var eventName = data.eventName;
    var promiseID = data.promiseID;
    var eventPayload = data.data;
    var uniqueID = data.uniqueID;
    var widgetInstance = Context.GetWidgetInstance(uniqueID);
    var appConfig = widgetInstance.getConfig();
    var extensionID = widgetInstance.getExtensionID();

    Logger.Info('Event from SDK => Eventname : ', eventName, ', Time : ', data.time, ', Eventpayload : ', eventPayload);

    var eventObj = {
      'data': eventPayload,
      'config': appConfig,
      'iframe': widgetInstance.getIFrame()
    };

    if ( promiseID ) {
      var promiseObject = {
        'resolve': PromiseCallback.bind(null, widgetInstance, promiseID, eventName, true),
        'reject': PromiseCallback.bind(null, widgetInstance, promiseID, eventName, false)
      };
      eventObj.promise = promiseObject;
    }
    if ( typeof extensionID !== 'undefined') {
      eventObj.extension_id = extensionID; // TODO: Will be removed in future. Added for backward compatibility.
      eventObj.widgetID = uniqueID;
      eventObj.promiseID = promiseID;
    }

    Context.TriggerEventListeners(eventName, eventObj);
  }

  function HandleEventResponse(MessageEvent, data) {
    var promiseID = data.promiseID;
    var eventPayload = data.data;
    if (PromiseQueue.hasOwnProperty(promiseID)) {
      PromiseQueue[promiseID].resolve(eventPayload);
      PromiseQueue[promiseID] = undefined; // eslint-disable-line
      delete PromiseQueue[promiseID];
    }
  }

  // TODO: Experiemental Currently. need to refactor.
  function PromiseCallback(widgetInstance, promiseID, eventName, isSuccess, response) {
    var eventObj = {
      type: '__EVENT_RESPONSE__',
      eventName: 'eventName',
      promiseID: promiseID,
      time: new Date().getTime(),
      data: response,
      isSuccess: isSuccess
    };

    SendMessage(widgetInstance, eventObj);
  }
  function HandleHTTPRequest(MessageEvent, data) {
    var options = data.options;
    var promiseID = data.promiseID;
    var uniqueID = data.uniqueID;

    var promiseObj = {
      'resolve': NotifyRequestProcessedResult.bind(null, uniqueID, MessageEvent.origin, promiseID, true),
      'reject': NotifyRequestProcessedResult.bind(null, uniqueID, MessageEvent.origin, promiseID, false)
    };
    Context.ProcessGetRequest(promiseID, uniqueID, options, promiseObj);
  }
  function NotifyRequestProcessedResult(uniqueID, windowOrigin, promiseID, isSuccess, response ) {

    var sourceWindow = ZApp.GetWidgetInstance(uniqueID).getWindow();
    var eventObj = {
      type: '__EVENT_RESPONSE__', // NO I18N
      eventName: '__HTTP__',
      data: response,
      time: new Date().getTime(),
      promiseID: promiseID,
      isSuccess: isSuccess
    };
    setTimeout(function () { sourceWindow.postMessage(eventObj, windowOrigin)}, 0); // eslint-disable-line semi
  }

  // Util
  function getURLWithPath(url) {
    var a = document.createElement('a');
    a.setAttribute('href', url);
    return a.protocol + '//' + a.host + a.pathname;
  }

  MessageManager.Init = Init;
  MessageManager.SendMessage = SendMessage;
  MessageManager.BroadcastEvent = BroadcastEvent;
  MessageManager.WidgetLoadHandler = WidgetLoadHandler;

  return MessageManager;

})( window.MessageManager || {});

// $Id$
var DefaultRenderHandlers = (function (DefaultRenderHandlers) { // eslint-disable-line 

  function WidgetHandler(appConfig) {

    var appLocation = appConfig.location;
    var appURL = appConfig.resolvedURL;
    var IFrameComponent;

    if ( appLocation && typeof appLocation === 'string' ) {
      appLocation = IFrameComponent = document.getElementById(appLocation); // No I18N
    }

    if ( appLocation instanceof HTMLIFrameElement ) {
      IFrameComponent = appLocation;
      IFrameComponent.setAttribute('src', appURL);
    }

    return IFrameComponent;
  }

  DefaultRenderHandlers.WidgetHandler = WidgetHandler;

  return DefaultRenderHandlers;

})(window.DefaultRenderHandlers || {});


// $Id$
var ZApp = (function (Framework) {

  var Logger = ZAppUtil.getLogger(); // Logging instance for Core Framework
  try {

    var REGISTER_CHECK_TIMEOUT = 15 * 1000; // Seconds to schedule for check
    // var CLEAN_RUNTIME_TIMEOUT = 2 * 1000; // Seconds to schedule for invalid runtime clearance
    var
      isInit = false,
      _isDevMode = false,
      MetaStore = {},
      serverConfig = {
        devHost: {
          host: '127.0.0.1',
          port: '5000',
          path: ''
        },
        zappsHost: {
          host: '{{zappid}}.zappsusercontent.com',
          port: '',
          path: '/appfiles/{{zappid}}/{{version}}/{{hashkey}}'
        }
      },
      preRenderApp, postRenderApp,

      defaultLocale,
      ExtensionData = {}, // Extension Modules config data - Widgets, Buttons, Webtabs
      Widgets = [],  // Individual widgets data
      WidgetRuntimes = {}, // All the individual widget runtimes
      Connectors = [], // Connectors data

      RenderHandlers, // Function which handles the render of the Widgets
      RequestHandler, // Function which handles API Request handling of the app.

      widgetRegisterCBMap = {},

      FrameworkContext = {}; // Context Object which is passed around Individual modules

    function isInitialized() {
      return isInit;
    }

    function GetWidgetRegisterCallback(widgetLocation) {
      return widgetRegisterCBMap[widgetLocation];
    }
    function GetWidgetInstance(uniqueID) {
      return WidgetRuntimes[uniqueID];
    }
    function GetAllWidgetInstance() {
      return WidgetRuntimes;
    }
    function GetExtensionInstance(extensionID) {
      return ExtensionData[extensionID];
    }
    function GetExtensionConfig(extensionID) {
      var extension = GetExtensionInstance(extensionID);
      return extension && extension.config;
    }
    function DeleteWidgetInstance(uniqueID, forceDelete) {
      var IFrameEle = document.getElementById(uniqueID);

      if ( forceDelete ) {
        WidgetRuntimes[uniqueID] = undefined; // eslint-disable-line no-undefined
        delete WidgetRuntimes[uniqueID];
        if ( IFrameEle ) {
          IFrameEle.parentElement.removeChild(IFrameEle);
        }
      } else if ( !IFrameEle ) {
        WidgetRuntimes[uniqueID] = undefined; // eslint-disable-line no-undefined
        delete WidgetRuntimes[uniqueID];
      }
    }

    function GetConnectors(extensionID) {
      return Connectors.filter(function (connector) {
        return connector.extension_id && connector.extension_id === extensionID;
      });
    }

    function RenderWidgets(locationID, modelData ) {
      Logger.Info('Render Apps with LocationID => ', locationID);

      MetaStore[locationID] = modelData;

      for ( var i = 0; i < Widgets.length; i++) {

        var widgetProps = Widgets[i];
        try {
          var widgetLocation = widgetProps.location;
          // Checking wheather this Widget belongs to this location.
          if ( (Array.isArray(widgetLocation) && widgetLocation.indexOf(locationID) === -1 ) ||
              widgetLocation !== locationID
          ) continue;

          var widgetInstance = new ZWidgetRuntime(widgetProps); // eslint-disable-line no-undef

          // TODO: have to handle forceRender, which in case will render the app forcefully.
          RenderWidget(locationID, widgetInstance);
        } catch (e) {
          Logger.Error('Exception while Rendering Widget ==> ', e);
        }
      }
    }

    // Private API to render passed in Widget configuration
    function RenderWidget(renderLocation, widgetInstance) {

      try {
        var uniqueID = generateSecretKey();
        widgetInstance._uniqueID = uniqueID;        
        widgetInstance._resolvedURL = getResolvedAppURL(widgetInstance);

        executeCallback(preRenderApp, widgetInstance);
        var windowRef = RenderHandlers.WidgetHandler(renderLocation, widgetInstance);

        if (windowRef instanceof HTMLIFrameElement) {
          windowRef.setAttribute('data-location', renderLocation);
          windowRef.setAttribute('id', uniqueID);
          WidgetRuntimes[uniqueID] = widgetInstance;

          // Listening for OnUnload event on the IFrame
          document.getElementById(uniqueID).addEventListener('DOMNodeRemovedFromDocument', function () {
            WidgetRuntimes[uniqueID] = undefined; // eslint-disable-line no-undefined
            delete WidgetRuntimes[uniqueID];
          });

          // Listening for OnLoad event on the IFrame
          windowRef.onload = MessageManager.WidgetLoadHandler.bind(null, widgetInstance);
          ScheduleRegisterCheck(uniqueID);

          executeCallback(postRenderApp, widgetInstance);
        } else {
          Logger.Info('[windowRef] is not an IFrameElement.' + renderLocation + ' , ' + widgetInstance.getURL());
        }
      } catch (e) {
        throw e;
      }

      return widgetInstance;
    }
    function LoadWidget(appConfig) {
      if ( !ZApp.isInitialized() ) {
        Logger.Error('Bootstrap not yet initialized.');
        return;
      }
      Logger.Info('Load App : [ ' + appConfig.url + ',' + appConfig.location + ']'); // No I18N

      if ( !appConfig.ondemand ) {
        Widgets.push(appConfig);
      }

      // Storing this widget's meta to store
      MetaStore[appConfig.location] = appConfig.meta;

      var widgetInstance = new ZWidgetRuntime(appConfig); // eslint-disable-line no-undef
      return RenderWidget(appConfig.location, widgetInstance);
    }
    function ScheduleRegisterCheck(widgetID) {
      setTimeout(function () {
        var widgetInstance = WidgetRuntimes[widgetID];
        if ( widgetInstance && widgetInstance._hasLoaded && !widgetInstance._hasRegistered ) {
          WidgetRuntimes[widgetID] = undefined;
          delete WidgetRuntimes[widgetID];
        }
      }, REGISTER_CHECK_TIMEOUT);
    }
    function isDevMode() {
      return _isDevMode;
    }

    function executeCallback(fn, appInstance) {
      if ( fn && typeof fn === 'function' ) {
        return fn(appInstance);
      }
    }
    function getResolvedAppURL(widgetConfig) {
      var widgetURL = widgetConfig.getURL();

      var serviceOrigin = ZAppUtil.getURLOrigin();
      var resolvedURL;
      var qpMap = {
        'serviceOrigin': encodeURIComponent(serviceOrigin),
        'isDevMode': isDevMode(),
        'isLogEnabled': ZAppUtil.isLogEnabled()
      };
      var QPString = ZAppUtil.constructQueryParamsString(qpMap);

      if ( ZAppUtil.isURL(widgetURL) ) { // If the URL is external (absolute) URL.
        resolvedURL = widgetURL;
      } else { // If its internal hosted app URL. ( relative )
        var extID = widgetConfig.getExtensionID();
        var appBaseURL = getExtensionBaseURL(extID);
        resolvedURL = appBaseURL + widgetURL;
      }

      resolvedURL += resolvedURL.indexOf('?') === -1 ? '?' : '&';
      resolvedURL += QPString;

      return resolvedURL;
    }
    function getConstructedURL(extensionData) {
      var urlConfig = serverConfig.zappsHost;
      if (isDevMode()) {
        urlConfig = serverConfig.devHost;
      }

      var fullURL;
      var protocol = urlConfig.protocol ? urlConfig.protocol : window.location.protocol;
      var host = getPatchedString(urlConfig.host, extensionData);
      var port = urlConfig.port ? ( ':' + urlConfig.port ) : '';
      var path = urlConfig.path && getPatchedString(urlConfig.path, extensionData);

      fullURL = protocol + '//' + host + port + path;

      return fullURL;
    }
    function getPatchedString(string, params) {

      var paramsMap = {};
      if (!string || typeof string !== 'string') {
        throw new Error('Invalid String'); // NO I18N
      }
      if ( Array.isArray(params) ) {
        params.forEach(function (param) {
          paramsMap[param.name] = param.value;
        });
      } else {
        paramsMap = params;
      }

      var patchedString =
        string.
          replace(/\{\{\w{1,}\}\}/g,
            function (match) {
              var key = match.replace(/[{{}}]/g, '');
              return paramsMap[key];
            });

      return patchedString;
    }
    function getExtensionBaseURL(extension) {
      var extensionInstance;
      if ( typeof extension === 'string' ) {
        extensionInstance = GetExtensionInstance(extension);
      } else {
        extensionInstance = extension;
      }
      var serverBaseURL = getConstructedURL(extensionInstance);

      return serverBaseURL;
    }

    // Public API
    function LoadExtension(extensionConfig) {
      if ( !ZApp.isInitialized() ) {
        Logger.Error('Bootstrap not yet initialized.');
      }

      return _LoadExtension(extensionConfig);
    }
    function _LoadExtension(extensionData) {

      try {

        var extData =  typeof extensionData === 'string' ? JSON.parse(extensionData) : extensionData;

        if ( typeof extData !== 'object' ) {
          Logger.Error('Invalid extension config passed'); return;
        }

        var modules = extData.modules;
        if ( typeof modules === 'undefined' ) {
          Logger.Error('Invalid modules properties');
        }

        addWidgets(extData, modules.widgets);
        addConnectors(extData, extData.connectors);

        extData.config = getFilteredConfigParams(extData.config);

        extData.modules.widgets = undefined; // eslint-disable-line no-undefined
        extData.connectors = undefined; // eslint-disable-line no-undefined
        extData.modules = undefined; // eslint-disable-line no-undefined
        delete extData.modules;
        delete extData.connectors;

        // RenderExtension(extensionData); // On Demand Rendering supporting arriving soon.
        ExtensionData[extData.id] = extData;

      } catch (err) {
        Logger.Error('Error in Loading App Data ', err);
      }
    }

    // Utility
    function addWidgets(extensionData, widgets) {
      if (Array.isArray(widgets)) {

        for ( var i = 0, len = widgets.length; i < len; i++) {
          widgets[i].extension_id = extensionData.id;
          widgets[i].extension_version = extensionData.version;

          Widgets.push(widgets[i]);
        }
      }
    }

    function addConnectors(extensionData, connectors) {
      if (Array.isArray(connectors)) {

        for ( var i = 0, len = connectors.length; i < len; i++) {
          connectors[i].extension_id = extensionData.id;
          connectors[i].extension_version = extensionData.version;
        }
        Connectors = Connectors.concat(connectors);
      }
    }

    function getFilteredConfigParams(configArr) {
      if ( isDevMode() ) { return configArr; } // If in Devmode all config params are needed for manipulation.

      if ( Array.isArray(configArr)) {
        return configArr.filter(function (config) { return !Boolean(config.secure); });
      }
    }

    // Event Operations
    var _EventListeners = {};
    function AttachEventListener(eventName, fn) {

      if (!_EventListeners.hasOwnProperty(eventName)) {
        _EventListeners[eventName] = [];
      }
      _EventListeners[eventName].push(fn);
    }

    function GetWidgetsByEvent(eventName) {
      var widgetInstances = GetAllWidgetInstance();
      var eventWidget = [];
      for (var key in widgetInstances) {
        if (widgetInstances.hasOwnProperty(key)) {
          var events = widgetInstances[key]._bindedEvents;
          if (events[eventName] !== undefined) {
            eventWidget.push(key);
          }
        }
      }
      return eventWidget;
    }

    // Meta operations
    function GetMeta(location) {
      return MetaStore[location];
    }
    // Event operations
    function BroadcastEvent(eventName, payload, isPromise) {
      return MessageManager.BroadcastEvent(eventName, payload, isPromise);
    }

    function DeleteAllExtensions() {
      var widgetRuntimes = GetAllWidgetInstance();
      for (var key in widgetRuntimes) {
        if (widgetRuntimes.hasOwnProperty(key)) {
          var iframeElement = document.getElementById(key);
          if (iframeElement && iframeElement.parentNode) {
            iframeElement.parentNode.removeChild(iframeElement);
          }
        }
      }
      ExtensionData = {};
      Widgets = [];
      WidgetRuntimes = {};
      Connectors = [];
    }

    function DeleteExtension(extensionId) {
      var widgetRuntimes = GetAllWidgetInstance();
      for (var key in widgetRuntimes) {
        if (widgetRuntimes.hasOwnProperty(key) && widgetRuntimes[key].getExtensionID() === extensionId) {
          var widgetElement = document.getElementById(key);
          widgetElement.parentNode.removeChild(widgetElement);
          WidgetRuntimes[key] = undefined;
          delete WidgetRuntimes[key];
        }
      }

      Widgets = removeExtnElementsInArray(Widgets, extensionId);
      Connectors = removeExtnElementsInArray(Connectors, extensionId);

      ExtensionData[extensionId] = undefined;
      delete ExtensionData[extensionId];

    }

    function removeExtnElementsInArray(array, extensionId) {
      return array.filter( function (e) {
        return !(e.extension_id === extensionId);
      });
    }

    function ProcessGetRequest(promiseId, uniqueID, options, promiseObj) {

      try {        
        Logger.Info('ProcessGetRequest : PromiseID: ', promiseId, ', Options: ', options);

        options.contentType = options && options.contentType ? options.contentType : 'application/text';
        options.dataType = options && options.dataType ? options.dataType : 'text';
        options.widgetID = uniqueID;
        options.promiseID = promiseId;

        if ( typeof RequestHandler !== 'function' ) { throw new Error('Provide Request handler implementation in the Bootstrap.'); }

        RequestHandler(options, promiseObj);

      } catch (e) {      
        Logger.Error('ProcessGetRequest : Error => ', e); // NO I18N
      }
    }

    function TriggerEventListeners(eventName, evt) {
      var eventListeners = _EventListeners[eventName];
      if ( Array.isArray(eventListeners) ) {
        for (var i = 0; i < eventListeners.length; i++) {
          eventListeners[i](evt);
        }
      }
    }

    function FetchLocaleResource( extensionID ) {
      return new Promise(function (resolve, reject) {

        var extensionData = ExtensionData[extensionID];
        if ( extensionData && extensionData.locale === undefined ) {
          reject();
        } else if ( extensionData && extensionData.localeResource !== undefined ) {
          resolve({ locale: extensionData.locale, content: extensionData.localeResource });
        } else {

          var extensionLocale = extensionData.locale;
          var localeResourceURL = getExtensionBaseURL(extensionID) + '/app/translations/' + extensionLocale + '.json';

          FetchResource(localeResourceURL, extensionLocale).then(function (localeResponse) {
            resolve(localeResponse);
          }).catch(function () {
            if (extensionLocale !== defaultLocale) {
              localeResourceURL = getExtensionBaseURL(extensionID) + '/app/translations/' + defaultLocale + '.json';
              FetchResource(localeResourceURL, defaultLocale).then(function (localeResponse) {
                resolve(localeResponse);
              }).catch(function (e) {
                reject(e);
              });
            } else {
              reject();
            }
          });

        }
      });
    }

    function FetchResource(url, locale) {
      return new Promise(function (resolve, reject) {
        try {
          var XHR = new XMLHttpRequest();
          XHR.onreadystatechange = function () {
            if (XHR.readyState === XMLHttpRequest.DONE && XHR.status === 200) {
              var responseJSON;
              try {
                responseJSON = JSON.parse(XHR.responseText);
              } catch (e) { reject(e); }
              resolve({ locale: locale, content: responseJSON });
            } else if (XHR.readyState === XMLHttpRequest.DONE) {
              reject(XHR.status);
            }
          };
          XHR.open('GET', url);
          XHR.send();
        } catch (e) {
          reject();
        }
      });
    }

    // Framework Initializer
    function Bootstrap(config) {
      return new Promise(function (resolve, reject) {

        var MessageHandler;
        try {
          if (!config || typeof config !== 'object') {
            throw new Error('Invalid configurations passed to Bootstrap.'); // NO I18N
          }

          RenderHandlers = config.RenderHandlers || DefaultRenderHandlers;
          RequestHandler = config.RequestHandler;

          preRenderApp = config.preRenderApp;
          postRenderApp = config.postRenderApp;

          _isDevMode = Boolean(config.isDevMode);

          // Pre filling defaults
          for ( var k in config.serverConfig ) {
            if ( serverConfig.hasOwnProperty(k)) {
              serverConfig[k] = config.serverConfig[k];
            }
          }

          defaultLocale = config.defaultLocale || 'en';

          FrameworkContext.defaultLocale = defaultLocale;
          FrameworkContext.ProcessGetRequest = ProcessGetRequest;
          FrameworkContext.Logger = Logger;
          FrameworkContext.GetWidgetInstance = GetWidgetInstance;
          FrameworkContext.GetAllWidgetInstance = GetAllWidgetInstance;
          FrameworkContext.GetExtensionInstance = GetExtensionInstance;
          FrameworkContext.DeleteWidgetInstance = DeleteWidgetInstance;
          FrameworkContext.GetWidgetRegisterCallback = GetWidgetRegisterCallback;

          FrameworkContext.GetMeta = GetMeta;

          FrameworkContext.TriggerEventListeners = TriggerEventListeners;

          FrameworkContext.FetchLocaleResource = FetchLocaleResource;

          FrameworkContext.RenderWidget = RenderWidget;

          // Attaching event handlers
          var EventListeners = config.EventListeners || {};
          for ( k in EventListeners) {
            if ( EventListeners.hasOwnProperty(k)) {
              AttachEventListener(k, EventListeners[k]);
            }
          }

          MessageHandler =  MessageManager.Init(FrameworkContext);
          window.addEventListener('message', MessageHandler);
          isInit = true;

          // CleanRuntimeScheduler();

          Logger.Info('Running in Dev Mode : ', isDevMode()); // No I18N

          resolve(Framework);
        } catch (e) {
          reject(e.message);
        }
      });
    }

    // Utils
    function generateSecretKey() {
      var d = new Date().getTime();
      var secretKey = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor( d / 16);
        return ( c === 'x' ? r : ( r & 0x3 | 0x8)).toString(16);
      });
      return secretKey;
    }

    // Public API's
    Framework.Bootstrap = Bootstrap;
    Framework.isInitialized = isInitialized;

    // Loading extension | widgets
    Framework.LoadExtension = LoadExtension;
    Framework.LoadWidget = LoadWidget;
    Framework.GetMeta = GetMeta;

    // Rendering widgets and other types
    Framework.RenderWidgets = RenderWidgets;

    // Getting widgets reference
    Framework.GetWidgetInstance = GetWidgetInstance;
    Framework.GetWidgetsByEvent = GetWidgetsByEvent;
    Framework.GetAllWidgetInstance = GetAllWidgetInstance;
    Framework.DeleteWidgetInstance = DeleteWidgetInstance;

    Framework.GetExtensionInstance = GetExtensionInstance;
    Framework.GetExtensionConfig = GetExtensionConfig;
    Framework.GetConnectors = GetConnectors;

    Framework.isDevMode = isDevMode;

    Framework.BroadcastEvent = BroadcastEvent;
    Framework.DeleteAllExtensions = DeleteAllExtensions;
    Framework.DeleteExtension = DeleteExtension;
    Framework.getLogger = ZAppUtil.getLogger;

    Framework.GetExtensionBaseURL = getExtensionBaseURL;

    // Returning public API
    return Framework;

  } catch (e) {
    Logger.Error('Error Occured ', e.message);
  }

})(window.ZApp || {});
