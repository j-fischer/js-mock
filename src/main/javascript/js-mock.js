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

  /* variables */
  var _shouldMonitorMocks = false;
  var _monitoredMocks = [];

  function __format() {
    var result = arguments[0];

    var i, len = arguments.length;
    for (i = 1; i < len; i++) {
      result = result.replace("{" + (i-1) + "}", arguments[i]);
    }

    return result;
  }

  function __mock(name) {
    var newMock = new MockClass({
      name: name
    });

    if (_shouldMonitorMocks) {
      _monitoredMocks.push(newMock);
    }

    return newMock;
  }

  function __mockProperties(objName, obj, objType) {
    var result =
      objType === "function" ?
        __mock(objName) :
        {};

    var errors = [];
    Object.keys(obj).forEach(function(propertyName) {
      if (result[propertyName] !== undefined) {
        errors.push(__format("{0} has already been assigned to the mock object.", propertyName));
      }

      if (typeof obj[propertyName] === "function") {
        result[propertyName] = __mock(objName + "." + propertyName);
      } else {
        result[propertyName] = obj[propertyName];
      }
    });

    if (errors.length > 0) {
      throw new Error("Failed to create mock object for the following reasons: " + JSON.stringify(errors));
    }

    return result;
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
  * @name Mock
  * @private
  * @class
  *
  * @classdesc The object returned by <code>JsMock.mock</code> representing the mock
  * for a function. The object contains numerous methods to define expectations for the
  * invocations of the mocked function and will match every call of this function
  * against those expectations.
  */
  var MockClass = function (args) {

    var _name = args.name;

    var _scope, _callCount, _expectTotalCalls, _expectations;

    function reset() {
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
     * Set the expectation for the mock to be called 'x' number of times.
     *
     * @param {number} count The number of times how often this mock is expected to be called.
     *
     * @returns {MockClass} This {@link MockClass} instance.
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
     * @returns {MockClass} This {@link MockClass} instance.
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
     * @returns {MockClass} This {@link MockClass} instance.
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
     * @returns {MockClass} This {@link MockClass} instance.
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
     * @returns {MockClass} This {@link MockClass} instance.
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
     * @returns {MockClass} This {@link MockClass} instance.
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
    * @returns {MockClass} This {@link MockClass} instance.
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
     * @returns {MockClass} This {@link MockClass} instance.
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
    * @returns {MockClass} This {@link MockClass} instance.
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
    * @returns {MockClass} This {@link MockClass} instance.
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
    * @returns {MockClass} This {@link MockClass} instance.
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
    * @returns {MockClass} This {@link MockClass} instance.
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
    * @returns {MockClass} This {@link MockClass} instance.
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
    * @returns {MockClass} This {@link MockClass} instance.
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
    * @returns {MockClass} This {@link MockClass} instance.
    *
    * @function Mock#with
    */
    _thisMock.with = function (func) {
      return _thisMock.withExactArgs.apply(_thisMock, Array.prototype.slice.call(arguments));
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
     */
    mock: function (mockName, objectToBeMocked) {
      if (typeof mockName !== "string" || !mockName) {
        throw new TypeError("The first argument must be a string");
      }

      var objType = typeof objectToBeMocked;
      if (objType === "function" || (objType === "object" && objectToBeMocked !== null)) {
        return __mockProperties(mockName, objectToBeMocked, objType);
      }

      return __mock(mockName);
    },

    /**
     * When testing a module or file, the best way is to define a set of global mocks,
     * which can be shared between the test cases using the <code>JsMock.monitorMocks()</code> function.
     * All mocks created inside the factory function will be added to the current test
     * context and can be verified with a single call to <code>JsMock.assertIfSatisfied()</code>.<br>
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
     */
    monitorMocks: function (factoryFunc) {
      if (typeof factoryFunc !== "function") {
        throw new TypeError("The first argument must be a function");
      }

      // Clean up monitored mocks so that the same JsMock context can be used between test files
      _monitoredMocks = [];

      try {
        _shouldMonitorMocks = true;
        factoryFunc();
      } finally {
        _shouldMonitorMocks = false;
      }
    },

    /**
     * Verify all mocks registered in the current test context.<br>
     * <br>
     * All mock objects that where created in the factory function of <code>monitorMocks()</code>
     * will be verified and an {@link ExpectationError} will be thrown if any of those
     * mocks fails the verification.
     *
     * @throws {ExpectationError} An error if a mock object in the current test context failed the verification.
     * @returns {boolean} Returns <code>true</code> if all mocks were satisfied. This is useful for simple assertions
     *                    in case a test framework requires one.
     */
    assertIfSatisfied: function () {
      var i, len = _monitoredMocks.length;
      for (i = 0; i < len; i++) {
        _monitoredMocks[i].verify();
      }

      return true;
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