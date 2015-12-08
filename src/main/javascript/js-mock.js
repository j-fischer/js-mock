/*!
 * JsMock - A simple Javascript mocking framework.
 *
 * @author Johannes Fischer (johannes@jsmock.org)
 * @license BSD-3-Clause
 *
 * Copyright (c) 2015 Johannes Fischer
 */
(function () {

  /* constants */
  var _STUB = "STUB"; // Makes a mock behave like a stub
  var _ALL_CALLS = "ALL_INVOCATIONS"; // The scope of the invocations, i.e. exactly(3).returns('foo'); means return 'foo' for all invocations

  /* diagnostic variables */
  var _logsEnabled = false;
  var _idCounter = 0;

  /* variables */
  var _shouldMonitorMocks = false;
  var _monitor = {
    mocks: [],
    globalMocks: []
  };

  /* internal functions */
  function __generateId() {
    return _idCounter++;
  }

  function __log() {
    if (_logsEnabled && console) {
      console.log(__format.apply(null, Array.prototype.slice.call(arguments)));
    }
  }

  function __resetMonitor() {
    __log("Resetting monitor");
    _monitor = {
      mocks: [],
      globalMocks: []
    };
  }

  function __format() {
    var result = arguments[0];

    var i, len = arguments.length;
    for (i = 1; i < len; i++) {
      result = result.replace("{" + (i-1) + "}", arguments[i]);
    }

    return result;
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
  * @class ExpectationError
  * @classdesc An ExpectationError will be thrown in any situation where a mock
  * expectation has not been met.
  *
  * @property {string} name The name of the error, will always return 'ExpectationError'.
  * @property {string} message The error message for this error instance.
  * @property {string} stack A string containing the stack trace for this error instance.
  */
  function ExpectationError(message) {
    this.name = 'ExpectationError';
    this.message = 'ExpectationError: ' + (message || 'Unknown expectation failed.');
    this.stack = (new Error()).stack;
  }
  ExpectationError.prototype = Object.create(Error.prototype);
  ExpectationError.prototype.constructor = ExpectationError;


  /**
  * Internal - Instantiated by JsMock.
  *
  * @name GlobalMock
  * @private
  * @class
  *
  * @classdesc The object returned by <code>JsMock.mockGlobal</code> representing the mock
  * for a global function or function property. The object to verify the mock and restore
  * the original object and allows the definition of expectations without having to use
  * the original in a test case at all.
  */
  var __GlobalMockFactory = function (args) {
    var _mock = args.mock;
    var _context = args.context;
    var _original = args.original;
    var _propertyName = args.propertyName;

    var _id = __generateId();
    __log("Instantiating global mock '{0}:{1}'", _propertyName, _id);

    function verifyActive() {
      if (_context[_propertyName] === _original)
        throw new Error("Mock object has not been activated");
    }

    function verifyMocks() {
      var verificationErrors = [];
      if (typeof(_mock) === "function") {
        try {
          _mock.verify();
        } catch (ex) {
          verificationErrors.push(ex.message);
        }
      }

      Object.keys(_mock).forEach(function(propertyName) {
        var property = _mock[propertyName];

        if (typeof property !== "function") {
          return;
        }

        try {
          // If the main object is a function, it will contain mock's functions mixed with the original's function
          if (property.verify) {
            property.verify();
          }
        } catch (ex) {
          verificationErrors.push(ex.message);
        }
      });

      if (verificationErrors.length > 0) {
        throw new ExpectationError(__format("Missing invocations for {0}: {1}.", _propertyName, JSON.stringify(verificationErrors))); //TODO: improve message format
      }

      return true;
    }

    function restoreOriginal() {
      __log("Restoring global mock '{0}:{1}'", _propertyName, _id);
      _context[_propertyName] = _original;
    }

    return {
     /**
      * Returns the mock object of this GlobalMock in order to set some expectations.
      *
      * @returns {Mock} The {@link Mock} instance representing this global mock object.
      * @throws {Error} An error if this GlobalMock is not active.
      *
      * @see {@link Mock}
      *
      * @function GlobalMock#expect
      */
      expect: function () {
        verifyActive();

        return _mock;
      },

     /**
      * Activates this <code>GlobalMock</code> by replacing the global, original object with the {@link Mock} instance.
      *
      * @function GlobalMock#activate
      */
      activate: function () {
        __log("Activating global mock '{0}:{1}'", _propertyName, _id);
        _context[_propertyName] = _mock;
      },

     /**
      * Verifies the entire mock object with all its properties and the main function, if available.
      *
      * @throws {ExpectationError} An expectation error if at least one expectation was not fulfilled.
      *
      * @function GlobalMock#verify
      */
      verify: verifyMocks,

     /**
      * First restores the original object and then verifies if all expectations have been fulfilled.
      *
      * @throws {ExpectationError} An expectation error if at least one expectation was not fulfilled.
      *
      * @see {@link GlobalMock#verify}
      *
      * @function GlobalMock#restore
      */
      restore: function () {
        restoreOriginal();
        return verifyMocks();
      },

     /**
      * Restores the original object of this <code>GlobalMock</code> instance.
      *
      * @function GlobalMock#restoreWithoutVerifying
      */
      restoreWithoutVerifying: restoreOriginal,

      /* For debugging purposes */
      __toString: function () {
        return __format("GlobalMock({0})", _propertyName);
      }
    };
  };


 /**
  * Internal - Instantiated by JsMock.
  *
  * @name Mock
  * @private
  * @class
  *
  * @classdesc The object returned by <code>JsMock.mock</code> representing the mock
  * for a function. The object contains numerous methods to define expectations for the
  * invocations of the mocked function and will match every call of this function
  * against those expectations.
  */
  var __MockFactory = function (args) {

    var _id = __generateId();
    var _name = args.name;

    __log("Instantiating mock '{0}:{1}'", _name, _id);

    var _scope, _callCount, _expectTotalCalls, _expectations;

    function reset() {
      __log("Resetting mock '{0}:{1}'", _name, _id);
      _scope = null;
      _callCount = 0;
      _expectTotalCalls = 0;
      _expectations = {}; // {args, returnValue, calls, fulfilled}
    }

    function verifyScope() {
      if (_scope === null) {
        throw new Error("You must call allowing, exactly, never, once, twice or thrice before setting any other expectations for this mock.");
      }
    }

    function isMatcher(obj) {
      return obj !== null &&
        typeof obj === "object" &&
        typeof obj.matches === "function" &&
        typeof obj.describeTo === "function";
    }

    function doArgsMatch(expectedArgs, actualArgs) {

      if (expectedArgs === undefined) {
        // Wildcard - any args match
        return true;
      }

      if (expectedArgs.length !== actualArgs.length) {
        return false;
      }

      var i, len = expectedArgs.length;
      for (i = 0; i < len; i++) {
        var expectedArgument = expectedArgs[i];
        var actualArgument = actualArgs[i];

        if (isMatcher(expectedArgument)) {
          if (expectedArgument.matches(actualArgument)) {
            continue;
          }
          return false;
        }

        if (expectedArgument !== actualArgument) {
          return false;
        }
      }

      return true;
    }

    function findMatchingExpectation(actualArguments) {
      //find matching expectation, throw if no expectation is found
      if (_scope === _STUB) {
        var stub = _expectations[_STUB];
        if (!doArgsMatch(stub.args, actualArguments)) {
          throw new ExpectationError(__format("Unexpected invocation of '{0}'. Actual arguments: {1}.", _name, JSON.stringify(actualArguments)));
        }

        return stub;
      }

      for (var index in _expectations) {
        var expectation = _expectations[index];

        if (expectation.fulfilled) {
          continue;
        }

        if (!doArgsMatch(expectation.args, actualArguments)) {
          break;
        }

        __log("Matched expectation '{0}' for mock '{1}:{2}'", index, _name, _id);
        return expectation;
      }

      throw new ExpectationError(__format("Unexpected invocation of '{0}' for call {1}: actual arguments: {2}.", _name, index, JSON.stringify(actualArguments)));
    }

    function setProperty(obj, propertyName, value) {
      if (propertyName === "returnValue") {
        if ("calls" in obj) {
          throw Error("callsAndReturns() is already set for this expectation. You can only define one of those two functions for you mock");
        }
      }
      if (propertyName === "calls") {
        if ("returnValue" in obj) {
          throw Error("returns() is already set for this expectation. You can only define one of those two functions for you mock");
        }
      }

      obj[propertyName] = value;
    }

    function setInScope(propertyName, value) {
      verifyScope();

      __log("Setting '{0}' for mock '{1}:{2}'", propertyName, _name, _id);
      if (_scope !== _ALL_CALLS) {
        setProperty(_expectations[_scope], propertyName, value);
        return;
      }

      for (var index in _expectations) {
        setProperty(_expectations[index], propertyName, value);
      }
    }

    var _thisMock = function evalCall() {
      if (_callCount === _expectTotalCalls) {
        throw new ExpectationError(__format("'{0}' already called {1} time(s).", _name, _expectTotalCalls));
      }

      var actualArguments = Array.prototype.slice.call(arguments);
      var expectation = findMatchingExpectation(actualArguments);

      //set fulfilled
      expectation.fulfilled = true;

      _callCount++;

      //execute function if applicable
      if (expectation.calls) {
        try {
          return expectation.calls.apply(null, actualArguments);
        } catch (ex) {
          throw new ExpectationError(__format("Registered action for '{0}' threw an error: {1}.", _name, JSON.stringify(ex)));
        }
      }

      //return value
      return expectation.returnValue;
    };

    /**
     * Simply returns this {@link Mock} instance. The function was added to match the API for {@link GlobalMock} so that
     * the expectations can be defined with the same syntax, which makes switching between those types easy.
     *
     * @returns {Mock} This {@link Mock} instance.
     *
     * @function Mock#expect
     */
    _thisMock.expect = function() {
      return _thisMock;
    };

    /**
     * Set the expectation for the mock to be called 'x' number of times.
     *
     * @param {number} count The number of times how often this mock is expected to be called.
     *
     * @returns {Mock} This {@link Mock} instance.
     *
     * @function Mock#exactly
     */
    _thisMock.allowing = function() {
      reset();

      _expectTotalCalls = -1;
      _expectations[_STUB] = {};
      _scope = _STUB;

      return _thisMock;
    };

    /**
     * Set the expectation for the mock to be called 'x' number of times.
     *
     * @param {number} count The number of times how often this mock is expected to be called.
     *
     * @returns {Mock} This {@link Mock} instance.
     *
     * @function Mock#exactly
     */
    _thisMock.exactly = function(count) {
      if (count < 0) {
        throw new Error("'count' must be 0 or higher");
      }

      reset();

      _scope = _ALL_CALLS;
      _expectTotalCalls = count;

      for (var i = 1; i <= count; i++) {
        _expectations[i] = {};
      }

      return _thisMock;
    };

    /**
     * Will set all following expectations for the given call.
     *
     * @param {number} number The index of the call (starting with 1) where the expectations should be set.
     *
     * @returns {Mock} This {@link Mock} instance.
     *
     * @function Mock#onCall
     */
    _thisMock.onCall = function (index) {
      if (index < 1) {
        throw new Error("Call index must be larger than 0");
      }

      if (_expectTotalCalls < 0) {
          throw new Error("Mock is set up as a stub. Cannot set expectations for a specific call.");
      }

      if (index > _expectTotalCalls) {
        throw new Error("Attempting to set the behaviour for a call that is not expected. Calls expected: " + _expectTotalCalls + ", call attempted to change: " + index);
      }

      _scope = index;

      return _thisMock;
    };

    /**
     * Expects the function to be called with the given arguments. Any of the given arguments can be
     * a JsHamcrest style matcher. If a matcher is provided as an argument, the actual argument will
     * be passed on to the `matches()` function of the matcher object.
     *
     * @param {...?(number|boolean|string|array|object|function)} arguments The arguments to be expected when the function is invoked.
     *
     * @returns {Mock} This {@link Mock} instance.
     *
     * @function Mock#withExactArgs
     */
    _thisMock.withExactArgs = function () {
      setInScope("args", Array.prototype.slice.call(arguments));
      return _thisMock;
    };

    /**
     * Expects the function to be called to return the given value.
     *
     * @param {?(number|boolean|string|array|object|function)} returnValue The value to be returned when the function is invoked.
     *
     * @returns {Mock} This {@link Mock} instance.
     *
     * @throws {TypeError} An error if the given argument is not a function.
     * @throws {Error} An error if {@link Mock#callsAndReturns} has already been defined for this expectation.
     *
     * @function Mock#returns
     */
    _thisMock.returns = function (returnValue) {
      setInScope("returnValue", returnValue);
      return _thisMock;
    };

    /**
     * Executes a function if the mock was successfully matched. All arguments passed in to the mock function
     * will be passed on to the function defined in here. The function will be executed immediately and the
     * value returned by the function will also be the return value of the mock.
     *
     * @param {!function} func The function to be executed when the expectation is fulfilled.
     *
     * @returns {Mock} This {@link Mock} instance.
     *
     * @throws {TypeError} An error if the given argument is not a function.
     * @throws {Error} An error if {@link Mock#returns} has already been defined for this expectation.
     *
     * @function Mock#callsAndReturns
     */
    _thisMock.callsAndReturns = function (func) {
      if (typeof (func) !== "function") {
        throw new TypeError("Argument must be a function");
      }

      setInScope("calls", func);
      return _thisMock;
    };

    /**
     * Verifies of all set expectations of this mock are fulfilled. If not, an ExpectationError will be thrown.
     * If the verification passes, the mock will be reset to its original state.
     *
     * @returns {boolean} Returns <code>true</code> if all expectations for this mock were satisfied.
     *                    This is useful for simple assertions in case a test framework requires one.
     *
     * @throws {ExpectationError} An ExpectationError if any expectation was not fulfilled.
     *
     * @function Mock#verify
     */
    _thisMock.verify = function () {
      __log("Verifying mock '{0}:{1}'", _name, _id);
      if (_scope === _STUB) {
        reset();
        return true;
      }

      var unfulfilledExpectations = [];
      Object.keys(_expectations).forEach(function(index) {
        var expectation = _expectations[index];

        // TODO: Verify if this code branch can ever be executed. I think missing expectations would always fail in line 249.
        if (!expectation.fulfilled) {
          unfulfilledExpectations.push(__format("Expectation for call {0} with args {1}, will return {2}.", index, JSON.stringify(expectation.args), JSON.stringify(expectation.returnValue)));
        }
      });

      if (unfulfilledExpectations.length > 0) {
        throw new ExpectationError(__format("Missing invocations for {0}: {1}.", _name, JSON.stringify(unfulfilledExpectations))); //TODO: improve message format
      }

      reset();
      return true;
    };

   /* helpers, i.e. once, twice, onFirstCall, etc */
   /**
    * Alias for exactly(0).
    *
    * @see {@link Mock#exactly}
    *
    * @returns {Mock} This {@link Mock} instance.
    *
    * @function Mock#never
    */
   _thisMock.never = function () {
     return _thisMock.exactly(0);
   };

    /* helpers, i.e. once, twice, onFirstCall, etc */
    /**
     * Alias for exactly(1).
     *
     * @see {@link Mock#exactly}
     *
     * @returns {Mock} This {@link Mock} instance.
     *
     * @function Mock#once
     */
    _thisMock.once = function () {
      return _thisMock.exactly(1);
    };

   /**
    * Alias for exactly(2).
    *
    * @see {@link Mock#exactly}
    *
    * @returns {Mock} This {@link Mock} instance.
    *
    * @function Mock#twice
    */
    _thisMock.twice = function () {
      return _thisMock.exactly(2);
    };

   /**
    * Alias for exactly(3).
    *
    * @see {@link Mock#exactly}
    *
    * @returns {Mock} This {@link Mock} instance.
    *
    * @function Mock#thrice
    */
    _thisMock.thrice = function () {
      return _thisMock.exactly(3);
    };

   /**
    * Alias for onCall(1).
    *
    * @see {@link Mock#onCall}
    *
    * @returns {Mock} This {@link Mock} instance.
    *
    * @function Mock#onFirstCall
    */
    _thisMock.onFirstCall = function () {
      return _thisMock.onCall(1);
    };

   /**
    * Alias for onCall(2).
    *
    * @see {@link Mock#onCall}
    *
    * @returns {Mock} This {@link Mock} instance.
    *
    * @function Mock#onSecondCall
    */
    _thisMock.onSecondCall = function () {
      return _thisMock.onCall(2);
    };

   /**
    * Alias for onCall(3).
    *
    * @see {@link Mock#onCall}
    *
    * @returns {Mock} This {@link Mock} instance.
    *
    * @function Mock#onThirdCall
    */
    _thisMock.onThirdCall = function () {
      return _thisMock.onCall(3);
    };

   /**
    * Alias for callsAndReturns.
    *
    * @see {@link Mock#callsAndReturns}
    *
    * @returns {Mock} This {@link Mock} instance.
    *
    * @function Mock#will
    */
    _thisMock.will = function (func) {
      return _thisMock.callsAndReturns(func);
    };

   /**
    * Alias for withExactArgs.
    *
    * @see {@link Mock#withExactArgs}
    *
    * @returns {Mock} This {@link Mock} instance.
    *
    * @function Mock#with
    */
    _thisMock.with = _thisMock.withExactArgs;

    /* For debugging purposes */
    _thisMock.__toString = function () {
      return _name + ":" + _id;
    };

    reset();

    return _thisMock;
  };


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
     * which can be shared between the test cases using the <code>JsMock.monitorMocks()</code> function.
     * All mocks created inside the factory function will be added to the current test
     * context and can be verified with a single call to <code>JsMock.assertWatched()</code>.<br>
     * <br>
     * For example:
     * <pre>
     *    var mockFunction1, mockFunction2;
     *    JsMock.monitorMocks(function () {
     *      mockFunction1 = JsMock.mock("name1");
     *      mockFunction2 = JsMock.mock("name2");
     *    });
     * </pre>
     *
     * @param {function} factoryFunc A function that will create mock objects for the current test context.
     *
     * @throws {TypeError} A type error if the argument is not a {function}.
     */
    watch: __watch,

   /**
    * Alias for JsMock.watch().
    *
    * @see {@link js-mock#watch}
    * @deprecated since version 0.9
    */
    monitorMocks: __watch,

    /**
     * Verify all mocks registered in the current test context.<br>
     * <br>
     * All mock objects that where created in the factory function of <code>monitorMocks()</code>
     * will be verified and an {@link ExpectationError} will be thrown if any of those
     * mocks fails the verification.
     * <br>
     * Any global mocks that were created using <code>mockGlobal()</code> will also be restored.
     *
     * @throws {ExpectationError} An error if a mock object in the current test context failed the verification.
     * @returns {boolean} Returns <code>true</code> if all mocks were satisfied. This is useful for simple assertions
     *                    in case a test framework requires one.
     */
    assertWatched: __assertWatched,

   /**
    * Alias for JsMock.assertWatched().
    *
    * @see {@link js-mock#assertWatched}
    * @deprecated since version 0.9
    */
    assertIfSatisfied: __assertWatched,

    /* For internal debugging purposes */
    __enableLogs: function() {
      _logsEnabled = true;
    }
  };

  API.ExpectationError = ExpectationError;

  if (typeof define === "function") {
    define("js-mock", [], function() {
      return API;
    });
  }

  if (typeof window !== "undefined") {
    window.JsMock = API;
  } else if (typeof module !== "undefined") {
    module.exports = API;
  }
})();