/**
 * JsMock - A simple Javascript mocking framework.
 *
 * @author Johannes Fischer (jh-fischer@web.de)
 * @license BSD
 *
 * Copyright (c) 2015 Johannes Fischer
 */
(function () {
  
  /* constants */
  var _ALL_CALLS = "ALL_INVOCATIONS"; // The scope of the invocations, i.e. exactly(3).returns('foo'); means return 'foo' for all invocations
  
  /* variables */
  var _shouldMonitorMocks = false;
  var _monitoredMocks = [];
  
  function _format() {
    var result = arguments[0];
    
    var i, len = arguments.length;  
    for (i = 1; i < len; i++) {
      result = result.replace("{" + (i-1) + "}", arguments[i]);
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
      _scope = _ALL_CALLS;
      _callCount = 0;
      _expectTotalCalls = 0;
      _expectations = {}; // {args, returnValue, will, fulfilled}
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
        //TODO: Add support for matchers here
        if (expectedArgs[i] !== actualArgs[i]) {
          return false;
        }
      }
      
      return true;
    }
    
    function findMatchingExpectation(actualArguments) {
      //find matching expectation, throw if no expectation is found
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
      
      throw new ExpectationError(_format("Unexpected invocation of '{0}' for call {1}: actual arguments: {2}.", _name, index, JSON.stringify(actualArguments)));
    }
    
    function setInScope(propertyName, value) {
      if (_scope !== _ALL_CALLS) {
        _expectations[_scope][propertyName] = value;
        return;
      }
      
      for (var index in _expectations) {
        _expectations[index][propertyName] = value;
      }
    }
    
    var _thisMock = function evalCall() {
      if (_callCount === _expectTotalCalls) {
        throw new ExpectationError(_format("'{0}' already called {1} time(s).", _name, _expectTotalCalls));
      }

      var actualArguments = Array.prototype.slice.call(arguments);
      var expectation = findMatchingExpectation(actualArguments);
      
      //execute function if applicable
      if (expectation.will) {
        try {
          expectation.will.apply(null, actualArguments);
        } catch (ex) {
          throw new ExpectationError(_format("Registered action for '{0}' threw an error: {1}.", _name, JSON.stringify(ex)));
        }
      }
      
      //set fulfilled
      expectation.fulfilled = true;
      
      _callCount++;
      
      //return value
      return expectation.returnValue;
    };

    /** 
     * Set the expectation for the mock to be called 'x' number of times. 
     *
     * @param {number} count The number of times how often this mock is expected to be called.
     *
     * @returns {object} This {@link MockClass} instance. 
     *
     * @function Mock#exactly
     */
    _thisMock.exactly = function(count) {
      // validate count > 0
      
      reset();
      
      _expectTotalCalls = count;
      
      for (var i = 1; i <= count; i++) {
        _expectations[i] = {};
      }
      
      return _thisMock;
    };
    
    _thisMock.onCall = function (index) {
      if (index > _expectTotalCalls) {
        throw new Error("Attempting to set the behaviour for a call that is not expected. Calls expected: " + _expectTotalCalls + ", call attempted to change: " + index);
      }
      
      _scope = index;
      
      return _thisMock;
    };
      
    _thisMock.withExactArgs = function () {
      setInScope("args", arguments);
      return _thisMock;
    };
      
    _thisMock.returns = function (returnValue) {
      setInScope("returnValue", returnValue);
      return _thisMock;
    };
      
    _thisMock.will = function (func) {
      setInScope("will", func);
      return _thisMock;
    };
      
    _thisMock.verify = function () {
      var unfulfilledExpectations = [];
      
      if (_callCount !== _expectTotalCalls) {
        throw new ExpectationError(_format("Missing invocations for '{0}'. Expected {1} call(s) but only got {2}.", _name, _expectTotalCalls, _callCount));
      }
      
      Object.keys(_expectations).forEach(function(index) {
        var expectation = _expectations[index];
        if (!expectation.fulfilled) {
          unfulfilledExpectations.push(_format("Expectation for call {0} with args {1}, will return {2}.", index, JSON.stringify(expectation.args), JSON.stringify(expectation.returnValue)));
        }
      });
      
      if (unfulfilledExpectations.length > 0) {
        throw new ExpectationError(_format("Missing invocations for {0}: {1}.", _name, JSON.stringify(unfulfilledExpectations))); //TODO: improve message format
      }
      
      reset();
    };

    /* helpers, i.e. once, twice, onFirstCall, etc */
    _thisMock.once = function () {
      return _thisMock.exactly(1);
    };
    
    _thisMock.twice = function () {
      return _thisMock.exactly(2);
    };
    
    _thisMock.thrice = function () {
      return _thisMock.exactly(3);
    };
    
    _thisMock.onFirstCall = function () {
      return _thisMock.onCall(1);
    };
    
    _thisMock.onSecondCall = function () {
      return _thisMock.onCall(2);
    };
    
    _thisMock.onThirdCall = function () {
      return _thisMock.onCall(3);
    };
      
    reset();  
      
    return _thisMock;  
  };
  
  
  function mock(name) {
    var newMock = new MockClass({
      name: name
    });
    
    if (_shouldMonitorMocks) {
      _monitoredMocks.push(newMock);
    }
    
    return newMock;
  }
  
  function mockProperties(objName, obj) {
    var result = {};
    Object.keys(obj).forEach(function(propertyName) {
      if (typeof obj[propertyName] === "function") { 
        result[propertyName] = mock(objName + "." + propertyName);
      } else {
        result[propertyName] = obj[propertyName];
      }
    });
    
    return result;
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
     * Only functions of the object will be mocked. Any other types will simply be copied over.
     * 
     * @param {string} mockName A named to be used to idenfify this mock object. The name will be include in any thrown {@link ExpectationError}. 
     * @param {object} objectToBeMocked (optional) The object to be cloned with mock functions. Only functions will be mocked, any other property values will simply be copied over.
     */
    mock: function (mockName, objectToBeMocked) {
      if (typeof mockName !== "string" || !mockName) {
        throw new TypeError("The first argument must be a string");
      }
      
      if (typeof objectToBeMocked === "object" && objectToBeMocked !== null) {
        return mockProperties(mockName, objectToBeMocked);
      }
      
      return mock(mockName);
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
     */
    assertIfSatisfied: function () {
      var i, len = _monitoredMocks.length;
      for (i = 0; i < len; i++) {
        _monitoredMocks[i].verify();
      }
    }
  };
  
  API.ExpectationError = ExpectationError;
  
  if ( typeof define === "function") {
  	define("js-mock", [], function() {
  		return API;
  	});
  }

  window.JsMock = API;
})();