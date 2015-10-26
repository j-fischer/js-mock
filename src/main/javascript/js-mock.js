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
  * This is a class. 
  *
  * @class
  */
  function ExpectationError(message) {
    this.name = 'ExpectationError';
    this.message = 'ExpectationError: ' + (message || 'Unknown expectation failed.');
    this.stack = (new Error()).stack;
  }
  ExpectationError.prototype = Object.create(Error.prototype);
  ExpectationError.prototype.constructor = ExpectationError;
  
 /** 
  * This is a class. 
  *
  * @class
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
          
      _callCount++;

      var actualArguments = arguments;
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
      
      //return value
      return expectation.returnValue;
    };
        
    _thisMock.exactly = function(count) {
      reset();
      
      _expectTotalCalls = count;
    };
    
    _thisMock.onCall = function (index) {
      // TODO: verify index
      
      _scope = index;
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
      //verify expectations
      var unfulfilledExpectations = [];
      
      if (_callCount !== _expectTotalCalls) {
        throw new ExpectationError(_format("Missing invocations for '{0}'. Expected {1} call(s) but only got {2}.", _name, _expectTotalCalls, _callCount));
      }
      
      Object.keys(_expectations).forEach(function(expectation, index) {
        if (!expectation.fulfilled) {
          unfulfilledExpectations.push(_format("Expectation for call {0} with args {1},\nwill return {2}.", index, JSON.stringify(expectation.args), JSON.stringify(expectation.returnValue)));
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
    Object.keys(obj).forEach(function(element) {
      result[element] = mock(objName + "." + element);
    });
    
    return result;
  }  
  
 /** 
  * This is a module. 
  *
  * @exports js-mock
  */
  var API = {
    /** 
     * This is an API method that does something.
     * @param {object} args
     *   @param {string} args.aParam: this is a parameter for this method
     *
     * @module js-mock
     */
    mock: function (arg1, arg2) {
      if (typeof arg1 !== "string" || !arg1) {
        throw new TypeError("The first argument must be a string");
      }
      
      if (typeof arg2 === "object" && arg2 !== null) {
        return mockProperties(arg1, arg2);
      }
      
      return mock(arg1);
    },
    
    monitorMocks: function (factoryFunc) {
      if (typeof factoryFunc !== "function") {
        throw new TypeError("The first argument must be a function");
      }
    },
    
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