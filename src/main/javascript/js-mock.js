/*!
 * JsMock - A simple Javascript mocking framework.
 * @version @@DEV
 *
 * @author Johannes Fischer (johannes@jsmock.org)
 * @license BSD-3-Clause
 *
 * Copyright (c) 2015 Johannes Fischer
 */
(function () {

  /* diagnostic variables */
  var _logsEnabled = false;
  var _idCounter = 0;

  /* variables */
  var _jshamcrest = null;
  var _shouldMonitorMocks = false;
  var _monitor = {
    mocks: [],
    globalMocks: []
  };

  /* global helper functions */
  function __generateId() {
    return _idCounter++;
  }

  function __format() {
    var result = arguments[0];

    var i, len = arguments.length;
    for (i = 1; i < len; i++) {
      result = result.replace("{" + (i-1) + "}", arguments[i]);
    }

    return result;
  }

  function __log() {
    if (_logsEnabled && console) {
      console.log(__format.apply(null, Array.prototype.slice.call(arguments)));
    }
  }

  function __getJsHamcrest() {
    return _jshamcrest || JsHamcrest;
  }

/*INSERT ExpectationError */

/*INSERT GlobalMock */

/*INSERT Mock */

  /* internal functions */
  function __resetMonitor() {
    __log("Resetting monitor");
    _monitor = {
      mocks: [],
      globalMocks: []
    };
  }

  function __createSimpleMock(name) {
    var newMock = __MockFactory({
      name: name
    });

    if (_shouldMonitorMocks) {
      __log("Adding '{0}' to monitor", newMock.__toString());
      _monitor.mocks.push(newMock);
    }

    return newMock;
  }

  function __createObjectOrFunctionMock(objName, obj, objType) {
    if (obj.constructor === Array) {
      throw new TypeError("Mocking of arrays is not supported");
    }

    var result =
      objType === "function" ?
        __createSimpleMock(objName) :
        {};

    var errors = [];
    Object.keys(obj).forEach(function(propertyName) {
      if (result[propertyName] !== undefined) {
        errors.push(__format("'{0}' has already been assigned to the mock object.", propertyName));
      }

      if (typeof obj[propertyName] === "function") {
        result[propertyName] = __createSimpleMock(objName + "." + propertyName);
      } else {
        result[propertyName] = obj[propertyName];
      }
    });

    if (errors.length > 0) {
      throw new Error("Failed to create mock object for the following reasons: " + JSON.stringify(errors));
    }

    return result;
  }

  function __mockGlobal(globalObjectName) {
    var objectSelectors = globalObjectName.split(".");
    var contextObject = typeof window === 'undefined' ?
      global : //Node
      window; //Browser

    var original = contextObject[objectSelectors[0]];

    var i, len = objectSelectors.length;
    for (i = 1; i < len; i++) {
      contextObject = original;
      original = contextObject[objectSelectors[i]];
    }

    var orgType = typeof original;
    if (orgType !== "function" && orgType !== "object") {
      throw new TypeError(__format("Global variable '{0}' must be an object or a function, but was '{1}'", globalObjectName, orgType));
    }

    if (original === null) {
      throw new TypeError(__format("Global variable '{0}' cannot be null", globalObjectName));
    }

    var mock = __createObjectOrFunctionMock(globalObjectName, original, orgType);

    var globalMock = __GlobalMockFactory({
      propertyName: objectSelectors.pop(),
      context: contextObject,
      original: original,
      mock: mock
    });

    if (_shouldMonitorMocks) {
      __log("Adding '{0}' to monitor", globalMock.__toString());
      _monitor.globalMocks.push(globalMock);
    }

    globalMock.activate();

    return globalMock;
  }

  function __watch(factoryFunc) {
    if (typeof factoryFunc !== "function") {
      throw new TypeError("The first argument must be a function");
    }

    // Clean up monitored mocks so that the same JsMock context can be used between test files
    __resetMonitor();

    try {
      _shouldMonitorMocks = true;
      factoryFunc();
    } finally {
      _shouldMonitorMocks = false;
    }
  }

  function __assertWatched() {
    var i, len = _monitor.globalMocks.length;

    // First restore to ensure the proper state for the next test
    for (i = 0; i < len; i++) {
      var globalMock = _monitor.globalMocks[i];
      __log("Restoring global mock '{0}'", globalMock.__toString());
      globalMock.restoreWithoutVerifying();
    }

    len = _monitor.mocks.length;
    for (i = 0; i < len; i++) {
      var mock = _monitor.mocks[i];
      __log("Asserting mock '{0}'", mock.__toString());
      mock.verify();
    }

    return true;
  }

 /**
  * JavaScript mocking framework, which can be used with any test framework. JsMock is inspired by jMock and Sinon.js
  * with its interface being very similar to Sinon in order to make it easy to switch between those two frameworks.<br>
  * <br>
  * JsMock does only support mocks where all expectations have to be set prior to making the call to the function under test.<br>
  *
  * @exports js-mock
  */
  var API = {
    /**
     * Creates a mock object for a function.<br>
     * <br>
     * If the <code>objectToBeMocked</code> property is provided, the <code>mockName</code> will be used as a prefix for each mock of the object, while the function name will be the suffix.<br>
     * Only functions of the object will be mocked. Any other types will simply be copied over. If the object is a function itself (like jQuery, for example), the main function will also be mocked.
     *
     * @param {string} mockName A named to be used to idenfify this mock object. The name will be include in any thrown {@link ExpectationError}.
     * @param {object|function} objectToBeMocked The object to be cloned with mock functions. Only functions will be mocked, any other property values will simply be copied over.
     *
     * @returns {Mock} a mock object
     */
    mock: function (mockName, objectToBeMocked) {
      if (typeof mockName !== "string" || !mockName) {
        throw new TypeError("The first argument must be a string");
      }

      var objType = typeof objectToBeMocked;
      if (objType === "function" || (objType === "object" && objectToBeMocked !== null)) {
        return __createObjectOrFunctionMock(mockName, objectToBeMocked, objType);
      }

      return __createSimpleMock(mockName);
    },


    /**
     * Creates a mock object for a global variable or a child property of it. For the replacement of a child property, the path to the property must be provided, separated by a '.'.<br>
     * For example, <code>JsMock.mockGlobal("$")</code> will mock the entire jQuery library, while <code>JsMock.mockGlobal("$.ajax")</code> will only mock the ajax() function, but leave
     * the remaining jQuery API intact.
     * <br>
     * The global variable must be of a type 'object' or 'function' and cannot be <code>null</code>.
     *
     * @param {string} globalObjectName The name of the global variable as it is registered with either the <code>window</code> or <code>global</code> object.
     *
     * @throws {TypeError} A type error if the argument is not a {string} or empty.
     * @throws {TypeError} A type error if the global object cannot be mocked.
     * @throws {TypeError} A type error if the global object is a function and contains properties conflicting with the {@link Mock} API.
     *
     * @returns {GlobalMock} mock object for the global variable
     */
    mockGlobal: function (globalObjectName) {
      if (typeof globalObjectName !== "string" || !globalObjectName) {
        throw new TypeError("The first argument must be a string");
      }

      return __mockGlobal(globalObjectName);
    },

    /**
     * When testing a module or file, the best way is to define a set of global mocks,
     * which can be shared between the test cases using the <code>JsMock.watch()</code> function.
     * All mocks created inside the factory function will be added to the current test
     * context and can be verified with a single call to <code>JsMock.assertWatched()</code>.<br>
     * <br>
     * For example:
     * <pre>
     *    var mockFunction1, mockFunction2;
     *    JsMock.watch(function () {
     *      mockFunction1 = JsMock.mock("name1");
     *      mockFunction2 = JsMock.mock("name2");
     *    });
     * </pre>
     *
     * @param {function} factoryFunc A function that will create mock objects for the current test context.
     *
     * @throws {TypeError} A type error if the argument is not a {function}.
     *
     * @function module:js-mock.watch
     */
    watch: __watch,

    /**
     * Verify all mocks registered in the current test context.<br>
     * <br>
     * All mock objects that where created in the factory function of <code>watch()</code>
     * will be verified and an {@link ExpectationError} will be thrown if any of those
     * mocks fails the verification.
     * <br>
     * Any global mocks that were created using <code>mockGlobal()</code> will also be restored.
     *
     * @throws {ExpectationError} An error if a mock object in the current test context failed the verification.
     * @returns {boolean} Returns <code>true</code> if all mocks were satisfied. This is useful for simple assertions
     *                    in case a test framework requires one.
     *
     * @function module:js-mock.assertWatched
     */
    assertWatched: __assertWatched,

    /* For internal debugging purposes */
    __enableLogs: function() {
      _logsEnabled = true;
    },

    __disableLogs: function() {
      _logsEnabled = false;
    }
  };

  API.ExpectationError = ExpectationError;

  if (typeof define === "function") {
    define("js-mock", ['jshamcrest'], function(JsHamcrest) {
      _jshamcrest = JsHamcrest;
      return API;
    });
  }

  if (typeof window !== "undefined") {
    window.JsMock = API;
  } else if (typeof module !== "undefined") {
    module.exports = API;
  }
})();