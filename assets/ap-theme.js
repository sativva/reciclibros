(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) =>
    key in obj
      ? __defProp(obj, key, {
          enumerable: true,
          configurable: true,
          writable: true,
          value,
        })
      : (obj[key] = value);
  var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    return value;
  };

  function Apollo(root) {
    this.apollolistenMap = [{}, {}];
    if (root) {
      this.root(root);
    }
    this.handle = Apollo.prototype.handle.bind(this);
    this._removedListeners = [];
  }
  Apollo.prototype.root = function (root) {
    const apollolistenMap = this.apollolistenMap;
    let eventType;
    if (this.rootElement) {
      for (eventType in apollolistenMap[1]) {
        if (apollolistenMap[1].hasOwnProperty(eventType)) {
          this.rootElement.removeEventListener(eventType, this.handle, true);
        }
      }
      for (eventType in apollolistenMap[0]) {
        if (apollolistenMap[0].hasOwnProperty(eventType)) {
          this.rootElement.removeEventListener(eventType, this.handle, false);
        }
      }
    }
    if (!root || !root.addEventListener) {
      if (this.rootElement) {
        delete this.rootElement;
      }
      return this;
    }
    this.rootElement = root;
    for (eventType in apollolistenMap[1]) {
      if (apollolistenMap[1].hasOwnProperty(eventType)) {
        this.rootElement.addEventListener(eventType, this.handle, true);
      }
    }
    for (eventType in apollolistenMap[0]) {
      if (apollolistenMap[0].hasOwnProperty(eventType)) {
        this.rootElement.addEventListener(eventType, this.handle, false);
      }
    }
    return this;
  };

  Apollo.prototype.off = function (eventType, selector, handler, uCapture) {
    let i;
    let listener;
    let apollolistenMap;
    let listenerList;
    let singleEventType;
    if (typeof selector === "function") {
      uCapture = handler;
      handler = selector;
      selector = null;
    }
    if (uCapture === void 0) {
      this.off(eventType, selector, handler, true);
      this.off(eventType, selector, handler, false);
      return this;
    }
    apollolistenMap = this.apollolistenMap[uCapture ? 1 : 0];
    if (!eventType) {
      for (singleEventType in apollolistenMap) {
        if (apollolistenMap.hasOwnProperty(singleEventType)) {
          this.off(singleEventType, selector, handler);
        }
      }
      return this;
    }
    listenerList = apollolistenMap[eventType];
    if (!listenerList || !listenerList.length) {
      return this;
    }
    for (i = listenerList.length - 1; i >= 0; i--) {
      listener = listenerList[i];
      if (
        (!selector || selector === listener.selector) &&
        (!handler || handler === listener.handler)
      ) {
        this._removedListeners.push(listener);
        listenerList.splice(i, 1);
      }
    }
    if (!listenerList.length) {
      delete apollolistenMap[eventType];
      if (this.rootElement) {
        this.rootElement.removeEventListener(eventType, this.handle, uCapture);
      }
    }
    return this;
  };
  Apollo.prototype.on = function (evtType, selector, handler, uCapture) {
    let root;
    let apollolistenMap;
    let matcher;
    let matcherParam;
    if (!evtType) {
      throw new TypeError("Invalid event type: " + evtType);
    }
    if (typeof selector === "function") {
      uCapture = handler;
      handler = selector;
      selector = null;
    }
    if (uCapture === void 0) {
      uCapture = this.captureForType(evtType);
    }
    if (typeof handler !== "function") {
      throw new TypeError("Handler must be a type of Function");
    }
    root = this.rootElement;
    apollolistenMap = this.apollolistenMap[uCapture ? 1 : 0];
    if (!apollolistenMap[evtType]) {
      if (root) {
        root.addEventListener(evtType, this.handle, uCapture);
      }
      apollolistenMap[evtType] = [];
    }
    if (!selector) {
      matcherParam = null;
      matcher = apolloMatchesRoot.bind(this);
    } else if (/^[a-z]+$/i.test(selector)) {
      matcherParam = selector;
      matcher = apolloMatchesTag;
    } else if (/^#[a-z0-9\-_]+$/i.test(selector)) {
      matcherParam = selector.slice(1);
      matcher = matchesId;
    } else {
      matcherParam = selector;
      matcher = Element.prototype.matches;
    }
    apollolistenMap[evtType].push({
      selector,
      handler,
      matcher,
      matcherParam,
    });
    return this;
  };
  Apollo.prototype.captureForType = function (evtType) {
    return ["blur", "error", "focus", "load", "resize", "scroll"].indexOf(evtType) !== -1;
  };
  Apollo.prototype.fire = function (event, target, listener) {
    return listener.handler.call(target, event, target);
  };

  function apolloMatchesTag(tagName, element) {
    return tagName.toLowerCase() === element.tagName.toLowerCase();
  }

  function apolloMatchesRoot(selector, element) {
    if (this.rootElement === window) {
      return element === document || element === document.documentElement || element === window;
    }
    return this.rootElement === element;
  }

  function matchesId(id, element) {
    return id === element.id;
  }
  Apollo.prototype.destroy = function () {
    this.off();
    this.root();
  };
  Apollo.prototype.handle = function (event) {
    let i;
    let l;
    const type = event.type;
    let root;
    let phase;
    let listener;
    let returned;
    let listenerList = [];
    let target;
    const eventIgnore = "ApolloIgnore";
    if (event[eventIgnore] === true) {
      return;
    }
    target = event.target;
    if (target.nodeType === 3) {
      target = target.parentNode;
    }
    if (target.correspondingUseElement) {
      target = target.correspondingUseElement;
    }
    root = this.rootElement;
    phase = event.eventPhase || (event.target !== event.currentTarget ? 3 : 2);
    switch (phase) {
      case 1:
        listenerList = this.apollolistenMap[1][type];
        break;
      case 2:
        if (this.apollolistenMap[0] && this.apollolistenMap[0][type]) {
          listenerList = listenerList.concat(this.apollolistenMap[0][type]);
        }
        if (this.apollolistenMap[1] && this.apollolistenMap[1][type]) {
          listenerList = listenerList.concat(this.apollolistenMap[1][type]);
        }
        break;
      case 3:
        listenerList = this.apollolistenMap[0][type];
        break;
    }
    let toFire = [];
    l = listenerList.length;
    while (target && l) {
      for (i = 0; i < l; i++) {
        listener = listenerList[i];
        if (!listener) {
          break;
        }
        if (
          target.tagName &&
          ["button", "input", "select", "textarea"].indexOf(target.tagName.toLowerCase()) > -1 &&
          target.hasAttribute("disabled")
        ) {
          toFire = [];
        } else if (listener.matcher.call(target, listener.matcherParam, target)) {
          toFire.push([event, target, listener]);
        }
      }
      if (target === root) {
        break;
      }
      l = listenerList.length;
      target = target.parentElement || target.parentNode;
      if (target instanceof HTMLDocument) {
        break;
      }
    }
    let ret;
    for (i = 0; i < toFire.length; i++) {
      if (this._removedListeners.indexOf(toFire[i][2]) > -1) {
        continue;
      }
      returned = this.fire.apply(this, toFire[i]);
      if (returned === false) {
        toFire[i][0][eventIgnore] = true;
        toFire[i][0].preventDefault();
        ret = false;
        break;
      }
    }
    return ret;
  };

  var main_default = Apollo;

  var ApolloInputBindingManager = class {
    constructor() {
      this.apolloElement = new main_default(document.body);
      this.apolloElement.on("change", "[data-bind-value]", this._evtOnValueChanged.bind(this));
    }
    _evtOnValueChanged(event, target) {
      const boundElement = document.getElementById(target.getAttribute("data-bind-value"));

      if (boundElement) {
        if (target.tagName === "SELECT") {
          target = target.options[target.selectedIndex];
        }
        boundElement.innerHTML = target.hasAttribute("title")
          ? target.getAttribute("title")
          : target.value;
      }
    }
  };

  function triggerEvent(element, name, data = {}) {
    //thanhvn
    element.dispatchEvent(
      new CustomEvent(name, {
        bubbles: true,
        detail: data,
      })
    );
  }

  function triggerNonBubblingEvent(element, name, data = {}) {
    element.dispatchEvent(
      new CustomEvent(name, {
        bubbles: false,
        detail: data,
      })
    );
  }

  var CustomHTMLElement = class extends HTMLElement {
    constructor() {
      super();
      this._sectionReloadedStatus = false;
      if (Shopify.designMode) {
        this.rootApollo.on("shopify:section:select", (event) => {
          const parentSection = this.closest(".shopify-section");
          if (event.target === parentSection && event.detail.load) {
            this._sectionReloadedStatus = true;
          }
        });
      }
    }
    get rootApollo() {
      return (this._rootApollo = this._rootApollo || new main_default(document.documentElement));
    }
    get apollo() {
      return (this._apollo = this._apollo || new main_default(this));
    }
    loadingBarEnable() {
      triggerEvent(document.documentElement, "theme:loading:start");
    }
    loadingBarDisable() {
      triggerEvent(document.documentElement, "theme:loading:end");
    }
    untilObjectVisible(
      intersectionObserverOptions = {
        rootMargin: "30px 0px",
        threshold: 0,
      }
    ) {
      const onObjectVisible = () => {
        this.classList.add("ap-object-loaded");
        this.style.opacity = "1";
      };
      return new Promise((resolve) => {
        if (window.IntersectionObserver) {
          this.intersectionObserver = new IntersectionObserver((event) => {
            if (event[0].isIntersecting) {
              this.intersectionObserver.disconnect();
              requestAnimationFrame(() => {
                resolve();
                onObjectVisible();
              });
            }
          }, intersectionObserverOptions);
          this.intersectionObserver.observe(this);
        } else {
          resolve();
          onObjectVisible();
        }
      });
    }
    disconnectedCallback() {
      var _a;
      this.apollo.destroy();
      this.rootApollo.destroy();
      (_a = this.intersectionObserver) == null ? void 0 : _a.disconnect();
      delete this._apollo;
      delete this._rootApollo;
    }
  };

  var apollohtmltagSelectors = [
    "input",
    "select",
    "textarea",
    "a[href]",
    "button",
    "[tabindex]",
    "audio[controls]",
    "video[controls]",
    '[contenteditable]:not([contenteditable="false"])',
    "details>summary:first-of-type",
    "details",
  ];
  var apollohtmltagSelector = /* @__PURE__ */ apollohtmltagSelectors.join(",");
  var matches =
    typeof Element === "undefined"
      ? function () {}
      : Element.prototype.matches ||
        Element.prototype.msMatchesSelector ||
        Element.prototype.webkitMatchesSelector;
  var apolloHtmltag = function apolloHtmltag2(el, includeContainer, filter) {
    var apollohtmltags = Array.prototype.slice.apply(el.querySelectorAll(apollohtmltagSelector));
    if (includeContainer && matches.call(el, apollohtmltagSelector)) {
      apollohtmltags.unshift(el);
    }
    apollohtmltags = apollohtmltags.filter(filter);
    return apollohtmltags;
  };
  var apolloContentEditableStatus = function apolloContentEditableStatusFunction(node) {
    return node.contentEditable === "true";
  };
  var indexOfTab = function indexOfTabFunction(node) {
    var arrTabindex = parseInt(node.getAttribute("tabindex"), 10);
    if (!isNaN(arrTabindex)) {
      return arrTabindex;
    }
    if (apolloContentEditableStatus(node)) {
      return 0;
    }
    let status =
      node.nodeName === "AUDIO" || node.nodeName === "VIDEO" || node.nodeName === "DETAILS";
    status = status && node.getAttribute("tabindex") === null;
    if (status) {
      return 0;
    }
    return node.tabIndex;
  };
  var sortTabOrdered = function sortTabOrderedFunction(a, b) {
    if (a.tabIndex === b.tabIndex) {
      return a.documentOrder - b.documentOrder;
    } else {
      return a.tabIndex - b.tabIndex;
    }
  };
  var inputStatus = function inputStatusFunction(node) {
    return node.tagName === "INPUT";
  };
  var hiddenInputStatus = function hiddenInputStatusFuncrion(node) {
    return inputStatus(node) && node.type === "hidden";
  };
  var detailsWithSummaryStatus = function detailsWithSummaryStatusFunction(node) {
    var r = node.tagName === "DETAILS";
    var r2 = Array.prototype.slice.apply(node.children).some(function (child) {
      return child.tagName === "SUMMARY";
    });
    return r && r2;
  };
  var radioCheckedStatus = function radioCheckedStatusFunction(nodes, form) {
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].checked && nodes[i].form === form) {
        return nodes[i];
      }
    }
  };
  var tabRadioStatus = function tabRadioStatusFunction(node) {
    if (!node.name) {
      return true;
    }
    var radioScope = node.form || node.ownerDocument;
    var qObjectRadios = function qObjectRadiosFunction(name) {
      let status = radioScope.querySelectorAll('input[type="radio"][name="' + name + '"]');
      return status;
    };
    var radioSet;
    if (
      typeof window !== "undefined" &&
      typeof window.CSS !== "undefined" &&
      typeof window.CSS.escape === "function"
    ) {
      radioSet = qObjectRadios(window.CSS.escape(node.name));
    } else {
      try {
        radioSet = qObjectRadios(node.name);
      } catch (err) {
        console.error("%s", err.message);
        return false;
      }
    }
    var checked = radioCheckedStatus(radioSet, node.form);
    return !checked || checked === node;
  };
  var radioStatus = function radioStatusFunction(node) {
    return inputStatus(node) && node.type === "radio";
  };
  var nonRadioTabbableStatus = function nonRadioTabbableStatusFunction(node) {
    return radioStatus(node) && !tabRadioStatus(node);
  };
  var hiddenStatus = function hiddenStatusFunction(node, displayCheck) {
    if (getComputedStyle(node).visibility === "hidden") {
      return true;
    }
    var isDirectSummary = matches.call(node, "details>summary:first-of-type");
    if (isDirectSummary) {
      var nodeUnderDetails = node.parentElement;
    } else {
      var nodeUnderDetails = node;
    }

    if (matches.call(nodeUnderDetails, "details:not([open]) *")) {
      return true;
    }
    if (!displayCheck || displayCheck === "full") {
      while (node) {
        if (getComputedStyle(node).display === "none") {
          return true;
        }
        node = node.parentElement;
      }
    } else if (displayCheck === "non-zero-area") {
      var _node$getBoundingClie = node.getBoundingClientRect();
      var width = _node$getBoundingClie.width;
      var height = _node$getBoundingClie.height;
      return width === 0 && height === 0;
    }
    return false;
  };
  var fromFieldDisabledStatus = function fromFieldDisabledStatusFunction(node) {
    if (
      inputStatus(node) ||
      node.tagName === "SELECT" ||
      node.tagName === "TEXTAREA" ||
      node.tagName === "BUTTON"
    ) {
      var parentNode = node.parentElement;
      while (parentNode) {
        if (parentNode.tagName === "FIELDSET" && parentNode.disabled) {
          for (var i = 0; i < parentNode.children.length; i++) {
            var child = parentNode.children.item(i);
            if (child.tagName === "LEGEND") {
              if (child.contains(node)) {
                return false;
              }
              return true;
            }
          }
          return true;
        }
        parentNode = parentNode.parentElement;
      }
    }
    return false;
  };
  var nodeFocusMatchingSelectoreStatus = function nodeFocusMatchingSelectoreStatusFunction(
    options,
    node
  ) {
    if (
      node.disabled ||
      hiddenInputStatus(node) ||
      hiddenStatus(node, options.displayCheck) ||
      detailsWithSummaryStatus(node) ||
      fromFieldDisabledStatus(node)
    ) {
      return false;
    }
    return true;
  };
  var nodeSelectorTabbableMatchingStatus = function nodeSelectorTabbableMatchingStatusFunction(
    options,
    node
  ) {
    if (
      !nodeFocusMatchingSelectoreStatus(options, node) ||
      nonRadioTabbableStatus(node) ||
      indexOfTab(node) < 0
    ) {
      return false;
    }
    return true;
  };
  var objTabbable = function objTabbableFunction(el, options) {
    options = options || {};
    var regularTabbables = [];
    var orderedTabbables = [];
    var apollohtmltags = apolloHtmltag(
      el,
      options.includeContainer,
      nodeSelectorTabbableMatchingStatus.bind(null, options)
    );
    apollohtmltags.forEach(function (apollohtmltag, i) {
      var apollohtmltagTabindex = indexOfTab(apollohtmltag);
      if (apollohtmltagTabindex === 0) {
        regularTabbables.push(apollohtmltag);
      } else {
        orderedTabbables.push({
          documentOrder: i,
          tabIndex: apollohtmltagTabindex,
          node: apollohtmltag,
        });
      }
    });
    var objTabbableNodes = orderedTabbables
      .sort(sortTabOrdered)
      .map(function (a) {
        return a.node;
      })
      .concat(regularTabbables);
    return objTabbableNodes;
  };
  var focusableCandidateSelector = /* @__PURE__ */ apollohtmltagSelectors
    .concat("iframe")
    .join(",");
  var focusableStatus = function focusableStatusFunction(node, options) {
    options = options || {};
    if (!node) {
      throw new Error("No node provided");
    }
    if (matches.call(node, focusableCandidateSelector) === false) {
      return false;
    }
    return nodeFocusMatchingSelectoreStatus(options, node);
  };

  function apolloPrivateKeys(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object);
      if (enumerableOnly) {
        symbols = symbols.filter(function (sym) {
          return Object.getOwnPropertyDescriptor(object, sym).enumerable;
        });
      }
      keys.push.apply(keys, symbols);
    }
    return keys;
  }
  var apolloTrapsActiveFocus = (function () {
    var trapQueue = [];
    return {
      apolloTrapClose: function apolloTrapClose(trap) {
        var index = trapQueue.indexOf(trap);
        if (index !== -1) {
          trapQueue.splice(index, 1);
        }
        if (trapQueue.length > 0) {
          trapQueue[trapQueue.length - 1].unpause();
        }
      },
      apolloTrapOpen: function apolloTrapOpen(trap) {
        if (trapQueue.length > 0) {
          var active = trapQueue[trapQueue.length - 1];
          if (active !== trap) {
            active.pause();
          }
        }
        var index = trapQueue.indexOf(trap);
        if (index === -1) {
          trapQueue.push(trap);
        } else {
          trapQueue.splice(index, 1);
          trapQueue.push(trap);
        }
      },
    };
  })();

  function _objectAdvandFunction(target) {
    for (var i = 1; i < arguments.length; i++) {
      if (arguments[i] != null) {
        var source = arguments[i];
      } else {
        var source = {};
      }
      if (i % 2) {
        apolloPrivateKeys(Object(source), true).forEach(function (key) {
          _defineObjectProperty(target, key, source[key]);
        });
      } else if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
      } else {
        apolloPrivateKeys(Object(source)).forEach(function (key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
    }
    return target;
  }

  function _defineObjectProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value,
        enumerable: true,
        configurable: true,
        writable: true,
      });
    } else {
      obj[key] = value;
    }
    return obj;
  }

  var inputSelectableStatus = function inputSelectableStatusFunction(node) {
    return (
      node.tagName && node.tagName.toLowerCase() === "input" && typeof node.select === "function"
    );
  };
  var eventEscapeStatus = function eventEscapeStatusFunction(e) {
    return e.key === "Escape" || e.key === "Esc" || e.keyCode === 27;
  };
  var eventTabStatus = function eventTabStatusFunction(e) {
    return e.key === "Tab" || e.keyCode === 9;
  };
  var delay = function delayFunction(fn) {
    return setTimeout(fn, 0);
  };
  var findIndex = function findIndexFunction(arr, fn) {
    var idx = -1;
    arr.every(function (value, i) {
      if (fn(value)) {
        idx = i;
        return false;
      }
      return true;
    });
    return idx;
  };
  var checkValueOHandler = function checkValueOHandlerFunction(value) {
    for (
      var _len = arguments.length, params = new Array(_len > 1 ? _len - 1 : 0), _key = 1;
      _key < _len;
      _key++
    ) {
      params[_key - 1] = arguments[_key];
    }
    if (typeof value === "function") {
      return value.apply(void 0, params);
    } else {
      return value;
    }
  };
  var createObjectFocusTrap = function createObjectFocusTrapFunction(elements, userOptions) {
    var doc = document;
    var config = _objectAdvandFunction(
      {
        returnFocusOnDeactivate: true,
        escapeDeactivates: true,
        delayInitialFocus: true,
      },
      userOptions
    );
    var state = {
      containers: [],
      objTabbableGroups: [],
      nodeFocusedBeforeActivation: null,
      mostRecentlyFocusedNode: null,
      active: false,
      paused: false,
      delayInitialFocusTimer: void 0,
    };
    var trap;
    var getObjectOption = function getObjectOptionFunction(
      configOverrideOptions,
      optionName,
      configOptionName
    ) {
      if (configOverrideOptions && configOverrideOptions[optionName] !== void 0) {
        return configOverrideOptions[optionName];
      } else {
        return config[configOptionName || optionName];
      }
    };
    var containersObjectContain = function containersObjectContainFunction(element) {
      return state.containers.some(function (container) {
        return container.contains(element);
      });
    };
    var objectNodeForOptionContent = function objectNodeForOptionContentFunction(optionName) {
      var optionValue = config[optionName];
      if (!optionValue) {
        return null;
      }
      var node = optionValue;
      if (typeof optionValue === "string") {
        node = doc.querySelector(optionValue);
        if (!node) {
          throw new Error("`".concat(optionName, "`"));
        }
      }
      if (typeof optionValue === "function") {
        node = optionValue();
        if (!node) {
          throw new Error("`".concat(optionName, "`"));
        }
      }
      return node;
    };
    var objectInitialFocusNodeContent = function objectInitialFocusNodeContentFunction() {
      var node;
      if (getObjectOption({}, "initialFocus") === false) {
        return false;
      }
      if (objectNodeForOptionContent("initialFocus") !== null) {
        node = objectNodeForOptionContent("initialFocus");
      } else if (containersObjectContain(doc.activeElement)) {
        node = doc.activeElement;
      } else {
        var firstObjectGroupTabbable = state.objTabbableGroups[0];
        var firstTabbableNode =
          firstObjectGroupTabbable && firstObjectGroupTabbable.firstTabbableNode;
        node = firstTabbableNode || objectNodeForOptionContent("fallbackFocus");
      }
      if (!node) {
        throw new Error("Your focus-trap needs to have at least one focusable element");
      }
      return node;
    };
    var updateObjectTabbableNodes = function updateObjectTabbableNodesFunction() {
      state.objTabbableGroups = state.containers
        .map(function (container) {
          var objTabbableNodes = objTabbable(container);
          if (objTabbableNodes.length > 0) {
            return {
              container,
              firstTabbableNode: objTabbableNodes[0],
              lastTabbableNode: objTabbableNodes[objTabbableNodes.length - 1],
            };
          }
          return void 0;
        })
        .filter(function (group) {
          return !!group;
        });
      if (state.objTabbableGroups.length <= 0 && !objectNodeForOptionContent("fallbackFocus")) {
        throw new Error(
          "Your focus-trap must have at least one container with at least one objTabbable node in it at all times"
        );
      }
    };
    var elementTryFocus = function elementTryFocusFunction(node) {
      if (node === false) {
        return;
      }
      if (node === doc.activeElement) {
        return;
      }
      if (!node || !node.focus) {
        elementTryFocusFunction(objectInitialFocusNodeContent());
        return;
      }
      node.focus({
        preventScroll: !!config.preventScroll,
      });
      state.mostRecentlyFocusedNode = node;
      if (inputSelectableStatus(node)) {
        node.select();
      }
    };
    var contentReturnFocusNode = function contentReturnFocusNodeFunction(previousActiveElement) {
      var node = objectNodeForOptionContent("setReturnFocus");
      return node ? node : previousActiveElement;
    };
    var checkObjectPointerDown = function checkObjectPointerDownFunctions(e) {
      if (containersObjectContain(e.target)) {
        return;
      }
      if (checkValueOHandler(config.clickOutsideDeactivates, e)) {
        trap.deactivate({
          returnFocus: config.returnFocusOnDeactivate && !focusableStatus(e.target),
        });
        return;
      }
      if (checkValueOHandler(config.allowOutsideClick, e)) {
        return;
      }
      e.preventDefault();
    };
    var objectFocusInCheck = function objectFocusInCheckFunction(e) {
      var targetContained = containersObjectContain(e.target);
      if (targetContained || e.target instanceof Document) {
        if (targetContained) {
          state.mostRecentlyFocusedNode = e.target;
        }
      } else {
        e.stopImmediatePropagation();
        elementTryFocus(state.mostRecentlyFocusedNode || objectInitialFocusNodeContent());
      }
    };
    var objectTabStatus = function objectTabStatusFunction(e) {
      updateObjectTabbableNodes();
      var destinationNode = null;
      if (state.objTabbableGroups.length > 0) {
        var containerIndex = findIndex(state.objTabbableGroups, function (_ref) {
          var container = _ref.container;
          return container.contains(e.target);
        });
        if (containerIndex < 0) {
          if (e.shiftKey) {
            destinationNode =
              state.objTabbableGroups[state.objTabbableGroups.length - 1].lastTabbableNode;
          } else {
            destinationNode = state.objTabbableGroups[0].firstTabbableNode;
          }
        } else if (e.shiftKey) {
          var startOfGroupIndex = findIndex(state.objTabbableGroups, function (_ref2) {
            var firstTabbableNode = _ref2.firstTabbableNode;
            return e.target === firstTabbableNode;
          });
          if (
            startOfGroupIndex < 0 &&
            state.objTabbableGroups[containerIndex].container === e.target
          ) {
            startOfGroupIndex = containerIndex;
          }
          if (startOfGroupIndex >= 0) {
            if (startOfGroupIndex === 0) {
              var destinationGroupIndex = state.objTabbableGroups.length - 1;
            } else {
              var destinationGroupIndex = startOfGroupIndex - 1;
            }
            var destinationGroup = state.objTabbableGroups[destinationGroupIndex];
            destinationNode = destinationGroup.lastTabbableNode;
          }
        } else {
          var lastOfGroupIndex = findIndex(state.objTabbableGroups, function (_ref3) {
            var lastTabbableNode = _ref3.lastTabbableNode;
            return e.target === lastTabbableNode;
          });
          if (
            lastOfGroupIndex < 0 &&
            state.objTabbableGroups[containerIndex].container === e.target
          ) {
            lastOfGroupIndex = containerIndex;
          }
          if (lastOfGroupIndex >= 0) {
            if (lastOfGroupIndex === state.objTabbableGroups.length - 1) {
              var _destinationGroupIndex = 0;
            } else {
              var _destinationGroupIndex = lastOfGroupIndex + 1;
            }
            var _destinationGroup = state.objTabbableGroups[_destinationGroupIndex];
            destinationNode = _destinationGroup.firstTabbableNode;
          }
        }
      } else {
        destinationNode = objectNodeForOptionContent("fallbackFocus");
      }
      if (destinationNode) {
        e.preventDefault();
        elementTryFocus(destinationNode);
      }
    };
    var checkKey = function checkKey2(e) {
      if (eventEscapeStatus(e) && checkValueOHandler(config.escapeDeactivates) !== false) {
        e.preventDefault();
        trap.deactivate();
        return;
      }
      if (eventTabStatus(e)) {
        objectTabStatus(e);
        return;
      }
    };
    var checkClick = function checkClick2(e) {
      if (checkValueOHandler(config.clickOutsideDeactivates, e)) {
        return;
      }
      if (containersObjectContain(e.target)) {
        return;
      }
      if (checkValueOHandler(config.allowOutsideClick, e)) {
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    var addListeners = function addListeners2() {
      if (!state.active) {
        return;
      }
      apolloTrapsActiveFocus.apolloTrapOpen(trap);
      state.delayInitialFocusTimer = config.delayInitialFocus
        ? delay(function () {
            elementTryFocus(objectInitialFocusNodeContent());
          })
        : elementTryFocus(objectInitialFocusNodeContent());
      doc.addEventListener("focusin", objectFocusInCheck, true);
      doc.addEventListener("mousedown", checkObjectPointerDown, {
        capture: true,
        passive: false,
      });
      doc.addEventListener("touchstart", checkObjectPointerDown, {
        capture: true,
        passive: false,
      });
      doc.addEventListener("click", checkClick, {
        capture: true,
        passive: false,
      });
      doc.addEventListener("keydown", checkKey, {
        capture: true,
        passive: false,
      });
      return trap;
    };
    var removeListeners = function removeListeners2() {
      if (!state.active) {
        return;
      }
      doc.removeEventListener("focusin", objectFocusInCheck, true);
      doc.removeEventListener("mousedown", checkObjectPointerDown, true);
      doc.removeEventListener("touchstart", checkObjectPointerDown, true);
      doc.removeEventListener("click", checkClick, true);
      doc.removeEventListener("keydown", checkKey, true);
      return trap;
    };
    trap = {
      activate: function activate(activateOptions) {
        if (state.active) {
          return this;
        }
        var onActivate = getObjectOption(activateOptions, "onActivate");
        var onPostActivate = getObjectOption(activateOptions, "onPostActivate");
        var checkCanFocusTrap = getObjectOption(activateOptions, "checkCanFocusTrap");
        if (!checkCanFocusTrap) {
          updateObjectTabbableNodes();
        }
        state.active = true;
        state.paused = false;
        state.nodeFocusedBeforeActivation = doc.activeElement;
        if (onActivate) {
          onActivate();
        }
        var finishActivation = function finishActivation2() {
          if (checkCanFocusTrap) {
            updateObjectTabbableNodes();
          }
          addListeners();
          if (onPostActivate) {
            onPostActivate();
          }
        };
        if (checkCanFocusTrap) {
          checkCanFocusTrap(state.containers.concat()).then(finishActivation, finishActivation);
          return this;
        }
        finishActivation();
        return this;
      },
      deactivate: function deactivate(deactivateOptions) {
        if (!state.active) {
          return this;
        }
        clearTimeout(state.delayInitialFocusTimer);
        state.delayInitialFocusTimer = void 0;
        removeListeners();
        state.active = false;
        state.paused = false;
        apolloTrapsActiveFocus.apolloTrapClose(trap);
        var onDeactivate = getObjectOption(deactivateOptions, "onDeactivate");
        var onPostDeactivate = getObjectOption(deactivateOptions, "onPostDeactivate");
        var checkCanReturnFocus = getObjectOption(deactivateOptions, "checkCanReturnFocus");
        if (onDeactivate) {
          onDeactivate();
        }
        var returnFocus = getObjectOption(
          deactivateOptions,
          "returnFocus",
          "returnFocusOnDeactivate"
        );
        var finishDeactivation = function finishDeactivation2() {
          delay(function () {
            if (returnFocus) {
              elementTryFocus(contentReturnFocusNode(state.nodeFocusedBeforeActivation));
            }
            if (onPostDeactivate) {
              onPostDeactivate();
            }
          });
        };
        if (returnFocus && checkCanReturnFocus) {
          checkCanReturnFocus(contentReturnFocusNode(state.nodeFocusedBeforeActivation)).then(
            finishDeactivation,
            finishDeactivation
          );
          return this;
        }
        finishDeactivation();
        return this;
      },
      pause: function pause() {
        if (state.paused || !state.active) {
          return this;
        }
        state.paused = true;
        removeListeners();
        return this;
      },
      unpause: function unpause() {
        if (!state.paused || !state.active) {
          return this;
        }
        state.paused = false;
        updateObjectTabbableNodes();
        addListeners();
        return this;
      },
      updateContainerElements: function updateContainerElements(containerElements) {
        var elementsAsArray = [].concat(containerElements).filter(Boolean);
        state.containers = elementsAsArray.map(function (element) {
          return typeof element === "string" ? doc.querySelector(element) : element;
        });
        if (state.active) {
          updateObjectTabbableNodes();
        }
        return this;
      },
    };
    trap.updateContainerElements(elements);
    return trap;
  };

  function apolloShopifyEventFilter(event, domElement, callback) {
    let executeCallback = false;
    if (event.type.includes("shopify:section")) {
      if (
        domElement.hasAttribute("section") &&
        domElement.getAttribute("section") === event.detail.sectionId
      ) {
        executeCallback = true;
      }
    } else if (event.type.includes("shopify:block") && event.target === domElement) {
      executeCallback = true;
    }
    if (executeCallback) {
      callback(event);
    }
  }

  class LocalizationForm extends HTMLElement {
    constructor() {
      super();
      this.elements = {
        input: this.querySelector('input[name="language_code"], input[name="country_code"]'),
        button: this.querySelector("button"),
        panel: this.querySelector("ul"),
      };
      this.elements.button.addEventListener("click", this.openSelector.bind(this));
      this.elements.button.addEventListener("focusout", this.closeSelector.bind(this));
      this.addEventListener("keyup", this.onContainerKeyUp.bind(this));

      this.querySelectorAll("a").forEach((item) =>
        item.addEventListener("click", this.onItemClick.bind(this))
      );
    }

    hidePanel() {
      this.elements.button.setAttribute("aria-expanded", "false");
      this.elements.panel.setAttribute("hidden", true);
    }

    onContainerKeyUp(event) {
      if (event.code.toUpperCase() !== "ESCAPE") return;

      this.hidePanel();
      this.elements.button.focus();
    }

    onItemClick(event) {
      event.preventDefault();
      const form = this.querySelector("form");
      this.elements.input.value = event.currentTarget.dataset.value;
      if (form) form.submit();
    }

    openSelector() {
      this.elements.button.focus();
      this.elements.panel.toggleAttribute("hidden");
      this.elements.button.setAttribute(
        "aria-expanded",
        (this.elements.button.getAttribute("aria-expanded") === "false").toString()
      );
    }

    closeSelector(event) {
      const shouldClose = event.relatedTarget && event.relatedTarget.nodeName === "BUTTON";
      if (event.relatedTarget === null || shouldClose) {
        this.hidePanel();
      }
    }
  }

  customElements.define("localization-form", LocalizationForm);

  var ApolloOpenableElement = class extends CustomHTMLElement {
    static get observedAttributes() {
      return ["open"];
    }
    constructor() {
      super();
      if (Shopify.designMode) {
        this.rootApollo.on("shopify:section:select", (event) =>
          apolloShopifyEventFilter(event, this, () => (this.open = true))
        );
        this.rootApollo.on("shopify:section:deselect", (event) =>
          apolloShopifyEventFilter(event, this, () => (this.open = false))
        );
      }
      if (this.hasAttribute("ap-appendbody")) {
        const existingNode = document.getElementById(this.id);
        this.removeAttribute("ap-appendbody");
        if (existingNode && existingNode !== this) {
          existingNode.replaceWith(this.cloneNode(true));
          this.remove();
        } else {
          document.body.appendChild(this);
        }
      }
    }
    connectedCallback() {
      this.apollo.on("click", ".openable__overlay", () => (this.open = false));
      this.apollo.on("click", '[data-action="close"]', (event) => {
        event.stopPropagation();
        this.open = false;
      });
    }
    get requiresLoading() {
      return this.hasAttribute("href");
    }
    get open() {
      return this.hasAttribute("open");
    }
    set open(value) {
      if (value) {
        (async () => {
          await this._load();
          this.clientWidth;
          this.setAttribute("open", "");
        })();
      } else {
        this.removeAttribute("open");
      }
    }
    get shouldTrapFocus() {
      return true;
    }
    get returnFocusOnDeactivate() {
      return !this.hasAttribute("return-focus") || this.getAttribute("return-focus") === "true";
    }
    get focusTrap() {
      return (this._focusTrap =
        this._focusTrap ||
        createObjectFocusTrap(this, {
          fallbackFocus: this,
          initialFocus: this.getAttribute("initial-focus-selector"),
          clickOutsideDeactivates: (event) =>
            !(
              event.target.hasAttribute("ap-controlsaria") &&
              event.target.getAttribute("ap-controlsaria") === this.id
            ),
          allowOutsideClick: (event) =>
            event.target.hasAttribute("ap-controlsaria") &&
            event.target.getAttribute("ap-controlsaria") === this.id,
          returnFocusOnDeactivate: this.returnFocusOnDeactivate,
          onDeactivate: () => (this.open = false),
          preventScroll: true,
        }));
    }
    attributeChangedCallback(name, oldval, newval) {
      switch (name) {
        case "open":
          if (oldval === null && newval === "") {
            if (this.shouldTrapFocus) {
              setTimeout(() => this.focusTrap.activate(), 150);
            }
            triggerEvent(this, "ap-elementopen:open");
          } else if (newval === null) {
            if (this.shouldTrapFocus) {
              this.focusTrap.deactivate();
            }
            triggerEvent(this, "ap-elementopen:close");
          }
      }
    }
    async _load() {
      if (!this.requiresLoading) {
        return;
      }
      triggerNonBubblingEvent(this, "ap-elementopen:load:start");
      const responseContent = await fetch(this.getAttribute("href"));
      const objectElement = document.createElement("div");
      objectElement.innerHTML = await responseContent.text();
      this.innerHTML = objectElement.querySelector(this.tagName.toLowerCase()).innerHTML;
      this.removeAttribute("href");
      triggerNonBubblingEvent(this, "ap-elementopen:load:end");
    }
  };
  window.customElements.define("ap-elementopen", ApolloOpenableElement);

  var ApolloContentCollapsible = class extends ApolloOpenableElement {
    constructor() {
      super();
      this.ignoreNextTransition = this.open;
      this.addEventListener("shopify:block:select", () => (this.open = true));
      this.addEventListener("shopify:block:deselect", () => (this.open = false));
    }
    get animateItems() {
      return this.hasAttribute("animate-items");
    }
    attributeChangedCallback(name) {
      if (this.ignoreNextTransition) {
        return (this.ignoreNextTransition = false);
      }
      switch (name) {
        case "open":
          this.style.overflow = "hidden";
          const keyframes = {
            height: ["0px", `${this.scrollHeight}px`],
            visibility: ["hidden", "visible"],
          };
          if (this.animateItems) {
            keyframes["opacity"] = this.open ? [0, 0] : [0, 1];
          }
          this.animate(keyframes, {
            duration: 500,
            direction: this.open ? "normal" : "reverse",
            easing: "cubic-bezier(0.75, 0, 0.175, 1)",
          }).onfinish = () => {
            this.style.overflow = this.open ? "visible" : "hidden";
          };
          if (this.animateItems && this.open) {
            this.animate(
              {
                opacity: [0, 1],
                transform: ["translateY(10px)", "translateY(0)"],
              },
              {
                duration: 250,
                delay: 250,
                easing: "cubic-bezier(0.75, 0, 0.175, 1)",
              }
            );
          }
          let aptriger = "";
          if (this.open) {
            aptriger = "ap-elementopen:open";
          } else {
            aptriger = "ap-elementopen:close";
          }
          triggerEvent(this, aptriger);
      }
    }
  };
  window.customElements.define("ap-contentcollapsible", ApolloContentCollapsible);

  var ApolloContentCollapsible2 = class extends ApolloOpenableElement {
    constructor() {
      super();
      this.ignoreNextTransition = this.open;
      this.addEventListener("shopify:block:select", () => (this.open = true));
      this.addEventListener("shopify:block:deselect", () => (this.open = false));
    }
    get animateItems() {
      return this.hasAttribute("animate-items");
    }
    attributeChangedCallback(name) {
      if (this.ignoreNextTransition) {
        return (this.ignoreNextTransition = false);
      }
      switch (name) {
        case "open":
          this.style.overflow = "hidden";
          const keyframes = {
            height: ["0px", `${this.scrollHeight}px`],
            visibility: ["hidden", "visible"],
          };
          if (this.animateItems) {
            keyframes["opacity"] = this.open ? [0, 0] : [0, 1];
          }
          this.animate(keyframes, {
            duration: 500,
            direction: this.open ? "normal" : "reverse",
            easing: "cubic-bezier(0.75, 0, 0.175, 1)",
          }).onfinish = () => {
            this.style.overflow = this.open ? "visible" : "hidden";
          };
          if (this.animateItems && this.open) {
            this.animate(
              {
                opacity: [0, 1],
                transform: ["translateY(10px)", "translateY(0)"],
              },
              {
                duration: 250,
                delay: 250,
                easing: "cubic-bezier(0.75, 0, 0.175, 1)",
              }
            );
          }
          let aptriger = "";
          if (this.open) {
            aptriger = "ap-elementopen:open";
          } else {
            aptriger = "ap-elementopen:close";
          }
          triggerEvent(this, aptriger);
      }
    }
  };
  window.customElements.define("ap-contentcollapsible-2", ApolloContentCollapsible2);

  var apolloButtonConfirm = class extends HTMLButtonElement {
    connectedCallback() {
      this.addEventListener("click", (event) => {
        if (
          !window.confirm(this.getAttribute("data-message") || "Are you sure you wish to do this?")
        ) {
          event.preventDefault();
        }
      });
    }
  };
  window.customElements.define("confirm-button", apolloButtonConfirm, {
    extends: "button",
  });

  var apolloLoaderButtonMixin = {
    _buttonPrepare() {
      this.originalContent = this.innerHTML;
      this._transitionStartPromise = null;
      this.innerHTML = `
      <span class="ap-text-loaderbutton">${this.innerHTML}</span>
      <span class="ap-loader-loaderbutton" hidden>
        <div class="spinner">
          <svg focusable="false" width="25" height="25" class="icon icon--spinner" viewBox="25 25 50 50">
            <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" stroke-width="4"></circle>
          </svg>
        </div>
      </span>
    `;
      this.spinnerElement = this.lastElementChild;
      this.textElement = this.firstElementChild;
      window.addEventListener("pagehide", () => this.removeAttribute("ap-ariabusy"));
    },
    _transitionStart() {
      const animationtext = this.textElement.animate(
        {
          opacity: [1, 0],
          transform: ["translateY(0)", "translateY(-10px)"],
        },
        {
          duration: 75,
          easing: "ease",
          fill: "forwards",
        }
      );
      this.spinnerElement.hidden = false;
      const animationspinner = this.spinnerElement.animate(
        {
          opacity: [0, 1],
          transform: ["translate(-50%, 0%)", "translate(-50%, -50%)"],
        },
        {
          duration: 75,
          delay: 75,
          easing: "ease",
          fill: "forwards",
        }
      );
      this._transitionStartPromise = Promise.all([
        new Promise((resolve) => (animationtext.onfinish = () => resolve())),
        new Promise((resolve) => (animationspinner.onfinish = () => resolve())),
      ]);
    },
    async _transitionEnd() {
      if (!this._transitionStartPromise) {
        return;
      }
      await this._transitionStartPromise;
      this.spinnerElement.animate(
        {
          opacity: [1, 0],
          transform: ["translate(-50%, -50%)", "translate(-50%, -100%)"],
        },
        {
          duration: 75,
          delay: 100,
          easing: "ease",
          fill: "forwards",
        }
      ).onfinish = () => (this.spinnerElement.hidden = true);
      this.textElement.animate(
        {
          opacity: [0, 1],
          transform: ["translateY(10px)", "translateY(0)"],
        },
        {
          duration: 75,
          delay: 175,
          easing: "ease",
          fill: "forwards",
        }
      );
      this._transitionStartPromise = null;
    },
  };

  var apolloLoaderButton = class extends HTMLButtonElement {
    static get observedAttributes() {
      return ["ap-ariabusy"];
    }
    constructor() {
      super();
      this.addEventListener("click", (event) => {
        if (
          this.type === "submit" &&
          this.form &&
          this.form.checkValidity() &&
          !this.form.hasAttribute("is")
        ) {
          if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
            event.preventDefault();
            this.setAttribute("ap-ariabusy", "true");
            setTimeout(() => this.form.submit(), 250);
          } else {
            this.setAttribute("ap-ariabusy", "true");
          }
        }
      });
    }
    connectedCallback() {
      this._buttonPrepare();
      if (document.getElementById("agree_terms_conditions")) {
        document
          .getElementById("agree_terms_conditions")
          .addEventListener("change", function (event) {
            //document.getElementById('form_cart').submit();
            if (document.getElementById("agree_terms_conditions").checked) {
              document.getElementById("bt_checkout").removeAttribute("disabled");
            } else {
              document.getElementById("bt_checkout").setAttribute("disabled", "disabled");
            }
          });
      }
    }
    disconnectedCallback() {
      this.innerHTML = this.originalContent;
    }
    attributeChangedCallback(property, oldval, newval) {
      if (property === "ap-ariabusy") {
        if (newval === "true") {
          this._transitionStart();
        } else {
          this._transitionEnd();
        }
      }
    }
  };
  Object.assign(apolloLoaderButton.prototype, apolloLoaderButtonMixin);
  window.customElements.define("loader-button", apolloLoaderButton, {
    extends: "button",
  });

  var ApPagePagination = class extends CustomHTMLElement {
    connectedCallback() {
      if (this.hasAttribute("ajax")) {
        this.apollo.on("click", "a", this._onLinkClicked.bind(this));
      }
    }
    _onLinkClicked(event, target) {
      event.preventDefault();
      const url = new URL(window.location.href);
      url.searchParams.set("page", target.getAttribute("data-page"));
      triggerEvent(this, "pagination:page-changed", {
        url: url.toString(),
      });
    }
  };
  window.customElements.define("ap-pagepagination", ApPagePagination);

  var ApToggleButton = class extends HTMLButtonElement {
    static get observedAttributes() {
      return ["ap-expanded-aria", "ap-ariabusy"];
    }
    constructor() {
      super();
      if (this.hasAttribute("loader")) {
        this._buttonPrepare();
      }
      this.addEventListener("click", this._onButtonClick.bind(this));
      this.rootApollo = new main_default(document.documentElement);
    }
    _onButtonClick() {
      this.expandedStatus = !this.expandedStatus;
    }
    connectedCallback() {
      document.addEventListener("ap-elementopen:close", (event) => {
        if (this.objectElementControlled === event.target) {
          this.expandedStatus = false;
          event.stopPropagation();
        }
      });
      document.addEventListener("ap-elementopen:open", (event) => {
        if (this.objectElementControlled === event.target) {
          this.expandedStatus = true;
          event.stopPropagation();
        }
      });
      this.rootApollo.on(
        "ap-elementopen:load:start",
        `#${this.getAttribute("ap-controlsaria")}`,
        () => {
          if (this.classList.contains("button")) {
            this.setAttribute("ap-ariabusy", "true");
          } else if (this.offsetParent !== null) {
            triggerEvent(document.documentElement, "theme:loading:start");
          }
        },
        true
      );
      this.rootApollo.on(
        "ap-elementopen:load:end",
        `#${this.getAttribute("ap-controlsaria")}`,
        () => {
          if (this.classList.contains("button")) {
            this.removeAttribute("ap-ariabusy");
          } else if (this.offsetParent !== null) {
            triggerEvent(document.documentElement, "theme:loading:end");
          }
        },
        true
      );
    }
    disconnectedCallback() {
      this.rootApollo.destroy();
    }
    get expandedStatus() {
      return this.getAttribute("ap-expanded-aria") === "true";
    }
    set expandedStatus(value) {
      let val = "false";
      if (value) {
        val = "true";
      }
      this.setAttribute("ap-expanded-aria", val);
    }
    get objectElementControlled() {
      return document.getElementById(this.getAttribute("ap-controlsaria"));
    }
    attributeChangedCallback(name, oldval, newval) {
      switch (name) {
        case "ap-expanded-aria":
          if (oldval === "false" && newval === "true") {
            this.objectElementControlled.open = true;
          } else if (oldval === "true" && newval === "false") {
            this.objectElementControlled.open = false;
          }
          break;
        case "ap-ariabusy":
          if (this.hasAttribute("loader")) {
            if (newval === "true") {
              this._transitionStart();
            } else {
              this._transitionEnd();
            }
          }
          break;
      }
    }
  };
  Object.assign(ApToggleButton.prototype, apolloLoaderButtonMixin);
  window.customElements.define("toggle-button", ApToggleButton, {
    extends: "button",
  });

  var apToggleLink = class extends HTMLAnchorElement {
    static get observedAttributes() {
      return ["ap-expanded-aria"];
    }
    constructor() {
      super();
      this.addEventListener("click", (event) => {
        event.preventDefault();
        this.expandedStatus = !this.expandedStatus;
      });
      this.rootApollo = new main_default(document.documentElement);
    }
    connectedCallback() {
      this.rootApollo.on(
        "ap-elementopen:close",
        `#${this.getAttribute("ap-controlsaria")}`,
        (event) => {
          if (this.objectElementControlled === event.target) {
            this.expandedStatus = false;
          }
        },
        true
      );
      this.rootApollo.on(
        "ap-elementopen:open",
        `#${this.getAttribute("ap-controlsaria")}`,
        (event) => {
          if (this.objectElementControlled === event.target) {
            this.expandedStatus = true;
          }
        },
        true
      );
    }
    disconnectedCallback() {
      this.rootApollo.destroy();
    }
    get expandedStatus() {
      return this.getAttribute("ap-expanded-aria") === "true";
    }
    set expandedStatus(value) {
      this.setAttribute("ap-expanded-aria", value ? "true" : "false");
    }
    get objectElementControlled() {
      return document.querySelector(`#${this.getAttribute("ap-controlsaria")}`);
    }
    attributeChangedCallback(name, oldval, newval) {
      switch (name) {
        case "ap-expanded-aria":
          if (oldval === "false" && newval === "true") {
            this.objectElementControlled.open = true;
          } else if (oldval === "true" && newval === "false") {
            this.objectElementControlled.open = false;
          }
      }
    }
  };
  window.customElements.define("ap-togglelink", apToggleLink, {
    extends: "a",
  });

  var apPageDots = class extends CustomHTMLElement {
    connectedCallback() {
      this.buttons = Array.from(this.querySelectorAll("button"));
      this.apollo.on("click", "button", (event, target) => {
        this._apEvtDispatch(this.buttons.indexOf(target));
      });
      if (this.hasAttribute("animation-timer")) {
        this.apollo.on("animationend", (event) => {
          if (event.elapsedTime > 0) {
            this._apEvtDispatch(
              (this.selectedIndex + 1 + this.buttons.length) % this.buttons.length
            );
          }
        });
      }
    }
    get selectedIndex() {
      return this.buttons.findIndex((button) => button.getAttribute("ap-currentaria") === "true");
    }
    set selectedIndex(selectedIndex) {
      this.buttons.forEach((button, index) =>
        button.setAttribute("ap-currentaria", selectedIndex === index ? "true" : "false")
      );
      if (this.hasAttribute("ap-selectedalign")) {
        const windowHalfWidth = window.innerWidth / 2;
        const selectedItem = this.buttons[selectedIndex];
        const apBoundingRect = selectedItem.getBoundingClientRect();
        const scrollableElement = this._apFindElementFirstScrollable(this.parentElement);
        if (scrollableElement) {
          let left =
            scrollableElement.scrollLeft +
            (apBoundingRect.left - windowHalfWidth) +
            apBoundingRect.width / 2;
          let behavior = "smooth";
          scrollableElement.scrollTo({
            behavior: behavior,
            left: left,
          });
        }
      }
    }
    _apEvtDispatch(index) {
      if (index !== this.selectedIndex) {
        this.dispatchEvent(
          new CustomEvent("ap-pagedots:changed", {
            bubbles: true,
            detail: {
              index,
            },
          })
        );
      }
    }
    _apFindElementFirstScrollable(item, depth = 0) {
      if (item === null || depth > 3) {
        return null;
      }
      if (item.scrollWidth > item.clientWidth) {
        return item;
      } else {
        return this._apFindElementFirstScrollable(item.parentElement, depth + 1);
      }
    }
  };
  window.customElements.define("ap-pagedots", apPageDots);

  var apButtonsNextPrevious = class extends HTMLElement {
    connectedCallback() {
      this.prevButton = this.querySelector("button:first-of-type");
      this.nextButton = this.querySelector("button:last-of-type");
      this.prevButton.addEventListener("click", () =>
        this.prevButton.dispatchEvent(
          new CustomEvent("ap-nextprev:prev", {
            bubbles: true,
          })
        )
      );
      this.nextButton.addEventListener("click", () =>
        this.nextButton.dispatchEvent(
          new CustomEvent("ap-nextprev:next", {
            bubbles: true,
          })
        )
      );
    }
    set isPrevDisabled(value) {
      this.prevButton.disabled = value;
    }
    set isNextDisabled(value) {
      this.nextButton.disabled = value;
    }
  };
  var apPrevButton = class extends HTMLButtonElement {
    connectedCallback() {
      this.addEventListener("click", () =>
        this.dispatchEvent(
          new CustomEvent("ap-nextprev:prev", {
            bubbles: true,
          })
        )
      );
    }
  };
  var apNextButton = class extends HTMLButtonElement {
    connectedCallback() {
      this.addEventListener("click", () =>
        this.dispatchEvent(
          new CustomEvent("ap-nextprev:next", {
            bubbles: true,
          })
        )
      );
    }
  };
  window.customElements.define("ap-button-nextprev", apButtonsNextPrevious);
  window.customElements.define("ap-buttonprev", apPrevButton, {
    extends: "button",
  });
  window.customElements.define("ap-buttonnext", apNextButton, {
    extends: "button",
  });

  function apStickyHeaderOffsetContent() {
    const documentStyles = getComputedStyle(document.documentElement);
    return (
      parseInt(documentStyles.getPropertyValue("--header-height") || 0) *
        parseInt(documentStyles.getPropertyValue("--enable-sticky-header") || 0) +
      parseInt(documentStyles.getPropertyValue("--ap-announcementbar-height") || 0) *
        parseInt(documentStyles.getPropertyValue("--enable-sticky-ap-announcementbar") || 0)
    );
  }

  var apSafeSticky = class extends HTMLElement {
    connectedCallback() {
      this.lastKnownY = window.scrollY;
      this.currentTop = 0;
      this.hasPendingRaf = false;
      window.addEventListener("scroll", this._apGetPosition.bind(this));
    }
    get initialTopOffset() {
      return apStickyHeaderOffsetContent() + (parseInt(this.getAttribute("offset")) || 0);
    }
    _apGetPosition() {
      if (this.hasPendingRaf) {
        return;
      }
      this.hasPendingRaf = true;
      requestAnimationFrame(() => {
        let bounds = this.getBoundingClientRect();
        let maxTop = bounds.top + window.scrollY - this.offsetTop + this.initialTopOffset;
        let minTop = this.clientHeight - window.innerHeight;
        if (window.scrollY < this.lastKnownY) {
          this.currentTop -= window.scrollY - this.lastKnownY;
        } else {
          this.currentTop += this.lastKnownY - window.scrollY;
        }
        this.currentTop = Math.min(
          Math.max(this.currentTop, -minTop),
          maxTop,
          this.initialTopOffset
        );
        this.lastKnownY = window.scrollY;
        this.style.top = `${this.currentTop}px`;
        this.hasPendingRaf = false;
      });
    }
  };
  window.customElements.define("ap-safesticky", apSafeSticky);

  function apStream(callback, delay3 = 15) {
    let apStreamTimeout = null,
      storedEvent = null;
    const apStreamdEventHandler = (event) => {
      storedEvent = event;
      const shouldHandleEvent = !apStreamTimeout;
      if (shouldHandleEvent) {
        callback(storedEvent);
        storedEvent = null;
        apStreamTimeout = setTimeout(() => {
          apStreamTimeout = null;
          if (storedEvent) {
            apStreamdEventHandler(storedEvent);
          }
        }, delay3);
      }
    };
    return apStreamdEventHandler;
  }

  // js/custom-element/behavior/ap-spyscroll.js
  // var apSpyScroll = class extends HTMLElement {
  //   connectedCallback() {
  //     this._createSvg();
  //     this.elementsToObserve = Array.from(this.querySelectorAll("a")).map((linkElement) => document.querySelector(linkElement.getAttribute("href")));
  //     this.navListItems = Array.from(this.querySelectorAll("li"));
  //     this.navItems = this.navListItems.map((listItem) => {
  //       const anchor = listItem.firstElementChild, targetID = anchor && anchor.getAttribute("href").slice(1), target = document.getElementById(targetID);
  //       return { listItem, anchor, target };
  //     }).filter((item) => item.target);
  //     this.drawPath();
  //     window.addEventListener("scroll", apStream(this.markVisibleSection.bind(this), 25));
  //     window.addEventListener("orientationchange", () => {
  //       window.addEventListener("resize", () => {
  //         this.drawPath();
  //         this.markVisibleSection();
  //       }, { once: true });
  //     });
  //     this.markVisibleSection();
  //   }
  //   _createSvg() {
  //     this.navPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  //     const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  //     svgElement.insertAdjacentElement("beforeend", this.navPath);
  //     this.insertAdjacentElement("beforeend", svgElement);
  //     this.lastPathStart = this.lastPathEnd = null;
  //   }
  //   drawPath() {
  //     let path = [], pathIndent;
  //     this.navItems.forEach((item, i) => {
  //       const x = item.anchor.offsetLeft - 5, y = item.anchor.offsetTop, height = item.anchor.offsetHeight;
  //       if (i === 0) {
  //         path.push("M", x, y, "L", x, y + height);
  //         item.pathStart = 0;
  //       } else {
  //         if (pathIndent !== x) {
  //           path.push("L", pathIndent, y);
  //         }
  //         path.push("L", x, y);
  //         this.navPath.setAttribute("d", path.join(" "));
  //         item.pathStart = this.navPath.getTotalLength() || 0;
  //         path.push("L", x, y + height);
  //       }
  //       pathIndent = x;
  //       this.navPath.setAttribute("d", path.join(" "));
  //       item.pathEnd = this.navPath.getTotalLength();
  //     });
  //   }
  //   syncPath() {
  //     const someElsAreVisible = () => this.querySelectorAll(".is-visible").length > 0, thisElIsVisible = (el) => el.classList.contains("is-visible"), pathLength = this.navPath.getTotalLength();
  //     let pathStart = pathLength, pathEnd = 0;
  //     this.navItems.forEach((item) => {
  //       if (thisElIsVisible(item.listItem)) {
  //         pathStart = Math.min(item.pathStart, pathStart);
  //         pathEnd = Math.max(item.pathEnd, pathEnd);
  //       }
  //     });
  //     if (someElsAreVisible() && pathStart < pathEnd) {
  //       if (pathStart !== this.lastPathStart || pathEnd !== this.lastPathEnd) {
  //         const dashArray = `1 ${pathStart} ${pathEnd - pathStart} ${pathLength}`;
  //         this.navPath.style.setProperty("stroke-dashoffset", "1");
  //         this.navPath.style.setProperty("stroke-dasharray", dashArray);
  //         this.navPath.style.setProperty("opacity", "1");
  //       }
  //     } else {
  //       this.navPath.style.setProperty("opacity", "0");
  //     }
  //     this.lastPathStart = pathStart;
  //     this.lastPathEnd = pathEnd;
  //   }
  //   markVisibleSection() {
  //     this.navListItems.forEach((item) => item.classList.remove("is-visible"));
  //     for (const [index, elementToObserve] of this.elementsToObserve.entries()) {
  //       const boundingClientRect = elementToObserve.getBoundingClientRect();
  //       if (boundingClientRect.top > apStickyHeaderOffsetContent() || index === this.elementsToObserve.length - 1) {
  //         this.querySelector(`a[href="#${elementToObserve.id}"]`).parentElement.classList.add("is-visible");
  //         break;
  //       }
  //     }
  //     this.syncPath();
  //   }
  // };
  // window.customElements.define("ap-spyscroll", apSpyScroll);

  // js/custom-element/behavior/ap-shadowscroll.js

  var ApUpdateProcess = class {
    constructor(targetElement) {
      this.scheduleUpdate = apStream(() =>
        this.updateProcess(targetElement, getComputedStyle(targetElement))
      );
      this.resizeObserver = new ResizeObserver(this.scheduleUpdate.bind(this));
    }
    startProcess(element) {
      if (this.element) {
        this.stopProcess();
      }
      if (element) {
        element.addEventListener("scroll", this.scheduleUpdate);
        this.resizeObserver.observe(element);
        this.element = element;
      }
    }
    stopProcess() {
      if (this.element) {
        this.element.removeEventListener("scroll", this.scheduleUpdate);
        this.resizeObserver.unobserve(this.element);
        this.element = null;
      } else {
        return;
      }
    }
    updateProcess(targetElement, style) {
      if (this.element) {
        const maxSize = style.getPropertyValue("--ap-shadowscroll-size")
          ? parseInt(style.getPropertyValue("--ap-shadowscroll-size"))
          : 0;
        const scroll = {
          top: Math.max(this.element.scrollTop, 0),
          bottom: Math.max(
            this.element.scrollHeight - this.element.offsetHeight - this.element.scrollTop,
            0
          ),
          left: Math.max(this.element.scrollLeft, 0),
          right: Math.max(
            this.element.scrollWidth - this.element.offsetWidth - this.element.scrollLeft,
            0
          ),
        };
        requestAnimationFrame(() => {
          for (const position of ["top", "bottom", "left", "right"]) {
            targetElement.style.setProperty(
              `--${position}`,
              `${scroll[position] > maxSize ? maxSize : scroll[position]}px`
            );
          }
        });
      } else {
        return;
      }
    }
  };
  var ApShadowScroll = class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({
        mode: "open",
      }).innerHTML = `
      <style>
        :host {
          display: inline-block;
          contain: layout;
          position: relative;
        }
        
        :host([hidden]) {
          display: none;
        }
        
        s {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          right: 0;
          pointer-events: none;
          background-image:
            var(--ap-shadowscroll-top, radial-gradient(farthest-side at 50% 0%, rgba(0,0,0,.2), rgba(0,0,0,0))),
            var(--ap-shadowscroll-bottom, radial-gradient(farthest-side at 50% 100%, rgba(0,0,0,.2), rgba(0,0,0,0))),
            var(--ap-shadowscroll-left, radial-gradient(farthest-side at 0%, rgba(0,0,0,.2), rgba(0,0,0,0))),
            var(--ap-shadowscroll-right, radial-gradient(farthest-side at 100%, rgba(0,0,0,.2), rgba(0,0,0,0)));
          background-position: top, bottom, left, right;
          background-repeat: no-repeat;
          background-size: 100% var(--top, 0), 100% var(--bottom, 0), var(--left, 0) 100%, var(--right, 0) 100%;
        }
      </style>
      <slot></slot>
      <s></s>
    `;
      this.updater = new ApUpdateProcess(this.shadowRoot.lastElementChild);
    }
    connectedCallback() {
      this.shadowRoot.querySelector("slot").addEventListener("slotchange", () => this.start());
      this.start();
    }
    disconnectedCallback() {
      this.updater.stopProcess();
    }
    start() {
      this.updater.startProcess(this.firstElementChild);
    }
  };
  if ("ResizeObserver" in window) {
    window.customElements.define("ap-shadowscroll", ApShadowScroll);
  }

  var ApShareApToggleButton = class extends ApToggleButton {
    _onButtonClick() {
      if (window.matchMedia(window.themeVariables.breakpoints.phone).matches && navigator.share) {
        if (this.hasAttribute("share-title")) {
          let title = this.getAttribute("share-title");
        } else {
          let title = document.title;
        }
        if (this.hasAttribute("share-url")) {
          let url = this.getAttribute("share-url");
        } else {
          let url = window.location.href;
        }
        navigator.share({
          title: title,
          url: url,
        });
      } else {
        super._onButtonClick();
      }
    }
  };
  window.customElements.define("ap-sharetogglebutton", ApShareApToggleButton, {
    extends: "button",
  });

  var APCarousel = class extends CustomHTMLElement {
    connectedCallback() {
      this.items = Array.from(this.querySelectorAll("ap-carousel-item"));
      this.pageDotsElements = Array.from(this.querySelectorAll("ap-pagedots"));
      this.prevNextButtonsElements = Array.from(this.querySelectorAll("ap-button-nextprev"));
      if (this.items.length > 1) {
        this.addEventListener("ap-nextprev:prev", this.prevCarouselItem.bind(this));
        this.addEventListener("ap-nextprev:next", this.nextCarouselItem.bind(this));
        this.addEventListener("ap-pagedots:changed", (event) =>
          this.select(event.detail.index, true)
        );
        if (Shopify.designMode) {
          this.addEventListener("shopify:block:select", (event) =>
            this.select(event.target.index, !event.detail.load)
          );
        }
      }
      const scrollerElement = this.items[0].parentElement;
      let rootMargin = `${scrollerElement.clientHeight}px 0px`;
      this.intersectionObserver = new IntersectionObserver(this._onVisibilityChanged.bind(this), {
        root: scrollerElement,
        rootMargin: rootMargin,
        threshold: 0.8,
      });
      this.items.forEach((item) => this.intersectionObserver.observe(item));
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      this.intersectionObserver.disconnect();
    }
    get selectedIndex() {
      return this.items.findIndex((item) => item.selected);
    }
    prevCarouselItem(useEffect = true) {
      this.select(Math.max(this.selectedIndex - 1, 0), useEffect);
    }
    nextCarouselItem(useEffect = true) {
      this.select(Math.min(this.selectedIndex + 1, this.items.length - 1), useEffect);
    }
    select(index, useEffect = true) {
      const clampIndex = Math.max(0, Math.min(index, this.items.length));
      const selectedElement = this.items[clampIndex];
      this._apElementAdjustNavigation(selectedElement);
      if (useEffect) {
        this.items.forEach((item) => this.intersectionObserver.unobserve(item));
        setInterval(() => {
          this.items.forEach((item) => this.intersectionObserver.observe(item));
        }, 800);
      }
      this.items.forEach((item, loopIndex) => (item.selected = loopIndex === clampIndex));
      const direction = window.themeVariables.settings.direction === "ltr" ? 1 : -1;
      selectedElement.parentElement.scrollTo({
        left: direction * (selectedElement.clientWidth * clampIndex),
        behavior: useEffect ? "smooth" : "auto",
      });
    }
    _apElementAdjustNavigation(selectedElement) {
      this.items.forEach((item) => (item.selected = selectedElement === item));
      this.pageDotsElements.forEach((pageDot) => (pageDot.selectedIndex = selectedElement.index));
      this.prevNextButtonsElements.forEach((prevNextButton) => {
        prevNextButton.isPrevDisabled = selectedElement.index === 0;
        prevNextButton.isNextDisabled = selectedElement.index === this.items.length - 1;
      });
    }
    _onVisibilityChanged(entries) {
      for (let entry of entries) {
        if (entry.isIntersecting) {
          this._apElementAdjustNavigation(entry.target);
          break;
        }
      }
    }
  };
  var APCarouselItem = class extends CustomHTMLElement {
    static get observedAttributes() {
      return ["hidden"];
    }
    get index() {
      return [...this.parentNode.children].indexOf(this);
    }
    get selected() {
      return !this.hasAttribute("hidden");
    }
    set selected(value) {
      this.hidden = !value;
    }
  };
  window.customElements.define("ap-carousel-item", APCarouselItem);
  window.customElements.define("ap-carousel", APCarousel);

  var ApCursorOfDrag = class extends HTMLElement {
    connectedCallback() {
      this.scrollableElement = this.parentElement;
      this.scrollableElement.addEventListener("mouseenter", this._onMouseEnter.bind(this));
      this.scrollableElement.addEventListener("mousemove", this._apEvtOnMouseMove.bind(this));
      this.scrollableElement.addEventListener("mouseleave", this._onMouseLeave.bind(this));
      this.innerHTML = `
      <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <path d="M0 60C0 26.863 26.863 0 60 0s60 26.863 60 60-26.863 60-60 60S0 93.137 0 60z" fill="rgb(var(--color-body))"/>
        <path d="M46 50L36 60l10 10M74 50l10 10-10 10" stroke="rgb(var(--section-background))" stroke-width="4"/>
      </svg>
    `;
    }
    _onMouseEnter(event) {
      this.removeAttribute("hidden");
      this._positionCursor(event);
    }
    _onMouseLeave() {
      this.setAttribute("hidden", "");
    }
    _apEvtOnMouseMove(event) {
      this.toggleAttribute(
        "hidden",
        event.target.tagName === "BUTTON" || event.target.tagName === "A"
      );
      this._positionCursor(event);
    }
    _positionCursor(event) {
      const elementBoundingRect = this.scrollableElement.getBoundingClientRect();
      const x = event.clientX - elementBoundingRect.x;
      const y = event.clientY - elementBoundingRect.y;
      this.style.transform = `translate(${x - this.clientWidth / 2}px, ${
        y - this.clientHeight / 2
      }px)`;
    }
  };
  window.customElements.define("ap-cursorofdrag", ApCursorOfDrag);

  var ApScrollableContent = class extends CustomHTMLElement {
    connectedCallback() {
      if (this.draggable) {
        this._apDraggSetup();
      }
      this._apScrollCheck();
      window.addEventListener("resize", this._apScrollCheck.bind(this));
      this.addEventListener("scroll", apStream(this._apProgressCalculator.bind(this), 15));
    }
    get draggable() {
      return this.hasAttribute("draggable");
    }
    _apDraggSetup() {
      this.insertAdjacentHTML(
        "afterend",
        '<ap-cursorofdrag hidden class="custom-ap-cursorofdrag"></ap-cursorofdrag>'
      );
      const mediaQuery = matchMedia("(hover: none)");
      mediaQuery.addListener(this._apMediaChanges.bind(this));
      if (!mediaQuery.matches) {
        this._apListenersAttachDraggable();
      }
    }
    _apListenersAttachDraggable() {
      this.apollo.on("mousedown", this._apEvtOnMouseDown.bind(this));
      this.apollo.on("mousemove", this._apEvtOnMouseMove.bind(this));
      this.apollo.on("mouseup", this._apEvtOnMouseUp.bind(this));
    }
    _apListenersRemoveDraggable() {
      this.apollo.off("mousedown");
      this.apollo.off("mousemove");
      this.apollo.off("mouseup");
    }
    _apScrollCheck() {
      this.classList.toggle("is-scrollable", this.scrollWidth > this.offsetWidth);
    }
    _apProgressCalculator() {
      const scrollLeft =
        this.scrollLeft * (window.themeVariables.settings.direction === "ltr" ? 1 : -1);
      const progress =
        Math.max(0, Math.min(1, scrollLeft / (this.scrollWidth - this.clientWidth))) * 100;
      triggerEvent(this, "ap-scrollablecontent:progress", {
        progress,
      });
    }
    _apMediaChanges(event) {
      if (!event.matches) {
        this._apListenersAttachDraggable();
      } else {
        this._apListenersRemoveDraggable();
      }
    }
    _apEvtOnMouseDown(event) {
      if (event.target && event.target.nodeName === "IMG") {
        event.preventDefault();
      }
      this.startX = event.clientX + this.scrollLeft;
      this.diffX = 0;
      this.drag = true;
    }
    _apEvtOnMouseMove(event) {
      if (this.drag) {
        this.diffX = this.startX - (event.clientX + this.scrollLeft);
        this.scrollLeft += this.diffX;
      }
    }
    _apEvtOnMouseUp() {
      this.drag = false;
      let st = 1;
      let animate = () => {
        let step = Math.sinh(st);
        if (step <= 0) {
          window.cancelAnimationFrame(animate);
        } else {
          this.scrollLeft += this.diffX * step;
          st -= 0.03;
          window.requestAnimationFrame(animate);
        }
      };
      animate();
    }
  };
  window.customElements.define("ap-scrollablecontent", ApScrollableContent);

  var APLoadingBar = class extends CustomHTMLElement {
    constructor() {
      super();
      this.rootApollo.on("theme:loading:start", this.show.bind(this));
      this.rootApollo.on("theme:loading:end", this.hide.bind(this));
      this.apollo.on("transitionend", this._onTransitionEnd.bind(this));
    }
    show() {
      this.classList.add("is-visible");
      this.style.transform = "scaleX(0.4)";
    }
    hide() {
      this.style.transform = "scaleX(1)";
      this.classList.add("isfinished");
    }
    _onTransitionEnd(event) {
      if (event.propertyName === "transform" && this.classList.contains("isfinished")) {
        this.classList.remove("is-visible");
        this.classList.remove("isfinished");
        this.style.transform = "scaleX(0)";
      }
    }
  };
  window.customElements.define("ap-loadingbar", APLoadingBar);

  var APSplitLines = class extends HTMLElement {
    connectedCallback() {
      this.originalContent = this.textContent;
      this.lastWidth = window.innerWidth;
      this.hasBeenSplitted = false;
      window.addEventListener("resize", this._apEvtOnResize.bind(this));
    }
    [Symbol.asyncIterator]() {
      return {
        splitPromise: this.split.bind(this),
        index: 0,
        async next() {
          const lines = await this.splitPromise();
          if (this.index !== lines.length) {
            return {
              done: false,
              value: lines[this.index++],
            };
          } else {
            return {
              done: true,
            };
          }
        },
      };
    }
    split(force = false) {
      if (this.childElementCount > 0 && !force) {
        return Promise.resolve(Array.from(this.children));
      }
      this.hasBeenSplitted = true;
      return new Promise((resolve) => {
        requestAnimationFrame(() => {
          this.innerHTML = this.originalContent
            .replace(/./g, "<span>$&</span>")
            .replace(/\s/g, " ");
          const bounds = {};
          Array.from(this.children).forEach((child) => {
            const rect = child.getBoundingClientRect().top;
            bounds[rect] = (bounds[rect] || "") + child.textContent;
          });
          this.innerHTML = Object.values(bounds)
            .map(
              (item) =>
                `<span ${this.hasAttribute("reveal") && !force ? "reveal" : ""} ${
                  this.hasAttribute("ap-revealvisibility") && !force ? "ap-revealvisibility" : ""
                } style="display: block">${item.trim()}</span>`
            )
            .join("");
          this.style.opacity = this.hasAttribute("reveal") ? 1 : null;
          if (this.hasAttribute("ap-revealvisibility")) {
            this.style.visibility = "visible";
          } else {
            this.style.visibility = null;
          }
          resolve(Array.from(this.children));
        });
      });
    }
    async _apEvtOnResize() {
      if (this.lastWidth === window.innerWidth || !this.hasBeenSplitted) {
        return;
      }
      await this.split(true);
      this.dispatchEvent(   
        new CustomEvent("ap-splitlines:re-split", {
          bubbles: true,
        })
      );
      this.lastWidth = window.innerWidth;
    }
  };
  window.customElements.define("ap-splitlines", APSplitLines);

  var ApolloPopContent = class extends ApolloOpenableElement {
    connectedCallback() {
      super.connectedCallback();
      this.apollo.on("click", ".popover__overlay", () => (this.open = false));
    }
    attributeChangedCallback(name, oldval, newval) {
      super.attributeChangedCallback(name, oldval, newval);
      switch (name) {
        case "open":
          document.documentElement.classList.toggle("ap-lockmobile", this.open);
      }
    }
  };
  window.customElements.define("apollopop-content", ApolloPopContent);

  var ApNavTabs = class extends HTMLElement {
    connectedCallback() {
      this.buttons = Array.from(this.querySelectorAll("button[ap-controlsaria]"));
      this.scrollerElement = this.querySelector(".ap-navtabs__scroller");
      this.buttons.forEach((button) =>
        button.addEventListener("click", () => this.selectButton(button))
      );
      this.addEventListener("shopify:block:select", (event) =>
        this.selectButton(event.target, !event.detail.load)
      );
      this.positionElement = document.createElement("span");
      this.positionElement.classList.add("ap-navtabs__position");
      this.buttons[0].parentElement.insertAdjacentElement("afterend", this.positionElement);
      window.addEventListener("resize", this._apEvtOnResizedWindow.bind(this));
      this._apEvtNavigationPositionChange();
      if (this.hasArrows) {
        this._apEvtArrowsHandle();
      }
    }
    get hasArrows() {
      return this.hasAttribute("arrows");
    }
    get selectedTabIndex() {
      return this.buttons.findIndex((button) => button.getAttribute("ap-expanded-aria") === "true");
    }
    get selectedButton() {
      return this.buttons.find((button) => button.getAttribute("ap-expanded-aria") === "true");
    }
    selectButton(button, animate = true) {
      if (!this.buttons.includes(button) || this.selectedButton === button) {
        return;
      }
      const from = document.getElementById(this.selectedButton.getAttribute("ap-controlsaria")),
        to = document.getElementById(button.getAttribute("ap-controlsaria"));
      if (animate) {
        this._apEvtContentTransition(from, to);
      } else {
        from.hidden = true;
        to.hidden = false;
      }
      this.selectedButton.setAttribute("ap-expanded-aria", "false");
      button.setAttribute("ap-expanded-aria", "true");
      triggerEvent(this, "ap-navtabs:changed", {
        button,
      });
      this._apEvtNavigationPositionChange();
    }
    addButton(button) {
      button.addEventListener("click", () => this.selectButton(button));
      button.setAttribute("ap-expanded-aria", "false");
      this.buttons[this.buttons.length - 1].insertAdjacentElement("afterend", button);
      this.buttons.push(button);
      this._apEvtNavigationPositionChange(false);
    }
    _apEvtContentTransition(from, to) {
      from.animate(
        {
          opacity: [1, 0],
        },
        {
          duration: 250,
          easing: "ease",
        }
      ).onfinish = () => {
        from.hidden = true;
        to.hidden = false;
        to.animate(
          {
            opacity: [0, 1],
          },
          {
            duration: 250,
            easing: "ease",
          }
        );
      };
    }
    _apEvtOnResizedWindow() {
      this._apEvtNavigationPositionChange();
    }
    _apEvtNavigationPositionChange(useEffect = true) {
      const scale =
          this.selectedButton.clientWidth / this.positionElement.parentElement.clientWidth,
        translate =
          this.selectedButton.offsetLeft / this.positionElement.parentElement.clientWidth / scale,
        windowHalfWidth = this.scrollerElement.clientWidth / 2;
      let behavior = "auto";
      if (useEffect) {
        behavior = "smooth";
      }
      let left =
        this.selectedButton.offsetLeft - windowHalfWidth + this.selectedButton.clientWidth / 2;
      this.scrollerElement.scrollTo({
        behavior: behavior,
        left: left,
      });
      if (!useEffect) {
        this.positionElement.style.transition = "none";
      }
      this.positionElement.style.setProperty("--scale", scale);
      this.positionElement.style.setProperty("--translate", `${translate * 100}%`);
      this.positionElement.clientWidth;
      requestAnimationFrame(() => {
        this.positionElement.classList.add("is-initialized");
        this.positionElement.style.transition = null;
      });
    }
    _apEvtArrowsHandle() {
      if (this.querySelector(".ap-navtabs__arrows")) {
        const arrowsContainer = this.querySelector(".ap-navtabs__arrows");
        arrowsContainer.firstElementChild.addEventListener("click", () => {
          this.selectButton(this.buttons[Math.max(this.selectedTabIndex - 1, 0)]);
        });
        arrowsContainer.lastElementChild.addEventListener("click", () => {
          this.selectButton(
            this.buttons[Math.min(this.selectedTabIndex + 1, this.buttons.length - 1)]
          );
        });
      }
    }
  };
  window.customElements.define("ap-navtabs", ApNavTabs);

  var ApLoaderLibrary = class {
    static load(libraryName) {
      const STATUS_REQUESTED = "requested";
      const STATUS_LOADED = "loaded";
      const aplib = this.libraries[libraryName];
      if (!aplib) {
        return;
      }
      if (aplib.status === STATUS_REQUESTED) {
        return aplib.promise;
      }
      if (aplib.status === STATUS_LOADED) {
        return Promise.resolve();
      }
      let promise;
      if (aplib.type === "script") {
        promise = new Promise((resolve, reject) => {
          let tag = document.createElement("script");
          tag.id = aplib.tagId;
          tag.src = aplib.src;
          tag.onerror = reject;
          tag.onload = () => {
            aplib.status = STATUS_LOADED;
            resolve();
          };
          document.body.appendChild(tag);
        });
      } else {
        promise = new Promise((resolve, reject) => {
          let tag = document.createElement("link");
          tag.id = aplib.tagId;
          tag.href = aplib.src;
          tag.rel = "stylesheet";
          tag.type = "text/css";
          tag.onerror = reject;
          tag.onload = () => {
            aplib.status = STATUS_LOADED;
            resolve();
          };
          document.body.appendChild(tag);
        });
      }
      aplib.promise = promise;
      aplib.status = STATUS_REQUESTED;
      return promise;
    }
  };
  __publicField(ApLoaderLibrary, "libraries", {
    modelViewerUiStyles: {
      tagId: "shopify-model-viewer-ui-styles",
      src: window.themeVariables.libs.modelViewerUiStyles,
      type: "link",
    },
    flickity: {
      tagId: "flickity",
      src: window.themeVariables.libs.flickity,
      type: "script",
    },
    photoswipe: {
      tagId: "photoswipe",
      src: window.themeVariables.libs.photoswipe,
      type: "script",
    },
  });

  var MediaFeatures = class {
    static prefersReducedMotion() {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    static supportsHover() {
      return window.matchMedia("(any-hover: hover)").matches;
    }
  };

  var ApLocalizationSelector = class extends HTMLSelectElement {
    connectedCallback() {
      this.localizationProvinceElement = document.getElementById(this.getAttribute("ap-ariaowns"));
      this.addEventListener("change", this._updateLocalizationProvinceVisibility.bind(this));
      if (this.hasAttribute("data-default")) {
        for (let i = 0; i !== this.options.length; ++i) {
          if (this.options[i].text === this.getAttribute("data-default")) {
            this.selectedIndex = i;
            break;
          }
        }
      }
      if (this.localizationProvinceElement.hasAttribute("data-default")) {
        for (let i = 0; i !== this.localizationProvinceElement.options.length; ++i) {
          if (
            this.localizationProvinceElement.options[i].text ===
            this.localizationProvinceElement.getAttribute("data-default")
          ) {
            this.localizationProvinceElement.selectedIndex = i;
            break;
          }
        }
      }
      this._updateLocalizationProvinceVisibility();
    }
    _updateLocalizationProvinceVisibility() {
      const selectedOption = this.options[this.selectedIndex];
      if (!selectedOption) {
        return;
      }
      let provinces = JSON.parse(selectedOption.getAttribute("data-provinces") || "[]"), provinceSelectElement = this.localizationProvinceElement.tagName === "SELECT" ? this.localizationProvinceElement : this.localizationProvinceElement.querySelector("select");
      provinceSelectElement.innerHTML = "";
      if (provinces.length === 0) {
        this.localizationProvinceElement.hidden = true;
        return;
      }
      provinces.forEach((data) => {
        provinceSelectElement.options.add(new Option(data[1], data[0]));
      });
      this.localizationProvinceElement.hidden = false;
    }
  };
  window.customElements.define("ap-localizationselector", ApLocalizationSelector, {
    extends: "select",
  });

  var ApLinkBar = class extends HTMLElement {
    connectedCallback() {
      const linkBarSelectedItem = this.querySelector(".ap-linkbar__link-item--selected");
      if (linkBarSelectedItem) {
        requestAnimationFrame(() => {
          linkBarSelectedItem.style.scrollSnapAlign = "none";
        });
      }
    }
  };
  window.customElements.define("ap-linkbar", ApLinkBar);

  var ApContentModal = class extends ApolloOpenableElement {
    connectedCallback() {
      super.connectedCallback();
      if (this.apAppearAfterDelay && !(this.apOnlyOnce && this.apHasAppearedOnce)) {
        setTimeout(() => (this.open = true), this.apApparitionDelay);
      }
      this.apollo.on("click", ".modal__overlay", () => (this.open = false));
    }
    get apAppearAfterDelay() {
      return this.hasAttribute("ap-delayapparition");
    }
    get apApparitionDelay() {
      return parseInt(this.getAttribute("ap-delayapparition") || 0) * 1e3;
    }
    get apOnlyOnce() {
      return this.hasAttribute("only-once");
    }
    get apHasAppearedOnce() {
      return localStorage.getItem("theme:popup-appeared") !== null;
    }
    attributeChangedCallback(name, oldval, newval) {
      super.attributeChangedCallback(name, oldval, newval);
      switch (name) {
        case "open":
          document.documentElement.classList.toggle("ap-lockall", this.open);
          if (this.open) {
            localStorage.setItem("theme:popup-appeared", true);
          }
      }
    }
  };
  window.customElements.define("ap-contentmodal", ApContentModal);

  var ApPriceRange = class extends HTMLElement {
    connectedCallback() {
      this.rangeMinBound = this.querySelector(".ap-pricerange__range-group input:first-child");
      this.rangeMaxBound = this.querySelector(".ap-pricerange__range-group input:last-child");
      this.textInputMinBound = this.querySelector(".ap-pricerange__input:first-child input");
      this.textInputMaxBound = this.querySelector(".ap-pricerange__input:last-child input");
      this.textInputMinBound.addEventListener("focus", () => this.textInputMinBound.select());
      this.textInputMaxBound.addEventListener("focus", () => this.textInputMaxBound.select());
      this.textInputMaxBound.addEventListener("change", (event) => {
        event.target.value = Math.min(
          Math.max(
            parseInt(event.target.value),
            parseInt(this.textInputMinBound.value || event.target.min) + 1
          ),
          event.target.max
        );
        this.rangeMaxBound.value = event.target.value;
        let val = (parseInt(this.rangeMaxBound.value) / parseInt(this.rangeMaxBound.max)) * 100;
        this.rangeMaxBound.parentElement.style.setProperty("--range-max", `${val}%`);
      });
      this.textInputMinBound.addEventListener("change", (event) => {
        event.target.value = Math.max(
          Math.min(
            parseInt(event.target.value),
            parseInt(this.textInputMaxBound.value || event.target.max) - 1
          ),
          event.target.min
        );
        this.rangeMinBound.value = event.target.value;
        let val = (parseInt(this.rangeMinBound.value) / parseInt(this.rangeMinBound.max)) * 100;
        this.rangeMinBound.parentElement.style.setProperty("--range-min", `${val}%`);
      });
      this.rangeMaxBound.addEventListener("change", (event) => {
        this.textInputMaxBound.value = event.target.value;
        this.textInputMaxBound.dispatchEvent(
          new Event("change", {
            bubbles: true,
          })
        );
      });
      this.rangeMinBound.addEventListener("change", (event) => {
        this.textInputMinBound.value = event.target.value;
        this.textInputMinBound.dispatchEvent(
          new Event("change", {
            bubbles: true,
          })
        );
      });
      this.rangeMaxBound.addEventListener("input", (event) => {
        triggerEvent(this, "facet:abort-loading");
        event.target.value = Math.max(
          parseInt(event.target.value),
          parseInt(this.textInputMinBound.value || event.target.min) + 1
        );
        let val = (parseInt(event.target.value) / parseInt(event.target.max)) * 100;
        event.target.parentElement.style.setProperty("--range-max", `${val}%`);
        this.textInputMaxBound.value = event.target.value;
      });
      this.rangeMinBound.addEventListener("input", (event) => {
        triggerEvent(this, "facet:abort-loading");
        event.target.value = Math.min(
          parseInt(event.target.value),
          parseInt(this.textInputMaxBound.value || event.target.max) - 1
        );
        let val = (parseInt(event.target.value) / parseInt(event.target.max)) * 100;
        event.target.parentElement.style.setProperty("--range-min", `${val}%`);
        this.textInputMinBound.value = event.target.value;
      });
    }
  };
  window.customElements.define("ap-pricerange", ApPriceRange);

  window.addEventListener("load", function () {
    var APFlickityCarousel = class extends CustomHTMLElement {
      constructor() {
        super();
        if (this.getAttribute("list-type")) {
          var list = document.getElementsByClassName("product__media-item");
          for (var i = 0; i < list.length; i++) {
            let id = list[i].id;
            if (list[i].getAttribute("data-media-type") == "image") {
              list[i].onclick = function () {
                for (var j = 0; j < list.length; j++) {
                  list[j].classList.remove("is-selected");
                }
                if (id == this.id) {
                  this.classList.add("is-selected");
                  let buttonZoom = document.getElementsByClassName("product__zoom-button");
                  buttonZoom[0].click();
                }
              };
            }
          }
          return;
        } else {
          if (this.childElementCount === 1) {
            document.querySelector('.product__media-item').classList.add('d-show');
            return;
          }
          this.addEventListener("flickity:ready", this._ApEvtPreloadNextImage.bind(this));
          this.addEventListener("flickity:slide-changed", this._ApEvtPreloadNextImage.bind(this));
          this._apFlickityCreate();
        }
      }
      async disconnectedCallback() {
        if (this.flickity) {
          const flickityInstance = await this.flickity;
          flickityInstance.destroy();
        }
      }
      get flickityConfig() {
        return JSON.parse(this.getAttribute("flickity-config"));
      }
      get flickityInstance() {
        return this.flickity;
      }
      async next() {
        (await this.flickityInstance).next();
      }
      async previous() {
        (await this.flickityInstance).previous();
      }
      async select(indexOrSelector) {
        (await this.flickityInstance).selectCell(indexOrSelector);
      }
      async setDraggable(draggable) {
        const flickityInstance = await this.flickity;
        flickityInstance.options.draggable = draggable;
        flickityInstance.updateDraggable();
      }
      async reload() {
        const flickityInstance = await this.flickity;
        flickityInstance.destroy();
        if (this.flickityConfig["cellSelector"]) {
          Array.from(this.children)
            .sort((a, b) =>
              parseInt(a.getAttribute("data-original-position")) >
              parseInt(b.getAttribute("data-original-position"))
                ? 1
                : -1
            )
            .forEach((node) => this.appendChild(node));
        }
        this._apFlickityCreate();
      }
      async _apFlickityCreate() {
        this.flickity = new Promise(async (resolve) => {
          await ApLoaderLibrary.load("flickity");
          await this.untilObjectVisible({
            rootMargin: "400px",
            threshold: 0,
          });
          const flickityInstance = new window.ThemeFlickity(this, {
            ...this.flickityConfig,
            ...{
              rightToLeft: window.themeVariables.settings.direction === "rtl",
              accessibility: MediaFeatures.supportsHover(),
              on: {
                ready: (event) => triggerEvent(this, "flickity:ready", event),
                change: (event) => triggerEvent(this, "flickity:slide-changed", event),
                settle: (event) => triggerEvent(this, "flickity:slide-settled", event),
              },
            },
          });
          resolve(flickityInstance);
        });
        if (this.hasAttribute("click-nav")) {
          const flickityInstance = await this.flickityInstance;
          flickityInstance.on("staticClick", this._ApEvtOnStaticClick.bind(this));
          this.addEventListener("mousemove", this._apEvtOnMouseMove.bind(this));
        }
      }
      async _ApEvtOnStaticClick(event, pointer, cellElement) {
        const flickityInstance = await this.flickityInstance,
          isVideoOrModelType =
            flickityInstance.selectedElement.hasAttribute("data-media-type") &&
            ["video", "external_video", "model"].includes(
              flickityInstance.selectedElement.getAttribute("data-media-type")
            );
        if (
          !cellElement ||
          isVideoOrModelType ||
          window.matchMedia(window.themeVariables.breakpoints.phone).matches
        ) {
          return;
        }
        const flickityViewport = flickityInstance.viewport,
          apBoundingRect = flickityViewport.getBoundingClientRect(),
          halfEdge = Math.floor(apBoundingRect.right - apBoundingRect.width / 2);

        if (pointer.clientX > halfEdge) {
          flickityInstance.next();
        } else {
          flickityInstance.previous();
        }
      }
      async _apEvtOnMouseMove(event) {
        const flickityInstance = await this.flickityInstance,
          isVideoOrModelType =
            flickityInstance.selectedElement.hasAttribute("data-media-type") &&
            ["video", "external_video", "model"].includes(
              flickityInstance.selectedElement.getAttribute("data-media-type")
            );
        this.classList.toggle(
          "is-hovering-right",
          event.offsetX > this.clientWidth / 2 && !isVideoOrModelType
        );
        this.classList.toggle(
          "is-hovering-left",
          event.offsetX <= this.clientWidth / 2 && !isVideoOrModelType
        );
      }
      async _ApEvtPreloadNextImage() {
        var _a;
        const flickityInstance = await this.flickity;
        if (flickityInstance.selectedElement.nextElementSibling) {
          (_a = flickityInstance.selectedElement.nextElementSibling.querySelector("img")) == null
            ? void 0
            : _a.setAttribute("loading", "eager");
        }
      }
    };
    window.customElements.define("ap-flickitycarousel", APFlickityCarousel);
  });

  function apSiblings(element, filter, includeSelf = false) {
    let apContentSiblings = [];
    let currentObjectElement = element;
    while ((currentObjectElement = currentObjectElement.previousElementSibling)) {
      if (!filter || currentObjectElement.matches(filter)) {
        apContentSiblings.push(currentObjectElement);
      }
    }
    if (includeSelf) {
      apContentSiblings.push(element);
    }
    currentObjectElement = element;
    while ((currentObjectElement = currentObjectElement.nextElementSibling)) {
      if (!filter || currentObjectElement.matches(filter)) {
        apContentSiblings.push(currentObjectElement);
      }
    }
    return apContentSiblings;
  }
  async function resolveAsyncIterator(target) {
    const processedTarget = [];
    if (!(target != null && typeof target[Symbol.iterator] === "function")) {
      target = [target];
    }
    for (const targetItem of target) {
      if (typeof targetItem[Symbol.asyncIterator] === "function") {
        for await (const awaitTarget of targetItem) {
          processedTarget.push(awaitTarget);
        }
      } else {
        processedTarget.push(targetItem);
      }
    }
    return processedTarget;
  }

  var ApFlickityControls = class extends CustomHTMLElement {
    async connectedCallback() {
      this.flickityCarousel.addEventListener(
        "flickity:ready",
        this._onSlideChanged.bind(this, false)
      );
      this.flickityCarousel.addEventListener(
        "flickity:slide-changed",
        this._onSlideChanged.bind(this, true)
      );
      this.apollo.on("click", '[data-action="prev"]', () => this.flickityCarousel.previous());
      this.apollo.on("click", '[data-action="next"]', () => this.flickityCarousel.next());
      this.apollo.on("click", '[data-action="select"]', (event, target) =>
        this.flickityCarousel.select(`#${target.getAttribute("ap-controlsaria")}`)
      );
    }
    get flickityCarousel() {
      return (this._flickityCarousel =
        this._flickityCarousel || document.getElementById(this.getAttribute("controls")));
    }
    async _onSlideChanged(animate = true) {
      let flickityInstance = await this.flickityCarousel.flickityInstance;
      let flickityactiveItems = Array.from(
        this.querySelectorAll(`[ap-controlsaria="${flickityInstance.selectedElement.id}"]`)
      );
      flickityactiveItems.forEach((activeItem) => {
        activeItem.setAttribute("ap-currentaria", "true");
        apSiblings(activeItem).forEach((sibling) => sibling.removeAttribute("ap-currentaria"));
        requestAnimationFrame(() => {
          if (activeItem.offsetParent && activeItem.offsetParent !== this) {
            const windowHalfHeight = activeItem.offsetParent.clientHeight / 2,
              windowHalfWidth = activeItem.offsetParent.clientWidth / 2;
            let behavior = "auto";
            if (animate) {
              behavior = "smooth";
            }
            let top = activeItem.offsetTop - windowHalfHeight + activeItem.clientHeight / 2;
            let left = activeItem.offsetLeft - windowHalfWidth + activeItem.clientWidth / 2;
            activeItem.offsetParent.scrollTo({
              behavior: behavior,
              top: top,
              left: left,
            });
          }
        });
      });
    }
  };
  window.customElements.define("ap-flickitycontrols", ApFlickityControls);

  var ApVideoExternal = class extends CustomHTMLElement {
    constructor() {
      super();
      this.hasLoaded = false;
      (async () => {
        if (this.autoPlay) {
          await this.untilObjectVisible({
            rootMargin: "300px",
            threshold: 0,
          });
          this.play();
        } else {
          this.addEventListener("click", this.play.bind(this), {
            once: true,
          });
        }
      })();
    }
    get autoPlay() {
      return this.hasAttribute("autoplay");
    }
    get provider() {
      return this.getAttribute("provider");
    }
    async play() {
      if (!this.hasLoaded) {
        await this._setupVideoPlayer();
      }
      if (this.provider === "youtube") {
        this.firstElementChild.contentWindow.postMessage(
          JSON.stringify({
            event: "command",
            func: "playVideo",
            args: "",
          }),
          "*"
        );
      } else if (this.provider === "vimeo") {
        this.firstElementChild.contentWindow.postMessage(
          JSON.stringify({
            method: "play",
          }),
          "*"
        );
      }
    }
    pause() {
      if (!this.hasLoaded) {
        return;
      }
      if (this.provider === "youtube") {
        this.firstElementChild.contentWindow.postMessage(
          JSON.stringify({
            event: "command",
            func: "pauseVideo",
            args: "",
          }),
          "*"
        );
      } else if (this.provider === "vimeo") {
        this.firstElementChild.contentWindow.postMessage(
          JSON.stringify({
            method: "pause",
          }),
          "*"
        );
      }
    }
    _setupVideoPlayer() {
      if (this._setupPromise) {
        return this._setupPromise;
      }
      return (this._setupPromise = new Promise((resolve) => {
        const node = this.querySelector("template").content.firstElementChild.cloneNode(true);
        node.onload = () => {
          this.hasLoaded = true;
          resolve();
        };
        this.innerHTML = "";
        this.appendChild(node);
      }));
    }
  };
  window.customElements.define("ap-videoexternal", ApVideoExternal);

  var ApLoaderProduct = class {
    static load(productHandle) {
      if (!productHandle) {
        return;
      }
      if (this.loadedProducts[productHandle]) {
        return this.loadedProducts[productHandle];
      }
      this.loadedProducts[productHandle] = new Promise(async (resolve) => {
        const response = await fetch(
          `${window.themeVariables.routes.rootUrlWithoutSlash}/products/${productHandle}.js`
        );
        const responseAsJson = await response.json();
        resolve(responseAsJson);
      });
      return this.loadedProducts[productHandle];
    }
  };
  __publicField(ApLoaderProduct, "loadedProducts", {});

  // js/custom-element/ui/model-media.js
  // var ModelMedia = class extends HTMLElement {
  //   constructor() {
  //     super();
  //     ApLoaderLibrary.load("modelViewerUiStyles");
  //     window.Shopify.loadFeatures([
  //       {
  //         name: "shopify-xr",
  //         version: "1.0",
  //         onLoad: this._setupShopifyXr.bind(this)
  //       },
  //       {
  //         name: "model-viewer-ui",
  //         version: "1.0",
  //         onLoad: () => {
  //           this.modelUi = new window.Shopify.ModelViewerUI(this.firstElementChild, { focusOnPlay: false });
  //           const modelViewer = this.querySelector("model-viewer");
  //           modelViewer.addEventListener("shopify_model_viewer_ui_toggle_play", () => {
  //             modelViewer.dispatchEvent(new CustomEvent("model:played", { bubbles: true }));
  //           });
  //           modelViewer.addEventListener("shopify_model_viewer_ui_toggle_pause", () => {
  //             modelViewer.dispatchEvent(new CustomEvent("model:paused", { bubbles: true }));
  //           });
  //         }
  //       }
  //     ]);
  //   }
  //   disconnectedCallback() {
  //     var _a;
  //     (_a = this.modelUi) == null ? void 0 : _a.destroy();
  //   }
  //   play() {
  //     if (this.modelUi) {
  //       this.modelUi.play();
  //     }
  //   }
  //   pause() {
  //     if (this.modelUi) {
  //       this.modelUi.pause();
  //     }
  //   }
  //   async _setupShopifyXr() {
  //     if (!window.ShopifyXR) {
  //       document.addEventListener("shopify_xr_initialized", this._setupShopifyXr.bind(this));
  //     } else {
  //       const product = await ApLoaderProduct.load(this.getAttribute("product-handle"));
  //       const models = product["media"].filter((media) => media["media_type"] === "model");
  //       window.ShopifyXR.addModels(models);
  //       window.ShopifyXR.setupXRElements();
  //     }
  //   }
  // };
  // window.customElements.define("model-media", ModelMedia);

  // js/custom-element/ui/native-video.js
  // var NativeVideo = class extends HTMLElement {
  //   constructor() {
  //     super();
  //     this.hasLoaded = false;
  //     if (this.autoPlay) {
  //       this.play();
  //     } else {
  //       this.addEventListener("click", this.play.bind(this), { once: true });
  //     }
  //   }
  //   get autoPlay() {
  //     return this.hasAttribute("autoplay");
  //   }
  //   play() {
  //     if (!this.hasLoaded) {
  //       this._replaceContent();
  //     }
  //     this.querySelector("video").play();
  //   }
  //   pause() {
  //     if (this.hasLoaded) {
  //       this.querySelector("video").pause();
  //     }
  //   }
  //   _replaceContent() {
  //     const node = this.querySelector("template").content.firstElementChild.cloneNode(true);
  //     this.innerHTML = "";
  //     this.appendChild(node);
  //     this.firstElementChild.addEventListener("play", () => {
  //       this.dispatchEvent(new CustomEvent("video:played", { bubbles: true }));
  //     });
  //     this.firstElementChild.addEventListener("pause", () => {
  //       this.dispatchEvent(new CustomEvent("video:paused", { bubbles: true }));
  //     });
  //     this.hasLoaded = true;
  //   }
  // };
  // window.customElements.define("native-video", NativeVideo);

  var ApComboBox = class extends ApolloOpenableElement {
    connectedCallback() {
      super.connectedCallback();
      this.options = Array.from(this.querySelectorAll('[role="option"]'));
      this.apollo.on("click", '[role="option"]', this._evtOnValueClicked.bind(this));
      this.apollo.on("keydown", '[role="listbox"]', this._evtOnKeyDown.bind(this));
      this.apollo.on("change", "select", this._evtOnValueChanged.bind(this));
      this.apollo.on("click", ".ap-combobox__overlay", () => (this.open = false));
      if (this.hasAttribute("fit-toggle")) {
        const maxWidth = Math.max(...this.options.map((item) => item.clientWidth)),
          control = document.querySelector(`[ap-controlsaria="${this.id}"]`);
        if (control) {
          control.style.setProperty("--largest-option-width", `${maxWidth + 2}px`);
        }
      }
    }
    get nativeSelect() {
      return this.querySelector("select");
    }
    set selectedValue(value) {
      this.options.forEach((option) => {
        let val = "false";
        if (option.getAttribute("value") === value) {
          val = "true";
        }
        option.setAttribute("aria-selected", val);
      });
    }
    attributeChangedCallback(name, oldval, newval) {
      super.attributeChangedCallback(name, oldval, newval);
      switch (name) {
        case "open":
          if (this.open) {
            const apBoundingRect = this.getBoundingClientRect();
            let status = apBoundingRect.top >= (window.innerHeight / 2) * 1.5;
            this.classList.toggle("ap-top-combobox", status);
            setTimeout(() => this.focusTrap.activate(), 150);
          } else {
            this.focusTrap.deactivate();
            setTimeout(() => this.classList.remove("ap-top-combobox"), 200);
          }
          document.documentElement.classList.toggle("ap-lockmobile", this.open);
      }
    }
    _evtOnValueClicked(event, target) {
      this.selectedValue = target.value;
      this.nativeSelect.value = target.value;
      this.nativeSelect.dispatchEvent(
        new Event("change", {
          bubbles: true,
        })
      );
      this.open = false;
    }
    _evtOnValueChanged(event, target) {
      Array.from(this.nativeSelect.options).forEach((option) =>
        option.toggleAttribute("selected", target.value === option.value)
      );
      this.selectedValue = target.value;
    }
    _evtOnKeyDown(event) {
      var _a, _b;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (event.key === "ArrowDown") {
          (_a = document.activeElement.nextElementSibling) == null ? void 0 : _a.focus();
        } else {
          (_b = document.activeElement.previousElementSibling) == null ? void 0 : _b.focus();
        }
      }
    }
  };
  window.customElements.define("ap-combobox", ApComboBox);

  var ApQuantitySelector = class extends CustomHTMLElement {
    connectedCallback() {
      this.inputElement = this.querySelector("input");
      this.apollo.on(
        "click",
        "button:first-child",
        () => (this.inputElement.quantity = this.inputElement.quantity - 1)
      );
      this.apollo.on(
        "click",
        "button:last-child",
        () => (this.inputElement.quantity = this.inputElement.quantity + 1)
      );
    }
  };
  window.customElements.define("ap-quantityselector", ApQuantitySelector);

  var ApInputNumber = class extends HTMLInputElement {
    connectedCallback() {
      this.addEventListener("input", this._evtOnValueInput.bind(this));
      this.addEventListener("change", this._evtOnValueChanged.bind(this));
      this.addEventListener("keydown", this._evtOnKeyDown.bind(this));
    }
    get quantity() {
      return parseInt(this.value);
    }
    set quantity(quantity) {
      const isNumeric =
        (typeof quantity === "number" ||
          (typeof quantity === "string" && quantity.trim() !== "")) &&
        !isNaN(quantity);
      if (quantity === "") {
        return;
      }
      if (!isNumeric || quantity < 0) {
        quantity = parseInt(quantity) || 1;
      }
      this.value = Math.max(
        this.min || 1,
        Math.min(quantity, this.max || Number.MAX_VALUE)
      ).toString();
      this.size = Math.max(this.value.length + 1, 2);
    }
    _evtOnValueInput() {
      this.quantity = this.value;
    }
    _evtOnValueChanged() {
      if (this.value === "") {
        this.quantity = 1;
      }
    }
    _evtOnKeyDown(event) {
      event.stopPropagation();
      if (event.key === "ArrowUp") {
        this.quantity = this.quantity + 1;
      } else if (event.key === "ArrowDown") {
        this.quantity = this.quantity - 1;
      }
    }
  };
  window.customElements.define("ap-inputnumber", ApInputNumber, {
    extends: "input",
  });

  var CustomAnnouncementBar = class extends CustomHTMLElement {
    async connectedCallback() {
      await customElements.whenDefined("ap-announcementbar-item");
      this.items = Array.from(this.querySelectorAll("ap-announcementbar-item"));
      this.pendingTransitionStatus = false;
      this.apollo.on("click", '[data-action="prev"]', this.previous.bind(this));
      this.apollo.on("click", '[data-action="next"]', this.next.bind(this));
      this.apollo.on("ap-announcementbar:content:open", this._pausePlayer.bind(this));
      this.apollo.on("ap-announcementbar:content:close", this._startPlayer.bind(this));
      if (window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(this._apUpdatePropertiesCustom.bind(this));
        this.resizeObserver.observe(this);
      }
      if (this.autoPlay) {
        this._startPlayer();
      }
      if (Shopify.designMode) {
        this.apollo.on("shopify:block:select", (event) => this.select(event.target.index, false));
      }
    }
    get autoPlay() {
      return this.hasAttribute("auto-play");
    }
    get selectedIndex() {
      return this.items.findIndex((item) => item.selected);
    }
    previous() {
      let val = (this.selectedIndex - 1 + this.items.length) % this.items.length;
      this.select(val);
    }
    next() {
      let val = (this.selectedIndex + 1 + this.items.length) % this.items.length;
      this.select(val);
    }
    async select(index, animate = true) {
      if (this.selectedIndex === index || this.pendingTransitionStatus) {
        return;
      }
      this._pausePlayer();
      this.pendingTransitionStatus = true;
      await this.items[this.selectedIndex].deselect(animate);
      await this.items[index].select(animate);
      this.pendingTransitionStatus = false;
      if (this.autoPlay) {
        this._startPlayer();
      }
    }
    _pausePlayer() {
      clearInterval(this._interval);
    }
    _startPlayer() {
      this._interval = setInterval(
        this.next.bind(this),
        parseInt(this.getAttribute("cycle-speed")) * 1e3
      );
    }
    _apUpdatePropertiesCustom(entries) {
      entries.forEach((entry) => {
        if (entry.target === this) {
          const height = entry.borderBoxSize
            ? entry.borderBoxSize.length > 0
              ? entry.borderBoxSize[0].blockSize
              : entry.borderBoxSize.blockSize
            : entry.target.clientHeight;
          document.documentElement.style.setProperty("--ap-announcementbar-height", `${height}px`);
        }
      });
    }
  };
  window.customElements.define("ap-announcementbar", CustomAnnouncementBar);

  var CustomAnnouncementBarItem = class extends CustomHTMLElement {
    connectedCallback() {
      if (this.hasContent) {
        this.contentElement = this.querySelector(".ap-announcementbar__content");
        this.apollo.on("click", '[data-action="open-content"]', this.clickOpenContent.bind(this));
        this.apollo.on("click", '[data-action="close-content"]', this.clickCloseContent.bind(this));
        if (Shopify.designMode) {
          this.addEventListener("shopify:block:select", this.clickOpenContent.bind(this));
          this.addEventListener("shopify:block:deselect", this.clickCloseContent.bind(this));
        }
      }
    }
    get index() {
      return [...this.parentNode.children].indexOf(this);
    }
    get hasContent() {
      return this.hasAttribute("has-content");
    }
    get selected() {
      return !this.hasAttribute("hidden");
    }
    get focusTrap() {
      return (this._trapFocus =
        this._trapFocus ||
        createObjectFocusTrap(
          this.contentElement.querySelector(".ap-announcementbar__content-inner"),
          {
            fallbackFocus: this,
            clickOutsideDeactivates: (event) => !(event.target.tagName === "BUTTON"),
            allowOutsideClick: (event) => event.target.tagName === "BUTTON",
            onDeactivate: this.clickCloseContent.bind(this),
            preventScroll: true,
          }
        ));
    }
    async select(animate = true) {
      this.removeAttribute("hidden");
      await new Promise((resolve) => {
        this.animate(
          {
            transform: ["translateY(8px)", "translateY(0)"],
            opacity: [0, 1],
          },
          {
            duration: animate ? 150 : 0,
            easing: "ease-in-out",
          }
        ).onfinish = resolve;
      });
    }
    async deselect(animate = true) {
      await this.clickCloseContent();
      await new Promise((resolve) => {
        this.animate(
          {
            transform: ["translateY(0)", "translateY(-8px)"],
            opacity: [1, 0],
          },
          {
            duration: animate ? 150 : 0,
            easing: "ease-in-out",
          }
        ).onfinish = resolve;
      });
      this.setAttribute("hidden", "");
    }
    async clickOpenContent() {
      if (this.hasContent) {
        this.contentElement.addEventListener("transitionend", () => this.focusTrap.activate(), {
          once: true,
        });
        this.contentElement.removeAttribute("hidden");
        document.documentElement.classList.add("ap-lockall");
        this.dispatchEvent(
          new CustomEvent("ap-announcementbar:content:open", {
            bubbles: true,
          })
        );
      }
    }
    async clickCloseContent() {
      if (!this.hasContent || this.contentElement.hasAttribute("hidden")) {
        return Promise.resolve();
      }
      await new Promise((resolve) => {
        this.contentElement.addEventListener("transitionend", () => resolve(), {
          once: true,
        });
        this.contentElement.setAttribute("hidden", "");
        this.focusTrap.deactivate();
        document.documentElement.classList.remove("ap-lockall");
        this.dispatchEvent(
          new CustomEvent("ap-announcementbar:content:close", {
            bubbles: true,
          })
        );
      });
    }
  };
  window.customElements.define("ap-announcementbar-item", CustomAnnouncementBarItem);

  var SearchPage = class extends HTMLElement {
    connectedCallback() {
      this.facetToolbar = document.getElementById("mobile-facet-toolbar");
      this.tabsNav = document.getElementById("search-ap-navtabs");
      this.tabsNav.addEventListener("ap-navtabs:changed", this._onCategoryChanged.bind(this));
      this._completeSearch();
    }
    get terms() {
      return this.getAttribute("terms");
    }
    get sortSy() {
      return this.querySelector("#input-s").getAttribute("value");
    }
    get completeFor() {
      return JSON.parse(this.getAttribute("complete-for")).filter((item) => !(item === ""));
    }
    async _completeSearch() {
      const promisesList = [];
      this.completeFor.forEach((item) => {
        promisesList.push(
          fetch(
            `${window.themeVariables.routes.searchUrl}?section_id=${this.getAttribute(
              "section-id"
            )}&q=${this.terms}&type=${item}&options[prefix]=last&options[unavailable_products]=${
              window.themeVariables.settings.searchProductsUnavailable
            }`
          )
        );
        // this.querySelector("#input-q").setAttribute("value", `${this.terms}`);
        // console.log(this.terms);
        this.querySelector("#clear-all").setAttribute("href", `/search?sort_by=${this.sortSy}&q=${this.terms}&type=product&options[prefix]=last&options[unavailable_products]=last`);
      });
      const responses = await Promise.all(promisesList);
      await Promise.all(
        responses.map(async (response) => {
          const div = document.createElement("div");
          div.innerHTML = await response.text();
          const categoryResultDiv = div.querySelector(".main-search__category-result"),
            tabNavItem = div.querySelector("#search-ap-navtabs .ap-navtabs__item");
          if (categoryResultDiv) {
            categoryResultDiv.setAttribute("hidden", "");
            this.insertAdjacentElement("beforeend", categoryResultDiv);
            this.tabsNav.addButton(tabNavItem);
          }
        })
      );
    }
    _onCategoryChanged(event) {
      const button = event.detail.button;
      this.tabsNav.classList.toggle("is-collapsed", button.getAttribute("data-type") !== "product");
    }
  };
  window.customElements.define("search-page", SearchPage);

  var WishlistCount = class extends CustomHTMLElement {
    connectedCallback() {
      let wishlist = this._getCookie("apwl");
      if (wishlist) {
        wishlist = wishlist.split(",");
        this.innerHTML = wishlist.length;
      } else {
        this.innerHTML = 0;
      }
    }
    _getCookie(cname) {
      let name = cname + "=";
      let ca = document.cookie.split(";");
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == " ") {
          c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
        }
      }
      return "";
    }
  };
  window.customElements.define("ap-wishlistcount", WishlistCount);

  var WishlistButton = class extends CustomHTMLElement {
    async connectedCallback() {
      this.apollo.on("click", '[data-action~="add"]', this._addWishlist.bind(this));
      this.apollo.on("click", '[data-action~="remove"]', this._removeWishlist.bind(this));
      this._initWishlist();
    }
    _initWishlist() {
      let wishlist = this._getCookie("apwl");
      let id = this.getAttribute("data-id");
      if (wishlist != "") {
        wishlist = wishlist.split(",");
        if (wishlist.includes(id)) {
          this.classList.add("active");
          this.setAttribute("data-action", "remove");
          this.setAttribute("alt", window.themeVariables.strings.removeWishlist);
        }
      }
    }
    _addWishlist() {
      let wishlist = this._getCookie("apwl");
      let id = this.getAttribute("data-id");
      if (wishlist != "") {
        wishlist = wishlist.split(",");
        if (wishlist.includes(id) == false) {
          wishlist.push(id);
        }
        wishlist = wishlist.join(",");
      } else {
        wishlist = id;
      }
      this._setCookie("apwl", wishlist, 365);
      this.classList.add("active");
      this.setAttribute("data-action", "remove");
      this.setAttribute("alt", window.themeVariables.strings.removeWishlist);
      document.querySelector("ap-wishlistcount").innerHTML = wishlist.split(",").length;
    }
    _removeWishlist() {
      let wishlist = this._getCookie("apwl");
      let id = this.getAttribute("data-id");
      if (wishlist != "") {
        wishlist = wishlist.split(",");
        if (wishlist.indexOf(id) > -1) {
          wishlist.splice(wishlist.indexOf(id), 1);
        }
        wishlist = wishlist.join(",");
        this._setCookie("apwl", wishlist, 365);
        this.classList.remove("active");
        this.setAttribute("data-action", "add");
        this.setAttribute("alt", window.themeVariables.strings.addToWishlist);
        document.querySelector("ap-wishlistcount").innerHTML = wishlist.split(",").length;
      } else {
        document.querySelector("ap-wishlistcount").innerHTML = 0;
      }
      if (document.querySelector("body").classList.contains("page.wishlist")) {
        document.getElementById("product-item-" + id).remove();
      }
    }
    _setCookie(cname, cvalue, exdays) {
      const d = new Date();
      d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
      let expires = "expires=" + d.toUTCString();
      document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }
    _getCookie(cname) {
      let name = cname + "=";
      let ca = document.cookie.split(";");
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == " ") {
          c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
        }
      }
      return "";
    }
  };
  window.customElements.define("ap-wishlistbutton", WishlistButton);

  var ApWishlistDisplay = class extends HTMLElement {
    async connectedCallback() {
      if (this.searchQueryString === "") {
        document.getElementById("no-wishlistdisplay").classList = "active";
        return;
      }
      const response = await fetch(
        `${window.themeVariables.routes.apDrawerSearchUrl}?q=${this.searchQueryString}&resources[limit]=10&resources[type]=product&section_id=${this.sectionId}`
      );
      const div = document.createElement("div");
      div.innerHTML = await response.text();
      const recentlyViewedProductsElement = div.querySelector("ap-wishlistdisplay");
      if (recentlyViewedProductsElement.hasChildNodes()) {
        this.innerHTML = recentlyViewedProductsElement.innerHTML;
      }
    }

    get searchQueryString() {
      let wishlist = this._getCookie("apwl");
      if (wishlist != "") {
        wishlist = wishlist.split(",");
        return wishlist
          .map((item) => "id:" + item)
          .slice(0, this.productsCount)
          .join(" OR ");
      }
      return "";
    }
    get sectionId() {
      return this.getAttribute("section-id");
    }

    _getCookie(cname) {
      let name = cname + "=";
      let ca = document.cookie.split(";");
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == " ") {
          c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
        }
      }
      return "";
    }
  };
  window.customElements.define("ap-wishlistdisplay", ApWishlistDisplay);

  var CompareCount = class extends CustomHTMLElement {
    async connectedCallback() {
      let compare = this._getCookie("apcp");
      if (compare) {
        compare = compare.split(",");
        this.innerHTML = compare.length;
      } else {
        this.innerHTML = 0;
      }
    }
    _getCookie(cname) {
      let name = cname + "=";
      let ca = document.cookie.split(";");
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == " ") {
          c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
        }
      }
      return "";
    }
  };
  window.customElements.define("ap-comparecount", CompareCount);

  var CompareButton = class extends CustomHTMLElement {
    connectedCallback() {
      this.apollo.on("click", '[data-action~="add"]', this._addCompare.bind(this));
      this.apollo.on("click", '[data-action~="remove"]', this._removeCompare.bind(this));
      this._initCompare();
    }
    _initCompare() {
      let compare = this._getCookie("apcp");
      let id = this.getAttribute("data-id");
      if (compare != "") {
        compare = compare.split(",");
        if (compare.includes(id)) {
          this.classList.add("active");
          this.setAttribute("data-action", "remove");
          this.setAttribute("alt", window.themeVariables.strings.removeCompare);
        }
      }
    }
    _addCompare() {
      let compare = this._getCookie("apcp");
      let id = this.getAttribute("data-id");
      if (compare != "") {
        compare = compare.split(",");
        if (compare.includes(id) == false) {
          compare.push(id);
        }
        compare = compare.join(",");
      } else {
        compare = id;
      }
      this._setCookie("apcp", compare, 365);
      this.classList.add("active");
      this.setAttribute("data-action", "remove");
      this.setAttribute("alt", window.themeVariables.strings.removeCompare);
      document.querySelector("ap-comparecount").innerHTML = compare.split(",").length;
    }
    _removeCompare() {
      let compare = this._getCookie("apcp");
      let id = this.getAttribute("data-id");
      if (compare != "") {
        compare = compare.split(",");
        if (compare.indexOf(id) > -1) {
          compare.splice(compare.indexOf(id), 1);
        }
        compare = compare.join(",");
        this._setCookie("apcp", compare, 365);
        this.classList.remove("active");
        this.setAttribute("data-action", "add");
        this.setAttribute("alt", window.themeVariables.strings.addToCompare);
        document.querySelector("ap-comparecount").innerHTML = compare.split(",").length;
      } else {
        document.querySelector("ap-comparecount").innerHTML = 0;
      }

      if (document.querySelector("body").classList.contains("page.compare")) {
        document.getElementById("product-item-" + id).remove();
      }
    }
    _setCookie(cname, cvalue, exdays) {
      const d = new Date();
      d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
      let expires = "expires=" + d.toUTCString();
      document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }
    _getCookie(cname) {
      let name = cname + "=";
      let ca = document.cookie.split(";");
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == " ") {
          c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
        }
      }
      return "";
    }
  };
  window.customElements.define("ap-comparebutton", CompareButton);

  var ApCompareDisplay = class extends HTMLElement {
    async connectedCallback() {
      if (this.searchQueryString === "") {
        document.getElementById("no-comparedisplay").classList = "active";
        return;
      }
      const response = await fetch(
        `${window.themeVariables.routes.apDrawerSearchUrl}?q=${this.searchQueryString}&resources[limit]=10&resources[type]=product&section_id=${this.sectionId}`
      );
      const div = document.createElement("div");
      div.innerHTML = await response.text();
      const recentlyViewedProductsElement = div.querySelector("ap-comparedisplay");
      if (recentlyViewedProductsElement.hasChildNodes()) {
        this.innerHTML = recentlyViewedProductsElement.innerHTML;
      }
    }

    get searchQueryString() {
      let compare = this._getCookie("apcp");
      if (compare != "") {
        compare = compare.split(",");
        return compare
          .map((item) => "id:" + item)
          .slice(0, this.productsCount)
          .join(" OR ");
      }
      return "";
    }
    get sectionId() {
      return this.getAttribute("section-id");
    }

    _getCookie(cname) {
      let name = cname + "=";
      let ca = document.cookie.split(";");
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == " ") {
          c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
        }
      }
      return "";
    }
  };
  window.customElements.define("ap-comparedisplay", ApCompareDisplay);

  var CookieBar = class extends CustomHTMLElement {
    connectedCallback() {
      if (window.Shopify && window.Shopify.designMode) {
        this.rootApollo.on("shopify:section:select", (event) =>
          apolloShopifyEventFilter(event, this, () => (this.open = true))
        );
        this.rootApollo.on("shopify:section:deselect", (event) =>
          apolloShopifyEventFilter(event, this, () => (this.open = false))
        );
      }
      this.apollo.on("click", '[data-action~="accept-policy"]', this._acceptPolicy.bind(this));
      this.apollo.on("click", '[data-action~="decline-policy"]', this._declinePolicy.bind(this));
      window.Shopify.loadFeatures([
        {
          name: "consent-tracking-api",
          version: "0.1",
          onLoad: this._onCookieBarSetup.bind(this),
        },
      ]);
    }
    set open(value) {
      this.toggleAttribute("hidden", !value);
    }
    _onCookieBarSetup() {
      if (this._getCookie("cookie_policy") == "true") {
        this.open = false;
      } else {
        this.open = true;
      }
    }
    _acceptPolicy() {
      this._setCookie("cookie_policy", true, 365);
      this.open = false;
    }
    _declinePolicy() {
      this.open = false;
    }
    _setCookie(cname, cvalue, exdays) {
      const d = new Date();
      d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
      let expires = "expires=" + d.toUTCString();
      document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }
    _getCookie(cname) {
      let name = cname + "=";
      let ca = document.cookie.split(";");
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == " ") {
          c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
        }
      }
      return "";
    }
  };
  window.customElements.define("ap-cookiebar", CookieBar);

  ApProductRecommendations = class extends HTMLElement {
    async connectedCallback() {
      if (!this.hasAttribute("use-automaticrecommendations")) {
        return;
      }
      const response = await fetch(
        `${window.themeVariables.routes.productUrlRecommendations}?product_id=${this.productId}&limit=${this.recommendationsCount}&section_id=${this.sectionId}`
      );
      const div = document.createElement("div");
      div.innerHTML = await response.text();
      const productRecommendationsElement = div.querySelector("ap-productrecommendations");
      if (productRecommendationsElement.hasChildNodes()) {
        this.innerHTML = productRecommendationsElement.innerHTML;
      }
    }
    get productId() {
      return this.getAttribute("product-id");
    }
    get sectionId() {
      return this.getAttribute("section-id");
    }
    get recommendationsCount() {
      return parseInt(this.getAttribute("recommendations-count") || 4);
    }
  };
  window.customElements.define("ap-productrecommendations", ApProductRecommendations);

  var ApRecentlyProductsViewed = class extends HTMLElement {
    async connectedCallback() {
      if (this.searchQueryString === "") {
        return;
      }
      const response = await fetch(
        `${window.themeVariables.routes.apDrawerSearchUrl}?q=${this.searchQueryString}&resources[limit]=10&resources[type]=product&section_id=${this.sectionId}`
      );
      const div = document.createElement("div");
      div.innerHTML = await response.text();
      const recentlyViewedProductsElement = div.querySelector("ap-recentlyproductsviewed");
      if (recentlyViewedProductsElement.hasChildNodes()) {
        this.innerHTML = recentlyViewedProductsElement.innerHTML;
      }
    }
    get searchQueryString() {
      const items = JSON.parse(localStorage.getItem("theme:ap-recentlyproductsviewed") || "[]");
      if (
        this.hasAttribute("exclude-product-id") &&
        items.includes(parseInt(this.getAttribute("exclude-product-id")))
      ) {
        items.splice(items.indexOf(parseInt(this.getAttribute("exclude-product-id"))), 1);
      }
      return items
        .map((item) => "id:" + item)
        .slice(0, this.productsCount)
        .join(" OR ");
    }
    get sectionId() {
      return this.getAttribute("section-id");
    }
    get productsCount() {
      return this.getAttribute("products-count") || 4;
    }
  };
  window.customElements.define("ap-recentlyproductsviewed", ApRecentlyProductsViewed);

  var ApRecentlyProductsViewedPopup = class extends ApolloOpenableElement {
    async connectedCallback() {
      super.connectedCallback();
      if (this.searchQueryString === "") {
        return;
      }
      document
        .getElementById("shopify-section-recently-viewed-products-popup")
        .classList.add("active");
      const response = await fetch(
        `${window.themeVariables.routes.apDrawerSearchUrl}?q=${this.searchQueryString}&resources[limit]=10&resources[type]=product&section_id=${this.sectionId}`
      );

      const div = document.createElement("div");
      div.innerHTML = await response.text();
      const recentlyViewedProductsElement = div.querySelector("ap-recentlyproductsviewed-popup");
      if (recentlyViewedProductsElement.hasChildNodes()) {
        this.innerHTML = recentlyViewedProductsElement.innerHTML;
      }
      const productsviewedbutton = div.querySelector("ap-productsviewed-button");
      if (productsviewedbutton.hasChildNodes()) {
        document.querySelector("ap-productsviewed-button").innerHTML =
          productsviewedbutton.innerHTML;
      }

      if (this.hasAttribute("reverse-breakpoint")) {
        this.originalDirection = this.classList.contains("drawer--from-left") ? "left" : "right";
        const matchMedia2 = window.matchMedia(this.getAttribute("reverse-breakpoint"));
        matchMedia2.addListener(this._objCheckReverseOpenDirec.bind(this));
        this._objCheckReverseOpenDirec(matchMedia2);
      }
      this.apollo.on("click", ".drawer__overlay", () => (this.open = false));
    }
    attributeChangedCallback(name, oldval, newval) {
      super.attributeChangedCallback(name, oldval, newval);
      switch (name) {
        case "open":
          document.documentElement.classList.toggle("ap-lockall", this.open);
      }
    }
    _objCheckReverseOpenDirec(match) {
      this.classList.remove("drawer--from-left");
      if (
        (this.originalDirection === "left" && !match.matches) ||
        (this.originalDirection !== "left" && match.matches)
      ) {
        this.classList.add("drawer--from-left");
      }
    }
    get searchQueryString() {
      const items = JSON.parse(localStorage.getItem("theme:ap-recentlyproductsviewed") || "[]");
      if (
        this.hasAttribute("exclude-product-id") &&
        items.includes(parseInt(this.getAttribute("exclude-product-id")))
      ) {
        items.splice(items.indexOf(parseInt(this.getAttribute("exclude-product-id"))), 1);
      }
      return items
        .map((item) => "id:" + item)
        .slice(0, this.productsCount)
        .join(" OR ");
    }
    get sectionId() {
      return this.getAttribute("section-id");
    }
    get productsCount() {
      return this.getAttribute("products-count") || 4;
    }
  };
  window.customElements.define("ap-recentlyproductsviewed-popup", ApRecentlyProductsViewedPopup);

  var ApRecentlyProductsViewedPopupButton = class extends CustomHTMLElement {};
  window.customElements.define("ap-productsviewed-button", ApRecentlyProductsViewedPopupButton);

  var ApCrossSelling = class extends HTMLElement {
    async connectedCallback() {
      if (this.searchQueryString === "") {
        return;
      }
      const response = await fetch(
        `${window.themeVariables.routes.apDrawerSearchUrl}?q=${this.searchQueryString}&resources[limit]=10&resources[type]=product&section_id=${this.sectionId}`
      );
      const div = document.createElement("div");
      div.innerHTML = await response.text();
      const recentlyViewedProductsElement = div.querySelector("ap-crossselling");
      if (recentlyViewedProductsElement.hasChildNodes()) {
        this.innerHTML = recentlyViewedProductsElement.innerHTML;
      }
      const closeModal = document.getElementById("close");
      if (closeModal) {
        closeModal.onclick = () => {
          document.getElementById("modal-productsell").classList.remove("modal-active");
        };
      }
    }

    get searchQueryString() {
      let ids = this.getAttribute("data-id");
      if (ids != "") {
        ids = ids.split(",");
        return ids.map((item) => "id:" + item).join(" OR ");
      }
      return "";
    }
    get sectionId() {
      return this.getAttribute("section-id");
    }
  };
  window.customElements.define("ap-crossselling", ApCrossSelling);

  var ApUpsell = class extends HTMLElement {
    async connectedCallback() {
      if (this.searchQueryString === "") {
        return;
      }
      const response = await fetch(
        `${window.themeVariables.routes.apDrawerSearchUrl}?q=${this.searchQueryString}&resources[limit]=10&resources[type]=product&section_id=${this.sectionId}`
      );
      const div = document.createElement("div");
      div.innerHTML = await response.text();
      const recentlyViewedProductsElement = div.querySelector("ap-upsell");
      if (recentlyViewedProductsElement.hasChildNodes()) {
        this.innerHTML = recentlyViewedProductsElement.innerHTML;
      }

      const closeModal = document.getElementById("close");
      if (closeModal) {
        closeModal.onclick = () => {
          document.getElementById("modal-productsell").classList.remove("modal-active");
        };
      }
    }

    get searchQueryString() {
      let ids = this.getAttribute("data-id");
      if (ids != "") {
        ids = ids.split(",");
        return ids.map((item) => "id:" + item).join(" OR ");
      }
      return "";
    }
    get sectionId() {
      return this.getAttribute("section-id");
    }
  };
  window.customElements.define("ap-upsell", ApUpsell);

  var ApLoadMoreProducts = class extends HTMLElement {
    async connectedCallback() {
      if (this.searchQueryString === "" || document.getElementById("ap_loadmoreproduct") == null) {
        return;
      }
      this._onWindowScrollListener = apStream(this._function_loadmore.bind(this), 100);
      window.addEventListener("scroll", this._onWindowScrollListener);
    }

    _function_loadmore(event) {
      let loadmore = document.getElementById("ap_loadmoreproduct");
      if (window.scrollY - loadmore.offsetTop > 0) {
        if (document.getElementById("ap_loadmoreproduct").className == "") {
          document.getElementById("ap_loadmoreproduct").classList.add("loading");
          this._nextpage();
        }
      }
    }

    _nextpage() {
      let page = parseInt(document.getElementById("ap_page_load").value);
      let max_page = parseInt(document.getElementById("ap_max_page").value);
      let nextpage = page + 1;
      if (max_page >= nextpage) {
        const formData = new FormData(document.getElementById("ap-facetfilters-form"));
        let searchParamsAsString = new URLSearchParams(formData).toString();
        if (searchParamsAsString.indexOf("page=" + page) == -1) {
          searchParamsAsString = searchParamsAsString + "&page=" + nextpage;
        } else {
          searchParamsAsString = searchParamsAsString.replace("page=" + page, "page=" + nextpage);
        }
        document.getElementById("loading-more-product-icon").style.display = "block";
        let url = `${
          window.location.pathname
        }?${searchParamsAsString}&section_id=${this.getAttribute("section-id")}`;
        fetch(url)
          .then((x) => x.text())
          .then((y) => this._updatehtmlcontent(y));
      }
    }

    _updatehtmlcontent(content) {
      const parser = new DOMParser();
      const html = parser.parseFromString(content, "text/html");
      const loadmoreproduct = html.getElementById("ap-loadmoreproduct");
      if (loadmoreproduct.children.length) {
        let str = "";
        for (let i = 0; i < loadmoreproduct.children.length; i++) {
          document.getElementById("ap_productlist").append(loadmoreproduct.children[i]);
          i--;
        }
        let page = parseInt(document.getElementById("ap_page_load").value) + 1;
        document.getElementById("ap_page_load").value = page;
        if (window.scrollY - document.getElementById("ap_loadmoreproduct").offsetTop < 0) {
          document.getElementById("ap_loadmoreproduct").classList = "";
          this._onWindowScrollListener = apStream(this._function_loadmore.bind(this), 100);
          window.addEventListener("scroll", this._onWindowScrollListener);
        }
      }
      document.getElementById("loading-more-product-icon").style.display = "none";
    }
  };
  window.customElements.define("ap-loadmoreproduct", ApLoadMoreProducts);

  function apGetSizedOfMediaUrl(media, size) {
    let src = "";
    if (typeof media === "string") {
      src = media;
    } else {
      if (media["preview_image"]) {
        src = media["preview_image"]["src"];
      } else {
        src = media["url"];
      }
    }
    if (size === null) {
      return src;
    }
    if (size === "master") {
      return src.replace(/http(s)?:/, "");
    }
    const match = src.match(/\.(jpeg|jpg|png|bmp|gif|tiff|tif|bitmap)(\?v=\d+)?$/i);
    if (match) {
      const prefix = src.split(match[0]);
      const suffix = match[0];
      return (prefix[0] + "_" + size + suffix).replace(/http(s)?:/, "");
    } else {
      return null;
    }
  }

  function apGetMediasrcset(media, sizeList) {
    let srcset = [];
    let supportedSizes = apGetSupportedSizes(media, sizeList);
    if (typeof media === "string") {
      supportedSizes = sizeList;
    }
    supportedSizes.forEach((supportedSize) => {
      srcset.push(`${apGetSizedOfMediaUrl(media, supportedSize + "x")} ${supportedSize}w`);
    });
    return srcset.join(",");
  }

  function apGetSupportedSizes(media, desiredSizes) {
    let supportedSizes = [];
    let mediaWidth = media["preview_image"]["width"];
    desiredSizes.forEach((width) => {
      if (mediaWidth >= width) {
        supportedSizes.push(width);
      }
    });
    return supportedSizes;
  }

  function imageLoaded(image) {
    return new Promise((resolve) => {
      if (!image || image.tagName !== "IMG" || image.complete) {
        resolve();
      } else {
        image.onload = () => resolve();
      }
    });
  }

  var ApAnimationCustom = class {
    constructor(effect) {
      this._effect = effect;
      this._playState = "idle";
      this._finished = Promise.resolve();
    }
    get finished() {
      return this._finished;
    }
    get animationEffects() {
      if (this._effect instanceof ApEffectOfCustomKeyframe) {
        return [this._effect];
      } else {
        return this._effect.animationEffects;
      }
    }
    cancel() {
      this.animationEffects.forEach((animationEffect) => animationEffect.cancel());
    }
    finish() {
      this.animationEffects.forEach((animationEffect) => animationEffect.finish());
    }
    play() {
      this._playState = "running";
      this._effect.play();
      this._finished = this._effect.finished;
      this._finished.then(
        () => {
          this._playState = "finished";
        },
        (rejection) => {
          this._playState = "idle";
        }
      );
    }
  };
  var ApEffectOfCustomKeyframe = class {
    constructor(target, keyframes, options = {}) {
      if (!target) {
        return;
      }
      if ("Animation" in window) {
        this._customanimation = new Animation(new KeyframeEffect(target, keyframes, options));
      } else {
        options["fill"] = "forwards";
        this._customanimation = target.animate(keyframes, options);
        this._customanimation.pause();
      }
      this._customanimation.addEventListener("finish", () => {
        target.style.opacity = keyframes.hasOwnProperty("opacity")
          ? keyframes["opacity"][keyframes["opacity"].length - 1]
          : null;
        target.style.visibility = keyframes.hasOwnProperty("visibility")
          ? keyframes["visibility"][keyframes["visibility"].length - 1]
          : null;
      });
    }
    get finished() {
      if (!this._customanimation) {
        return Promise.resolve();
      }
      return this._customanimation.finished
        ? this._customanimation.finished
        : new Promise((resolve) => (this._customanimation.onfinish = resolve));
    }
    play() {
      if (this._customanimation) {
        this._customanimation.startTime = null;
        this._customanimation.play();
      }
    }
    cancel() {
      if (this._customanimation) {
        this._customanimation.cancel();
      }
    }
    finish() {
      if (this._customanimation) {
        this._customanimation.finish();
      }
    }
  };
  var ApEffectGroup = class {
    constructor(childrenEffects) {
      this._childrenEffects = childrenEffects;
      this._finished = Promise.resolve();
    }
    get finished() {
      return this._finished;
    }
    get animationEffects() {
      return this._childrenEffects.flatMap((effect) => {
        return effect instanceof ApEffectOfCustomKeyframe ? effect : effect.animationEffects;
      });
    }
  };
  var ApEffectParallel = class extends ApEffectGroup {
    play() {
      const promises = [];
      for (const effect of this._childrenEffects) {
        effect.play();
        promises.push(effect.finished);
      }
      this._finished = Promise.all(promises);
    }
  };
  var ApEffectSequence = class extends ApEffectGroup {
    play() {
      this._finished = new Promise(async (resolve, reject) => {
        try {
          for (const effect of this._childrenEffects) {
            effect.play();
            await effect.finished;
          }
          resolve();
        } catch (exception) {
          reject();
        }
      });
    }
  };

  var ApSlideshowItem = class extends HTMLElement {
    async connectedCallback() {
      this._pendingAnimations = [];
      this.addEventListener("ap-splitlines:re-split", (event) => {
        Array.from(event.target.children).forEach(
          (line) => (line.style.visibility = this.selected ? "visible" : "hidden")
        );
      });
      if (MediaFeatures.prefersReducedMotion()) {
        this.setAttribute("ap-revealvisibility", "");
        Array.from(this.querySelectorAll("[reveal], [ap-revealvisibility]")).forEach((item) => {
          item.removeAttribute("reveal");
          item.removeAttribute("ap-revealvisibility");
        });
      }
    }
    get index() {
      return [...this.parentNode.children].indexOf(this);
    }
    get selected() {
      return !this.hasAttribute("hidden");
    }
    async transitionToLeave(transitionType, useEffect = true) {
      if (transitionType !== "reveal") {
        this.setAttribute("hidden", "");
      }
      this._pendingAnimations.forEach((animation2) => animation2.cancel());
      this._pendingAnimations = [];
      let animation = null,
        textElements = await resolveAsyncIterator(
          this.querySelectorAll(
            "ap-splitlines, .button-group, .button-wrapper"
          )
        );
      let elementImages = Array.from(this.querySelectorAll(".slideshow__image-wrapper"));
      switch (transitionType) {
        case "sweep":
          animation = new ApAnimationCustom(
            new ApEffectSequence([
              new ApEffectOfCustomKeyframe(
                this,
                {
                  visibility: ["visible", "hidden"],
                },
                {
                  duration: 500,
                }
              ),
              new ApEffectParallel(
                textElements.map((item) => {
                  return new ApEffectOfCustomKeyframe(item, {
                    opacity: [1, 0],
                    visibility: ["visible", "hidden"],
                  });
                })
              ),
            ])
          );
          break;
        case "fade":
          animation = new ApAnimationCustom(
            new ApEffectOfCustomKeyframe(
              this,
              {
                opacity: [1, 0],
                visibility: ["visible", "hidden"],
              },
              {
                duration: 250,
                easing: "ease-in-out",
              }
            )
          );
          break;
        case "reveal":
          animation = new ApAnimationCustom(
            new ApEffectSequence([
              new ApEffectParallel(
                textElements.reverse().map((item) => {
                  return new ApEffectOfCustomKeyframe(
                    item,
                    {
                      opacity: [1, 0],
                      visibility: ["visible", "hidden"],
                    },
                    {
                      duration: 250,
                      easing: "ease-in-out",
                    }
                  );
                })
              ),
              new ApEffectParallel(
                elementImages.map((item) => {
                  if (!item.classList.contains("slideshow__image-wrapper--secondary")) {
                    return new ApEffectOfCustomKeyframe(
                      item,
                      {
                        visibility: ["visible", "hidden"],
                        clipPath: ["inset(0 0 0 0)", "inset(0 0 100% 0)"],
                      },
                      {
                        duration: 450,
                        easing: "cubic-bezier(0.99, 0.01, 0.50, 0.94)",
                      }
                    );
                  } else {
                    return new ApEffectOfCustomKeyframe(
                      item,
                      {
                        visibility: ["visible", "hidden"],
                        clipPath: ["inset(0 0 0 0)", "inset(100% 0 0 0)"],
                      },
                      {
                        duration: 450,
                        easing: "cubic-bezier(0.99, 0.01, 0.50, 0.94)",
                      }
                    );
                  }
                })
              ),
            ])
          );
          break;
      }
      await this._executeAnimation(animation, useEffect);
      if (transitionType === "reveal") {
        this.setAttribute("hidden", "");
      }
    }
    async transitionToEnter(transitionType, useEffect = true, reverseDirection = false) {
      this.removeAttribute("hidden");
      await this._untilReady();
      let animation = null,
        textElements = await resolveAsyncIterator(
          this.querySelectorAll(
            "ap-splitlines, .button-group, .button-wrapper"
          )
        ),
        elementImages = Array.from(this.querySelectorAll(".slideshow__image-wrapper"));
      switch (transitionType) {
        case "sweep":
          animation = new ApAnimationCustom(
            new ApEffectSequence([
              new ApEffectOfCustomKeyframe(
                this,
                {
                  visibility: ["hidden", "visible"],
                  clipPath: reverseDirection
                    ? ["inset(0 100% 0 0)", "inset(0 0 0 0)"]
                    : ["inset(0 0 0 100%)", "inset(0 0 0 0)"],
                },
                {
                  duration: 500,
                  easing: "cubic-bezier(1, 0, 0, 1)",
                }
              ),
              new ApEffectParallel(
                textElements.map((item, index) => {
                  return new ApEffectOfCustomKeyframe(
                    item,
                    {
                      opacity: [0, 1],
                      visibility: ["hidden", "visible"],
                      clipPath: ["inset(0 0 100% 0)", "inset(0 0 0 0)"],
                      transform: ["translateY(100%)", "translateY(0)"],
                    },
                    {
                      duration: 450,
                      delay: 100 * index,
                      easing: "cubic-bezier(0.5, 0.06, 0.01, 0.99)",
                    }
                  );
                })
              ),
            ])
          );
          break;
        case "fade":
          animation = new ApAnimationCustom(
            new ApEffectOfCustomKeyframe(
              this,
              {
                opacity: [0, 1],
                visibility: ["hidden", "visible"],
              },
              {
                duration: 250,
                easing: "ease-in-out",
              }
            )
          );
          break;
        case "reveal":
          animation = new ApAnimationCustom(
            new ApEffectSequence([
              new ApEffectParallel(
                elementImages.map((item) => {
                  if (!item.classList.contains("slideshow__image-wrapper--secondary")) {
                    return new ApEffectOfCustomKeyframe(
                      item,
                      {
                        visibility: ["hidden", "visible"],
                        clipPath: ["inset(0 0 100% 0)", "inset(0 0 0 0)"],
                      },
                      {
                        duration: 450,
                        delay: 100,
                        easing: "cubic-bezier(0.5, 0.06, 0.01, 0.99)",
                      }
                    );
                  } else {
                    return new ApEffectOfCustomKeyframe(
                      item,
                      {
                        visibility: ["hidden", "visible"],
                        clipPath: ["inset(100% 0 0 0)", "inset(0 0 0 0)"],
                      },
                      {
                        duration: 450,
                        delay: 100,
                        easing: "cubic-bezier(0.5, 0.06, 0.01, 0.99)",
                      }
                    );
                  }
                })
              ),
              new ApEffectParallel(
                textElements.map((item, index) => {
                  return new ApEffectOfCustomKeyframe(
                    item,
                    {
                      opacity: [0, 1],
                      visibility: ["hidden", "visible"],
                      clipPath: ["inset(0 0 100% 0)", "inset(0 0 0 0)"],
                      transform: ["translateY(100%)", "translateY(0)"],
                    },
                    {
                      duration: 450,
                      delay: 100 * index,
                      easing: "cubic-bezier(0.5, 0.06, 0.01, 0.99)",
                    }
                  );
                })
              ),
            ])
          );
          break;
      }
      return this._executeAnimation(animation, useEffect);
    }
    async _executeAnimation(animation, useEffect) {
      this._pendingAnimations.push(animation);
      useEffect ? animation.play() : animation.finish();
      return animation.finished;
    }
    async _untilReady() {
      return Promise.all(this._getVisibleImages().map((image) => imageLoaded(image)));
    }
    _preloadImages() {
      this._getVisibleImages().forEach((image) => {
        image.setAttribute("loading", "eager");
      });
    }
    _getVisibleImages() {
      return Array.from(this.querySelectorAll("img")).filter((image) => {
        return getComputedStyle(image.parentElement).display !== "none";
      });
    }
  };
  window.customElements.define("ap-slideshowitem", ApSlideshowItem);

  var ApBlockerMixinVerticalScroll = {
    _blockVerticalScroll(threshold = 18) {
      this.addEventListener("touchstart", (event) => {
        this.firstTouchClientX = event.touches[0].clientX;
      });
      this.addEventListener(
        "touchmove",
        (event) => {
          const touchClientX = event.touches[0].clientX - this.firstTouchClientX;
          if (Math.abs(touchClientX) > threshold) {
            event.preventDefault();
          }
        },
        {
          passive: false,
        }
      );
    },
  };

  var ApSlideshow = class extends CustomHTMLElement {
    connectedCallback() {
      this.listItems = Array.from(this.querySelectorAll("ap-slideshowitem"));
      this.pageDots = this.querySelector("ap-pagedots");
      this.transitioningStatus = false;
      if (this.listItems.length > 1) {
        if (Shopify.designMode) {
          this.addEventListener("shopify:block:deselect", this.startPlayer.bind(this));
          this.addEventListener("shopify:block:select", (event) => {
            this.pausePlayer();
            this.intersectionObserver.disconnect();
            if (!(!event.detail.load && event.target.selected)) {
              this.select(event.target.index, !event.detail.load);
            }
          });
        }
        this.addEventListener("swiperight", this.previous.bind(this));
        this.addEventListener("swipeleft", this.next.bind(this));
        this.addEventListener("ap-pagedots:changed", (event) => this.select(event.detail.index));
        this.addEventListener("ap-nextprev:prev", this.previous.bind(this));
        this.addEventListener("ap-nextprev:next", this.next.bind(this));
        this._blockVerticalScroll();
      }
      this._setupTextOverlayImageVisibility();
    }
    get selectedIndex() {
      return this.listItems.findIndex((item) => item.selected);
    }
    get transitionType() {
      if (MediaFeatures.prefersReducedMotion()) {
        return "fade";
      } else {
        return this.getAttribute("transition-type");
      }
    }
    async _setupTextOverlayImageVisibility() {
      await this.untilObjectVisible();
      await this.listItems[this.selectedIndex]
        .transitionToEnter(this.transitionType)
        .catch((error) => {});
      this.startPlayer();
    }
    previous() {
      this.select(
        (this.selectedIndex - 1 + this.listItems.length) % this.listItems.length,
        true,
        true
      );
    }
    next() {
      this.select(
        (this.selectedIndex + 1 + this.listItems.length) % this.listItems.length,
        true,
        false
      );
    }
    async select(index, shouldTransition = true, reverseDirection = false) {
      if (this.transitionType === "reveal" && this.transitioningStatus) {
        return;
      }
      this.transitioningStatus = true;
      const itemPrevious = this.listItems[this.selectedIndex],
        newItem = this.listItems[index];
      this.listItems[(newItem.index + 1) % this.listItems.length]._preloadImages();
      if (itemPrevious && itemPrevious !== newItem) {
        if (this.transitionType !== "reveal") {
          itemPrevious.transitionToLeave(this.transitionType, shouldTransition);
        } else {
          await itemPrevious.transitionToLeave(this.transitionType, shouldTransition);
        }
      }
      if (this.pageDots) {
        this.pageDots.selectedIndex = newItem.index;
      }
      await newItem
        .transitionToEnter(this.transitionType, shouldTransition, reverseDirection)
        .catch((error) => {});
      this.transitioningStatus = false;
    }
    pausePlayer() {
      this.style.setProperty("--section-animation-play-state", "paused");
    }
    startPlayer() {
      if (this.hasAttribute("auto-play")) {
        this.style.setProperty("--section-animation-play-state", "running");
      }
    }
  };
  Object.assign(ApSlideshow.prototype, ApBlockerMixinVerticalScroll);
  window.customElements.define("ap-slideshow", ApSlideshow);

  var ApProductsSlideshowItem = class extends HTMLElement {
    async connectedCallback() {
      this._pendingAnimations = [];
      this.addEventListener("ap-splitlines:re-split", (event) => {
        Array.from(event.target.children).forEach(
          (line) => (line.style.visibility = this.selected ? "visible" : "hidden")
        );
      });
      if (MediaFeatures.prefersReducedMotion()) {
        this.setAttribute("ap-revealvisibility", "");
        Array.from(this.querySelectorAll("[reveal], [ap-revealvisibility]")).forEach((item) => {
          item.removeAttribute("reveal");
          item.removeAttribute("ap-revealvisibility");
        });
      }
    }
    get index() {
      return [...this.parentNode.children].indexOf(this);
    }
    get selected() {
      return !this.hasAttribute("hidden");
    }
    async transitionToLeave(transitionType, useEffect = true) {
      if (transitionType !== "reveal") {
        this.setAttribute("hidden", "");
      }
      this._pendingAnimations.forEach((animation2) => animation2.cancel());
      this._pendingAnimations = [];
      let animation = null,
        textElements = await resolveAsyncIterator(
          this.querySelectorAll(
            "ap-splitlines, .button-group, .button-wrapper"
          )
        );
      let elementImages = Array.from(this.querySelectorAll(".slideshow__image-wrapper"));
      switch (transitionType) {
        case "sweep":
          animation = new ApAnimationCustom(
            new ApEffectSequence([
              new ApEffectOfCustomKeyframe(
                this,
                {
                  visibility: ["visible", "hidden"],
                },
                {
                  duration: 500,
                }
              ),    
              new ApEffectParallel(
                textElements.map((item) => {
                  return new ApEffectOfCustomKeyframe(item, {
                    opacity: [1, 0],
                    visibility: ["visible", "hidden"],
                  });
                })
              ),
            ])
          );
          break;
        case "fade":
          animation = new ApAnimationCustom(
            new ApEffectOfCustomKeyframe(
              this,
              {
                opacity: [1, 0],
                visibility: ["visible", "hidden"],
              },
              {
                duration: 250,
                easing: "ease-in-out",
              }
            )
          );
          break;
        case "reveal":
          animation = new ApAnimationCustom(
            new ApEffectSequence([
              new ApEffectParallel(
                textElements.reverse().map((item) => {
                  return new ApEffectOfCustomKeyframe(
                    item,
                    {
                      opacity: [1, 0],
                      visibility: ["visible", "hidden"],
                    },
                    {
                      duration: 250,
                      easing: "ease-in-out",
                    }
                  );
                })
              ),
              new ApEffectParallel(
                elementImages.map((item) => {
                  if (!item.classList.contains("slideshow__image-wrapper--secondary")) {
                    return new ApEffectOfCustomKeyframe(
                      item,
                      {
                        visibility: ["visible", "hidden"],
                        clipPath: ["inset(0 0 0 0)", "inset(0 0 100% 0)"],
                      },
                      {
                        duration: 450,
                        easing: "cubic-bezier(0.99, 0.01, 0.50, 0.94)",
                      }
                    );
                  } else {
                    return new ApEffectOfCustomKeyframe(
                      item,
                      {
                        visibility: ["visible", "hidden"],
                        clipPath: ["inset(0 0 0 0)", "inset(100% 0 0 0)"],
                      },
                      {
                        duration: 450,
                        easing: "cubic-bezier(0.99, 0.01, 0.50, 0.94)",
                      }
                    );
                  }
                })
              ),
            ])
          );
          break;
      }
      await this._executeAnimation(animation, useEffect);
      if (transitionType === "reveal") {
        this.setAttribute("hidden", "");
      }
    }
    async transitionToEnter(transitionType, useEffect = true, reverseDirection = false) {
      this.removeAttribute("hidden");
      await this._untilReady();
      let animation = null,
        textElements = await resolveAsyncIterator(
          this.querySelectorAll(
            "ap-splitlines, .button-group, .button-wrapper"
          )
        ),
        elementImages = Array.from(this.querySelectorAll(".slideshow__image-wrapper"));
      switch (transitionType) {
        case "sweep":
          animation = new ApAnimationCustom(
            new ApEffectSequence([
              new ApEffectOfCustomKeyframe(
                this,
                {
                  visibility: ["hidden", "visible"],
                  clipPath: reverseDirection
                    ? ["inset(0 100% 0 0)", "inset(0 0 0 0)"]
                    : ["inset(0 0 0 100%)", "inset(0 0 0 0)"],
                },
                {
                  duration: 500,
                  easing: "cubic-bezier(1, 0, 0, 1)",
                }
              ),
              new ApEffectParallel(
                textElements.map((item, index) => {
                  return new ApEffectOfCustomKeyframe(
                    item,
                    {
                      opacity: [0, 1],
                      visibility: ["hidden", "visible"],
                      clipPath: ["inset(0 0 100% 0)", "inset(0 0 0 0)"],
                      transform: ["translateY(100%)", "translateY(0)"],
                    },
                    {
                      duration: 450,
                      delay: 100 * index,
                      easing: "cubic-bezier(0.5, 0.06, 0.01, 0.99)",
                    }
                  );
                })
              ),
            ])
          );
          break;
        case "fade":
          animation = new ApAnimationCustom(
            new ApEffectOfCustomKeyframe(
              this,
              {
                opacity: [0, 1],
                visibility: ["hidden", "visible"],
              },
              {
                duration: 250,
                easing: "ease-in-out",
              }
            )
          );
          break;
        case "reveal":
          animation = new ApAnimationCustom(
            new ApEffectSequence([
              new ApEffectParallel(
                elementImages.map((item) => {
                  if (!item.classList.contains("slideshow__image-wrapper--secondary")) {
                    return new ApEffectOfCustomKeyframe(
                      item,
                      {
                        visibility: ["hidden", "visible"],
                        clipPath: ["inset(0 0 100% 0)", "inset(0 0 0 0)"],
                      },
                      {
                        duration: 450,
                        delay: 100,
                        easing: "cubic-bezier(0.5, 0.06, 0.01, 0.99)",
                      }
                    );
                  } else {
                    return new ApEffectOfCustomKeyframe(
                      item,
                      {
                        visibility: ["hidden", "visible"],
                        clipPath: ["inset(100% 0 0 0)", "inset(0 0 0 0)"],
                      },
                      {
                        duration: 450,
                        delay: 100,
                        easing: "cubic-bezier(0.5, 0.06, 0.01, 0.99)",
                      }
                    );
                  }
                })
              ),
              new ApEffectParallel(
                textElements.map((item, index) => {
                  return new ApEffectOfCustomKeyframe(
                    item,
                    {
                      opacity: [0, 1],
                      visibility: ["hidden", "visible"],
                      clipPath: ["inset(0 0 100% 0)", "inset(0 0 0 0)"],
                      transform: ["translateY(100%)", "translateY(0)"],
                    },
                    {
                      duration: 450,
                      delay: 100 * index,
                      easing: "cubic-bezier(0.5, 0.06, 0.01, 0.99)",
                    }
                  );
                })
              ),
            ])
          );
          break;
      }
      return this._executeAnimation(animation, useEffect);
    }
    async _executeAnimation(animation, useEffect) {
      this._pendingAnimations.push(animation);
      useEffect ? animation.play() : animation.finish();
      return animation.finished;
    }
    async _untilReady() {
      return Promise.all(this._getVisibleImages().map((image) => imageLoaded(image)));
    }
    _preloadImages() {
      this._getVisibleImages().forEach((image) => {
        image.setAttribute("loading", "eager");
      });
    }
    _getVisibleImages() {
      return Array.from(this.querySelectorAll("img")).filter((image) => {
        return getComputedStyle(image.parentElement).display !== "none";
      });
    }
  };
  window.customElements.define("ap-productsslideshowitem", ApProductsSlideshowItem);

  var ApProductsSlideshow = class extends CustomHTMLElement {
    connectedCallback() {
      this.listItems = Array.from(this.querySelectorAll("ap-productsslideshowitem"));
      this.pageDots = this.querySelector("ap-pagedots");
      this.transitioningStatus = false;
      if (this.listItems.length > 1) {
        this.addEventListener("swiperight", this.previous.bind(this));
        this.addEventListener("swipeleft", this.next.bind(this));
        this.addEventListener("ap-pagedots:changed", (event) => this.select(event.detail.index));
        this._blockVerticalScroll();
      }
      this._setupTextOverlayImageVisibility();
    }
    get selectedIndex() {
      if (this.listItems.findIndex((item) => item.selected) < 0) {
        return 0;
      }
      return this.listItems.findIndex((item) => item.selected);
    }
    get transitionType() {
      if (MediaFeatures.prefersReducedMotion()) {
        return "fade";
      } else {
        return this.getAttribute("transition-type");
      }
    }
    async _setupTextOverlayImageVisibility() {
      await this.untilObjectVisible();
      if (this.listItems.length) {
        await this.listItems[this.selectedIndex]
          .transitionToEnter(this.transitionType)
          .catch((error) => {});
        this.startPlayer();
      }
    }
    previous() {
      this.select(
        (this.selectedIndex - 1 + this.listItems.length) % this.listItems.length,
        true,
        true
      );
    }
    next() {
      this.select(
        (this.selectedIndex + 1 + this.listItems.length) % this.listItems.length,
        true,
        false
      );
    }
    async select(index, shouldTransition = true, reverseDirection = false) {
      if (this.transitionType === "reveal" && this.transitioningStatus) {
        return;
      }
      this.transitioningStatus = true;
      const itemPrevious = this.listItems[this.selectedIndex];
      const newItem = this.listItems[index];
      this.listItems[(newItem.index + 1) % this.listItems.length]._preloadImages();
      if (itemPrevious && itemPrevious !== newItem) {
        if (this.transitionType !== "reveal") {
          itemPrevious.transitionToLeave(this.transitionType, shouldTransition);
        } else {
          await itemPrevious.transitionToLeave(this.transitionType, shouldTransition);
        }
      }
      if (this.pageDots) {
        this.pageDots.selectedIndex = newItem.index;
      }
      await newItem
        .transitionToEnter(this.transitionType, shouldTransition, reverseDirection)
        .catch((error) => {});
      this.transitioningStatus = false;
    }
    pausePlayer() {
      this.style.setProperty("--section-animation-play-state", "paused");
    }
    startPlayer() {
      if (this.hasAttribute("auto-play")) {
        this.style.setProperty("--section-animation-play-state", "running");
      }
    }
  };
  Object.assign(ApProductsSlideshow.prototype, ApBlockerMixinVerticalScroll);
  window.customElements.define("ap-productsslideshow", ApProductsSlideshow);

  var ApApImageWithTextItem = class extends HTMLElement {
    get index() {
      return [...this.parentNode.children].indexOf(this);
    }
    get selected() {
      return !this.hasAttribute("hidden");
    }
    get hasAttachedImage() {
      return this.hasAttribute("attached-image");
    }
    async transitionToEnter(useEffect = true) {
      this.removeAttribute("hidden");
      const textWrapper = this.querySelector(".ap-imagewithtext__text-wrapper"),
        headings = await resolveAsyncIterator(
          this.querySelectorAll(".ap-imagewithtext__content ap-splitlines")
        );
      const animation = new ApAnimationCustom(
        new ApEffectSequence([
          new ApEffectParallel(
            headings.map((item, index) => {
              return new ApEffectOfCustomKeyframe(
                item,
                {
                  opacity: [0, 0.2, 1],
                  transform: ["translateY(100%)", "translateY(0)"],
                  clipPath: ["inset(0 0 100% 0)", "inset(0 0 0 0)"],
                },
                {
                  duration: 350,
                  delay: 120 * index,
                  easing: "cubic-bezier(0.5, 0.06, 0.01, 0.99)",
                }
              );
            })
          ),
          new ApEffectOfCustomKeyframe(
            textWrapper,
            {
              opacity: [0, 1],
            },
            {
              duration: 300,
            }
          ),
        ])
      );
      useEffect ? animation.play() : animation.finish();
      return animation.finished;
    }
    async transitionToLeave(useEffect = true) {
      const elements = await resolveAsyncIterator(
        this.querySelectorAll(
          ".ap-imagewithtext__text-wrapper, .ap-imagewithtext__content ap-splitlines"
        )
      );
      const animation = new ApAnimationCustom(
        new ApEffectParallel(
          elements.map((item) => {
            return new ApEffectOfCustomKeyframe(
              item,
              {
                opacity: [1, 0],
              },
              {
                duration: 200,
              }
            );
          })
        )
      );
      useEffect ? animation.play() : animation.finish();
      await animation.finished;
      this.setAttribute("hidden", "");
    }
  };
  window.customElements.define("ap-imagewithtext-item", ApApImageWithTextItem);

  var ApImageWithText = class extends CustomHTMLElement {
    connectedCallback() {
      this.items = Array.from(this.querySelectorAll("ap-imagewithtext-item"));
      this.imageItems = Array.from(this.querySelectorAll(".ap-imagewithtext__image"));
      this.pageDots = this.querySelector("ap-pagedots");
      this.pendingTransitionStatus = false;
      if (this.items.length > 1) {
        this.addEventListener("ap-pagedots:changed", (event) => this.select(event.detail.index));
        if (Shopify.designMode) {
          this.addEventListener("shopify:block:deselect", this.startPlayer.bind(this));
          this.addEventListener("shopify:block:select", (event) => {
            this.intersectionObserver.disconnect();
            this.pausePlayer();
            this.select(event.target.index, !event.detail.load);
          });
        }
      }
      this._setupTextOverlayImageVisibility();
    }
    async _setupTextOverlayImageVisibility() {
      await this.untilObjectVisible();
      if (this.hasAttribute("reveal-on-scroll")) {
        await this.transitionImage(this.selectedIndex);
        this.select(this.selectedIndex);
      }
      this.startPlayer();
    }
    get selectedIndex() {
      return this.items.findIndex((item) => item.selected);
    }
    async select(index, useEffect = true) {
      if (this.pendingTransitionStatus) {
        return;
      }
      this.pendingTransitionStatus = true;
      if (this.items[index].hasAttachedImage || !useEffect) {
        await this.transitionImage(index, useEffect);
      }
      if (this.selectedIndex !== index) {
        await this.items[this.selectedIndex].transitionToLeave(useEffect);
      }
      if (this.pageDots) {
        this.pageDots.selectedIndex = index;
      }
      await this.items[index].transitionToEnter(useEffect);
      this.pendingTransitionStatus = false;
    }
    async transitionImage(index, useEffect = true) {
      const activeImage = this.imageItems.find((item) => !item.hasAttribute("hidden")),
        nextImage =
          this.imageItems.find(
            (item) => item.id === this.items[index].getAttribute("attached-image")
          ) || activeImage;
      activeImage.setAttribute("hidden", "");
      nextImage.removeAttribute("hidden");
      await imageLoaded(nextImage);
      const animation = new ApAnimationCustom(
        new ApEffectOfCustomKeyframe(
          nextImage,
          {
            visibility: ["hidden", "visible"],
            clipPath: ["inset(0 0 0 100%)", "inset(0 0 0 0)"],
          },
          {
            duration: 600,
            easing: "cubic-bezier(1, 0, 0, 1)",
          }
        )
      );
      useEffect ? animation.play() : animation.finish();
    }
    pausePlayer() {
      this.style.setProperty("--section-animation-play-state", "paused");
    }
    startPlayer() {
      this.style.setProperty("--section-animation-play-state", "running");
    }
  };
  window.customElements.define("ap-imagewithtext", ApImageWithText);

  var ApTestimonialItem = class extends CustomHTMLElement {
    connectedCallback() {
      this.addEventListener("ap-splitlines:re-split", (event) => {
        Array.from(event.target.children).forEach(
          (line) => (line.style.visibility = this.selected ? "visible" : "hidden")
        );
      });
    }
    get index() {
      return [...this.parentNode.children].indexOf(this);
    }
    get selected() {
      return !this.hasAttribute("hidden");
    }
    async transitionToLeave(useEffect = true) {
      const textLines = await resolveAsyncIterator(
          this.querySelectorAll(
            "ap-splitlines, .testimonial__author, .testimonial__icon , .testimonial__info"
          )
        ),
        animation = new ApAnimationCustom(
          new ApEffectParallel(
            textLines.reverse().map((item, index) => {
              return new ApEffectOfCustomKeyframe(
                item,
                {
                  visibility: ["visible", "hidden"],
                  clipPath: ["inset(0 0 0 0)", "inset(0 0 100% 0)"],
                  transform: ["translateY(0)", "translateY(100%)"],
                },
                {
                  duration: 350,
                  delay: 60 * index,
                  easing: "cubic-bezier(0.68, 0.00, 0.77, 0.00)",
                }
              );
            })
          )
        );
      useEffect ? animation.play() : animation.finish();
      await animation.finished;
      this.setAttribute("hidden", "");
    }
    async transitionToEnter(useEffect = true) {
      const textLines = await resolveAsyncIterator(
          this.querySelectorAll(
            "ap-splitlines, .testimonial__author, .testimonial__icon , .testimonial__info "
          )
        ),
        animation = new ApAnimationCustom(
          new ApEffectParallel(
            textLines.map((item, index) => {
              return new ApEffectOfCustomKeyframe(
                item,
                {
                  visibility: ["hidden", "visible"],
                  clipPath: ["inset(0 0 100% 0)", "inset(0 0 0px 0)"],
                  transform: ["translateY(100%)", "translateY(0)"],
                },
                {
                  duration: 550,
                  delay: 120 * index,
                  easing: "cubic-bezier(0.23, 1, 0.32, 1)",
                }
              );
            })
          )
        );
      this.removeAttribute("hidden");
      useEffect ? animation.play() : animation.finish();
      return animation.finished;
    }
  };
  window.customElements.define("ap-testimonialitem", ApTestimonialItem);

  var ApListTestimonial = class extends CustomHTMLElement {
    connectedCallback() {
      this.listItems = Array.from(this.querySelectorAll("ap-testimonialitem"));
      this.pageDots = this.querySelector("ap-pagedots");
      this.pendingTransitionStatus = false;
      if (this.listItems.length > 1) {
        this.addEventListener("swiperight", this.previous.bind(this));
        this.addEventListener("swipeleft", this.next.bind(this));
        this.addEventListener("ap-nextprev:prev", this.previous.bind(this));
        this.addEventListener("ap-nextprev:next", this.next.bind(this));
        this.addEventListener("ap-pagedots:changed", (event) => this.select(event.detail.index));
        if (Shopify.designMode) {
          this.addEventListener("shopify:block:select", (event) => {
            var _a;
            (_a = this.intersectionObserver) == null ? void 0 : _a.disconnect();
            if (event.detail.load || !event.target.selected) {
              this.select(event.target.index, !event.detail.load);
            }
          });
        }
        this._blockVerticalScroll();
      }
      if (this.hasAttribute("reveal-on-scroll")) {
        this._setupTextOverlayImageVisibility();
      }
    }
    get selectedIndex() {
      return this.listItems.findIndex((item) => item.selected);
    }
    async _setupTextOverlayImageVisibility() {
      await this.untilObjectVisible();
      this.listItems[this.selectedIndex].transitionToEnter();
    }
    previous() {
      this.select((this.selectedIndex - 1 + this.listItems.length) % this.listItems.length);
    }
    next() {
      this.select((this.selectedIndex + 1 + this.listItems.length) % this.listItems.length);
    }
    async select(index, useEffect = true) {
      if (this.pendingTransitionStatus) {
        return;
      }
      this.pendingTransitionStatus = true;
      await this.listItems[this.selectedIndex].transitionToLeave(useEffect);
      if (this.pageDots) {
        this.pageDots.selectedIndex = index;
      }
      await this.listItems[index].transitionToEnter(useEffect);
      this.pendingTransitionStatus = false;
    }
  };
  Object.assign(ApListTestimonial.prototype, ApBlockerMixinVerticalScroll);
  window.customElements.define("ap-listtestimonial", ApListTestimonial);

  var BannerCarousel = class extends CustomHTMLElement {
    constructor() {
      super();
      this.bannerListInner = this.querySelector(".ap-productlist__inner");
      this.bannerItems = Array.from(this.querySelectorAll("banner-carousel-item"));
    }
    connectedCallback() {
      this.addEventListener("ap-nextprev:prev", this.previous.bind(this));
      this.addEventListener("ap-nextprev:next", this.next.bind(this));
      if (!this.hidden && this.staggerApparition) {
        this._staggerProductsApparition();
      }
    }
    get staggerApparition() {
      return this.hasAttribute("stagger-apparition");
    }
    get apparitionAnimation() {
      return (this._customanimation =
        this._customanimation ||
        new ApAnimationCustom(
          new ApEffectParallel(
            this.bannerItems.map((item, index) => {
              return new ApEffectOfCustomKeyframe(
                item,
                {
                  opacity: [0, 1],
                  transform: [
                    `translateY(${
                      MediaFeatures.prefersReducedMotion() ? 0 : window.innerWidth < 1e3 ? 35 : 60
                    }px)`,
                    "translateY(0)",
                  ],
                },
                {
                  duration: 600,
                  delay: MediaFeatures.prefersReducedMotion()
                    ? 0
                    : 100 * index - Math.min(3 * index * index, 100 * index),
                  easing: "ease",
                }
              );
            })
          )
        ));
    }
    previous(event) {
      const directionFlip = window.themeVariables.settings.direction === "ltr" ? 1 : -1,
        columnGap = parseInt(
          getComputedStyle(this).getPropertyValue("--ap-productlist-column-gap")
        );
      event.target.nextElementSibling.removeAttribute("disabled");
      event.target.toggleAttribute(
        "disabled",
        this.bannerListInner.scrollLeft * directionFlip -
          (this.bannerListInner.clientWidth + columnGap) <=
          0
      );
      this.bannerListInner.scrollBy({
        left: -(this.bannerListInner.clientWidth + columnGap) * directionFlip,
        behavior: "smooth",
      });
    }
    next(event) {
      const directionFlip = window.themeVariables.settings.direction === "ltr" ? 1 : -1,
        columnGap = parseInt(
          getComputedStyle(this).getPropertyValue("--ap-productlist-column-gap")
        );
      event.target.previousElementSibling.removeAttribute("disabled");
      event.target.toggleAttribute(
        "disabled",
        this.bannerListInner.scrollLeft * directionFlip +
          (this.bannerListInner.clientWidth + columnGap) * 2 >=
          this.bannerListInner.scrollWidth
      );
      this.bannerListInner.scrollBy({
        left: (this.bannerListInner.clientWidth + columnGap) * directionFlip,
        behavior: "smooth",
      });
    }
    attributeChangedCallback(name) {
      var _a, _b;
      if (!this.staggerApparition) {
        return;
      }
      switch (name) {
        case "hidden":
          if (!this.hidden) {
            this.bannerListInner.scrollLeft = 0;
            this.bannerListInner.parentElement.scrollLeft = 0;
            (_a = this.querySelector(".ap-nextap-buttonprev--prev")) == null
              ? void 0
              : _a.setAttribute("disabled", "");
            (_b = this.querySelector(".ap-nextap-buttonprev--next")) == null
              ? void 0
              : _b.removeAttribute("disabled");
            this._staggerProductsApparition();
          } else {
            this.apparitionAnimation.finish();
          }
      }
    }
    async _staggerProductsApparition() {
      this.bannerItems.forEach((item) => (item.style.opacity = 0));
      await this.untilObjectVisible({
        threshold: this.clientHeight > 0 ? 50 / this.clientHeight : 0,
      });
      this.apparitionAnimation.play();
    }
  };
  __publicField(BannerCarousel, "observedAttributes", ["hidden"]);
  window.customElements.define("banner-carousel", BannerCarousel);

  var ApTheLookbookShopItem = class extends HTMLElement {
    get index() {
      return [...this.parentNode.children].indexOf(this);
    }
    get selected() {
      return !this.hasAttribute("hidden");
    }
    async transitionToLeave(useEffect = true) {
      this.setAttribute("hidden", "");
      const animation = new ApAnimationCustom(
        new ApEffectOfCustomKeyframe(
          this,
          {
            visibility: ["visible", "hidden"],
          },
          {
            duration: 500,
          }
        )
      );
      useEffect ? animation.play() : animation.finish();
      return animation.finished;
    }
    async transitionToEnter(useEffect = true) {
      this.removeAttribute("hidden");
      const dots = Array.from(this.querySelectorAll(".ap-lookbookshop__dot"));
      dots.forEach((dot) => (dot.style.opacity = 0));
      const animation = new ApAnimationCustom(
        new ApEffectSequence([
          new ApEffectParallel(
            Array.from(this.querySelectorAll(".ap-lookbookshop__image")).map((item) => {
              return new ApEffectOfCustomKeyframe(
                item,
                {
                  opacity: [1, 1],
                },
                {
                  duration: 0,
                }
              );
            })
          ),
          new ApEffectOfCustomKeyframe(
            this,
            {
              visibility: ["hidden", "visible"],
              zIndex: [0, 1],
              clipPath: ["inset(0 0 0 100%)", "inset(0 0 0 0)"],
            },
            {
              duration: 500,
              easing: "cubic-bezier(1, 0, 0, 1)",
            }
          ),
          new ApEffectParallel(
            dots.map((item, index) => {
              return new ApEffectOfCustomKeyframe(
                item,
                {
                  opacity: [0, 1],
                  transform: ["scale(0)", "scale(1)"],
                },
                {
                  duration: 120,
                  delay: 75 * index,
                  easing: "ease-in-out",
                }
              );
            })
          ),
        ])
      );
      useEffect ? animation.play() : animation.finish();
      await animation.finished;
      if (window.matchMedia(window.themeVariables.breakpoints.tabletAndUp).matches) {
        const firstPopover = this.querySelector(
          ".ap-lookbookshop__product-wrapper .ap-lookbookshop__dot"
        );
        firstPopover == null ? void 0 : firstPopover.setAttribute("ap-expanded-aria", "true");
      }
    }
  };
  window.customElements.define("ap-lookbookshop-item", ApTheLookbookShopItem);

  var ApTheLookbookShopNav = class extends CustomHTMLElement {
    connectedCallback() {
      this.shopTheLook = this.closest("ap-lookbookshop");
      this.apollo.on("click", '[data-action="prev"]', () => this.shopTheLook.previous());
      this.apollo.on("click", '[data-action="next"]', () => this.shopTheLook.next());
    }
    transitionToIndex(index, useEffect = true) {
      const indexElements = Array.from(
          this.querySelectorAll(".ap-lookbookshop__counter-page-transition")
        ),
        currentObjectElement = indexElements.find((item) => !item.hasAttribute("hidden")),
        nextElement = indexElements[index];
      currentObjectElement.animate(
        {
          transform: ["translateY(0)", "translateY(-100%)"],
        },
        {
          duration: useEffect ? 1e3 : 0,
          easing: "cubic-bezier(1, 0, 0, 1)",
        }
      ).onfinish = () => currentObjectElement.setAttribute("hidden", "");
      nextElement.removeAttribute("hidden");
      nextElement.animate(
        {
          transform: ["translateY(100%)", "translateY(0)"],
        },
        {
          duration: useEffect ? 1e3 : 0,
          easing: "cubic-bezier(1, 0, 0, 1)",
        }
      );
    }
  };
  window.customElements.define("ap-lookbookshopnav", ApTheLookbookShopNav);

  var TheLookbookShop = class extends CustomHTMLElement {
    connectedCallback() {
      this.lookItems = Array.from(this.querySelectorAll("ap-lookbookshop-item"));
      this.nav = this.querySelector("ap-lookbookshopnav");
      this.pendingTransitionStatus = false;
      if (this.hasAttribute("reveal-on-scroll")) {
        this._setupTextOverlayImageVisibility();
      }
      if (this.lookItems.length > 1 && Shopify.designMode) {
        this.addEventListener("shopify:block:select", async (event) => {
          this.intersectionObserver.disconnect();
          await this.select(event.target.index, !event.detail.load);
          this.nav.animate(
            {
              opacity: [0, 1],
              transform: ["translateY(30px)", "translateY(0)"],
            },
            {
              duration: 0,
              fill: "forwards",
              easing: "ease-in-out",
            }
          );
        });
      }
    }
    get selectedIndex() {
      return this.lookItems.findIndex((item) => item.selected);
    }
    async _setupTextOverlayImageVisibility() {
      await this.untilObjectVisible();
      const images = Array.from(
        this.lookItems[this.selectedIndex].querySelectorAll(".ap-lookbookshop__image")
      );
      for (let image of images) {
        if (image.offsetParent !== null) {
          await imageLoaded(image);
        }
      }
      await this.lookItems[this.selectedIndex].transitionToEnter();
      if (this.nav) {
        this.nav.animate(
          {
            opacity: [0, 1],
            transform: ["translateY(30px)", "translateY(0)"],
          },
          {
            duration: 150,
            fill: "forwards",
            easing: "ease-in-out",
          }
        );
      }
    }
    previous() {
      this.select((this.selectedIndex - 1 + this.lookItems.length) % this.lookItems.length);
    }
    next() {
      this.select((this.selectedIndex + 1 + this.lookItems.length) % this.lookItems.length);
    }
    async select(index, animate = true) {
      const currentLook = this.lookItems[this.selectedIndex],
        nextLook = this.lookItems[index];
      if (this.pendingTransitionStatus) {
        return;
      }
      this.pendingTransitionStatus = true;
      if (currentLook !== nextLook) {
        this.nav.transitionToIndex(index, animate);
        currentLook.transitionToLeave();
      }
      nextLook.transitionToEnter(animate);
      this.pendingTransitionStatus = false;
    }
  };
  window.customElements.define("ap-lookbookshop", TheLookbookShop);

  var ApCollectionList = class extends CustomHTMLElement {
    async connectedCallback() {
      this.items = Array.from(this.querySelectorAll(".list-collections__item"));
      if (this.hasAttribute("scrollable")) {
        this.scroller = this.querySelector(".list-collections__scroller");
        this.addEventListener("ap-nextprev:prev", this.previous.bind(this));
        this.addEventListener("ap-nextprev:next", this.next.bind(this));
        this.addEventListener("shopify:block:select", (event) =>
          event.target.scrollIntoView({
            block: "nearest",
            inline: "center",
            behavior: event.detail.load ? "auto" : "smooth",
          })
        );
      }
      if (this.hasAttribute("reveal-on-scroll")) {
        this._setupTextOverlayImageVisibility();
      }
    }
    async _setupTextOverlayImageVisibility() {
      await this.untilObjectVisible();
      const prefersReducedMotion = MediaFeatures.prefersReducedMotion();
      const animation = new ApAnimationCustom(
        new ApEffectParallel(
          this.items.map((item, index) => {
            return new ApEffectSequence([
              new ApEffectOfCustomKeyframe(
                item.querySelector(".list-collections__item-image"),
                {
                  opacity: [0, 1],
                  transform: [`scale(${prefersReducedMotion ? 1 : 1.1})`, "scale(1)"],
                },
                {
                  duration: 250,
                  delay: prefersReducedMotion ? 0 : 150 * index,
                  easing: "cubic-bezier(0.65, 0, 0.35, 1)",
                }
              ),
              new ApEffectParallel(
                Array.from(item.querySelectorAll(".list-collections__item-info [reveal]")).map(
                  (textItem, subIndex) => {
                    return new ApEffectOfCustomKeyframe(
                      textItem,
                      {
                        opacity: [0, 1],
                        clipPath: [
                          `inset(${prefersReducedMotion ? "0 0 0 0" : "0 0 100% 0"})`,
                          "inset(0 0 0 0)",
                        ],
                        transform: [
                          `translateY(${prefersReducedMotion ? 0 : "100%"})`,
                          "translateY(0)",
                        ],
                      },
                      {
                        duration: 200,
                        delay: prefersReducedMotion ? 0 : 150 * index + 150 * subIndex,
                        easing: "cubic-bezier(0.5, 0.06, 0.01, 0.99)",
                      }
                    );
                  }
                )
              ),
            ]);
          })
        )
      );
      this._sectionReloadedStatus ? animation.finish() : animation.play();
    }
    previous() {
      const directionFlip = window.themeVariables.settings.direction === "ltr" ? 1 : -1;
      this.scroller.scrollBy({
        left: -this.items[0].clientWidth * directionFlip,
        behavior: "smooth",
      });
    }
    next() {
      const directionFlip = window.themeVariables.settings.direction === "ltr" ? 1 : -1;
      this.scroller.scrollBy({
        left: this.items[0].clientWidth * directionFlip,
        behavior: "smooth",
      });
    }
  };
  window.customElements.define("ap-collectionlist", ApCollectionList);

  var ApBannerGrid = class extends CustomHTMLElement {
    async connectedCallback() {
      this.items = Array.from(this.querySelectorAll(".banner-content"));
      if (this.hasAttribute("scrollable")) {
        this.scroller = this.querySelector(".list-collections__scroller");
        this.addEventListener("ap-nextprev:prev", this.previous.bind(this));
        this.addEventListener("ap-nextprev:next", this.next.bind(this));
        this.addEventListener("shopify:block:select", (event) =>
          event.target.scrollIntoView({
            block: "nearest",
            inline: "center",
            behavior: event.detail.load ? "auto" : "smooth",
          })
        );
      }
      if (this.hasAttribute("reveal-on-scroll")) {
        this._setupTextOverlayImageVisibility();
      }
    }
    async _setupTextOverlayImageVisibility() {
      await this.untilObjectVisible();
      const prefersReducedMotion = MediaFeatures.prefersReducedMotion();
      const animation = new ApAnimationCustom(
        new ApEffectParallel(
          this.items.map((item, index) => {
            return new ApEffectSequence([
              new ApEffectOfCustomKeyframe(
                item.querySelector(".banner-list-image"),
                {
                  opacity: [0, 1],
                  transform: [`scale(${prefersReducedMotion ? 1 : 1.1})`, "scale(1)"],
                },
                {
                  duration: 250,
                  delay: prefersReducedMotion ? 0 : 150 * index,
                  easing: "cubic-bezier(0.65, 0, 0.35, 1)",
                }
              ),
              new ApEffectOfCustomKeyframe(
                item.querySelector(".image-child"),
                {
                  opacity: [0, 1],
                  transform: [`scale(${prefersReducedMotion ? 1 : 1.1})`, "scale(1)"],
                },
                {
                  duration: 250,
                  delay: prefersReducedMotion ? 0 : 150 * index,
                  easing: "cubic-bezier(0.65, 0, 0.35, 1)",
                }
              ),
              new ApEffectOfCustomKeyframe(
                item.querySelector(".image-banner-video"),
                {
                  opacity: [0, 1],
                  transform: [`scale(${prefersReducedMotion ? 1 : 1.1})`, "scale(1)"],
                },
                {
                  duration: 250,
                  delay: prefersReducedMotion ? 0 : 150 * index,
                  easing: "cubic-bezier(0.65, 0, 0.35, 1)",
                }
              ),
              new ApEffectOfCustomKeyframe(
                item.querySelector(".image-child-2"),
                {
                  opacity: [0, 1],
                  transform: [`scale(${prefersReducedMotion ? 1 : 1.1})`, "scale(1)"],
                },
                {
                  duration: 250,
                  delay: prefersReducedMotion ? 0 : 150 * index,
                  easing: "cubic-bezier(0.65, 0, 0.35, 1)",
                }
              ),
              new ApEffectParallel(
                Array.from(item.querySelectorAll(".banner-text [reveal]")).map(
                  (textItem, subIndex) => {
                    return new ApEffectOfCustomKeyframe(
                      textItem,
                      {
                        opacity: [0, 1],
                        clipPath: [
                          `inset(${prefersReducedMotion ? "0 0 0 0" : "0 0 100% 0"})`,
                          "inset(0 0 0 0)",
                        ],
                        transform: [
                          `translateY(${prefersReducedMotion ? 0 : "100%"})`,
                          "translateY(0)",
                        ],
                      },
                      {
                        duration: 200,
                        delay: prefersReducedMotion ? 0 : 150 * index + 150 * subIndex,
                        easing: "cubic-bezier(0.5, 0.06, 0.01, 0.99)",
                      }
                    );
                  }
                )
              ),
            ]);
          })
        )
      );
      this._sectionReloadedStatus ? animation.finish() : animation.play();
    }
    previous() {
      const directionFlip = window.themeVariables.settings.direction === "ltr" ? 1 : -1;
      this.scroller.scrollBy({
        left: -this.items[0].clientWidth * directionFlip,
        behavior: "smooth",
      });
    }
    next() {
      const directionFlip = window.themeVariables.settings.direction === "ltr" ? 1 : -1;
      this.scroller.scrollBy({
        left: this.items[0].clientWidth * directionFlip,
        behavior: "smooth",
      });
    }
  };
  window.customElements.define("banner-content", ApBannerGrid);

  var ApService = class extends CustomHTMLElement {
    async connectedCallback() {
      this.items = Array.from(this.querySelectorAll(".service-item"));
      if (this.hasAttribute("reveal-on-scroll")) {
        this._setupTextOverlayImageVisibility();
      }
    }
    async _setupTextOverlayImageVisibility() {
      await this.untilObjectVisible();
      const prefersReducedMotion = MediaFeatures.prefersReducedMotion();
      const animation = new ApAnimationCustom(
        new ApEffectParallel(
          this.items.map((item, index) => {
            return new ApEffectSequence([
              new ApEffectOfCustomKeyframe(
                item.querySelector(".service-list-image"),
                {
                  opacity: [0, 1],
                  transform: [`scale(${prefersReducedMotion ? 1 : 1.1})`, "scale(1)"],
                },
                {
                  duration: 250,
                  delay: prefersReducedMotion ? 0 : 150 * index,
                  easing: "cubic-bezier(0.65, 0, 0.35, 1)",
                }
              ),
              new ApEffectParallel(
                Array.from(item.querySelectorAll(".service-list-content [reveal]")).map(
                  (textItem, subIndex) => {
                    return new ApEffectOfCustomKeyframe(
                      textItem,
                      {
                        opacity: [0, 1],
                        clipPath: [
                          `inset(${prefersReducedMotion ? "0 0 0 0" : "0 0 100% 0"})`,
                          "inset(0 0 0 0)",
                        ],
                        transform: [
                          `translateY(${prefersReducedMotion ? 0 : "100%"})`,
                          "translateY(0)",
                        ],
                      },
                      {
                        duration: 200,
                        delay: prefersReducedMotion ? 0 : 150 * index + 150 * subIndex,
                        easing: "cubic-bezier(0.5, 0.06, 0.01, 0.99)",
                      }
                    );
                  }
                )
              ),
              new ApEffectParallel(
                Array.from(item.querySelectorAll(".icon-item [reveal]")).map(
                  (textItem, subIndex) => {
                    return new ApEffectOfCustomKeyframe(
                      textItem,
                      {
                        opacity: [0, 1],
                        clipPath: [
                          `inset(${prefersReducedMotion ? "0 0 0 0" : "0 0 100% 0"})`,
                          "inset(0 0 0 0)",
                        ],
                        transform: [
                          `translateY(${prefersReducedMotion ? 0 : "100%"})`,
                          "translateY(0)",
                        ],
                      },
                      {
                        duration: 200,
                        delay: prefersReducedMotion ? 0 : 150 * index + 150 * subIndex,
                        easing: "cubic-bezier(0.5, 0.06, 0.01, 0.99)",
                      }
                    );
                  }
                )
              ),
            ]);
          })
        )
      );
      this._sectionReloadedStatus ? animation.finish() : animation.play();
    }
  };
  window.customElements.define("service-item", ApService);

  var ApNewsletter = class extends CustomHTMLElement {
    async connectedCallback() {
      this.items = Array.from(this.querySelectorAll(".ap-newsletter"));
      if (this.hasAttribute("reveal-on-scroll")) {
        this._setupTextOverlayImageVisibility();
      }
    }
    async _setupTextOverlayImageVisibility() {
      await this.untilObjectVisible();
      const prefersReducedMotion = MediaFeatures.prefersReducedMotion();
      const animation = new ApAnimationCustom(
        new ApEffectParallel(
          this.items.map((item, index) => {
            return new ApEffectSequence([
              new ApEffectOfCustomKeyframe(
                item.querySelector(".newsletter-list-image"),
                {
                  opacity: [0, 1],
                  transform: [`scale(${prefersReducedMotion ? 1 : 1.1})`, "scale(1)"],
                },
                {
                  duration: 250,
                  delay: prefersReducedMotion ? 0 : 150 * index,
                  easing: "cubic-bezier(0.65, 0, 0.35, 1)",
                }
              ),
              new ApEffectParallel(
                Array.from(item.querySelectorAll(".newsletter-content [reveal]")).map(
                  (textItem, subIndex) => {
                    return new ApEffectOfCustomKeyframe(
                      textItem,
                      {
                        opacity: [0, 1],
                        clipPath: [
                          `inset(${prefersReducedMotion ? "0 0 0 0" : "0 0 100% 0"})`,
                          "inset(0 0 0 0)",
                        ],
                        transform: [
                          `translateY(${prefersReducedMotion ? 0 : "100%"})`,
                          "translateY(0)",
                        ],
                      },
                      {
                        duration: 200,
                        delay: prefersReducedMotion ? 0 : 150 * index + 150 * subIndex,
                        easing: "cubic-bezier(0.5, 0.06, 0.01, 0.99)",
                      }
                    );
                  }
                )
              ),
            ]);
          })
        )
      );
      this._sectionReloadedStatus ? animation.finish() : animation.play();
    }
  };
  window.customElements.define("ap-newsletter", ApNewsletter);

  var ApAdvancedImage = class extends CustomHTMLElement {
    async connectedCallback() {
      this.items = Array.from(this.querySelectorAll(".adv-image"));
      if (this.hasAttribute("reveal-on-scroll")) {
        this._setupTextOverlayImageVisibility();
      }
    }
    async _setupTextOverlayImageVisibility() {
      await this.untilObjectVisible();
      const prefersReducedMotion = MediaFeatures.prefersReducedMotion();
      const animation = new ApAnimationCustom(
        new ApEffectParallel(
          this.items.map((item, index) => {
            return new ApEffectSequence([
              new ApEffectOfCustomKeyframe(
                item.querySelector(".adv-list-image"),
                {
                  opacity: [0, 1],
                  transform: [`scale(${prefersReducedMotion ? 1 : 1.1})`, "scale(1)"],
                },
                {
                  duration: 250,
                  delay: prefersReducedMotion ? 0 : 150 * index,
                  easing: "cubic-bezier(0.65, 0, 0.35, 1)",
                }
              ),
              new ApEffectParallel(
                Array.from(item.querySelectorAll(".adv-img-content [reveal]")).map(
                  (textItem, subIndex) => {
                    return new ApEffectOfCustomKeyframe(
                      textItem,
                      {
                        opacity: [0, 1],
                        clipPath: [
                          `inset(${prefersReducedMotion ? "0 0 0 0" : "0 0 100% 0"})`,
                          "inset(0 0 0 0)",
                        ],
                        transform: [
                          `translateY(${prefersReducedMotion ? 0 : "100%"})`,
                          "translateY(0)",
                        ],
                      },
                      {
                        duration: 200,
                        delay: prefersReducedMotion ? 0 : 150 * index + 150 * subIndex,
                        easing: "cubic-bezier(0.5, 0.06, 0.01, 0.99)",
                      }
                    );
                  }
                )
              ),
            ]);
          })
        )
      );
      this._sectionReloadedStatus ? animation.finish() : animation.play();
    }
  };
  window.customElements.define("adv-image", ApAdvancedImage);

  var ApProductList = class extends CustomHTMLElement {
    constructor() {
      super();
      this.productListInner = this.querySelector(".ap-productlist__inner");
      this.productItems = Array.from(this.querySelectorAll("product-item"));
    }
    connectedCallback() {
      this.addEventListener("ap-nextprev:prev", this.previous.bind(this));
      this.addEventListener("ap-nextprev:next", this.next.bind(this));
      if (!this.hidden && this.staggerApparition) {
        this._staggerProductsApparition();
      }
    }
    get staggerApparition() {
      return this.hasAttribute("stagger-apparition");
    }
    get apparitionAnimation() {
      return (this._customanimation =
        this._customanimation ||
        new ApAnimationCustom(
          new ApEffectParallel(
            this.productItems.map((item, index) => {
              return new ApEffectOfCustomKeyframe(
                item,
                {
                  opacity: [0, 1],
                  transform: [
                    `translateY(${
                      MediaFeatures.prefersReducedMotion() ? 0 : window.innerWidth < 1e3 ? 35 : 60
                    }px)`,
                    "translateY(0)",
                  ],
                },
                {
                  duration: 600,
                  delay: MediaFeatures.prefersReducedMotion()
                    ? 0
                    : 100 * index - Math.min(3 * index * index, 100 * index),
                  easing: "ease",
                }
              );
            })
          )
        ));
    }
    previous(event) {
      const directionFlip = window.themeVariables.settings.direction === "ltr" ? 1 : -1,
        columnGap = parseInt(
          getComputedStyle(this).getPropertyValue("--ap-productlist-column-gap")
        );
      event.target.nextElementSibling.removeAttribute("disabled");
      event.target.toggleAttribute(
        "disabled",
        this.productListInner.scrollLeft * directionFlip -
          (this.productListInner.clientWidth + columnGap) <=
          0
      );
      this.productListInner.scrollBy({
        left: -(this.productListInner.clientWidth + columnGap) * directionFlip,
        behavior: "smooth",
      });
    }
    next(event) {
      const directionFlip = window.themeVariables.settings.direction === "ltr" ? 1 : -1,
        columnGap = parseInt(
          getComputedStyle(this).getPropertyValue("--ap-productlist-column-gap")
        );
      event.target.previousElementSibling.removeAttribute("disabled");
      event.target.toggleAttribute(
        "disabled",
        this.productListInner.scrollLeft * directionFlip +
          (this.productListInner.clientWidth + columnGap) * 2 >=
          this.productListInner.scrollWidth
      );
      this.productListInner.scrollBy({
        left: (this.productListInner.clientWidth + columnGap) * directionFlip,
        behavior: "smooth",
      });
    }
    attributeChangedCallback(name) {
      var _a, _b;
      if (!this.staggerApparition) {
        return;
      }
      switch (name) {
        case "hidden":
          if (!this.hidden) {
            this.productListInner.scrollLeft = 0;
            this.productListInner.parentElement.scrollLeft = 0;
            (_a = this.querySelector(".ap-nextap-buttonprev--prev")) == null
              ? void 0
              : _a.setAttribute("disabled", "");
            (_b = this.querySelector(".ap-nextap-buttonprev--next")) == null
              ? void 0
              : _b.removeAttribute("disabled");
            this._staggerProductsApparition();
          } else {
            this.apparitionAnimation.finish();
          }
      }
    }
    async _staggerProductsApparition() {
      this.productItems.forEach((item) => (item.style.opacity = 0));
      await this.untilObjectVisible({
        threshold: this.clientHeight > 0 ? 50 / this.clientHeight : 0,
      });
      this.apparitionAnimation.play();
    }
  };
  __publicField(ApProductList, "observedAttributes", ["hidden"]);
  window.customElements.define("ap-productlist", ApProductList);

  // product-testimonial
  var ApProductCarouselItem = class extends CustomHTMLElement {
    connectedCallback() {
      this.addEventListener("ap-splitlines:re-split", (event) => {
        Array.from(event.target.children).forEach(
          (line) => (line.style.visibility = this.selected ? "visible" : "hidden")
        );
      });
    }
    get index() {
      return [...this.parentNode.children].indexOf(this);
    }
    get selected() {
      return !this.hasAttribute("hidden");
    }
    async transitionToLeave(useEffect = true) {
      const textLines = await resolveAsyncIterator(this.querySelectorAll(".product-carousel-box")),
        animation = new ApAnimationCustom(
          new ApEffectParallel(
            textLines.reverse().map((item, index) => {
              return new ApEffectOfCustomKeyframe(
                item,
                {
                  visibility: ["visible", "hidden"],
                  clipPath: ["inset(0 0 0 0)", "inset(0 0 0 100%)"],
                  transform: ["translateX(0)", "translateX(-100%)"],
                },
                {
                  duration: 350,
                  delay: 60 * index,
                  easing: "cubic-bezier(0.68, 0.00, 0.77, 0.00)",
                }
              );
            })
          )
        );
      useEffect ? animation.play() : animation.finish();
      await animation.finished;
      this.setAttribute("hidden", "");
    }
    async transitionToEnter(useEffect = true) {
      const textLines = await resolveAsyncIterator(this.querySelectorAll(".product-carousel-box")),
        animation = new ApAnimationCustom(
          new ApEffectParallel(
            textLines.map((item, index) => {
              return new ApEffectOfCustomKeyframe(
                item,
                {
                  visibility: ["hidden", "visible"],
                  clipPath: ["inset(0 100% 0 0)", "inset(0 0 0px 0)"],
                  transform: ["translateX(100%)", "translateX(0)"],
                },
                {
                  duration: 550,
                  delay: 120 * index,
                  easing: "cubic-bezier(0.23, 1, 0.32, 1)",
                }
              );
            })
          )
        );
      this.removeAttribute("hidden");
      useEffect ? animation.play() : animation.finish();
      return animation.finished;
    }
  };
  window.customElements.define("product-carousel", ApProductCarouselItem);

  var ApProductCarousel = class extends CustomHTMLElement {
    connectedCallback() {
      this.listItems = Array.from(this.querySelectorAll("product-carousel"));
      this.pageDots = this.querySelector("ap-pagedots");
      this.pendingTransitionStatus = false;
      if (this.listItems.length > 1) {
        this.addEventListener("swiperight", this.previous.bind(this));
        this.addEventListener("swipeleft", this.next.bind(this));
        this.addEventListener("ap-nextprev:prev", this.previous.bind(this));
        this.addEventListener("ap-nextprev:next", this.next.bind(this));
        this.addEventListener("ap-pagedots:changed", (event) => this.select(event.detail.index));
        if (Shopify.designMode) {
          this.addEventListener("shopify:block:select", (event) => {
            var _a;
            (a = this.intersectionObserver) == null ? void 0 : a.disconnect();
            if (event.detail.load || !event.target.selected) {
              this.select(event.target.index, !event.detail.load);
            }
          });
        }
        this._blockVerticalScroll();
      }
      if (this.hasAttribute("reveal-on-scroll")) {
        this._setupTextOverlayImageVisibility();
      }
    }
    get selectedIndex() {
      return this.listItems.findIndex((item) => item.selected);
    }
    async _setupTextOverlayImageVisibility() {
      await this.untilObjectVisible();
      this.listItems[this.selectedIndex].transitionToEnter();
    }
    previous() {
      this.select((this.selectedIndex - 1 + this.listItems.length) % this.listItems.length);
    }
    next() {
      this.select((this.selectedIndex + 1 + this.listItems.length) % this.listItems.length);
    }
    async select(index, useEffect = true) {
      if (this.pendingTransitionStatus) {
        return;
      }
      this.pendingTransitionStatus = true;
      await this.listItems[this.selectedIndex].transitionToLeave(useEffect);
      if (this.pageDots) {
        this.pageDots.selectedIndex = index;
      }
      await this.listItems[index].transitionToEnter(useEffect);
      this.pendingTransitionStatus = false;
    }
  };
  Object.assign(ApProductCarousel.prototype, ApBlockerMixinVerticalScroll);
  window.customElements.define("ap-product-carousel", ApProductCarousel);
  // end

  var ApLogoList = class extends CustomHTMLElement {
    async connectedCallback() {
      this.items = Array.from(this.querySelectorAll(".ap-logolist__item"));
      this.logoListScrollable = this.querySelector(".ap-logolist__list");
      if (this.items.length > 1) {
        this.addEventListener("ap-nextprev:prev", this.previous.bind(this));
        this.addEventListener("ap-nextprev:next", this.next.bind(this));
      }
      if (this.hasAttribute("reveal-on-scroll")) {
        this._setupTextOverlayImageVisibility();
      }
    }
    async _setupTextOverlayImageVisibility() {
      await this.untilObjectVisible();
      const animation = new ApAnimationCustom(
        new ApEffectParallel(
          this.items.map((item, index) => {
            return new ApEffectOfCustomKeyframe(
              item,
              {
                opacity: [0, 1],
                transform: [
                  `translateY(${MediaFeatures.prefersReducedMotion() ? 0 : "30px"})`,
                  "translateY(0)",
                ],
              },
              {
                duration: 600,
                delay: MediaFeatures.prefersReducedMotion() ? 0 : 100 * index,
                easing: "ease",
              }
            );
          })
        )
      );
      this._sectionReloadedStatus ? animation.finish() : animation.play();
    }
    previous(event) {
      const directionFlip = window.themeVariables.settings.direction === "ltr" ? 1 : -1;
      event.target.nextElementSibling.removeAttribute("disabled");
      event.target.toggleAttribute(
        "disabled",
        this.logoListScrollable.scrollLeft * directionFlip -
          (this.logoListScrollable.clientWidth + 24) <=
          0
      );
      this.logoListScrollable.scrollBy({
        left: -(this.logoListScrollable.clientWidth + 24) * directionFlip,
        behavior: "smooth",
      });
    }
    next(event) {
      const directionFlip = window.themeVariables.settings.direction === "ltr" ? 1 : -1;
      event.target.previousElementSibling.removeAttribute("disabled");
      event.target.toggleAttribute(
        "disabled",
        this.logoListScrollable.scrollLeft * directionFlip +
          (this.logoListScrollable.clientWidth + 24) * 2 >=
          this.logoListScrollable.scrollWidth
      );
      this.logoListScrollable.scrollBy({
        left: (this.logoListScrollable.clientWidth + 24) * directionFlip,
        behavior: "smooth",
      });
    }
  };
  window.customElements.define("ap-logolist", ApLogoList);

  var ApBlogPostNavigation = class extends HTMLElement {
    connectedCallback() {
      window.addEventListener("scroll", apStream(this._updateObjectProgressBar.bind(this), 15));
    }
    get hasNextArticle() {
      return this.hasAttribute("has-next-article");
    }
    _updateObjectProgressBar() {
      const apOffsetStickyHeader = apStickyHeaderOffsetContent(),
        marginCompensation = window.matchMedia(window.themeVariables.breakpoints.pocket).matches
          ? 40
          : 80,
        articleNavBoundingBox = this.getBoundingClientRect(),
        articleMainPartBoundingBox = this.parentElement.getBoundingClientRect(),
        difference =
          articleMainPartBoundingBox.bottom - (articleNavBoundingBox.bottom - marginCompensation),
        progress = Math.max(
          -1 * (difference / (articleMainPartBoundingBox.height + marginCompensation) - 1),
          0
        );
      this.classList.toggle(
        "is-visible",
        articleMainPartBoundingBox.top < apOffsetStickyHeader &&
          articleMainPartBoundingBox.bottom >
            apOffsetStickyHeader + this.clientHeight - marginCompensation
      );
      if (this.hasNextArticle) {
        if (progress > 0.8) {
          this.classList.add("article__nav--show-next");
        } else {
          this.classList.remove("article__nav--show-next");
        }
      }
      this.style.setProperty("--transform", `${progress}`);
    }
  };
  window.customElements.define("ap-blogpostnavigation", ApBlogPostNavigation);

  var ApBlogCarousel = class extends CustomHTMLElement {
    constructor() {
      super();
      this.blogListInner = this.querySelector(".ap-productlist__inner");
      this.blogItems = Array.from(this.querySelectorAll("blog-item"));
    }
    connectedCallback() {
      this.addEventListener("ap-nextprev:prev", this.previous.bind(this));
      this.addEventListener("ap-nextprev:next", this.next.bind(this));
      if (!this.hidden && this.staggerApparition) {
        this._staggerProductsApparition();
      }
    }
    get staggerApparition() {
      return this.hasAttribute("stagger-apparition");
    }
    get apparitionAnimation() {
      return (this._customanimation =
        this._customanimation ||
        new ApAnimationCustom(
          new ApEffectParallel(
            this.blogItems.map((item, index) => {
              return new ApEffectOfCustomKeyframe(
                item,
                {
                  opacity: [0, 1],
                  transform: [
                    `translateY(${
                      MediaFeatures.prefersReducedMotion() ? 0 : window.innerWidth < 1e3 ? 35 : 60
                    }px)`,
                    "translateY(0)",
                  ],
                },
                {
                  duration: 600,
                  delay: MediaFeatures.prefersReducedMotion()
                    ? 0
                    : 100 * index - Math.min(3 * index * index, 100 * index),
                  easing: "ease",
                }
              );
            })
          )
        ));
    }
    previous(event) {
      const directionFlip = window.themeVariables.settings.direction === "ltr" ? 1 : -1,
        columnGap = parseInt(
          getComputedStyle(this).getPropertyValue("--ap-productlist-column-gap")
        );
      event.target.nextElementSibling.removeAttribute("disabled");
      event.target.toggleAttribute(
        "disabled",
        this.blogListInner.scrollLeft * directionFlip -
          (this.blogListInner.clientWidth + columnGap) <=
          0
      );
      this.blogListInner.scrollBy({
        left: -(this.blogListInner.clientWidth + columnGap) * directionFlip,
        behavior: "smooth",
      });
    }
    next(event) {
      const directionFlip = window.themeVariables.settings.direction === "ltr" ? 1 : -1,
        columnGap = parseInt(
          getComputedStyle(this).getPropertyValue("--ap-productlist-column-gap")
        );
      event.target.previousElementSibling.removeAttribute("disabled");
      event.target.toggleAttribute(
        "disabled",
        this.blogListInner.scrollLeft * directionFlip +
          (this.blogListInner.clientWidth + columnGap) * 2 >=
          this.blogListInner.scrollWidth
      );
      this.blogListInner.scrollBy({
        left: (this.blogListInner.clientWidth + columnGap) * directionFlip,
        behavior: "smooth",
      });
    }
    attributeChangedCallback(name) {
      var _a, _b;
      if (!this.staggerApparition) {
        return;
      }
      switch (name) {
        case "hidden":
          if (!this.hidden) {
            this.blogListInner.scrollLeft = 0;
            this.blogListInner.parentElement.scrollLeft = 0;
            (_a = this.querySelector(".ap-nextap-buttonprev--prev")) == null
              ? void 0
              : _a.setAttribute("disabled", "");
            (_b = this.querySelector(".ap-nextap-buttonprev--next")) == null
              ? void 0
              : _b.removeAttribute("disabled");
            this._staggerProductsApparition();
          } else {
            this.apparitionAnimation.finish();
          }
      }
    }
    async _staggerProductsApparition() {
      this.blogItems.forEach((item) => (item.style.opacity = 0));
      await this.untilObjectVisible({
        threshold: this.clientHeight > 0 ? 50 / this.clientHeight : 0,
      });
      this.apparitionAnimation.play();
    }
  };
  __publicField(ApBlogCarousel, "observedAttributes", ["hidden"]);
  window.customElements.define("ap-blogcarousel", ApBlogCarousel);

  var CollectionCarousel = class extends CustomHTMLElement {
    constructor() {
      super();
      this.collectionListInner = this.querySelector(".ap-productlist__inner");
      this.collectionItems = Array.from(this.querySelectorAll("collection-carousel-item"));
    }
    connectedCallback() {
      this.addEventListener("ap-nextprev:prev", this.previous.bind(this));
      this.addEventListener("ap-nextprev:next", this.next.bind(this));
      if (!this.hidden && this.staggerApparition) {
        this._staggerProductsApparition();
      }
    }
    get staggerApparition() {
      return this.hasAttribute("stagger-apparition");
    }
    get apparitionAnimation() {
      return (this._customanimation =
        this._customanimation ||
        new ApAnimationCustom(
          new ApEffectParallel(
            this.collectionItems.map((item, index) => {
              return new ApEffectOfCustomKeyframe(
                item,
                {
                  opacity: [0, 1],
                  transform: [
                    `translateY(${
                      MediaFeatures.prefersReducedMotion() ? 0 : window.innerWidth < 1e3 ? 35 : 60
                    }px)`,
                    "translateY(0)",
                  ],
                },
                {
                  duration: 600,
                  delay: MediaFeatures.prefersReducedMotion()
                    ? 0
                    : 100 * index - Math.min(3 * index * index, 100 * index),
                  easing: "ease",
                }
              );
            })
          )
        ));
    }
    previous(event) {
      const directionFlip = window.themeVariables.settings.direction === "ltr" ? 1 : -1,
        columnGap = parseInt(
          getComputedStyle(this).getPropertyValue("--ap-productlist-column-gap")
        );
      event.target.nextElementSibling.removeAttribute("disabled");
      event.target.toggleAttribute(
        "disabled",
        this.collectionListInner.scrollLeft * directionFlip -
          (this.collectionListInner.clientWidth + columnGap) <=
          0
      );
      this.collectionListInner.scrollBy({
        left: -(this.collectionListInner.clientWidth + columnGap) * directionFlip,
        behavior: "smooth",
      });
    }
    next(event) {
      const directionFlip = window.themeVariables.settings.direction === "ltr" ? 1 : -1,
        columnGap = parseInt(
          getComputedStyle(this).getPropertyValue("--ap-productlist-column-gap")
        );
      event.target.previousElementSibling.removeAttribute("disabled");
      event.target.toggleAttribute(
        "disabled",
        this.collectionListInner.scrollLeft * directionFlip +
          (this.collectionListInner.clientWidth + columnGap) * 2 >=
          this.collectionListInner.scrollWidth
      );
      this.collectionListInner.scrollBy({
        left: (this.collectionListInner.clientWidth + columnGap) * directionFlip,
        behavior: "smooth",
      });
    }
    attributeChangedCallback(name) {
      var _a, _b;
      if (!this.staggerApparition) {
        return;
      }
      switch (name) {
        case "hidden":
          if (!this.hidden) {
            this.collectionListInner.scrollLeft = 0;
            this.collectionListInner.parentElement.scrollLeft = 0;
            (_a = this.querySelector(".ap-nextap-buttonprev--prev")) == null
              ? void 0
              : _a.setAttribute("disabled", "");
            (_b = this.querySelector(".ap-nextap-buttonprev--next")) == null
              ? void 0
              : _b.removeAttribute("disabled");
            this._staggerProductsApparition();
          } else {
            this.apparitionAnimation.finish();
          }
      }
    }
    async _staggerProductsApparition() {
      this.collectionItems.forEach((item) => (item.style.opacity = 0));
      await this.untilObjectVisible({
        threshold: this.clientHeight > 0 ? 50 / this.clientHeight : 0,
      });
      this.apparitionAnimation.play();
    }
  };
  __publicField(CollectionCarousel, "observedAttributes", ["hidden"]);
  window.customElements.define("collection-carousel", CollectionCarousel);

  var CollectionCarousel = class extends CustomHTMLElement {
    constructor() {
      super();
      this.collectionListInner = this.querySelector(".ap-productlist__inner");
      this.collectionItems = Array.from(this.querySelectorAll("instagram-carousel-item"));
    }
    connectedCallback() {
      this.addEventListener("ap-nextprev:prev", this.previous.bind(this));
      this.addEventListener("ap-nextprev:next", this.next.bind(this));
      if (!this.hidden && this.staggerApparition) {
        this._staggerProductsApparition();
      }
    }
    get staggerApparition() {
      return this.hasAttribute("stagger-apparition");
    }
    get apparitionAnimation() {
      return (this._customanimation =
        this._customanimation ||
        new ApAnimationCustom(
          new ApEffectParallel(
            this.collectionItems.map((item, index) => {
              return new ApEffectOfCustomKeyframe(
                item,
                {
                  opacity: [0, 1],
                  transform: [
                    `translateY(${
                      MediaFeatures.prefersReducedMotion() ? 0 : window.innerWidth < 1e3 ? 35 : 60
                    }px)`,
                    "translateY(0)",
                  ],
                },
                {
                  duration: 600,
                  delay: MediaFeatures.prefersReducedMotion()
                    ? 0
                    : 100 * index - Math.min(3 * index * index, 100 * index),
                  easing: "ease",
                }
              );
            })
          )
        ));
    }
    previous(event) {
      const directionFlip = window.themeVariables.settings.direction === "ltr" ? 1 : -1,
        columnGap = parseInt(
          getComputedStyle(this).getPropertyValue("--ap-productlist-column-gap")
        );
      event.target.nextElementSibling.removeAttribute("disabled");
      event.target.toggleAttribute(
        "disabled",
        this.collectionListInner.scrollLeft * directionFlip -
          (this.collectionListInner.clientWidth + columnGap) <=
          0
      );
      this.collectionListInner.scrollBy({
        left: -(this.collectionListInner.clientWidth + columnGap) * directionFlip,
        behavior: "smooth",
      });
    }
    next(event) {
      const directionFlip = window.themeVariables.settings.direction === "ltr" ? 1 : -1,
        columnGap = parseInt(
          getComputedStyle(this).getPropertyValue("--ap-productlist-column-gap")
        );
      event.target.previousElementSibling.removeAttribute("disabled");
      event.target.toggleAttribute(
        "disabled",
        this.collectionListInner.scrollLeft * directionFlip +
          (this.collectionListInner.clientWidth + columnGap) * 2 >=
          this.collectionListInner.scrollWidth
      );
      this.collectionListInner.scrollBy({
        left: (this.collectionListInner.clientWidth + columnGap) * directionFlip,
        behavior: "smooth",
      });
    }
    attributeChangedCallback(name) {
      var _a, _b;
      if (!this.staggerApparition) {
        return;
      }
      switch (name) {
        case "hidden":
          if (!this.hidden) {
            this.collectionListInner.scrollLeft = 0;
            this.collectionListInner.parentElement.scrollLeft = 0;
            (_a = this.querySelector(".ap-nextap-buttonprev--prev")) == null
              ? void 0
              : _a.setAttribute("disabled", "");
            (_b = this.querySelector(".ap-nextap-buttonprev--next")) == null
              ? void 0
              : _b.removeAttribute("disabled");
            this._staggerProductsApparition();
          } else {
            this.apparitionAnimation.finish();
          }
      }
    }
    async _staggerProductsApparition() {
      this.collectionItems.forEach((item) => (item.style.opacity = 0));
      await this.untilObjectVisible({
        threshold: this.clientHeight > 0 ? 50 / this.clientHeight : 0,
      });
      this.apparitionAnimation.play();
    }
  };
  __publicField(CollectionCarousel, "observedAttributes", ["hidden"]);
  window.customElements.define("instagram-carousel", CollectionCarousel);

  var ApMultiColumn = class extends CustomHTMLElement {
    connectedCallback() {
      if (!this.hasAttribute("stack")) {
        this.multiColumnInner = this.querySelector(".ap-multicolumn__inner");
        this.addEventListener("ap-nextprev:prev", this.previous.bind(this));
        this.addEventListener("ap-nextprev:next", this.next.bind(this));
        if (Shopify.designMode) {
          this.addEventListener("shopify:block:select", (event) => {
            event.target.scrollIntoView({
              inline: "center",
              block: "nearest",
              behavior: event.detail.load ? "auto" : "smooth",
            });
          });
        }
      }
      if (this.hasAttribute("stagger-apparition")) {
        this._setupTextOverlayImageVisibility();
      }
    }
    async _setupTextOverlayImageVisibility() {
      await this.untilObjectVisible({
        threshold: 50 / this.clientHeight,
      });
      const prefersReducedMotion = MediaFeatures.prefersReducedMotion();
      const animation = new ApAnimationCustom(
        new ApEffectParallel(
          Array.from(this.querySelectorAll(".ap-multicolumn__item")).map((item, index) => {
            return new ApEffectOfCustomKeyframe(
              item,
              {
                opacity: [0, 1],
                transform: [
                  `translateY(${
                    MediaFeatures.prefersReducedMotion() ? 0 : window.innerWidth < 1e3 ? 35 : 60
                  }px)`,
                  "translateY(0)",
                ],
              },
              {
                duration: 600,
                delay: prefersReducedMotion ? 0 : 100 * index,
                easing: "ease",
              }
            );
          })
        )
      );
      this._sectionReloadedStatus ? animation.finish() : animation.play();
    }
    previous(event) {
      const directionFlip = window.themeVariables.settings.direction === "ltr" ? 1 : -1,
        columnGap = parseInt(
          getComputedStyle(this).getPropertyValue("--ap-multicolumn-column-gap")
        );
      event.target.nextElementSibling.removeAttribute("disabled");
      event.target.toggleAttribute(
        "disabled",
        this.multiColumnInner.scrollLeft * directionFlip -
          (this.multiColumnInner.clientWidth + columnGap) <=
          0
      );
      this.multiColumnInner.scrollBy({
        left: -(this.multiColumnInner.clientWidth + columnGap) * directionFlip,
        behavior: "smooth",
      });
    }
    next(event) {
      const directionFlip = window.themeVariables.settings.direction === "ltr" ? 1 : -1,
        columnGap = parseInt(
          getComputedStyle(this).getPropertyValue("--ap-multicolumn-column-gap")
        );
      event.target.previousElementSibling.removeAttribute("disabled");
      event.target.toggleAttribute(
        "disabled",
        this.multiColumnInner.scrollLeft * directionFlip +
          (this.multiColumnInner.clientWidth + columnGap) * 2 >=
          this.multiColumnInner.scrollWidth
      );
      this.multiColumnInner.scrollBy({
        left: (this.multiColumnInner.clientWidth + columnGap) * directionFlip,
        behavior: "smooth",
      });
    }
  };
  window.customElements.define("ap-multicolumn", ApMultiColumn);

  var ApGalleryList = class extends HTMLElement {
    connectedCallback() {
      this.listItems = Array.from(this.querySelectorAll("ap-galleryitem"));
      this.scrollBarElement = this.querySelector(".ap-gallery__progress-bar");
      this.listWrapperElement = this.querySelector(".ap-gallery__list-wrapper");
      if (this.listItems.length > 1) {
        this.addEventListener(
          "ap-scrollablecontent:progress",
          this._updateObjectProgressBar.bind(this)
        );
        this.addEventListener("ap-nextprev:prev", this.previous.bind(this));
        this.addEventListener("ap-nextprev:next", this.next.bind(this));
        if (Shopify.designMode) {
          this.addEventListener("shopify:block:select", (event) =>
            this.select(event.target.index, !event.detail.load)
          );
        }
      }
    }
    previous() {
      this.select(
        [...this.listItems].reverse().find((item) => item.isOnLeftHalfPartOfScreen).index
      );
    }
    next() {
      this.select(this.listItems.findIndex((item) => item.isOnRightHalfPartOfScreen));
    }
    select(index, animate = true) {
      const apBoundingRect = this.listItems[index].getBoundingClientRect();
      this.listWrapperElement.scrollBy({
        behavior: animate ? "smooth" : "auto",
        left: Math.floor(apBoundingRect.left - window.innerWidth / 2 + apBoundingRect.width / 2),
      });
    }
    _updateObjectProgressBar(event) {
      var _a;
      (_a = this.scrollBarElement) == null
        ? void 0
        : _a.style.setProperty("--transform", `${event.detail.progress}%`);
    }
  };
  window.customElements.define("ap-gallerylist", ApGalleryList);

  var ApGalleryItem = class extends HTMLElement {
    get index() {
      return [...this.parentNode.children].indexOf(this);
    }
    get isOnRightHalfPartOfScreen() {
      let left = this.getBoundingClientRect().left;
      let right = this.getBoundingClientRect().right;
      if (window.themeVariables.settings.direction === "ltr") {
        return left > window.innerWidth / 2;
      } else {
        return right < window.innerWidth / 2;
      }
    }
    get isOnLeftHalfPartOfScreen() {
      let right = this.getBoundingClientRect().right;
      let left = this.getBoundingClientRect().left;
      if (window.themeVariables.settings.direction === "ltr") {
        return right < window.innerWidth / 2;
      } else {
        return left > window.innerWidth / 2;
      }
    }
  };
  window.customElements.define("ap-galleryitem", ApGalleryItem);

  var ApTextOverlayImage = class extends CustomHTMLElement {
    connectedCallback() {
      if (this.hasAttribute("parallax") && !MediaFeatures.prefersReducedMotion()) {
        this._hasPendingRaF = false;
        this._onScrollListenerTextOverlayImage = this._onScrollTextOverlayImage.bind(this);
        window.addEventListener("scroll", this._onScrollListenerTextOverlayImage);
      }
      if (this.hasAttribute("reveal-on-scroll")) {
        this._setupTextOverlayImageVisibility();
      }
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      if (this._onScrollListenerTextOverlayImage) {
        window.removeEventListener("scroll", this._onScrollListenerTextOverlayImage);
      }
    }
    async _setupTextOverlayImageVisibility() {
      await this.untilObjectVisible();
      const image = this.querySelector(".image-overlay__image"),
        headings = await resolveAsyncIterator(this.querySelectorAll("ap-splitlines")),
        prefersReducedMotion = MediaFeatures.prefersReducedMotion();
      await imageLoaded(image);
      const innerEffect = [
        new ApEffectOfCustomKeyframe(
          image,
          {
            opacity: [0, 1],
            transform: [`scale(${prefersReducedMotion ? 1 : 1.1})`, "scale(1)"],
          },
          {
            duration: 500,
            easing: "cubic-bezier(0.65, 0, 0.35, 1)",
          }
        ),
        new ApEffectParallel(
          headings.map((item, index) => {
            return new ApEffectOfCustomKeyframe(
              item,
              {
                opacity: [0, 0.2, 1],
                transform: [`translateY(${prefersReducedMotion ? 0 : "100%"})`, "translateY(0)"],
                clipPath: [
                  `inset(${prefersReducedMotion ? "0 0 0 0" : "0 0 100% 0"})`,
                  "inset(0 0 0 0)",
                ],
              },
              {
                duration: 300,
                delay: prefersReducedMotion ? 0 : 120 * index,
                easing: "cubic-bezier(0.5, 0.06, 0.01, 0.99)",
              }
            );
          })
        ),
        new ApEffectOfCustomKeyframe(
          this.querySelector(".image-overlay__text-container"),
          {
            opacity: [0, 1],
          },
          {
            duration: 300,
          }
        ),
      ];
      const animation = prefersReducedMotion
        ? new ApAnimationCustom(new ApEffectParallel(innerEffect))
        : new ApAnimationCustom(new ApEffectSequence(innerEffect));
      this._sectionReloadedStatus ? animation.finish() : animation.play();
    }
    _onScrollTextOverlayImage() {
      if (this._hasPendingRaF) {
        return;
      }
      this._hasPendingRaF = true;
      requestAnimationFrame(() => {
        const apBoundingRect = this.getBoundingClientRect(),
          speedFactor = 3,
          contentElement = this.querySelector(".image-overlay__content-wrapper"),
          elementImage = this.querySelector(".image-overlay__image"),
          apBoundingRectBottom = apBoundingRect.bottom,
          apBoundingRectHeight = apBoundingRect.height,
          apOffsetStickyHeader = apStickyHeaderOffsetContent();
        if (contentElement) {
          contentElement.style.opacity = Math.max(
            1 - speedFactor * (1 - Math.min(apBoundingRectBottom / apBoundingRectHeight, 1)),
            0
          ).toString();
        }
        if (elementImage) {
          elementImage.style.transform = `translateY(${
            100 -
            Math.max(
              1 -
                (1 -
                  Math.min(
                    apBoundingRectBottom / (apBoundingRectHeight + apOffsetStickyHeader),
                    1
                  )),
              0
            ) *
              100
          }px)`;
        }
        this._hasPendingRaF = false;
      });
    }
  };
  window.customElements.define("ap-textoverlayimage", ApTextOverlayImage);

  var ApImageTextBlock = class extends CustomHTMLElement {
    async connectedCallback() {
      if (this.hasAttribute("reveal-on-scroll")) {
        this._setupTextOverlayImageVisibility();
      }
    }
    async _setupTextOverlayImageVisibility() {
      await this.untilObjectVisible();
      const images = Array.from(this.querySelectorAll(".ap-imagetextblock__image[reveal]")),
        headings = await resolveAsyncIterator(this.querySelectorAll("ap-splitlines")),
        prefersReducedMotion = MediaFeatures.prefersReducedMotion();
      for (const image of images) {
        if (image.offsetParent !== null) {
          await imageLoaded(image);
        }
      }
      const innerEffect = [
        new ApEffectParallel(
          images.map((item) => {
            return new ApEffectOfCustomKeyframe(
              item,
              {
                opacity: [0, 1],
                transform: [`scale(${prefersReducedMotion ? 1 : 1.1})`, "scale(1)"],
              },
              {
                duration: 500,
                easing: "cubic-bezier(0.65, 0, 0.35, 1)",
              }
            );
          })
        ),
        new ApEffectOfCustomKeyframe(
          this.querySelector(".ap-imagetextblock__content"),
          {
            opacity: [0, 1],
            transform: [`translateY(${prefersReducedMotion ? 0 : "60px"})`, "translateY(0)"],
          },
          {
            duration: 150,
            easing: "ease-in-out",
          }
        ),
        new ApEffectParallel(
          headings.map((item, index) => {
            return new ApEffectOfCustomKeyframe(
              item,
              {
                opacity: [0, 0.2, 1],
                transform: [`translateY(${prefersReducedMotion ? 0 : "100%"})`, "translateY(0)"],
                clipPath: [
                  `inset(${prefersReducedMotion ? "0 0 0 0" : "0 0 100% 0"})`,
                  "inset(0 0 0 0)",
                ],
              },
              {
                duration: 300,
                delay: prefersReducedMotion ? 0 : 120 * index,
                easing: "cubic-bezier(0.5, 0.06, 0.01, 0.99)",
              }
            );
          })
        ),
        new ApEffectOfCustomKeyframe(
          this.querySelector(".ap-imagetextblock__text-container"),
          {
            opacity: [0, 1],
          },
          {
            duration: 300,
          }
        ),
      ];
      const animation = prefersReducedMotion
        ? new ApAnimationCustom(new ApEffectParallel(innerEffect))
        : new ApAnimationCustom(new ApEffectSequence(innerEffect));
      this._sectionReloadedStatus ? animation.finish() : animation.play();
    }
  };
  window.customElements.define("ap-imagetextblock", ApImageTextBlock);

  var ApListArticle = class extends CustomHTMLElement {
    async connectedCallback() {
      this.articleItems = Array.from(this.querySelectorAll(".article-item"));
      if (this.staggerApparition) {
        let val = 0;
        if (this.clientHeight > 0) {
          val = 50 / this.clientHeight;
        }
        await this.untilObjectVisible({
          threshold: val,
        });
        const animation = new ApAnimationCustom(
          new ApEffectParallel(
            this.articleItems.map((item, index) => {
              let transform = 0;
              if (MediaFeatures.prefersReducedMotion()) {
                transform = 0;
              } else {
                if (window.innerWidth < 1e3) {
                  transform = 35;
                } else {
                  transform = 60;
                }
              }
              let delay = 0;
              if (MediaFeatures.prefersReducedMotion()) {
                delay = 0;
              } else {
                delay = 100 * index - Math.min(3 * index * index, 100 * index);
              }
              return new ApEffectOfCustomKeyframe(
                item,
                {
                  opacity: [0, 1],
                  transform: [`translateY(${transform}px)`, "translateY(0)"],
                },
                {
                  duration: 600,
                  delay: delay,
                  easing: "ease",
                }
              );
            })
          )
        );
        this._sectionReloadedStatus ? animation.finish() : animation.play();
      }
    }
    get staggerApparition() {
      return this.hasAttribute("stagger-apparition");
    }
  };
  window.customElements.define("ap-listarticle", ApListArticle);

  // var ApBlogPostHeader = class extends HTMLElement {
  //   async connectedCallback() {
  //     const image = this.querySelector(".article__image");
  //     if (MediaFeatures.prefersReducedMotion()) {
  //       image.removeAttribute("reveal");
  //     } else {
  //       await imageLoaded(image);
  //       image.animate({ opacity: [0, 1], transform: ["scale(1.1)", "scale(1)"] }, { duration: 500, fill: "forwards", easing: "cubic-bezier(0.65, 0, 0.35, 1)" });
  //     }
  //   }
  // };
  // window.customElements.define("ap-blogpostheader", ApBlogPostHeader);

  var ApPredictiveSearchInput = class extends HTMLInputElement {
    connectedCallback() {
      this.addEventListener(
        "click",
        () => (document.getElementById(this.getAttribute("ap-controlsaria")).open = true)
      );
    }
  };
  window.customElements.define("ap-predictivesearchinput", ApPredictiveSearchInput, {
    extends: "input",
  });

  var ApDrawerContent = class extends ApolloOpenableElement {
    connectedCallback() {
      super.connectedCallback();
      if (this.hasAttribute("reverse-breakpoint")) {
        this.originalDirection = this.classList.contains("drawer--from-left") ? "left" : "right";
        const matchMedia2 = window.matchMedia(this.getAttribute("reverse-breakpoint"));
        matchMedia2.addListener(this._objCheckReverseOpenDirec.bind(this));
        this._objCheckReverseOpenDirec(matchMedia2);
      }
      this.apollo.on("click", ".drawer__overlay", () => (this.open = false));
    }
    attributeChangedCallback(name, oldval, newval) {
      super.attributeChangedCallback(name, oldval, newval);
      switch (name) {
        case "open":
          document.documentElement.classList.toggle("ap-lockall", this.open);
      }
    }
    _objCheckReverseOpenDirec(match) {
      this.classList.remove("drawer--from-left");
      if (
        (this.originalDirection === "left" && !match.matches) ||
        (this.originalDirection !== "left" && match.matches)
      ) {
        this.classList.add("drawer--from-left");
      }
    }
  };
  window.customElements.define("ap-drawercontent", ApDrawerContent);

  var ApSearchDrawer = class extends ApDrawerContent {
    connectedCallback() {
      super.connectedCallback();
      this.inputElement = this.querySelector('[name="q"]');
      this._apDrawerContentElement = this.querySelector(".drawer__content");
      this._apDrawerFooterElement = this.querySelector(".drawer__footer");
      this._apLoadingStateElement = this.querySelector(".predictive-search__loading-state");
      this._apResultsElement = this.querySelector(".predictive-search__results");
      this._apMenuListElement = this.querySelector(".predictive-search__menu-list");
      this.apollo.on("input", '[name="q"]', this._debounce(this._apOnSearch.bind(this), 200));
      this.apollo.on(
        "click",
        '[data-action="reset-search"]',
        this._apStartWithNewSearch.bind(this)
      );
    }
    async _apOnSearch(event, target) {
      if (event.key === "Enter") {
        return;
      }
      if (this.abortController) {
        this.abortController.abort();
      }
      this._apDrawerContentElement.classList.remove("drawer__content--center");
      this._apDrawerFooterElement.hidden = true;
      if (target.value === "") {
        this._apLoadingStateElement.hidden = true;
        this._apResultsElement.hidden = true;
        this._apMenuListElement ? (this._apMenuListElement.hidden = false) : "";
      } else {
        this._apDrawerContentElement.classList.add("drawer__content--center");
        this._apLoadingStateElement.hidden = false;
        this._apResultsElement.hidden = true;
        this._apMenuListElement ? (this._apMenuListElement.hidden = true) : "";
        let apSearchResults = {};
        try {
          this.abortController = new AbortController();
          if (this._apSupportSearchApi()) {
            apSearchResults = await this._apDrawerDoWithSearch(target.value);
          } else {
            apSearchResults = await this._apLiquidWithSearch(target.value);
          }
        } catch (e) {
          if (e.name === "AbortError") {
            return;
          }
        }
        this._apLoadingStateElement.hidden = true;
        this._apResultsElement.hidden = false;
        this._apMenuListElement ? (this._apMenuListElement.hidden = true) : "";
        if (apSearchResults.hasResults) {
          this._apDrawerFooterElement.hidden = false;
          this._apDrawerContentElement.classList.remove("drawer__content--center");
        }
        this._apResultsElement.innerHTML = apSearchResults.html;
      }
    }
    async _apDrawerDoWithSearch(term) {
      const apresponse = await fetch(
        `${window.themeVariables.routes.apDrawerSearchUrl}?q=${term}&resources[limit]=10&resources[type]=${window.themeVariables.settings.searchMode}&resources[options[unavailable_products]]=${window.themeVariables.settings.searchProductsUnavailable}&resources[options[fields]]=title,body,product_type,variants.title,vendor&section_id=predictive-search`,
        {
          signal: this.abortController.signal,
        }
      );
      const div = document.createElement("div");
      div.innerHTML = await apresponse.text();
      return {
        hasResults: div.querySelector(".predictive-search__results-categories") !== null,
        html: div.firstElementChild.innerHTML,
      };
    }
    async _apLiquidWithSearch(term) {
      let promises = [],
        supportedTypes = window.themeVariables.settings.searchMode
          .split(",")
          .filter((item) => item !== "collection");
      supportedTypes.forEach((searchType) => {
        promises.push(
          fetch(
            `${window.themeVariables.routes.searchUrl}?section_id=predictive-search-compatibility&q=${term}&type=${searchType}&options[unavailable_products]=${window.themeVariables.settings.searchProductsUnavailable}&options[prefix]=last`,
            {
              signal: this.abortController.signal,
            }
          )
        );
      });
      let results = await Promise.all(promises),
        resultsByCategories = {};
      for (const [index, value] of results.entries()) {
        const resultAsText = await value.text();
        const fakeDiv = document.createElement("div");
        fakeDiv.innerHTML = resultAsText;
        fakeDiv.innerHTML = fakeDiv.firstElementChild.innerHTML;
        if (fakeDiv.childElementCount > 0) {
          resultsByCategories[supportedTypes[index]] = fakeDiv.innerHTML;
        }
      }
      if (Object.keys(resultsByCategories).length > 0) {
        const entries = Object.entries(resultsByCategories),
          keys = Object.keys(resultsByCategories);
        let html = `
        <ap-navtabs class="ap-navtabs ap-navtabs--edge2edge ap-navtabs--narrow ap-navtabs--no-border">
          <ap-scrollablecontent class="ap-navtabs__scroller hide-scrollbar">
            <div class="ap-navtabs__scroller-inner">
              <div class="ap-navtabs__item-list">
      `;
        for (let [type, value] of entries) {
          html += `
          <button type="button" class="ap-navtabs__item heading heading--small" ap-expanded-aria="${
            type === keys[0] ? "true" : "false"
          }" ap-controlsaria="predictive-search-${type}">
            ${
              window.themeVariables.strings[
                "search" + type.charAt(0).toUpperCase() + type.slice(1) + "s"
              ]
            }
          </button>
        `;
        }
        html += `
              </div>
            </div>
          </ap-scrollablecontent>
        </ap-navtabs>
      `;
        html += '<div class="predictive-search__results-categories">';
        for (let [type, value] of entries) {
          html += `
          <div class="predictive-search__results-categories-item" ${
            type !== keys[0] ? "hidden" : ""
          } id="predictive-search-${type}">
            ${value}
          </div>
        `;
        }
        html += "</div>";
        return {
          hasResults: true,
          html,
        };
      } else {
        return {
          hasResults: false,
          html: `
        <p class="text--large">${window.themeVariables.strings.searchNoResults}</p>
          <div class="button-wrapper">
            <button type="button" data-action="reset-search" class="button button--primary">${window.themeVariables.strings.searchNewSearch}</button>
          </div>
        `,
        };
      }
    }
    _apStartWithNewSearch() {
      this.inputElement.value = "";
      this.inputElement.focus();
      const event = new Event("input", {
        bubbles: true,
        cancelable: true,
      });
      this.inputElement.dispatchEvent(event);
    }
    _apSupportSearchApi() {
      const shopifyFeatureRequests = JSON.parse(
        document.getElementById("shopify-features").innerHTML
      );
      return shopifyFeatureRequests["predictiveSearch"];
    }
    _debounce(fn, delay3) {
      let timer = null;
      return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          fn.apply(this, args);
        }, delay3);
      };
    }
  };
  window.customElements.define("ap-predictivesearchdrawer", ApSearchDrawer);

  // var ApTimeline = class extends HTMLElement {
  //   connectedCallback() {
  //     this.prevNextButtons = this.querySelector("ap-button-nextprev");
  //     this.pageDots = this.querySelector("ap-pagedots");
  //     this.scrollBarElement = this.querySelector(".timeline__progress-bar");
  //     this.listWrapperElement = this.querySelector(".timeline__list-wrapper");
  //     this.listItemElements = Array.from(this.querySelectorAll(".timeline__item"));
  //     this.isScrolling = false;
  //     if (this.listItemElements.length > 1) {
  //       this.addEventListener("ap-nextprev:prev", this.previous.bind(this));
  //       this.addEventListener("ap-nextprev:next", this.next.bind(this));
  //       this.addEventListener("ap-pagedots:changed", (event) => this.select(event.detail.index));
  //       if (Shopify.designMode) {
  //         this.addEventListener("shopify:block:select", (event) => {
  //           this.select(
  //             [...event.target.parentNode.children].indexOf(event.target),
  //             !event.detail.load
  //           );
  //         });
  //       }
  //       this.itemIntersectionObserver = new IntersectionObserver(
  //         this._evtOnItemObserved.bind(this),
  //         {
  //           threshold: 0.4,
  //         }
  //       );
  //       const mediaQuery = window.matchMedia(window.themeVariables.breakpoints.pocket);
  //       mediaQuery.addListener(this._evtOnChangedMedia.bind(this));
  //       this._evtOnChangedMedia(mediaQuery);
  //     }
  //   }
  //   get selectedIndex() {
  //     return this.listItemElements.findIndex((item) => !item.hasAttribute("hidden"));
  //   }
  //   previous() {
  //     this.select(Math.max(0, this.selectedIndex - 1));
  //   }
  //   next() {
  //     this.select(Math.min(this.selectedIndex + 1, this.listItemElements.length - 1));
  //   }
  //   select(index, animate = true) {
  //     const listItemElement = this.listItemElements[index],
  //       apBoundingRect = listItemElement.getBoundingClientRect();
  //     if (animate) {
  //       this.isScrolling = true;
  //       setTimeout(() => (this.isScrolling = false), 800);
  //     }
  //     if (window.matchMedia(window.themeVariables.breakpoints.pocket).matches) {
  //       this.listWrapperElement.scrollTo({
  //         behavior: animate ? "smooth" : "auto",
  //         left: this.listItemElements[0].clientWidth * index,
  //       });
  //     } else {
  //       this.listWrapperElement.scrollBy({
  //         behavior: animate ? "smooth" : "auto",
  //         left: Math.floor(apBoundingRect.left - window.innerWidth / 2 + apBoundingRect.width / 2),
  //       });
  //     }
  //     this._evtOnSelectedItem(index);
  //   }
  //   _evtOnSelectedItem(index) {
  //     var _a;
  //     const listItemElement = this.listItemElements[index];
  //     listItemElement.removeAttribute("hidden", "false");
  //     apSiblings(listItemElement).forEach((item) => item.setAttribute("hidden", ""));
  //     this.prevNextButtons.isPrevDisabled = index === 0;
  //     this.prevNextButtons.isNextDisabled = index === this.listItemElements.length - 1;
  //     this.pageDots.selectedIndex = index;
  //     (_a = this.scrollBarElement) == null
  //       ? void 0
  //       : _a.style.setProperty(
  //           "--transform",
  //           `${(100 / (this.listItemElements.length - 1)) * index}%`
  //         );
  //   }
  //   _evtOnItemObserved(entries) {
  //     if (this.isScrolling) {
  //       return;
  //     }
  //     entries.forEach((entry) => {
  //       if (entry.isIntersecting) {
  //         this._evtOnSelectedItem([...entry.target.parentNode.children].indexOf(entry.target));
  //       }
  //     });
  //   }
  //   _evtOnChangedMedia(event) {
  //     if (event.matches) {
  //       this.listItemElements.forEach((item) => this.itemIntersectionObserver.observe(item));
  //     } else {
  //       this.listItemElements.forEach((item) => this.itemIntersectionObserver.unobserve(item));
  //     }
  //   }
  // };
  // window.customElements.define("ap-timeline", ApTimeline);

  // js/custom-element/section/press/press-list.js
  // var PressList = class extends CustomHTMLElement {
  //   connectedCallback() {
  //     this.pressItemsWrapper = this.querySelector(".press-list__wrapper");
  //     this.pressItems = Array.from(this.querySelectorAll("press-item"));
  //     this.pageDots = this.querySelector("ap-pagedots");
  //     if (this.pressItems.length > 1) {
  //       if (Shopify.designMode) {
  //         this.addEventListener("shopify:block:select", (event) => {
  //           var _a;
  //           (_a = this.intersectionObserver) == null ? void 0 : _a.disconnect();
  //           if (event.detail.load || !event.target.selected) {
  //             this.select(event.target.index, !event.detail.load);
  //           }
  //         });
  //       }
  //       this.pressItemsWrapper.addEventListener("swiperight", this.previous.bind(this));
  //       this.pressItemsWrapper.addEventListener("swipeleft", this.next.bind(this));
  //       this.addEventListener("ap-pagedots:changed", (event) => this.select(event.detail.index));
  //       this._blockVerticalScroll();
  //     }
  //     if (this.hasAttribute("reveal-on-scroll")) {
  //       this._setupTextOverlayImageVisibility();
  //     }
  //   }
  //   async _setupTextOverlayImageVisibility() {
  //     await this.untilObjectVisible();
  //     this.pressItems[this.selectedIndex].transitionToEnter();
  //   }
  //   get selectedIndex() {
  //     return this.pressItems.findIndex((item) => item.selected);
  //   }
  //   previous() {
  //     this.select((this.selectedIndex - 1 + this.pressItems.length) % this.pressItems.length);
  //   }
  //   next() {
  //     this.select((this.selectedIndex + 1 + this.pressItems.length) % this.pressItems.length);
  //   }
  //   async select(index, useEffect = true) {
  //     const previousItem = this.pressItems[this.selectedIndex], newItem = this.pressItems[index];
  //     await previousItem.transitionToLeave(useEffect);
  //     this.pageDots.selectedIndex = index;
  //     await newItem.transitionToEnter(useEffect);
  //   }
  // };
  // Object.assign(PressList.prototype, ApBlockerMixinVerticalScroll);
  // window.customElements.define("press-list", PressList);

  // js/custom-element/section/press/press-item.js
  // var PressItem = class extends HTMLElement {
  //   connectedCallback() {
  //     this.addEventListener("ap-splitlines:re-split", (event) => {
  //       Array.from(event.target.children).forEach((line) => line.style.visibility = this.selected ? "visible" : "hidden");
  //     });
  //   }
  //   get index() {
  //     return [...this.parentNode.children].indexOf(this);
  //   }
  //   get selected() {
  //     return !this.hasAttribute("hidden");
  //   }
  //   async transitionToLeave(useEffect = true) {
  //     const textLines = await resolveAsyncIterator(this.querySelectorAll("ap-splitlines")), animation = new ApAnimationCustom(new ApEffectParallel(textLines.reverse().map((item, index) => {
  //       return new ApEffectOfCustomKeyframe(item, {
  //         visibility: ["visible", "hidden"],
  //         clipPath: ["inset(0 0 0 0)", "inset(0 0 100% 0)"],
  //         transform: ["translateY(0)", "translateY(100%)"]
  //       }, {
  //         duration: 350,
  //         delay: 60 * index,
  //         easing: "cubic-bezier(0.68, 0.00, 0.77, 0.00)"
  //       });
  //     })));
  //     useEffect ? animation.play() : animation.finish();
  //     await animation.finished;
  //     this.setAttribute("hidden", "");
  //   }
  //   async transitionToEnter(useEffect = true) {
  //     this.removeAttribute("hidden");
  //     const textLines = await resolveAsyncIterator(this.querySelectorAll("ap-splitlines, .testimonial__author, .testimonial__icon")), animation = new ApAnimationCustom(new ApEffectParallel(textLines.map((item, index) => {
  //       return new ApEffectOfCustomKeyframe(item, {
  //         visibility: ["hidden", "visible"],
  //         clipPath: ["inset(0 0 100% 0)", "inset(0 0 0px 0)"],
  //         transform: ["translateY(100%)", "translateY(0)"]
  //       }, {
  //         duration: 550,
  //         delay: 120 * index,
  //         easing: "cubic-bezier(0.23, 1, 0.32, 1)"
  //       });
  //     })));
  //     useEffect ? animation.play() : animation.finish();
  //     return animation.finished;
  //   }
  // };
  // window.customElements.define("press-item", PressItem);

  // js/custom-element/section/header/ap-navigationofdesktop.js
  var NavigationOfDesktop = class extends CustomHTMLElement {
    connectedCallback() {
      this.timeoutOpen = null;
      this.megaMenuCurrent = null;
      this.apollo.on(
        "mouseenter",
        ".has-dropdown",
        (event, target) => {
          if (event.target === target && event.relatedTarget !== null) {
            this.openDropdown(target);
          }
        },
        true
      );
      this.apollo.on("shopify:block:select", (event) =>
        this.openDropdown(event.target.parentElement)
      );
      this.apollo.on("shopify:block:deselect", (event) =>
        this.closeDropdown(event.target.parentElement)
      );
    }
    openDropdown(parentElement) {
      const itemmenu = parentElement.querySelector("[ap-controlsaria]");
      const itemdropdown = parentElement.querySelector(
        `#${itemmenu.getAttribute("ap-controlsaria")}`
      );
      if (itemdropdown.classList.contains("mega-menu")) {
        this.megaMenuCurrent = itemdropdown;
      } else {
        this.megaMenuCurrent = null;
      }
      let timeoutOpen = setTimeout(() => {
        if (itemmenu.getAttribute("ap-expanded-aria") === "true") {
          return;
        }
        itemmenu.setAttribute("ap-expanded-aria", "true");
        itemdropdown.removeAttribute("hidden");
        if (itemdropdown.classList.contains("mega-menu") && !MediaFeatures.prefersReducedMotion()) {
          const items = Array.from(
            itemdropdown.querySelectorAll(".mega-menu__column, .mega-menu__image-push")
          );
          items.forEach((item) => {
            item.getAnimations().forEach((animation2) => animation2.cancel());
            item.style.opacity = 0;
          });
          const animation = new ApAnimationCustom(
            new ApEffectParallel(
              items.map((item, index) => {
                return new ApEffectOfCustomKeyframe(
                  item,
                  {
                    opacity: [0, 1],
                    transform: ["translateY(-50px)", "translateY(0)"],
                  },
                  {
                    duration: 250,
                    delay: 100 + 60 * index,
                    easing: "cubic-bezier(0.65, 0, 0.35, 1)",
                  }
                );
              })
            )
          );
          animation.play();
        }
        const leaveListener = (event) => {
          if (event.relatedTarget !== null) {
            this.closeDropdown(parentElement);
            parentElement.removeEventListener("mouseleave", leaveListener);
          }
        };
        const leaveDocumentListener = () => {
          this.closeDropdown(parentElement);
          document.documentElement.removeEventListener("mouseleave", leaveDocumentListener);
        };
        parentElement.addEventListener("mouseleave", leaveListener);
        document.documentElement.addEventListener("mouseleave", leaveDocumentListener);
        timeoutOpen = null;
        this.dispatchEvent(
          new CustomEvent("desktop-nav:dropdown:open", {
            bubbles: true,
          })
        );
      }, 100);
      parentElement.addEventListener(
        "mouseleave",
        () => {
          if (timeoutOpen) {
            clearTimeout(timeoutOpen);
          }
        },
        {
          once: true,
        }
      );
    }
    closeDropdown(parentElement) {
      const itemmenu = parentElement.querySelector("[ap-controlsaria]");
      const itemdropdown = parentElement.querySelector(
        `#${itemmenu.getAttribute("ap-controlsaria")}`
      );
      requestAnimationFrame(() => {
        itemdropdown.classList.add("is-closing");
        itemmenu.setAttribute("ap-expanded-aria", "false");
        setTimeout(
          () => {
            itemdropdown.setAttribute("hidden", "");
            clearTimeout(this.timeoutOpen);
            itemdropdown.classList.remove("is-closing");
          },
          itemdropdown.classList.contains("mega-menu") && this.megaMenuCurrent !== itemdropdown
            ? 250
            : 0
        );
        this.dispatchEvent(
          new CustomEvent("desktop-nav:dropdown:close", {
            bubbles: true,
          })
        );
      });
    }
  };
  window.customElements.define("ap-navigationofdesktop", NavigationOfDesktop);

  var ApolloMobileMenu = class extends ApDrawerContent {
    get apparitionAnimation() {
      if (this._apparitionAnimation) {
        return this._apparitionAnimation;
      }
      if (!MediaFeatures.prefersReducedMotion()) {
        const navItems = Array.from(this.querySelectorAll('.mobile-nav__item[data-level="1"]')),
          effects = [];
        effects.push(
          new ApEffectParallel(
            navItems.map((item, index) => {
              return new ApEffectOfCustomKeyframe(
                item,
                {
                  opacity: [0, 1],
                  transform: ["translateX(-40px)", "translateX(0)"],
                },
                {
                  duration: 300,
                  delay: 300 + 120 * index - Math.min(2 * index * index, 120 * index),
                  easing: "cubic-bezier(0.25, 1, 0.5, 1)",
                }
              );
            })
          )
        );
        const bottomBar = this.querySelector(".drawer__footer");
        if (bottomBar) {
          effects.push(
            new ApEffectOfCustomKeyframe(
              bottomBar,
              {
                opacity: [0, 1],
                transform: ["translateY(100%)", "translateY(0)"],
              },
              {
                duration: 300,
                delay: 500 + Math.max(125 * navItems.length - 25 * navItems.length, 25),
                easing: "cubic-bezier(0.25, 1, 0.5, 1)",
              }
            )
          );
        }
        return (this._apparitionAnimation = new ApAnimationCustom(new ApEffectParallel(effects)));
      }
    }
    attributeChangedCallback(name, oldval, newval) {
      super.attributeChangedCallback(name, oldval, newval);
      switch (name) {
        case "open":
          if (this.open && this.apparitionAnimation) {
            Array.from(
              this.querySelectorAll('.mobile-nav__item[data-level="1"], .drawer__footer')
            ).forEach((item) => (item.style.opacity = 0));
            this.apparitionAnimation.play();
          }
          triggerEvent(this, this.open ? "mobile-nav:open" : "mobile-nav:close");
      }
    }
  };
  window.customElements.define("apollo-mobile-menu", ApolloMobileMenu);

  var ApolloVerticalMenu = class extends ApDrawerContent {
    get apparitionAnimation() {
      if (this._apparitionAnimation) {
        return this._apparitionAnimation;
      }
      if (!MediaFeatures.prefersReducedMotion()) {
        const navItems = Array.from(this.querySelectorAll('.vertical-nav__item[data-level="1"]')),
          effects = [];
        effects.push(
          new ApEffectParallel(
            navItems.map((item, index) => {
              return new ApEffectOfCustomKeyframe(
                item,
                {
                  opacity: [0, 1],
                  transform: ["translateX(-40px)", "translateX(0)"],
                },
                {
                  duration: 300,
                  delay: 300 + 120 * index - Math.min(2 * index * index, 120 * index),
                  easing: "cubic-bezier(0.25, 1, 0.5, 1)",
                }
              );
            })
          )
        );
        const bottomBar = this.querySelector(".drawer__footer");
        if (bottomBar) {
          effects.push(
            new ApEffectOfCustomKeyframe(
              bottomBar,
              {
                opacity: [0, 1],
                transform: ["translateY(100%)", "translateY(0)"],
              },
              {
                duration: 300,
                delay: 500 + Math.max(125 * navItems.length - 25 * navItems.length, 25),
                easing: "cubic-bezier(0.25, 1, 0.5, 1)",
              }
            )
          );
        }
        return (this._apparitionAnimation = new ApAnimationCustom(new ApEffectParallel(effects)));
      }
    }
    attributeChangedCallback(name, oldval, newval) {
      super.attributeChangedCallback(name, oldval, newval);
      switch (name) {
        case "open":
          if (this.open && this.apparitionAnimation) {
            Array.from(
              this.querySelectorAll('.vertical-nav__item[data-level="1"], .drawer__footer')
            ).forEach((item) => (item.style.opacity = 0));
            this.apparitionAnimation.play();
          }
          triggerEvent(this, this.open ? "vertical-nav:open" : "vertical-nav:close");
      }
    }
  };
  window.customElements.define("vertical-menu", ApolloVerticalMenu);

  var ApollocategoriesMenu = class extends ApDrawerContent {
    get apparitionAnimation() {
      if (this._apparitionAnimation) {
        return this._apparitionAnimation;
      }
      if (!MediaFeatures.prefersReducedMotion()) {
        const navItems = Array.from(this.querySelectorAll('.categories-nav__item[data-level="1"]')),
          effects = [];
        effects.push(
          new ApEffectParallel(
            navItems.map((item, index) => {
              return new ApEffectOfCustomKeyframe(
                item,
                {
                  opacity: [0, 1],
                  transform: ["translateX(-40px)", "translateX(0)"],
                },
                {
                  duration: 300,
                  delay: 300 + 120 * index - Math.min(2 * index * index, 120 * index),
                  easing: "cubic-bezier(0.25, 1, 0.5, 1)",
                }
              );
            })
          )
        );
        const bottomBar = this.querySelector(".drawer__footer");
        if (bottomBar) {
          effects.push(
            new ApEffectOfCustomKeyframe(
              bottomBar,
              {
                opacity: [0, 1],
                transform: ["translateY(100%)", "translateY(0)"],
              },
              {
                duration: 300,
                delay: 500 + Math.max(125 * navItems.length - 25 * navItems.length, 25),
                easing: "cubic-bezier(0.25, 1, 0.5, 1)",
              }
            )
          );
        }
        return (this._apparitionAnimation = new ApAnimationCustom(new ApEffectParallel(effects)));
      }
    }
    attributeChangedCallback(name, oldval, newval) {
      super.attributeChangedCallback(name, oldval, newval);
      switch (name) {
        case "open":
          if (this.open && this.apparitionAnimation) {
            Array.from(
              this.querySelectorAll('.categories-nav__item[data-level="1"], .drawer__footer')
            ).forEach((item) => (item.style.opacity = 0));
            this.apparitionAnimation.play();
          }
          triggerEvent(this, this.open ? "categories-nav:open" : "categories-nav:close");
      }
    }
  };
  window.customElements.define("categories-menu", ApollocategoriesMenu);

  var ApolloVerticalMenu = class extends ApDrawerContent {
    get apparitionAnimation() {
      if (this._apparitionAnimation) {
        return this._apparitionAnimation;
      }
    }
    attributeChangedCallback(name, oldval, newval) {
      super.attributeChangedCallback(name, oldval, newval);
    }
  };
  window.customElements.define("bar-menu", ApolloVerticalMenu);

  var ApHeaderStore = class extends CustomHTMLElement {
    connectedCallback() {
      if (window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(this._apUpdatePropertiesCustom.bind(this));
        this.resizeObserver.observe(this);
        this.resizeObserver.observe(this.querySelector(".header_wrapper"));
      }
      if (this.transparentStatus) {
        this.isTransparencyDetectionLocked = false;
        this.apollo.on("desktop-nav:dropdown:open", () => (this.lockTransparency = true));
        this.apollo.on("desktop-nav:dropdown:close", () => (this.lockTransparency = false));
        this.rootApollo.on("mobile-nav:open", () => (this.lockTransparency = true));
        this.rootApollo.on("mobile-nav:close", () => (this.lockTransparency = false));
        this.apollo.on("mouseenter", this._checkHeaderTransparent.bind(this), true);
        this.apollo.on("mouseleave", this._checkHeaderTransparent.bind(this));
        if (this.stickyStatus) {
          this._checkHeaderTransparent();
          this._onWindowScrollListener = apStream(this._checkHeaderTransparent.bind(this), 100);
          window.addEventListener("scroll", this._onWindowScrollListener);
        }
      }
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      if (window.ResizeObserver) {
        this.resizeObserver.disconnect();
      }
      if (this.transparentStatus && this.stickyStatus) {
        window.removeEventListener("scroll", this._onWindowScrollListener);
      }
    }
    get stickyStatus() {
      return this.hasAttribute("sticky");
    }
    get transparentStatus() {
      return this.hasAttribute("transparent");
    }
    get transparentHeaderThreshold() {
      return 25;
    }
    set lockTransparency(value) {
      this.isTransparencyDetectionLocked = value;
      this._checkHeaderTransparent();
    }
    _apUpdatePropertiesCustom(entries) {
      entries.forEach((entry) => {
        if (entry.target === this) {
          let h = 0;
          if (entry.borderBoxSize) {
            if (entry.borderBoxSize.length > 0) {
              h = entry.borderBoxSize[0].blockSize;
            } else {
              h = entry.borderBoxSize.blockSize;
            }
          } else {
            h = entry.target.clientHeight;
          }
          const height = h;
          document.documentElement.style.setProperty("--header-height", `${height}px`);
        }
        if (entry.target.classList.contains("header_wrapper")) {
          let h = 0;
          if (entry.borderBoxSize) {
            if (entry.borderBoxSize.length > 0) {
              h = entry.borderBoxSize[0].blockSize;
            } else {
              h = entry.borderBoxSize.blockSize;
            }
          } else {
            h = entry.target.clientHeight;
          }
          const heightWithoutNav = h;
          document.documentElement.style.setProperty(
            "--header-height-without-bottom-nav",
            `${heightWithoutNav}px`
          );
        }
      });
    }
    _checkHeaderTransparent(event) {
      if (
        this.isTransparencyDetectionLocked ||
        window.scrollY > this.transparentHeaderThreshold ||
        (event && event.type === "mouseenter")
      ) {
        this.classList.remove("header-transparent");
      } else {
        this.classList.add("header-transparent");
      }
    }
  };
  window.customElements.define("ap-headerstore", ApHeaderStore);

  var ApSwipePhotoUi = class {
    constructor(pswp) {
      this.photoSwipeInstance = pswp;
      this.apollo = new main_default(this.photoSwipeInstance.scrollWrap);
      this.maxSpreadZoom = window.themeVariables.settings.mobileZoomFactor || 2;
      this.pswpUi = this.photoSwipeInstance.scrollWrap.querySelector(".pswp__ui");
      this.apollo.on("click", '[data-action="pswp-close"]', this._close.bind(this));
      this.apollo.on("click", '[data-action="pswp-prev"]', this._evtGoToPrev.bind(this));
      this.apollo.on("click", '[data-action="pswp-next"]', this._evtGoToNext.bind(this));
      this.apollo.on("click", '[data-action="apswp-move-to"]', this._evtMoveTo.bind(this));
      this.photoSwipeInstance.listen("close", this._evtOnClosedApSwp.bind(this));
      this.photoSwipeInstance.listen("doubleTap", this._evtOnDoubleTapApSwp.bind(this));
      this.photoSwipeInstance.listen("beforeChange", this._evtOnBeforeChangeApSwp.bind(this));
      this.photoSwipeInstance.listen(
        "initialZoomInEnd",
        this._evtOnInitialZoomInEndApSwp.bind(this)
      );
      this.photoSwipeInstance.listen("initialZoomOut", this._evtOnInitialZoomOutApSwp.bind(this));
      this.photoSwipeInstance.listen(
        "parseVerticalMargin",
        this._evtOnParseVerticalMarginApSwp.bind(this)
      );
      this.apollo.on("pswpTap", ".pswp__img", this._evtOnTapApSwp.bind(this));
    }
    init() {
      const buttonsNextPrev = this.pswpUi.querySelector(".pswp__prev-next-buttons");
      const wrapperNavDots = this.pswpUi.querySelector(".pswp__dots-nav-wrapper");
      if (this.photoSwipeInstance.items.length <= 1) {
        buttonsNextPrev.style.display = "none";
        wrapperNavDots.style.display = "none";
        return;
      }
      buttonsNextPrev.style.display = "";
      wrapperNavDots.style.display = "";
      let dotsHtmlNav = "";
      this.photoSwipeInstance.items.forEach((item, index) => {
        dotsHtmlNav += `
        <button class="dots-nav__item tap-area" ${
          index === 0 ? 'ap-currentaria="true"' : ""
        } data-action="apswp-move-to">
          <span class="visually-hidden">Go to slide ${index}</span>
        </button>
      `;
      });
      wrapperNavDots.querySelector(".pswp__dots-nav-wrapper .dots-nav").innerHTML = dotsHtmlNav;
    }
    _close() {
      this.photoSwipeInstance.close();
    }
    _evtGoToPrev() {
      this.photoSwipeInstance.prev();
    }
    _evtGoToNext() {
      this.photoSwipeInstance.next();
    }
    _evtMoveTo(event, target) {
      this.photoSwipeInstance.goTo([...target.parentNode.children].indexOf(target));
    }
    _evtOnClosedApSwp() {
      this.apollo.off("pswpTap");
    }
    _evtOnDoubleTapApSwp(point) {
      const initialZoomLevel = this.photoSwipeInstance.currItem.initialZoomLevel;
      if (this.photoSwipeInstance.getZoomLevel() !== initialZoomLevel) {
        this.photoSwipeInstance.zoomTo(initialZoomLevel, point, 333);
      } else {
        let val = this.maxSpreadZoom;
        if (initialZoomLevel < 0.7) {
          val = 1;
        }
        this.photoSwipeInstance.zoomTo(val, point, 333);
      }
    }
    _evtOnTapApSwp(event) {
      if (event.detail.pointerType === "mouse") {
        this.photoSwipeInstance.toggleDesktopZoom(event.detail.releasePoint);
      }
    }
    _evtOnBeforeChangeApSwp() {
      if (this.photoSwipeInstance.items.length <= 1) {
        return;
      }
      const activeDot = this.photoSwipeInstance.scrollWrap.querySelector(
        `.dots-nav__item:nth-child(${this.photoSwipeInstance.getCurrentIndex() + 1})`
      );
      activeDot.setAttribute("ap-currentaria", "true");
      apSiblings(activeDot).forEach((item) => item.removeAttribute("ap-currentaria"));
    }
    _evtOnInitialZoomInEndApSwp() {
      var _a;
      (_a = this.pswpUi) == null ? void 0 : _a.classList.remove("pswp__ui--hidden");
    }
    _evtOnInitialZoomOutApSwp() {
      var _a;
      (_a = this.pswpUi) == null ? void 0 : _a.classList.add("pswp__ui--hidden");
    }
    _evtOnParseVerticalMarginApSwp(item) {
      item.vGap.bottom =
        this.photoSwipeInstance.items.length <= 1 ||
        window.matchMedia(window.themeVariables.breakpoints.lapAndUp).matches
          ? 0
          : 60;
    }
  };
  var ApProductZoomImage = class extends ApolloOpenableElement {
    connectedCallback() {
      super.connectedCallback();
      this.mediaElement = document.getElementById("ap_product_detail_media");
      this.maxSpreadZoom = window.themeVariables.settings.mobileZoomFactor || 2;
      ApLoaderLibrary.load("photoswipe");
    }
    disconnectedCallback() {
      var _a;
      super.disconnectedCallback();
      (_a = this.photoSwipeInstance) == null ? void 0 : _a.destroy();
    }
    async attributeChangedCallback(name, oldval, newval) {
      super.attributeChangedCallback(name, oldval, newval);
      switch (name) {
        case "open":
          if (this.open) {
            await ApLoaderLibrary.load("photoswipe");
            this._openPhotoSwipe();
          }
      }
    }
    async _openPhotoSwipe() {
      const items = await this._buildItemsSwipe();
      this.photoSwipeInstance = new window.ThemePhotoSwipe(this, ApSwipePhotoUi, items, {
        index: items.findIndex((item) => item.selected),
        maxSpreadZoom: this.maxSpreadZoom,
        loop: false,
        allowPanToNext: false,
        closeOnScroll: false,
        closeOnVerticalDrag: MediaFeatures.supportsHover(),
        showHideOpacity: true,
        arrowKeys: true,
        history: false,
        getThumbBoundsFn: () => {
          const thumbnail = this.mediaElement.querySelector(".product__media-item.is-selected");
          const pageYScroll = window.pageYOffset || document.documentElement.scrollTop;
          const rect = thumbnail.getBoundingClientRect();
          return {
            x: rect.left,
            y: rect.top + pageYScroll,
            w: rect.width,
          };
        },
        getDoubleTapZoom: (isMouseClick, item) => {
          if (isMouseClick) {
            if (item.w > item.h) {
              return 1.6;
            } else {
              return 1;
            }
          } else {
            if (item.initialZoomLevel < 0.7) {
              return 1;
            } else {
              return 1.33;
            }
          }
        },
      });
      let last_Width = null;
      this.photoSwipeInstance.updateSize = new Proxy(this.photoSwipeInstance.updateSize, {
        apply: (target, thisArg, argArray) => {
          if (last_Width !== window.innerWidth) {
            target(arguments);
            last_Width = window.innerWidth;
          }
        },
      });
      this.photoSwipeInstance.listen("close", () => {
        this.open = false;
      });
      this.photoSwipeInstance.init();
    }
    async _buildItemsSwipe() {
      const activeImages = Array.from(
          this.mediaElement.querySelectorAll(
            '.product__media-item[data-media-type="image"]:not(.is-filtered)'
          )
        ),
        product = await ApLoaderProduct.load(this.getAttribute("product-handle"));
      return Promise.resolve(
        activeImages.map((item) => {
          const matchedMedia = product["media"].find(
            (media) => media.id === parseInt(item.getAttribute("data-media-id"))
          );
          const supportedSizes = apGetSupportedSizes(
            matchedMedia,
            [
              200, 300, 400, 500, 600, 700, 800, 1e3, 1200, 1400, 1600, 1800, 2e3, 2200, 2400, 2600,
              2800, 3e3,
            ]
          );
          const desiredWidth = Math.min(
            supportedSizes[supportedSizes.length - 1],
            window.innerWidth
          );
          return {
            selected: item.classList.contains("is-selected"),
            src: apGetSizedOfMediaUrl(
              matchedMedia,
              `${Math.ceil(
                Math.min(desiredWidth * window.devicePixelRatio * this.maxSpreadZoom, 3e3)
              )}x`
            ),
            msrc: item.firstElementChild.currentSrc,
            originalMedia: matchedMedia,
            w: desiredWidth,
            h: parseInt(desiredWidth / matchedMedia["aspect_ratio"]),
          };
        })
      );
    }
  };
  window.customElements.define("ap-productzoomimage", ApProductZoomImage);

  var ApInventoryProduct = class extends HTMLElement {
    connectedCallback() {
      var _a;
      const scriptTag = this.querySelector("script");
      if (!scriptTag) {
        return;
      }
      this.inventories = JSON.parse(scriptTag.innerHTML);
      if ((_a = document.getElementById(this.getAttribute("form-id"))) == null) {
        void 0;
      } else {
        _a.addEventListener("variant:changed", this._evtOnChangedVariant.bind(this));
      }
    }
    _evtOnChangedVariant(event) {
      var _a;
      (_a = this.querySelector("span")) == null ? void 0 : _a.remove();
      if (event.detail.variant && this.inventories[event.detail.variant["id"]] !== "") {
        this.hidden = false;
        this.insertAdjacentHTML("afterbegin", this.inventories[event.detail.variant["id"]]);
      } else {
        this.hidden = true;
      }
    }
  };
  window.customElements.define("ap-inventoryproduct", ApInventoryProduct);

  var ApContainerPayment = class extends HTMLElement {
    connectedCallback() {
      var _a;
      if ((_a = document.getElementById(this.getAttribute("form-id"))) == null) {
        void 0;
      } else {
        _a.addEventListener("variant:changed", this._evtOnChangedVariant.bind(this));
      }
      if (Shopify.designMode && Shopify.PaymentButton) {
        Shopify.PaymentButton.init();
      }
    }
    _evtOnChangedVariant(event) {
      this._evtUpdateAddToCartButton(event.detail.variant);
      this._evtUpdateCheckoutButtonDynamic(event.detail.variant);
    }
    _evtUpdateAddToCartButton(variant) {
      let addToCartObjectButtonElement = this.querySelector("[data-product-add-to-cart-button]");
      if (!addToCartObjectButtonElement) {
        return;
      }
      let addToCartTextButton = "";
      addToCartObjectButtonElement.classList.remove(
        "button--primary",
        "button--secondary",
        "button--ternary"
      );
      if (!variant) {
        addToCartObjectButtonElement.setAttribute("disabled", "disabled");
        addToCartObjectButtonElement.classList.add("button--ternary");
        addToCartTextButton = window.themeVariables.strings.productFormUnavailable;
      } else {
        if (variant["available"]) {
          addToCartObjectButtonElement.removeAttribute("disabled");
          addToCartObjectButtonElement.classList.add(
            addToCartObjectButtonElement.hasAttribute("data-use-primary")
              ? "button--primary"
              : "button--secondary"
          );
          addToCartTextButton = addToCartObjectButtonElement.getAttribute("data-button-content");
        } else {
          addToCartObjectButtonElement.setAttribute("disabled", "disabled");
          addToCartObjectButtonElement.classList.add("button--ternary");
          addToCartTextButton = window.themeVariables.strings.productFormSoldOut;
        }
      }
      if (addToCartObjectButtonElement.getAttribute("is") === "loader-button") {
        addToCartObjectButtonElement.firstElementChild.innerHTML = addToCartTextButton;
      } else {
        addToCartObjectButtonElement.innerHTML = addToCartTextButton;
      }
    }
    _evtUpdateCheckoutButtonDynamic(variant) {
      let paymentObjectButtonElement = this.querySelector(".shopify-payment-button");
      if (!paymentObjectButtonElement) {
        return;
      }
      paymentObjectButtonElement.style.display =
        !variant || !variant["available"] ? "none" : "block";
    }
  };
  window.customElements.define("ap-paymentcontainerproduct", ApContainerPayment);

  var ApProductPaymentTerms = class extends CustomHTMLElement {
    connectedCallback() {
      var _a;
      if ((_a = document.getElementById(this.getAttribute("form-id"))) == null) {
        void 0;
      } else {
        _a.addEventListener("variant:changed", this._evtOnChangedVariant.bind(this));
      }
    }
    _evtOnChangedVariant(event) {
      const variant = event.detail.variant;
      if (variant) {
        const elementId = this.querySelector('[name="id"]');
        elementId.value = variant["id"];
        elementId.dispatchEvent(
          new Event("change", {
            bubbles: true,
          })
        );
      }
    }
  };
  window.customElements.define("ap-productpaymentterms", ApProductPaymentTerms);

  var ApProductForm = class extends HTMLFormElement {
    connectedCallback() {
      this.id.disabled = false;
      if (
        window.themeVariables.settings.cartType === "page" ||
        window.themeVariables.settings.pageType === "cart"
      ) {
        return;
      }
      this.addEventListener("submit", this._onSubmitApProductForm.bind(this));
    }
    async _onSubmitApProductForm(event) {
      event.preventDefault();
      if (!this.checkValidity()) {
        this.reportValidity();
        return;
      }
      const submitButtons = Array.from(this.elements).filter((button) => button.type === "submit");
      submitButtons.forEach((submitButton) => {
        submitButton.setAttribute("disabled", "disabled");
        submitButton.setAttribute("ap-ariabusy", "true");
      });
      const product_Form = new FormData(this);
      product_Form.append("sections", ["mini-cart"]);
      product_Form.delete("option1");
      product_Form.delete("option2");
      product_Form.delete("option3");
      const response = await fetch(`${window.themeVariables.routes.cartAddUrl}.js`, {
        body: product_Form,
        method: "POST",
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      submitButtons.forEach((submitButton) => {
        submitButton.removeAttribute("disabled");
        submitButton.removeAttribute("ap-ariabusy");
      });
      const responseJson = await response.json();
      if (response.ok) {
        let val = responseJson;
        if (responseJson.hasOwnProperty("items")) {
          val = responseJson["items"][0];
        }
        this.dispatchEvent(
          new CustomEvent("variant:added", {
            bubbles: true,
            detail: {
              variant: val,
            },
          })
        );
        fetch(`${window.themeVariables.routes.cartUrl}.js`).then(async (response2) => {
          const cartContent = await response2.json();
          document.documentElement.dispatchEvent(
            new CustomEvent("cart:updated", {
              bubbles: true,
              detail: {
                cart: cartContent,
              },
            })
          );
        });
        document.documentElement.dispatchEvent(
          new CustomEvent("cart:refresh", {
            bubbles: true,
            detail: {
              cart: responseJson,
              openMiniCart:
                window.themeVariables.settings.cartType === "drawer" &&
                this.closest(".drawer") === null,
            },
          })
        );
      }
      this.dispatchEvent(
        new CustomEvent("ap-cartnotification:show", {
          bubbles: true,
          cancelable: true,
          detail: {
            status: response.ok ? "success" : "error",
            error: responseJson["description"] || "",
          },
        })
      );
    }
  };
  window.customElements.define("ap-productform", ApProductForm, {
    extends: "form",
  });

  var ApProductMedia = class extends CustomHTMLElement {
    async connectedCallback() {
      var _a;
      this.flickityCarousel = this.querySelector("ap-flickitycarousel");
      if (this.hasAttribute("reveal-on-scroll")) {
        this._setupTextOverlayImageVisibility();
      }
      if (
        this.flickityCarousel.childElementCount === 1 ||
        this.querySelector(".ap-product-media-list").getAttribute("list-type")
      ) {
        return;
      }
      this.selectedVariantMediaId = null;
      this.viewInSpaceElement = this.querySelector("[data-shopify-model3d-id]");
      this.buttonZoom = this.querySelector(".product__zoom-button");
      this.product = await ApLoaderProduct.load(this.getAttribute("product-handle"));
      (_a = document.getElementById(this.getAttribute("form-id"))) == null
        ? void 0
        : _a.addEventListener("variant:changed", this._evtOnChangedVariant.bind(this));
      this.flickityCarousel.addEventListener("model:played", () =>
        this.flickityCarousel.setDraggable(false)
      );
      this.flickityCarousel.addEventListener("model:paused", () =>
        this.flickityCarousel.setDraggable(true)
      );
      this.flickityCarousel.addEventListener("video:played", () =>
        this.flickityCarousel.setDraggable(false)
      );
      this.flickityCarousel.addEventListener("video:paused", () =>
        this.flickityCarousel.setDraggable(true)
      );
      // this.flickityCarousel.addEventListener("flickity:ready", this._evtOnFlickityReady.bind(this));
      this.flickityCarousel.addEventListener(
        "flickity:slide-changed",
        this._eveOnFlickityChanged.bind(this)
      );
      this.flickityCarousel.addEventListener(
        "flickity:slide-settled",
        this._evtOnFlickitySettled.bind(this)
      );
      // this._evtOnFlickityReady();
    }
    get thumbnailsPosition() {
      return window.matchMedia(window.themeVariables.breakpoints.pocket).matches
        ? "bottom"
        : this.getAttribute("thumbnails-position");
    }
    async _setupTextOverlayImageVisibility() {
      await this.untilObjectVisible();
      const flickityInstance = await this.flickityCarousel.flickityInstance;
      let ap_image = this.querySelector(".ap-product-media-image-wrapper img");
      if (flickityInstance) {
        ap_image = flickityInstance.selectedElement.querySelector("img");
      }
      const image = ap_image;
      const prefersReducedMotion = MediaFeatures.prefersReducedMotion();
      await imageLoaded(image);
      const animation = new ApAnimationCustom(
        new ApEffectParallel([
          new ApEffectOfCustomKeyframe(
            image,
            {
              opacity: [0, 1],
              transform: [`scale(${prefersReducedMotion ? 1 : 1.1})`, "scale(1)"],
            },
            {
              duration: 500,
              easing: "cubic-bezier(0.65, 0, 0.35, 1)",
            }
          ),
          new ApEffectParallel(
            Array.from(this.querySelectorAll(".product__thumbnail-item:not(.is-filtered)")).map(
              (item, index) => {
                return new ApEffectOfCustomKeyframe(
                  item,
                  {
                    opacity: [0, 1],
                    transform:
                      this.thumbnailsPosition === "left"
                        ? [`translateY(${prefersReducedMotion ? 0 : "40px"})`, "translateY(0)"]
                        : [`translateX(${prefersReducedMotion ? 0 : "50px"})`, "translateX(0)"],
                  },
                  {
                    duration: 250,
                    delay: prefersReducedMotion ? 0 : 100 * index,
                    easing: "cubic-bezier(0.75, 0, 0.175, 1)",
                  }
                );
              }
            )
          ),
        ])
      );
      this._sectionReloadedStatus ? animation.finish() : animation.play();
    }
    async _evtOnChangedVariant(event) {
      const productvariant = event.detail.variant;
      const mediaIdsFiltered = [];
      let mediaReloadStatus = false;
      this.product["media"].forEach((media) => {
        var _a;
        let matchMedia2 =
          productvariant["featured_media"] &&
          media["id"] === productvariant["featured_media"]["id"];
        if ((_a = media["alt"]) == null ? void 0 : _a.includes("#")) {
          mediaReloadStatus = true;
          if (!matchMedia2) {
            const altofParts = media["alt"].split("#"),
              mediaGroupParts = altofParts.pop().split("_");
            this.product["options"].forEach((option) => {
              if (option["name"].toLowerCase() === mediaGroupParts[0].toLowerCase()) {
                if (
                  productvariant["options"][option["position"] - 1].toLowerCase() !==
                  mediaGroupParts[1].trim().toLowerCase()
                ) {
                  mediaIdsFiltered.push(media["id"]);
                }
              }
            });
          }
        }
      });
      const currentlyFilteredIds = [
        ...new Set(
          Array.from(this.querySelectorAll(".is-filtered[data-media-id]")).map((item) =>
            parseInt(item.getAttribute("data-media-id"))
          )
        ),
      ];
      if (currentlyFilteredIds.some((value) => !mediaIdsFiltered.includes(value))) {
        const selectedMediaId = productvariant["featured_media"]
          ? productvariant["featured_media"]["id"]
          : this.product["media"]
              .map((item) => item.id)
              .filter((item) => !mediaIdsFiltered.includes(item))[0];
        Array.from(this.querySelectorAll("[data-media-id]")).forEach((item) => {
          item.classList.toggle(
            "is-filtered",
            mediaIdsFiltered.includes(parseInt(item.getAttribute("data-media-id")))
          );
          item.classList.toggle(
            "is-selected",
            selectedMediaId === parseInt(item.getAttribute("data-media-id"))
          );
          item.classList.toggle(
            "is-initial-selected",
            selectedMediaId === parseInt(item.getAttribute("data-media-id"))
          );
        });
        this.flickityCarousel.reload();
      } else {
        if (
          !event.detail.variant["featured_media"] ||
          this.selectedVariantMediaId === event.detail.variant["featured_media"]["id"]
        ) {
          return;
        }
        this.flickityCarousel.select(
          `[data-media-id="${event.detail.variant["featured_media"]["id"]}"]`
        );
      }
      this.selectedVariantMediaId = event.detail.variant["featured_media"]
        ? event.detail.variant["featured_media"]["id"]
        : null;
    }
    // async _evtOnFlickityReady() {
    //   const flickityInstance = await this.flickityCarousel.flickityInstance;
    //   if (["video", "external_video"].includes(flickityInstance.selectedElement.getAttribute("data-media-type")) && this.hasAttribute("autoplay-video")) {
    //     flickityInstance.selectedElement.firstElementChild.play();
    //   }
    // }
    async _eveOnFlickityChanged() {
      const flickityInstance = await this.flickityCarousel.flickityInstance;
      flickityInstance.cells.forEach((item) => {
        if (
          ["external_video", "video", "model"].includes(
            item.element.getAttribute("data-media-type")
          )
        ) {
          if (item.element.firstElementChild) {
            item.element.firstElementChild.pause();
          }
        }
      });
    }
    async _evtOnFlickitySettled() {
      const flickityInstance = await this.flickityCarousel.flickityInstance;
      const selectedSlide = flickityInstance.selectedElement;
      if (this.buttonZoom) {
        this.buttonZoom.hidden = selectedSlide.getAttribute("data-media-type") !== "image";
      }
      if (this.viewInSpaceElement) {
        this.viewInSpaceElement.setAttribute(
          "data-shopify-model3d-id",
          this.viewInSpaceElement.getAttribute("data-shopify-model3d-default-id")
        );
      }
      switch (selectedSlide.getAttribute("data-media-type")) {
        case "model":
          this.viewInSpaceElement.setAttribute(
            "data-shopify-model3d-id",
            selectedSlide.getAttribute("data-media-id")
          );
          selectedSlide.firstElementChild.play();
          break;
        case "external_video":
        case "video":
          if (this.hasAttribute("autoplay-video")) {
            selectedSlide.firstElementChild.play();
          }
          break;
      }
    }
  };
  window.customElements.define("ap-productmedia", ApProductMedia);

  function apMoneyFormat(cents, format = "") {
    if (typeof cents === "string") {
      cents = cents.replace(".", "");
    }
    const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/,
      formatString = format || window.themeVariables.settings.moneyFormat;

    function defaultTo(value2, defaultValue) {
      return value2 == null || value2 !== value2 ? defaultValue : value2;
    }

    function formatWithDelimiters(number, precision, thousands, decimal) {
      precision = defaultTo(precision, 2);
      thousands = defaultTo(thousands, ",");
      decimal = defaultTo(decimal, ".");
      if (isNaN(number) || number == null) {
        return 0;
      }
      number = (number / 100).toFixed(precision);
      let parts = number.split("."),
        dollarsAmount = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + thousands),
        centsAmount = parts[1] ? decimal + parts[1] : "";
      return dollarsAmount + centsAmount;
    }
    let value = "";
    switch (formatString.match(placeholderRegex)[1]) {
      case "amount":
        value = formatWithDelimiters(cents, 2);
        break;
      case "amount_no_decimals":
        value = formatWithDelimiters(cents, 0);
        break;
      case "amount_with_space_separator":
        value = formatWithDelimiters(cents, 2, " ", ".");
        break;
      case "amount_with_comma_separator":
        value = formatWithDelimiters(cents, 2, ".", ",");
        break;
      case "amount_with_apostrophe_separator":
        value = formatWithDelimiters(cents, 2, "'", ".");
        break;
      case "amount_no_decimals_with_comma_separator":
        value = formatWithDelimiters(cents, 0, ",", ".");
        break;
      case "amount_no_decimals_with_space_separator":
        value = formatWithDelimiters(cents, 0, " ");
        break;
      case "amount_no_decimals_with_apostrophe_separator":
        value = formatWithDelimiters(cents, 0, "'");
        break;
    }
    if (formatString.indexOf("with_comma_separator") !== -1) {
      return formatString.replace(placeholderRegex, value);
    } else {
      return formatString.replace(placeholderRegex, value);
    }
  }

  var ApProductMeta = class extends HTMLElement {
    connectedCallback() {
      var _a;
      (_a = document.getElementById(this.getAttribute("form-id"))) == null
        ? void 0
        : _a.addEventListener("variant:changed", this._evtOnChangedVariant.bind(this));
    }
    get priceClass() {
      return this.getAttribute("ap-priceclass") || "";
    }
    get unitPriceClass() {
      return this.getAttribute("ap-unitpriceclass") || "";
    }
    _evtOnChangedVariant(event) {
      this._evtLabelsUpdate(event.detail.variant);
      this._evtPricesUpdate(event.detail.variant);
      this._evtSkuUpdate(event.detail.variant);
    }
    _evtLabelsUpdate(variant) {
      let productListLabel = this.querySelector("[data-product-label-list]");
      if (!productListLabel) {
        return;
      }
      if (!variant) {
        productListLabel.innerHTML = "";
      } else {
        productListLabel.innerHTML = "";
        if (!variant["available"]) {
          productListLabel.innerHTML = `<span class="label label--subdued">${window.themeVariables.strings.collectionSoldOut}</span>`;
        } else if (variant["compare_at_price"] > variant["price"]) {
          let priceDiscount = "";
          if (window.themeVariables.settings.discountMode === "percentage") {
            priceDiscount = `${Math.round(
              ((variant["compare_at_price"] - variant["price"]) * 100) / variant["compare_at_price"]
            )}%`;
          } else {
            priceDiscount = apMoneyFormat(variant["compare_at_price"] - variant["price"]);
          }
          productListLabel.innerHTML = `<span class="label label--highlight">${window.themeVariables.strings.collectionDiscount.replace(
            "@savings@",
            priceDiscount
          )}</span>`;
        }
      }
    }
    _evtPricesUpdate(variant) {
      let listProductPrices = this.querySelector("[data-product-price-list]");
      let currencyFormat = window.themeVariables.settings.moneyFormat;
      if (window.themeVariables.settings.currencyCodeEnabled) {
        currencyFormat = window.themeVariables.settings.moneyWithCurrencyFormat;
      }
      if (!listProductPrices) {
        return;
      }
      if (!variant) {
        listProductPrices.style.display = "none";
      } else {
        listProductPrices.innerHTML = "";
        if (variant["compare_at_price"] > variant["price"]) {
          listProductPrices.innerHTML += `<span class="price price--highlight ${
            this.priceClass
          }"><span class="visually-hidden">${
            window.themeVariables.strings.productSalePrice
          }</span>${apMoneyFormat(variant["price"], currencyFormat)}</span>`;
          listProductPrices.innerHTML += `<span class="price price--compare"><span class="visually-hidden">${
            window.themeVariables.strings.productRegularPrice
          }</span>${apMoneyFormat(variant["compare_at_price"], currencyFormat)}</span>`;
        } else {
          listProductPrices.innerHTML += `<span class="price ${
            this.priceClass
          }"><span class="visually-hidden">${
            window.themeVariables.strings.productSalePrice
          }</span>${apMoneyFormat(variant["price"], currencyFormat)}</span>`;
        }
        if (variant["unit_price_measurement"]) {
          let referenceValue = "";
          if (variant["unit_price_measurement"]["reference_value"] !== 1) {
            referenceValue = `<span class="unit-price-measurement__reference-value">${variant["unit_price_measurement"]["reference_value"]}</span>`;
          }
          listProductPrices.innerHTML += `
          <div class="price text--subdued ${this.unitPriceClass}">
            <div class="unit-price-measurement">
              <span class="unit-price-measurement__price">${apMoneyFormat(
                variant["unit_price"]
              )}</span>
              <span class="unit-price-measurement__separator">/</span>
              ${referenceValue}
              <span class="unit-price-measurement__reference-unit">${
                variant["unit_price_measurement"]["reference_unit"]
              }</span>
            </div>
          </div>
        `;
        }
        listProductPrices.style.display = "";
      }
    }
    _evtSkuUpdate(variant) {
      let sku = this.querySelector("[data-product-sku-container]");
      if (!sku) {
        return;
      }
      let skuNumber = sku.querySelector("[data-product-sku-number]");
      if (!variant || !variant["sku"]) {
        sku.style.display = "none";
      } else {
        skuNumber.innerHTML = variant["sku"];
        sku.style.display = "";
      }
    }
  };
  window.customElements.define("ap-productmeta", ApProductMeta);

  var ApQuickBuy = class extends ApDrawerContent {
    connectedCallback() {
      super.connectedCallback();
      this.apollo.on("variant:changed", this._evtOnChangedVariant.bind(this));
    }
    async _load() {
      await super._load();
      this.elementImage = this.querySelector(".ap-quickbuyproduct__image");
      if (window.Shopify && window.Shopify.PaymentButton) {
        window.Shopify.PaymentButton.init();
      }
    }
    _evtOnChangedVariant(event) {
      const variant = event.detail.variant;
      if (variant) {
        Array.from(this.querySelectorAll(`[href*="/products"]`)).forEach((link) => {
          const url = new URL(link.href);
          url.searchParams.set("variant", variant["id"]);
          link.setAttribute("href", url.toString());
        });
      }
      if (!this.elementImage || !variant || !variant["featured_media"]) {
        return;
      }
      const featuredMedia = variant["featured_media"];
      if (featuredMedia["alt"]) {
        this.elementImage.setAttribute("alt", featuredMedia["alt"]);
      }
      this.elementImage.setAttribute("width", featuredMedia["preview_image"]["width"]);
      this.elementImage.setAttribute("height", featuredMedia["preview_image"]["height"]);
      this.elementImage.setAttribute("src", apGetSizedOfMediaUrl(featuredMedia, "342x"));
      this.elementImage.setAttribute("data-srcset", apGetMediasrcset(featuredMedia, [114, 228, 342]));
    }
  };
  window.customElements.define("ap-quickbuy", ApQuickBuy);

  var ApPopoverQuickBuy = class extends ApolloPopContent {
    connectedCallback() {
      super.connectedCallback();
      this.apollo.on("variant:changed", this._evtOnChangedVariant.bind(this));
      this.apollo.on("variant:added", () => (this.open = false));
    }
    async _load() {
      await super._load();
      this.elementImage = this.querySelector(".ap-quickbuyproduct__image");
    }
    _evtOnChangedVariant(event) {
      const variant = event.detail.variant;
      if (variant) {
        Array.from(this.querySelectorAll(`[href*="/products"]`)).forEach((link) => {
          const url = new URL(link.href);
          url.searchParams.set("variant", variant["id"]);
          link.setAttribute("href", url.toString());
        });
      }
      if (!this.elementImage || !variant || !variant["featured_media"]) {
        return;
      }
      const featuredMedia = variant["featured_media"];
      if (featuredMedia["alt"]) {
        this.elementImage.setAttribute("alt", featuredMedia["alt"]);
      }
      let w = featuredMedia["preview_image"]["width"];
      this.elementImage.setAttribute("width", w);
      let h = featuredMedia["preview_image"]["height"];
      let src = apGetSizedOfMediaUrl(featuredMedia, "195x");
      let srcset = apGetMediasrcset(featuredMedia, [65, 130, 195]);
      this.elementImage.setAttribute("height", h);
      this.elementImage.setAttribute("src", src);
      this.elementImage.setAttribute("data-srcset", srcset);
    }
  };
  window.customElements.define("ap-popoverquickbuy", ApPopoverQuickBuy);

  var ApPickupStore = class extends HTMLElement {
    connectedCallback() {
      var _a;
      (_a = document.getElementById(this.getAttribute("form-id"))) == null
        ? void 0
        : _a.addEventListener("variant:changed", this._evtOnChangedVariant.bind(this));
    }
    _evtOnChangedVariant(event) {
      if (!event.detail.variant) {
        this.innerHTML = "";
      } else {
        this._evtRenderForVariant(event.detail.variant["id"]);
      }
    }
    async _evtRenderForVariant(id) {
      const response = await fetch(
          `${window.themeVariables.routes.rootUrlWithoutSlash}/variants/${id}?section_id=store-availability`
        ),
        div = document.createElement("div");
      div.innerHTML = await response.text();
      this.innerHTML = div.firstElementChild.innerHTML.trim();
    }
  };
  window.customElements.define("ap-pickupstore", ApPickupStore);

  var ApProductVariants = class extends CustomHTMLElement {
    async connectedCallback() {
      this.masterSelector = document.getElementById(this.getAttribute("form-id")).id;
      this.optionSelectors = Array.from(this.querySelectorAll("[data-selector-type]"));
      if (!this.masterSelector) {
        console.warn(
          `The variant selector for product with handle ${this.productHandle} is not linked to any product form.`
        );
        return;
      }
      this.product = await ApLoaderProduct.load(this.productHandle);
      this.apollo.on("change", '[name^="option"]', this._evtOnChangedOption.bind(this));
      this.masterSelector.addEventListener("change", this._evtOnMasterChangedSelector.bind(this));
      this._updateDisableSelectors();
      this._updateOptionPriceLabels();
      this.selectVariant(this.selectedVariant["id"]);
    }
    get selectedVariant() {
      return this._getVariantById(parseInt(this.masterSelector.value));
    }
    get productHandle() {
      return this.getAttribute("handle");
    }
    get hideSoldOutVariants() {
      return this.hasAttribute("hide-sold-out-variants");
    }
    get updateUrl() {
      return this.hasAttribute("update-url");
    }
    selectVariant(id) {
      var _a;
      if (!this._isVariantSelectable(this._getVariantById(id))) {
        id = this._getFirstMatchingAvailableVariant()["id"];
      }
      if (((_a = this.selectedVariant) == null ? void 0 : _a.id) === id) {
        this._updateDisableSelectors();
        this._updateOptionPriceLabels();
        return;
      }
      this.masterSelector.value = id;
      this.masterSelector.dispatchEvent(
        new Event("change", {
          bubbles: true,
        })
      );
      if (this.updateUrl && history.replaceState) {
        const newUrl = new URL(window.location.href);
        if (id) {
          newUrl.searchParams.set("variant", id);
        } else {
          newUrl.searchParams.delete("variant");
        }
        window.history.replaceState(
          {
            path: newUrl.toString(),
          },
          "",
          newUrl.toString()
        );
      }
      this._updateDisableSelectors();
      this._updateOptionPriceLabels();
      triggerEvent(this.masterSelector.form, "variant:changed", {
        variant: this.selectedVariant,
      });
    }
    _evtOnChangedOption() {
      var _a;
      this.selectVariant((_a = this._getVariantFromOptions()) == null ? void 0 : _a.id);
    }
    _evtOnMasterChangedSelector() {
      var _a;
      const options = ((_a = this.selectedVariant) == null ? void 0 : _a.options) || [];
      options.forEach((value, index) => {
        let input = this.querySelector(
            `input[name="option${index + 1}"][value="${CSS.escape(value)}"], select[name="option${
              index + 1
            }"]`
          ),
          triggerChangeEvent = false;
        if (input.tagName === "SELECT") {
          triggerChangeEvent = input.value !== value;
          input.value = value;
        } else if (input.tagName === "INPUT") {
          triggerChangeEvent = !input.checked && input.value === value;
          input.checked = input.value === value;
        }
        if (triggerChangeEvent) {
          input.dispatchEvent(
            new Event("change", {
              bubbles: true,
            })
          );
        }
      });
    }
    _getVariantById(id) {
      return this.product["variants"].find((variant) => variant["id"] === id);
    }
    _getVariantFromOptions() {
      const options = this._getSelectedOptionValues();
      return this.product["variants"].find((variant) => {
        return variant["options"].every((value, index) => value === options[index]);
      });
    }
    _isVariantSelectable(variant) {
      if (!variant) {
        return false;
      } else {
        return variant["available"] || (!this.hideSoldOutVariants && !variant["available"]);
      }
    }
    _getFirstMatchingAvailableVariant() {
      let options = this._getSelectedOptionValues(),
        matchedVariant = null,
        slicedCount = 0;
      do {
        options.pop();
        slicedCount += 1;
        matchedVariant = this.product["variants"].find((variant) => {
          return (
            variant["available"] &&
            variant["options"]
              .slice(0, variant["options"].length - slicedCount)
              .every((value, index) => value === options[index])
          );
        });
      } while (!matchedVariant && options.length > 0);
      return matchedVariant;
    }
    _getSelectedOptionValues() {
      const options = [];
      Array.from(
        this.querySelectorAll('input[name^="option"]:checked, select[name^="option"]')
      ).forEach((option) => options.push(option.value));
      return options;
    }
    _updateDisableSelectors() {
      const selectedVariant = this.selectedVariant;
      if (!selectedVariant) {
        return;
      }
      const applyClassToSelector = (selector, valueIndex, available, hasAtLeastOneCombination) => {
        let selectorType = selector.getAttribute("data-selector-type"),
          cssSelector = "";
        switch (selectorType) {
          case "color":
            cssSelector = `.color-swatch:nth-child(${valueIndex + 1})`;
            break;
          case "variant-image":
            cssSelector = `.variant-swatch:nth-child(${valueIndex + 1})`;
            break;
          case "block":
            cssSelector = `.block-swatch:nth-child(${valueIndex + 1})`;
            break;
          case "dropdown":
            cssSelector = `.ap-combobox__option-item:nth-child(${valueIndex + 1})`;
            break;
        }
        selector.querySelector(cssSelector).toggleAttribute("hidden", !hasAtLeastOneCombination);
        if (this.hideSoldOutVariants) {
          selector.querySelector(cssSelector).toggleAttribute("hidden", !available);
        } else {
          selector.querySelector(cssSelector).classList.toggle("is-disabled", !available);
        }
      };
      if (this.optionSelectors && this.optionSelectors[0]) {
        this.product["options"][0]["values"].forEach((value, valueIndex) => {
          const hasAtLeastOneCombination = this.product["variants"].some(
              (variant) => variant["option1"] === value && variant
            ),
            hasAvailableVariant = this.product["variants"].some(
              (variant) => variant["option1"] === value && variant["available"]
            );
          applyClassToSelector(
            this.optionSelectors[0],
            valueIndex,
            hasAvailableVariant,
            hasAtLeastOneCombination
          );
          if (this.optionSelectors[1]) {
            this.product["options"][1]["values"].forEach((value2, valueIndex2) => {
              const hasAtLeastOneCombination2 = this.product["variants"].some(
                  (variant) =>
                    variant["option2"] === value2 &&
                    variant["option1"] === selectedVariant["option1"] &&
                    variant
                ),
                hasAvailableVariant2 = this.product["variants"].some(
                  (variant) =>
                    variant["option2"] === value2 &&
                    variant["option1"] === selectedVariant["option1"] &&
                    variant["available"]
                );
              applyClassToSelector(
                this.optionSelectors[1],
                valueIndex2,
                hasAvailableVariant2,
                hasAtLeastOneCombination2
              );
              if (this.optionSelectors[2]) {
                this.product["options"][2]["values"].forEach((value3, valueIndex3) => {
                  const hasAtLeastOneCombination3 = this.product["variants"].some(
                      (variant) =>
                        variant["option3"] === value3 &&
                        variant["option1"] === selectedVariant["option1"] &&
                        variant["option2"] === selectedVariant["option2"] &&
                        variant
                    ),
                    hasAvailableVariant3 = this.product["variants"].some(
                      (variant) =>
                        variant["option3"] === value3 &&
                        variant["option1"] === selectedVariant["option1"] &&
                        variant["option2"] === selectedVariant["option2"] &&
                        variant["available"]
                    );
                  applyClassToSelector(
                    this.optionSelectors[2],
                    valueIndex3,
                    hasAvailableVariant3,
                    hasAtLeastOneCombination3
                  );
                });
              }
            });
          }
        });
      }
    }
    _updateOptionPriceLabels() {
      if (!this.optionSelectors || !this.product) {
        return;
      }
      let currencyFormat = window.themeVariables.settings.moneyFormat;
      if (window.themeVariables.settings.currencyCodeEnabled) {
        currencyFormat = window.themeVariables.settings.moneyWithCurrencyFormat;
      }
      const selectedOptions = this._getSelectedOptionValues();
      this.optionSelectors.forEach((selector, selectorIndex) => {
        const optionIndexAttr = selector.getAttribute("data-option-index");
        const optionIndex = optionIndexAttr ? parseInt(optionIndexAttr, 10) - 1 : selectorIndex;
        selector.querySelectorAll(".block-swatch").forEach((swatch) => {
          const input = swatch.querySelector('input[name^="option"]');
          if (!input) {
            return;
          }
          const priceEl = swatch.querySelector("[data-variant-price]");
          if (!priceEl) {
            return;
          }
          const value = input.value;
          const desiredOptions = selectedOptions.slice(0);
          desiredOptions[optionIndex] = value;
          let variant = this.product["variants"].find((variant2) => {
            return variant2["options"].every((opt, idx) => opt === desiredOptions[idx]);
          });
          if (!variant) {
            variant = this.product["variants"].find(
              (variant2) => variant2["options"][optionIndex] === value
            );
          }
          priceEl.textContent = variant ? apMoneyFormat(variant["price"], currencyFormat) : "";
        });
      });
    }
  };
  window.customElements.define("ap-productvariants", ApProductVariants);

  var ProductItem = class extends CustomHTMLElement {
    connectedCallback() {
      this.primaryImageList = Array.from(this.querySelectorAll(".product-item__primary-image"));
      this.apollo.on(
        "change",
        ".product-item-meta__swatch-list .color-swatch__radio",
        this._evtOnChangedColorSwatch.bind(this)
      );
      this.apollo.on(
        "mouseenter",
        ".product-item-meta__swatch-list .color-swatch__item",
        this._evtOnHoveredColorSwatch.bind(this),
        true
      );
      if (this.querySelector(".variants-item-size")) {
        var elements = this.getElementsByClassName("variant-size");
        for (var i = 0; i < elements.length; i++) {
          elements[i].addEventListener("click", function (e) {
            var current = this;
            for (var i = 0; i < elements.length; i++) {
              if (current != elements[i]) {
                elements[i].classList.remove("active");
              } else if (current.classList.contains("active") === true) {
                current.classList.remove("active");
              } else {
                current.classList.add("active");
              }
            }
            e.preventDefault();
          });
        }
      }
      if (this.querySelector(".variants-item-color")) {
        const itemVariantColor = Array.from(document.getElementsByClassName("variant-color"));
        itemVariantColor.forEach(function (item, idx) {
          item.onclick = function (e) {
            if (document.querySelector(".variant-color.active")) {
              console.log(
                document.querySelector(".variant-color.active").classList.remove("active")
              );
              document.querySelector(".variant-color.active").classList.remove("active");
            }
            item.classList.add("active");
            e.preventDefault();
          };
        });
      }
    }
    async _evtOnChangedColorSwatch(event, target) {
      Array.from(this.querySelectorAll(`[href*="/products"]`)).forEach((link) => {
        let url;
        if (link.tagName === "A") {
          url = new URL(link.href);
        } else {
          url = new URL(link.getAttribute("href"), `https://${window.themeVariables.routes.host}`);
        }
        url.searchParams.set("variant", target.getAttribute("data-variant-id"));
        link.setAttribute("href", url.toString());
      });
      if (target.hasAttribute("data-variant-featured-media")) {
        const newImage = this.primaryImageList.find(
          (image) =>
            image.getAttribute("data-media-id") ===
            target.getAttribute("data-variant-featured-media")
        );
        newImage.setAttribute("loading", "eager");
        const onImageLoaded = newImage.complete
          ? Promise.resolve()
          : new Promise((resolve) => (newImage.onload = resolve));
        await onImageLoaded;
        newImage.removeAttribute("hidden");
        let properties = {};
        if (
          Array.from(newImage.parentElement.classList).some((item) =>
            ["aspect-ratio--short", "aspect-ratio--tall", "aspect-ratio--square"].includes(item)
          )
        ) {
          properties = [
            {
              clipPath: "polygon(0 0, 0 0, 0 100%, 0% 100%)",
              transform: "translate(calc(-50% - 20px), -50%)",
              zIndex: 1,
              offset: 0,
            },
            {
              clipPath: "polygon(0 0, 20% 0, 5% 100%, 0 100%)",
              transform: "translate(calc(-50% - 20px), -50%)",
              zIndex: 1,
              offset: 0.3,
            },
            {
              clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
              transform: "translate(-50%, -50%)",
              zIndex: 1,
              offset: 1,
            },
          ];
        } else {
          properties = [
            {
              clipPath: "polygon(0 0, 0 0, 0 100%, 0% 100%)",
              transform: "translateX(-20px)",
              zIndex: 1,
              offset: 0,
            },
            {
              clipPath: "polygon(0 0, 20% 0, 5% 100%, 0 100%)",
              transform: "translateX(-20px)",
              zIndex: 1,
              offset: 0.3,
            },
            {
              clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
              transform: "translateX(0px)",
              zIndex: 1,
              offset: 1,
            },
          ];
        }
        await newImage.animate(properties, {
          duration: 500,
          easing: "ease-in-out",
        }).finished;
        this.primaryImageList
          .filter(
            (image) => image.classList.contains("product-item__primary-image") && image !== newImage
          )
          .forEach((image) => image.setAttribute("hidden", ""));
      }
    }
    _evtOnHoveredColorSwatch(event, target) {
      const input = target.previousElementSibling;
      if (input.hasAttribute("data-variant-featured-media")) {
        const newImage = this.primaryImageList.find(
          (image) =>
            image.getAttribute("data-media-id") ===
            input.getAttribute("data-variant-featured-media")
        );
        newImage.setAttribute("loading", "eager");
      }
    }
  };
  window.customElements.define("product-item", ProductItem);

  var ApProductFacet = class extends CustomHTMLElement {
    connectedCallback() {
      this.apollo.on("pagination:page-changed", this._rerenderApProductFacet.bind(this));
      this.apollo.on("facet:criteria-changed", this._rerenderApProductFacet.bind(this));
      this.apollo.on("facet:abort-loading", this._abortApProductFacet.bind(this));
    }
    async _rerenderApProductFacet(event) {
      history.replaceState({}, "", event.detail.url);
      this._abortApProductFacet();
      this.loadingBarEnable();
      const url = new URL(window.location);
      url.searchParams.set("section_id", this.getAttribute("section-id"));
      try {
        this.abortController = new AbortController();
        const response = await fetch(url.toString(), {
          signal: this.abortController.signal,
        });
        const responseAsText = await response.text();
        const fakeDiv = document.createElement("div");
        fakeDiv.innerHTML = responseAsText;
        this.querySelector("#facet-main").innerHTML =
          fakeDiv.querySelector("#facet-main").innerHTML;
        const activeFilterList = Array.from(
            fakeDiv.querySelectorAll(".ap-productfacet__active-list")
          ),
          toolbarItem = document.querySelector(".mobile-toolbar__item--filters");
        if (toolbarItem) {
          toolbarItem.classList.toggle("has-filters", activeFilterList.length > 0);
        }
        const filtersTempDiv = fakeDiv.querySelector("#ap-facetfilters");
        if (filtersTempDiv) {
          const previousScrollTop = this.querySelector(
            "#ap-facetfilters .drawer__content"
          ).scrollTop;
          Array.from(this.querySelectorAll("#ap-facetfilters-form .collapsible-toggle")).forEach(
            (filterToggle) => {
              const filtersTempDivToggle = filtersTempDiv.querySelector(
                  `[ap-controlsaria="${filterToggle.getAttribute("ap-controlsaria")}"]`
                ),
                expandedStatus = filterToggle.getAttribute("ap-expanded-aria") === "true";
              if (expandedStatus) {
                let ex_s = "true";
              } else {
                let ex_s = "false";
              }
              filtersTempDivToggle.setAttribute("ap-expanded-aria", ex_s);
              filtersTempDivToggle.nextElementSibling.toggleAttribute("open", expandedStatus);
              if (expandedStatus) {
                let ex_vi = "visible";
              } else {
                let ex_vi = "";
              }
              filtersTempDivToggle.nextElementSibling.style.overflow = ex_vi;
            }
          );
          this.querySelector("#ap-facetfilters").innerHTML = filtersTempDiv.innerHTML;
          this.querySelector("#ap-facetfilters .drawer__content").scrollTop = previousScrollTop;
        }
        const scrollTo =
          this.querySelector(".ap-productfacet__meta-bar") ||
          this.querySelector(".ap-productfacet__ap-productlist") ||
          this.querySelector(".ap-productfacet__main");
        requestAnimationFrame(() => {
          scrollTo.scrollIntoView({
            block: "start",
            behavior: "smooth",
          });
        });
        this.loadingBarDisable();
      } catch (e) {
        if (e.name === "AbortError") {
          return;
        }
      }
    }
    _abortApProductFacet() {
      if (this.abortController) {
        this.abortController.abort();
      }
    }
  };
  window.customElements.define("ap-productfacet", ApProductFacet);

  var ApFacetFilters = class extends ApDrawerContent {
    connectedCallback() {
      super.connectedCallback();
      this.apollo.on("change", '[name^="filter."]', this._evtOnChangedFilter.bind(this));
      this.rootApollo.on(
        "click",
        '[data-action="clear-filters"]',
        this._evtOnClearedFilters.bind(this)
      );
      if (this.alwaysVisible) {
        this.matchMedia = window.matchMedia(window.themeVariables.breakpoints.pocket);
        this.matchMedia.addListener(this._evtAdjustDrawer.bind(this));
        this._evtAdjustDrawer(this.matchMedia);
      }
    }
    get alwaysVisible() {
      return this.hasAttribute("always-visible");
    }
    _evtOnClearedFilters(event, target) {
      event.preventDefault();
      triggerEvent(this, "facet:criteria-changed", {
        url: target.href,
      });
      this.checked = false;
      window.location.reload();
    }
    _evtOnChangedFilter() {
      const formData = new FormData(this.querySelector("#ap-facetfilters-form"));
      const searchParamsAsString = new URLSearchParams(formData).toString();

      //thanhvn
      triggerEvent(this, "facet:criteria-changed", {
        url: `${window.location.pathname}?${searchParamsAsString}`,
      });
      window.location.reload();
    }
    _evtAdjustDrawer(match) {
      this.classList.toggle("drawer", match.matches);
      this.classList.toggle("drawer--from-left", match.matches);
    }
  };
  window.customElements.define("ap-facetfilters", ApFacetFilters);

  var ApSortByPopover = class extends ApolloPopContent {
    connectedCallback() {
      super.connectedCallback();
      this.apollo.on("change", '[name="sort_by"]', this._evtOnChangedSort.bind(this));
    }
    _evtOnChangedSort(event, target) {
      const url = new URL(location.href);
      url.searchParams.set("sort_by", target.value);
      url.searchParams.delete("page");
      this.open = false;
      this.dispatchEvent(
        new CustomEvent("facet:criteria-changed", {
          bubbles: true,
          detail: {
            url: url.toString(),
          },
        })
      );
    }
  };
  window.customElements.define("ap-sortbypopover", ApSortByPopover);

  var ApCartCount = class extends CustomHTMLElement {
    connectedCallback() {
      this.rootApollo.on(
        "cart:updated",
        (event) => (this.innerText = event.detail.cart["item_count"])
      );
    }

    async _detailCart(event) {
      let currencyFormat = window.themeVariables.settings.moneyFormat;
      if (window.themeVariables.settings.currencyCodeEnabled) {
        currencyFormat = window.themeVariables.settings.moneyWithCurrencyFormat;
      }
      let total = apMoneyFormat(event.detail.cart["total_price"], currencyFormat);
    }
  };
  window.customElements.define("ap-cartcount", ApCartCount);

  var ApCartTotalPrice = class extends CustomHTMLElement {
    connectedCallback() {
      this.rootApollo.on("cart:updated", this._detailCart.bind(this));
    }
    async _detailCart(event) {
      let currencyFormat = window.themeVariables.settings.moneyFormat;
      if (window.themeVariables.settings.currencyCodeEnabled) {
        currencyFormat = window.themeVariables.settings.moneyWithCurrencyFormat;
      }
      let total = apMoneyFormat(event.detail.cart["total_price"], currencyFormat);
      this.innerText = total;
    }
  };
  window.customElements.define("ap-carttotalprice", ApCartTotalPrice);

  var ApCartDrawer = class extends ApDrawerContent {
    connectedCallback() {
      super.connectedCallback();
      this.nextReplacementDelay = 0;
      this.rootApollo.on("cart:refresh", this._rerenderCart.bind(this));
      this.addEventListener("variant:added", () => (this.nextReplacementDelay = 600));
    }
    async _rerenderCart(event) {
      var _a;
      let cartContent = null,
        html = "";
      if (event.detail && event.detail["cart"]) {
        cartContent = event.detail["cart"];
        html = event.detail["cart"]["sections"]["mini-cart"];
      } else {
        const response = await fetch(
          `${window.themeVariables.routes.cartUrl}?section_id=${this.getAttribute("section")}`
        );
        html = await response.text();
      }
      const fakeDiv = document.createElement("div");
      fakeDiv.innerHTML = html;
      setTimeout(async () => {
        var _a2;
        const previousPosition = this.querySelector(".drawer__content").scrollTop;
        if (cartContent && cartContent["item_count"] === 0) {
          const animation = new ApAnimationCustom(
            new ApEffectParallel(
              Array.from(this.querySelectorAll(".drawer__content, .drawer__footer")).map((item) => {
                return new ApEffectOfCustomKeyframe(
                  item,
                  {
                    opacity: [1, 0],
                  },
                  {
                    duration: 250,
                    easing: "ease-in",
                  }
                );
              })
            )
          );
          animation.play();
          await animation.finished;
        }
        this.innerHTML = fakeDiv.querySelector("ap-cartdrawer").innerHTML;
        if (cartContent && cartContent["item_count"] === 0) {
          this.querySelector(".drawer__content").animate(
            {
              opacity: [0, 1],
              transform: ["translateY(40px)", "translateY(0)"],
            },
            {
              duration: 450,
              easing: "cubic-bezier(0.33, 1, 0.68, 1)",
            }
          );
        } else {
          this.querySelector(".drawer__content").scrollTop = previousPosition;
        }
        if ((_a2 = event == null ? void 0 : event.detail) == null ? void 0 : _a2.openMiniCart) {
          this.clientWidth;
          this.open = true;
        }
      }, ((_a = event == null ? void 0 : event.detail) == null ? void 0 : _a.replacementDelay) || this.nextReplacementDelay);
      this.nextReplacementDelay = 0;
    }
    async attributeChangedCallback(name, oldval, newval) {
      super.attributeChangedCallback(name, oldval, newval);
      switch (name) {
        case "open":
          if (this.open) {
            this.querySelector(".drawer__content").scrollTop = 0;
            if (!MediaFeatures.prefersReducedMotion()) {
              const lineItems = Array.from(this.querySelectorAll(".line-item")),
                recommendationsInner = this.querySelector(".mini-cart__recommendations-inner"),
                bottomBar = this.querySelector(".drawer__footer"),
                effects = [];
              if (
                recommendationsInner &&
                window.matchMedia(window.themeVariables.breakpoints.pocket).matches
              ) {
                lineItems.push(recommendationsInner);
              }
              lineItems.forEach((item) => (item.style.opacity = 0));
              recommendationsInner ? (recommendationsInner.style.opacity = 0) : null;
              bottomBar ? (bottomBar.style.opacity = 0) : null;
              effects.push(
                new ApEffectParallel(
                  lineItems.map((item, index) => {
                    return new ApEffectOfCustomKeyframe(
                      item,
                      {
                        opacity: [0, 1],
                        transform: ["translateX(40px)", "translateX(0)"],
                      },
                      {
                        duration: 400,
                        delay: 400 + 120 * index - Math.min(2 * index * index, 120 * index),
                        easing: "cubic-bezier(0.25, 1, 0.5, 1)",
                      }
                    );
                  })
                )
              );
              if (bottomBar) {
                effects.push(
                  new ApEffectOfCustomKeyframe(
                    bottomBar,
                    {
                      opacity: [0, 1],
                      transform: ["translateY(100%)", "translateY(0)"],
                    },
                    {
                      duration: 300,
                      delay: 400,
                      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
                    }
                  )
                );
              }
              if (
                recommendationsInner &&
                !window.matchMedia(window.themeVariables.breakpoints.pocket).matches
              ) {
                effects.push(
                  new ApEffectOfCustomKeyframe(
                    recommendationsInner,
                    {
                      opacity: [0, 1],
                      transform: ["translateX(100%)", "translateX(0)"],
                    },
                    {
                      duration: 250,
                      delay: 400 + Math.max(120 * lineItems.length - 25 * lineItems.length, 25),
                      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
                    }
                  )
                );
              }
              let animation = new ApAnimationCustom(new ApEffectParallel(effects));
              animation.play();
            }
          }
      }
    }
  };
  window.customElements.define("ap-cartdrawer", ApCartDrawer);

  // // js/custom-element/section/cart/ap-cartdrawer-recommendations.js
  // var _ApCartDrawerRecommendations = class extends HTMLElement {
  //   async connectedCallback() {
  //     if (!_ApCartDrawerRecommendations.recommendationsCache[this.productId]) {
  //       _ApCartDrawerRecommendations.recommendationsCache[this.productId] = fetch(`${window.themeVariables.routes.productUrlRecommendations}?product_id=${this.productId}&limit=10&section_id=${this.sectionId}`);
  //     }
  //     const response = await _ApCartDrawerRecommendations.recommendationsCache[this.productId];
  //     const div = document.createElement("div");
  //     div.innerHTML = await response.clone().text();
  //     const productRecommendationsElement = div.querySelector("ap-cartdrawer-recommendations");
  //     if (productRecommendationsElement && productRecommendationsElement.hasChildNodes()) {
  //       this.innerHTML = productRecommendationsElement.innerHTML;
  //     } else {
  //       this.hidden = true;
  //     }
  //   }
  //   get productId() {
  //     return this.getAttribute("product-id");
  //   }
  //   get sectionId() {
  //     return this.getAttribute("section-id");
  //   }
  // };
  // var ApCartDrawerRecommendations = _ApCartDrawerRecommendations;
  // __publicField(ApCartDrawerRecommendations, "recommendationsCache", {});
  // window.customElements.define("ap-cartdrawer-recommendations", ApCartDrawerRecommendations);

  var ApCartNote = class extends HTMLTextAreaElement {
    connectedCallback() {
      this.addEventListener("change", this._evtOnChangedNote.bind(this));
    }
    get ownedToggle() {
      return this.hasAttribute("ap-ariaowns")
        ? document.getElementById(this.getAttribute("ap-ariaowns"))
        : null;
    }
    async _evtOnChangedNote() {
      if (this.ownedToggle) {
        this.ownedToggle.innerHTML =
          this.value === ""
            ? window.themeVariables.strings.cartAddOrderNote
            : window.themeVariables.strings.cartEditOrderNote;
      }
      const response = await fetch(`${window.themeVariables.routes.cartUrl}/update.js`, {
        body: JSON.stringify({
          note: this.value,
        }),
        credentials: "same-origin",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      // const cartContent = await response.json();
      // document.documentElement.dispatchEvent(
      //   new CustomEvent("cart:updated", {
      //     bubbles: true,
      //     detail: {
      //       cart: cartContent,
      //     },
      //   })
      // );
    }
  };
  window.customElements.define("ap-cartnote", ApCartNote, {
    extends: "textarea",
  });

  // var ApFreeShippingBar = class extends HTMLElement {
  //   connectedCallback() {
  //     document.documentElement.addEventListener("cart:updated", this._onCartUpdated.bind(this));
  //   }
  //   get threshold() {
  //     return parseFloat(this.getAttribute("threshold"));
  //   }
  //   _onCartUpdated(event) {
  //     this.style.setProperty(
  //       "--progress",
  //       Math.min(parseFloat(event.detail["cart"]["total_price"]) / this.threshold, 1)
  //     );
  //   }
  // };
  // window.customElements.define("ap-freeshippingbar", ApFreeShippingBar);

  var ApLineItemQuantity = class extends CustomHTMLElement {
    connectedCallback() {
      this.apollo.on("click", "a", this._onQuantityLinkClicked.bind(this));
      this.apollo.on("change", "input", this._onQuantityChanged.bind(this));
    }
    _onQuantityLinkClicked(event, target) {
      event.preventDefault();
      this._updateFromLink(target.href);
    }
    _onQuantityChanged(event, target) {
      this._updateFromLink(
        `${window.themeVariables.routes.cartChangeUrl}?quantity=${
          target.value
        }&line=${target.getAttribute("data-line")}`
      );
    }
    async _updateFromLink(link) {
      if (window.themeVariables.settings.pageType === "cart") {
        window.location.href = link;
        return;
      }
      const changeUrl = new URL(link, `https://${window.themeVariables.routes.host}`),
        searchParams = changeUrl.searchParams,
        line = searchParams.get("line"),
        id = searchParams.get("id"),
        quantity = parseInt(searchParams.get("quantity"));
      this.dispatchEvent(
        new CustomEvent("line-item-quantity:change:start", {
          bubbles: true,
          detail: {
            newLineQuantity: quantity,
          },
        })
      );
      const response = await fetch(`${window.themeVariables.routes.cartChangeUrl}.js`, {
        body: JSON.stringify({
          line,
          id,
          quantity,
          sections: ["mini-cart"],
        }),
        credentials: "same-origin",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const cartContent = await response.json();
      this.dispatchEvent(
        new CustomEvent("line-item-quantity:change:end", {
          bubbles: true,
          detail: {
            cart: cartContent,
            newLineQuantity: quantity,
          },
        })
      );
      document.documentElement.dispatchEvent(
        new CustomEvent("cart:updated", {
          bubbles: true,
          detail: {
            cart: cartContent,
          },
        })
      );
      document.documentElement.dispatchEvent(
        new CustomEvent("cart:refresh", {
          bubbles: true,
          detail: {
            cart: cartContent,
            replacementDelay: quantity === 0 ? 600 : 750,
          },
        })
      );
    }
  };
  window.customElements.define("line-item-quantity", ApLineItemQuantity);

  var LineItem = class extends HTMLElement {
    connectedCallback() {
      this.lineItemLoader = this.querySelector(".line-item__loader");
      this.addEventListener("line-item-quantity:change:start", this._onQuantityStart.bind(this));
      this.addEventListener("line-item-quantity:change:end", this._onQuantityEnd.bind(this));
    }
    _onQuantityStart() {
      if (!this.lineItemLoader) {
        return;
      }
      this.lineItemLoader.hidden = false;
      this.lineItemLoader.firstElementChild.hidden = false;
      this.lineItemLoader.lastElementChild.hidden = true;
    }
    async _onQuantityEnd(event) {
      if (event.detail.cart["item_count"] === 0) {
        return;
      }
      if (this.lineItemLoader) {
        await this.lineItemLoader.firstElementChild.animate(
          {
            opacity: [1, 0],
            transform: ["translateY(0)", "translateY(-10px)"],
          },
          75
        ).finished;
        this.lineItemLoader.firstElementChild.hidden = true;
        if (event.detail.newLineQuantity === 0) {
          await this.animate(
            {
              opacity: [1, 0],
              height: [`${this.clientHeight}px`, 0],
            },
            {
              duration: 300,
              easing: "ease",
            }
          ).finished;
          this.remove();
        } else {
          this.lineItemLoader.lastElementChild.hidden = false;
          await this.lineItemLoader.lastElementChild.animate(
            {
              opacity: [0, 1],
              transform: ["translateY(10px)", "translateY(0)"],
            },
            {
              duration: 75,
              endDelay: 300,
            }
          ).finished;
          this.lineItemLoader.hidden = true;
        }
      }
    }
  };
  window.customElements.define("line-item", LineItem);

  var ApCartNotification = class extends CustomHTMLElement {
    connectedCallback() {
      this.rootApollo.on(
        "ap-cartnotification:show",
        this._evtOnShow.bind(this),
        !this.hasAttribute("global")
      );
      this.apollo.on("click", '[data-action="close"]', (event) => {
        event.stopPropagation();
        this.hidden = true;
      });
      this.addEventListener("mouseenter", this.stopTimer.bind(this));
      this.addEventListener("mouseleave", this.startTimer.bind(this));
      window.addEventListener("pagehide", () => (this.hidden = true));
    }
    set hidden(value) {
      if (!value) {
        this.startTimer();
      } else {
        this.stopTimer();
      }
      this.toggleAttribute("hidden", value);
    }
    get isInsideDrawer() {
      return this.classList.contains("ap-cartnotification--drawer");
    }
    stopTimer() {
      clearTimeout(this._timeout);
    }
    startTimer() {
      this._timeout = setTimeout(() => (this.hidden = true), 3e3);
    }
    _evtOnShow(event) {
      if (this.isInsideDrawer && !this.closest(".drawer").open) {
        return;
      }
      if (
        this.hasAttribute("global") &&
        event.detail.status === "success" &&
        window.themeVariables.settings.cartType === "drawer"
      ) {
        return;
      }
      event.stopPropagation();
      let closeButtonHtml = "";
      if (!this.isInsideDrawer) {
        closeButtonHtml = `
        <button class="ap-cartnotification__close tap-area hd-phone" data-action="close">
          <span class="visually-hidden">${window.themeVariables.strings.accessibilityClose}</span>
          <svg focusable="false" width="14" height="14" class="icon icon--close icon--inline" viewBox="0 0 14 14">
            <path d="M13 13L1 1M13 1L1 13" stroke="currentColor" stroke-width="2" fill="none"></path>
          </svg>
        </button>
      `;
      }
      if (event.detail.status === "success") {
        this.classList.remove("ap-cartnotification--error");
        this.innerHTML = `
        <div class="ap-cartnotification__overflow">
          <div class="container">
            <div class="ap-cartnotification__wrapper">
              <svg focusable="false" width="20" height="20" class="icon icon--ap-cartnotification" viewBox="0 0 20 20">
                <rect width="20" height="20" rx="10" fill="currentColor"></rect>
                <path d="M6 10L9 13L14 7" fill="none" stroke="rgb(var(--success-color))" stroke-width="2"></path>
              </svg>
              
              <div class="ap-cartnotification__text-wrapper">
                <span class="ap-cartnotification__heading heading hd-phone">${window.themeVariables.strings.cartItemAdded}</span>
                <span class="ap-cartnotification__heading heading hd-tablet-and-up">${window.themeVariables.strings.cartItemAddedShort}</span>
                <a href="${window.themeVariables.routes.cartUrl}" class="ap-cartnotification__view-cart link">${window.themeVariables.strings.cartViewCart}</a>
              </div>
              
              ${closeButtonHtml}
            </div>
          </div>
        </div>
      `;
      } else {
        this.classList.add("ap-cartnotification--error");
        this.innerHTML = `
        <div class="ap-cartnotification__overflow">
          <div class="container">
            <div class="ap-cartnotification__wrapper">
              <svg focusable="false" width="20" height="20" class="icon icon--ap-cartnotification" viewBox="0 0 20 20">
                <rect width="20" height="20" rx="10" fill="currentColor"></rect>
                <path d="M9.6748 13.2798C9.90332 13.0555 10.1763 12.9434 10.4937 12.9434C10.811 12.9434 11.0819 13.0555 11.3062 13.2798C11.5347 13.5041 11.6489 13.7749 11.6489 14.0923C11.6489 14.4097 11.5347 14.6847 11.3062 14.9175C11.0819 15.146 10.811 15.2603 10.4937 15.2603C10.1763 15.2603 9.90332 15.146 9.6748 14.9175C9.45052 14.6847 9.33838 14.4097 9.33838 14.0923C9.33838 13.7749 9.45052 13.5041 9.6748 13.2798ZM9.56689 12.1816V5.19922H11.4141V12.1816H9.56689Z" fill="rgb(var(--error-color))"></path>
              </svg>
              
              <div class="ap-cartnotification__text-wrapper">
                <span class="ap-cartnotification__heading heading">${event.detail.error}</span>
              </div>
              
              ${closeButtonHtml}
            </div>
          </div>
        </div>
      `;
      }
      this.clientHeight;
      this.hidden = false;
    }
  };
  window.customElements.define("ap-cartnotification", ApCartNotification);

  var ApShippingEstimator = class extends HTMLElement {
    connectedCallback() {
      this.submitButton = this.querySelector('[type="button"]');
      this.submitButton.addEventListener("click", this._evtShippingEstimate.bind(this));
    }
    async _evtShippingEstimate() {
      const zip = this.querySelector('[name="ap-shippingestimator[zip]"]').value;
      const country = this.querySelector('[name="ap-shippingestimator[country]"]').value;
      const province = this.querySelector('[name="ap-shippingestimator[province]"]').value;
      this.submitButton.setAttribute("ap-ariabusy", "true");
      const prepareResponse = await fetch(
        `${window.themeVariables.routes.cartUrl}/prepare_shipping_rates.json?shipping_address[zip]=${zip}&shipping_address[country]=${country}&shipping_address[province]=${province}`,
        {
          method: "POST",
        }
      );
      if (prepareResponse.ok) {
        const shippingRates = await this._getAsyncRatesShipping(zip, country, province);
        this._formatRatesShipping(shippingRates);
      } else {
        const jsonError = await prepareResponse.json();
        this._errorFormat(jsonError);
      }
      this.submitButton.removeAttribute("ap-ariabusy");
    }
    async _getAsyncRatesShipping(zip, country, province) {
      const response = await fetch(
        `${window.themeVariables.routes.cartUrl}/async_shipping_rates.json?shipping_address[zip]=${zip}&shipping_address[country]=${country}&shipping_address[province]=${province}`
      );
      const responseAsText = await response.text();
      if (responseAsText === null) {
        return this._getAsyncRatesShipping(zip, country, province);
      } else {
        return JSON.parse(responseAsText)["shipping_rates"];
      }
    }
    _formatRatesShipping(shippingRates) {
      var _a;
      (_a = this.querySelector(".ap-shippingestimator__results")) == null ? void 0 : _a.remove();
      let formattedShippingRates = "";
      shippingRates.forEach((shippingRate) => {
        formattedShippingRates += `<li>${shippingRate["presentment_name"]}: ${apMoneyFormat(
          parseFloat(shippingRate["price"]) * 100
        )}</li>`;
      });
      const html = `
      <div class="ap-shippingestimator__results">
        <p>${
          shippingRates.length === 0
            ? window.themeVariables.strings.shippingEstimatorNoResults
            : shippingRates.length === 1
            ? window.themeVariables.strings.shippingEstimatorOneResult
            : window.themeVariables.strings.shippingEstimatorMultipleResults
        }</p>
        ${
          formattedShippingRates === ""
            ? ""
            : `<ul class="unordered-list">${formattedShippingRates}</ul>`
        }
      </div>
    `;
      this.insertAdjacentHTML("beforeend", html);
    }
    _errorFormat(errors) {
      var _a;
      (_a = this.querySelector(".ap-shippingestimator__results")) == null ? void 0 : _a.remove();
      let formattedShippingRates = "";
      Object.keys(errors).forEach((errorKey) => {
        formattedShippingRates += `<li>${errorKey} ${errors[errorKey]}</li>`;
      });
      const html = `
      <div class="ap-shippingestimator__results">
        <p>${window.themeVariables.strings.shippingEstimatorError}</p>
        <ul class="unordered-list">${formattedShippingRates}</ul>
      </div>
    `;
      this.insertAdjacentHTML("beforeend", html);
    }
  };
  window.customElements.define("ap-shippingestimator", ApShippingEstimator);

  var ApReviewLink = class extends HTMLAnchorElement {
    constructor() {
      super();
      this.addEventListener("click", this._onClick.bind(this));
    }
    _onClick() {
      const shopifyReviewsElement = document.getElementById("shopify-product-reviews");
      if (!shopifyReviewsElement) {
        return;
      }
      if (window.matchMedia(window.themeVariables.breakpoints.pocket).matches) {
        shopifyReviewsElement.closest("ap-contentcollapsible").open = true;
      } else {
        document
          .querySelector(
            `[ap-controlsaria="${
              shopifyReviewsElement.closest(".product-tabs__tab-item-wrapper").id
            }"]`
          )
          .click();
      }
    }
  };
  window.customElements.define("ap-reviewlink", ApReviewLink, { extends: "a" });

  var ApProductStickyForm = class extends HTMLElement {
    connectedCallback() {
      var _a;
      if ((_a = document.getElementById(this.getAttribute("form-id"))) == null) {
        void 0;
      } else {
        _a.addEventListener("variant:changed", this._evtOnChangedVariant.bind(this));
      }
      this.elementImage = this.querySelector(".ap-productstickyform__image");
      this.priceElement = this.querySelector(".ap-productstickyform__price");
      this.unitPriceElement = this.querySelector(".ap-productstickyform__unit-price");
      this._setupVisibilityObserversTextOverlayImage();
    }
    disconnectedCallback() {
      this.intersectionObserver.disconnect();
    }
    set hidden(value) {
      this.toggleAttribute("hidden", value);
      if (value) {
        document.documentElement.style.removeProperty("--ap-cartnotification-offset");
      } else {
        document.documentElement.style.setProperty(
          "--ap-cartnotification-offset",
          `${this.clientHeight}px`
        );
      }
    }
    _evtOnChangedVariant(event) {
      const variant = event.detail.variant;
      let currencyFormat = window.themeVariables.settings.moneyFormat;
      if (window.themeVariables.settings.currencyCodeEnabled) {
        currencyFormat = window.themeVariables.settings.moneyWithCurrencyFormat;
      }
      if (!variant) {
        return;
      }
      if (this.priceElement) {
        this.priceElement.innerHTML = apMoneyFormat(variant["price"], currencyFormat);
      }
      if (this.unitPriceElement) {
        if (variant["unit_price_measurement"]) {
          this.unitPriceElement.style.display = "block";
        } else {
          this.unitPriceElement.style.display = "none";
        }
        if (variant["unit_price_measurement"]) {
          let referenceValue = "";
          if (variant["unit_price_measurement"]["reference_value"] !== 1) {
            referenceValue = `<span class="unit-price-measurement__reference-value">${variant["unit_price_measurement"]["reference_value"]}</span>`;
          }
          this.unitPriceElement.innerHTML = `
          <div class="unit-price-measurement">
            <span class="unit-price-measurement__price">${apMoneyFormat(
              variant["unit_price"]
            )}</span>
            <span class="unit-price-measurement__separator">/</span>
            ${referenceValue}
            <span class="unit-price-measurement__reference-unit">${
              variant["unit_price_measurement"]["reference_unit"]
            }</span>
          </div>
        `;
        }
      }
      if (!this.elementImage || !variant || !variant["featured_media"]) {
        return;
      }
      const featuredMedia = variant["featured_media"];
      if (featuredMedia["alt"]) {
        this.elementImage.setAttribute("alt", featuredMedia["alt"]);
      }
      this.elementImage.setAttribute("width", featuredMedia["preview_image"]["width"]);
      this.elementImage.setAttribute("height", featuredMedia["preview_image"]["height"]);
      this.elementImage.setAttribute("src", apGetSizedOfMediaUrl(featuredMedia, "165x"));
      this.elementImage.setAttribute("data-srcset", apGetMediasrcset(featuredMedia, [55, 110, 165]));
    }
    _setupVisibilityObserversTextOverlayImage() {
      const paymentContainerElement = document.getElementById("ApolloProductSticky"),
        footerElement = document.querySelector(".shopify-section--footer"),
        apOffsetStickyHeader = apStickyHeaderOffsetContent();
      this._isFooterVisible = this._isApContainerPaymentPassed = false;
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.target === footerElement) {
              this._isFooterVisible = entry.intersectionRatio > 0;
            }
            if (entry.target === paymentContainerElement) {
              const apBoundingRect = paymentContainerElement.getBoundingClientRect();
              this._isApContainerPaymentPassed =
                entry.intersectionRatio === 0 &&
                apBoundingRect.top + apBoundingRect.height <= apOffsetStickyHeader;
            }
          });
          if (window.matchMedia(window.themeVariables.breakpoints.pocket).matches) {
            this.hidden = !this._isApContainerPaymentPassed || this._isFooterVisible;
          } else {
            this.hidden = !this._isApContainerPaymentPassed;
          }
        },
        { rootMargin: `-${apOffsetStickyHeader}px 0px 0px 0px` }
      );
      this.intersectionObserver.observe(paymentContainerElement);
      this.intersectionObserver.observe(footerElement);
    }
  };
  window.customElements.define("ap-productstickyform", ApProductStickyForm);

  (() => {
    new ApolloInputBindingManager();
  })();
  (() => {
    if (Shopify.designMode) {
      document.addEventListener("shopify:section:load", () => {
        if (window.SPR) {
          window.SPR.initDomEls();
          window.SPR.loadProducts();
        }
      });
    }
    window.SPRCallbacks = {
      onFormSuccess: (event, info) => {
        document.getElementById(`form_${info.id}`).classList.add("spr-form--success");
      },
    };
  })();
  (() => {
    let previousClientWidth = document.documentElement.clientWidth;
    if (window.visualViewport) {
      previousClientWidth = window.visualViewport.width;
    }
    let setPropertyViewport = () => {
      const clientWidth = window.visualViewport
        ? window.visualViewport.width
        : document.documentElement.clientWidth;
      const clientHeight = window.visualViewport
        ? window.visualViewport.height
        : document.documentElement.clientHeight;
      if (clientWidth === previousClientWidth) {
        return;
      }
      requestAnimationFrame(() => {
        document.documentElement.style.setProperty("--window-height", clientHeight + "px");
        previousClientWidth = clientWidth;
      });
    };
    setPropertyViewport();
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", setPropertyViewport);
    } else {
      window.addEventListener("resize", setPropertyViewport);
    }
  })();
  (() => {
    let documentApollo = new main_default(document.body);
    documentApollo.on(
      "keyup",
      'input:not([type="checkbox"]):not([type="radio"]), textarea',
      (event, target) => {
        target.classList.toggle("is-filled", target.value !== "");
      }
    );
    documentApollo.on("change", "select", (event, target) => {
      target.parentNode.classList.toggle("is-filled", target.value !== "");
    });
  })();
  (() => {
    document.querySelectorAll(".rte table").forEach((table) => {
      table.outerHTML = '<div class="table-wrapper">' + table.outerHTML + "</div>";
    });
  })();
  (() => {
    let documentApollo = new main_default(document.documentElement);
    documentApollo.on("click", "[data-smooth-scroll]", (event, target) => {
      const elementScrollTo = document.querySelector(target.getAttribute("href"));
      if (elementScrollTo) {
        event.preventDefault();
        elementScrollTo.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  })();
  (() => {
    document.addEventListener("keyup", function (event) {
      if (event.key === "Tab") {
        document.body.classList.remove("no-focus-outline");
        document.body.classList.add("focus-outline");
      }
    });
  })();
})();
/*!
 * focus-trap 6.6.1
 * @license MIT, https://github.com/focus-trap/focus-trap/blob/master/LICENSE
 */
/*!
 * objTabbable 5.2.1
 * @license MIT, https://github.com/focus-trap/objTabbable/blob/master/LICENSE
 */
// (function($) {
//   $( document ).ready(function() {
//     $('.agree_terms_conditions').change(function(){
//       if($(this).is(":checked")){
//         $('#shopify-section-mini-cart .checkout-button').removeAttr('disabled');
//       } else {
//         $('#shopify-section-mini-cart .checkout-button').attr('disabled', 'disabled');
//       }
//     });
//   });
// })( jQuery );

class productPopupMedia extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("click", (event) => {
      document.getElementById(this.getAttribute("data-controls")).setAttribute("open", "");
    });
  }
}
customElements.define("product-popup-media", productPopupMedia);

class productListMedia extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("click", (event) => {});
  }
}
customElements.define("ap-productmedia-list", productListMedia);

let tag = document.getElementsByClassName("product__info-scroll");
if (tag.length) {
  var product_info_width = tag[0].clientWidth;
  var product_info_left = tag[0].offsetLeft;
  window.addEventListener("scroll", function () {
    if (tag) {
      if (this.pageYOffset > tag[0].offsetTop) {
        let header = document.querySelector(".shopify-section--header");
        tag[0].style.width = product_info_width;
        tag[0].style.position = "sticky";
        tag[0].style.top = header.clientHeight + "px";
        tag[0].style.left = product_info_left + "px";
      }
    }
  });
}

leo_create_instafeed();
function leo_create_instafeed() {
  if (document.getElementById("instafeed")) {
    let token = document.getElementById("instafeed").dataset.token;
    if (token) {
      let limit = parseInt(document.getElementById("instafeed").dataset.limit);
      let feed = new Instafeed({
        accessToken: document.getElementById("instafeed").dataset.token,
        limit: limit,
        template:
          '<div class="ap-multicolumn__item ap-multicolumn__item--align-start " reveal><div class="ap-multicolumn__image-wrapper"><img class="ap-multicolumn__image" alt="{{caption}}" src="{{image}}" ></div></div>',
        transform: function (item) {
          var d = new Date(item.timestamp);
          item.date = [d.getDate(), d.getMonth(), d.getYear()].join("/");
          return item;
        },

        after: function () {
          document.getElementById("buttons_instafeed").style.display = "flex";
        },
      });
      feed.run();
    }
  }
}

// Back to top
window.onscroll = () => {
  toggleTopButton();
};
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleTopButton() {
  if (document.getElementById("back-to-up")) {
    if (document.body.scrollTop > 500 || document.documentElement.scrollTop > 500) {
      document.getElementById("back-to-up").classList.remove("hd");
    } else {
      document.getElementById("back-to-up").classList.add("hd");
    }
  }
}

(() => {
  // MODAL UP SELL
  function modalProduct() {
    window.addEventListener("load", function (params) {
      this.setTimeout(() => {
        let zindex = document.querySelector("#modal-productsell");
        if (zindex) {
          zindex.classList.add("modal-active");
        }
      }, 2000);
    });
    const closeModal = document.getElementById("close");
    if (closeModal) {
      closeModal.onclick = () => {
        document.getElementById("modal-productsell").classList.remove("modal-active");
      };
    }
  }
  modalProduct();

  function modalGalleryImg() {
    const galleryImages = document.querySelectorAll('.gallery-item img');
    const popup = document.getElementById('image-popup');
    const popupImage = document.getElementById('ap-popup-image');
    const thumbnailImages = document.querySelectorAll('.gallery-thumbnail-list .gallery-item img');
    const closeButton = document.querySelector('.gallery-close-btn');
    const nextButton = document.querySelector('.gallery-next-btn');
    const prevButton = document.querySelector('.gallery-prev-btn');
  
    let currentIndex = 0;
    let isZoomed = false;
  
    function openPopup(index) {
      const largeImageSrc = galleryImages[index].getAttribute('data-large');
      popupImage.src = largeImageSrc;
      popup.style.opacity = '1';
      popup.style.visibility = 'visible';
      currentIndex = index;
      highlightThumbnail(largeImageSrc);
    }
  
    function closePopup() {
      popup.style.opacity = '0';
      popup.style.visibility = 'hidden';
      resetZoom();
    }
  
    function showNextImage() {
      currentIndex = (currentIndex + 1) % galleryImages.length;
      openPopup(currentIndex);
    }
  
    function showPrevImage() {
      currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
      openPopup(currentIndex);
    }
  
    function toggleZoom() {
      if (isZoomed) {
        popupImage.style.transform = 'scale(1)';
        popupImage.style.cursor = 'zoom-in';
      } else {
        popupImage.style.transform = 'scale(1.4)';
        popupImage.style.cursor = 'zoom-out';
      }
      isZoomed = !isZoomed;
    }
  
    function resetZoom() {
      isZoomed = false;
      popupImage.style.transform = 'scale(1)';
      popupImage.style.cursor = 'zoom-in';
    }
  
    function highlightThumbnail(src) {
      thumbnailImages.forEach(img => {
        if (img.getAttribute('data-large') === src) {
          img.classList.add('active');
        } else {
          img.classList.remove('active');
        }
      });
    }
  
    galleryImages.forEach((image, index) => {
      image.addEventListener('click', () => openPopup(index));
    });
  
    thumbnailImages.forEach((thumbnail) => {
      thumbnail.addEventListener('click', () => {
        const largeImageSrc = thumbnail.getAttribute('data-large');
        openPopup(Array.from(galleryImages).findIndex(img => img.getAttribute('data-large') === largeImageSrc));
      });
    });
  
    if (closeButton){
      closeButton.addEventListener('click', closePopup);
    }
    if (nextButton){
      nextButton.addEventListener('click', showNextImage);
    }
    if (prevButton){
      prevButton.addEventListener('click', showPrevImage);
    }
  
    if (popupImage){
      popupImage.addEventListener('click', toggleZoom);
    }
  
    if (popup){
      popup.addEventListener('click', function(e) {
        if (e.target === popup) {
          closePopup();
        }
      });
    }
  }
  modalGalleryImg();

  function Bgcollection() {
    if (document.querySelector(".colgrid__bg--full[data-index='1']")) {
      document.querySelector(".colgrid__bg--full[data-index='1']").classList.add("active");
    }
    Array.from(document.querySelectorAll('.colgrid .colgrid__box')).forEach(function (e) {
      var index = e.getAttribute("data-index");

      e.addEventListener("mouseover", () => {
        var item = document.querySelectorAll(".colgrid__bg--full[data-index='" + index + "']");
        const itemAc = document.querySelector(".colgrid__bg--full.active");
        const wasActive = itemAc.classList.contains('active');
        if (wasActive) {
          itemAc.classList.remove('active');
        }
        item.forEach(ii => {
          ii.classList.add('active');
        });
      });
    });
  }
  Bgcollection();

  function filterCollectionTop() {
    const btnfilter = document.querySelector(".filter-toggle");
    if (btnfilter) {
      btnfilter.onclick = () => {
        const btnfilter_2 = btnfilter.parentElement.closest(".ap-productfacet");
        btnfilter_2.querySelector(".ap-productfacet__aside").classList.add("open");
        btnfilter_2.querySelector(".drawer__overlay-filter").classList.add("open");
        document.documentElement.classList.add("ap-lockall");
      };
    }

    const btnClose = document.querySelector(".close-filter");
    if (btnClose) {
      btnClose.onclick = () => {
        const btnClose_2 = btnClose.closest(".ap-productfacet");
        btnClose_2.querySelector(".ap-productfacet__aside").classList.remove("open");
        btnClose_2.querySelector(".drawer__overlay-filter").classList.remove("open");
        document.documentElement.classList.remove("ap-lockall");
      };
    }

    const bgClose = document.querySelector(".drawer__overlay-filter");
    if (bgClose) {
      bgClose.onclick = () => {
        const bgClose_2 = bgClose.closest(".ap-productfacet");
        bgClose_2.querySelector(".ap-productfacet__aside").classList.remove("open");
        bgClose.classList.remove("open");
        document.documentElement.classList.remove("ap-lockall");
      };
    }
  }
  filterCollectionTop();

  function loadCountDown() {
    const second = 1000,
      minute = second * 60,
      hour = minute * 60,
      day = hour * 24;

    const getTime = document.querySelectorAll(".timer");

    for (let i = 0; i < getTime.length; i++) {
      const timeItem = getTime[i].getAttribute("data-date");

      const countDown = new Date(timeItem).getTime(),
        x = setInterval(function () {
          const now = new Date().getTime(),
            distance = countDown - now;

          const itemDay = getTime[i].querySelector(".js-timer-days");
          const itemHour = getTime[i].querySelector(".js-timer-hours");
          const itemMin = getTime[i].querySelector(".js-timer-minutes");
          const itemSec = getTime[i].querySelector(".js-timer-seconds");

          (itemDay.innerHTML = Math.floor(distance / day)),
            (itemHour.innerHTML = Math.floor((distance % day) / hour)),
            (itemMin.innerHTML = Math.floor((distance % hour) / minute)),
            (itemSec.innerHTML = Math.floor((distance % minute) / second));
        }, second);
    }
  }
  loadCountDown();

  function collectionCoupon() {
    const couponShow = document.getElementById("jsCoupon");
    const btnCoupon = document.querySelector(".js-btn-coupon");
    if (couponShow) {
      const set = setInterval(function () {
        couponShow.classList.add("show");
      }, couponShow.getAttribute("data-delay"));

      btnCoupon.addEventListener("click", (event) => {
        const copyText = document.getElementById("coupon_code");
        const copiEd = document.querySelector(".coupon-copied");
        copyText.select();
        copyText.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(copyText.value);
        copiEd.classList.add("show");
      });
      const close = document.querySelector(".close-coupon");
      close.addEventListener("click", (event) => {
        couponShow.classList.remove("show");
        clearInterval(set);
      });
    }
  }
  collectionCoupon();
  
  function mouseMove() {
    var productList = document.querySelectorAll('#ap-scroll');

    for (let i = 0; i < productList.length; i++) {
      const element = productList[i];
      element.addEventListener('mousedown', function(event) {
        event.preventDefault();
        
        var startX = event.pageX - element.offsetLeft;   
        var scrollLeft = element.scrollLeft;
      
        document.addEventListener('mousemove', moveList);
        document.addEventListener('mouseup', removeListeners);
      
        function moveList(event) {
          var x = event.pageX - element.offsetLeft;
          var walk = (x - startX) * 3;
          element.scrollLeft = scrollLeft - walk;
        }
      
        function removeListeners() {
          document.removeEventListener('mousemove', moveList);
          document.removeEventListener('mouseup', removeListeners);
        }
      });
    }
  }
  mouseMove();

  function apSwiper() {
    // basic options for all sliders

    // call init function
    initSwipers();

    function initSwipers(){

      const swipers = document.querySelectorAll('.swiper-container[data-swiper-id]');

      swipers.forEach(swiper_item => {
        const sliderId = swiper_item.getAttribute('data-swiper-id');

        const nextButton = document.querySelector(`.swiper-button-next[data-swiper-id="${sliderId}-next"]`);
        const prevButton = document.querySelector(`.swiper-button-prev[data-swiper-id="${sliderId}-prev"]`);

        // get options
        const swiperData = swiper_item.dataset.swiper;  // Access data-swiper attribute
    
        // Parse the swiperData JSON string to an object
        let swiperOptions = JSON.parse(swiperData || '{}');
    
        // Add pagination and navigation dynamically (if needed)
        swiperOptions = Object.assign(swiperOptions, {
          scrollbar: {
            el: swiper_item.querySelector(".swiper-scrollbar"),
          },
          pagination: {
            el: swiper_item.querySelector('.swiper-pagination'),
            clickable: true,
          },
          navigation: {
            nextEl: nextButton, 
            prevEl: prevButton,
          }
        });

        // init
        new Swiper(swiper_item, swiperOptions);
      })

    }      
  }
  apSwiper();
  if (Shopify.designMode) {
    document.addEventListener("shopify:section:load", () => {
      apSwiper();
      collectionCoupon();
      Bgcollection();
      loadCountDown();
      modalGalleryImg();
      modalProduct();
    });
  }
})();
