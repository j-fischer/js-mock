(function () { // initializes namepsace if neccessary
  var namespaceString = 'JsMock';
  
    var parts = namespaceString.split('.'),
        parent = window,
        currentPart = '';    
        
    for(var i = 0, length = parts.length; i < length; i++) {
        currentPart = parts[i];
        parent[currentPart] = parent[currentPart] || {};
        parent = parent[currentPart];
    }
})();

(function () {
  
  /* constants */
  var _ALL_CALLS = -1; // The scope of the invocations, i.e. exactly(3).returns('foo'); means return 'foo' for all invocations
  
  /* variables */
  var _shouldMonitorMocks = false;
  var _monitoredMocks = [];
  
  function _format() {
    var result = arguments[0];
    
    var i; len = arguments.length;  
    for (i = 1; i < len; i++) {
      result = result.replace("{" + i + "}", arguments[i]);
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
    this.message = message || 'Unkown expectation failed.';
    this.stack = (new Error()).stack;
  }
  ExpectationError.prototype = Object.create(Error.prototype);
  ExpectationError.prototype.constructor = ExpectationError;
  
 /** 
  * This is a class. 
  *
  * @class
  */
  var Mock = function (args) {
    
    var _name = args.name;
    
    var _scope, _callCount, _expectTotalCalls, _expectations;
    
    function reset() {
      _scope = _ALL_CALLS;
      _callCount = 0;
      _expectTotalCalls = 0;
      _expectations = {}; // {args, returns, will, fulfilled}
    }
    
    function matchArgs(expectedArgs, actualArgs) {
      if (expectedARgs === undefined) {
        return true;
      }
      
      // match args assuming type equality
    }
    
    function evalCall() {
      if (_callCount === _expectedCallCount) {
        throw new ExpectationError(_format("{0} already called {1} times", _name, _expectedCallCount));
      }
          
      _callCount++;

      //find matching expectation, throw if no expectation is found
      
      //execute function if applicable
      
      //set fulfilled
      
      //return value
    }
        
    this.exactly = function(count) {
      reset();
      
      _expectTotalCalls = count;
    };
      
    this.withExactArgs = function () {
        
    };
      
    this.returns = function (arg) {
        
    };
      
    this.will = function (willArgs, func) {
      
    };
      
    this.verify = function () {
      //verify expectations
      
      reset();
    }

    /* helpers, i.e. once, twice, onFirstCall, etc */
      
      
    return evalCall;  
  };
  
  
  function mock(name) {
    var mock = new Mock({
      name: name
    });
    
    if (_shouldMonitorMocks) {
      _monitoredMocks.push(mock);
    }
    
    return mock;
  }
  
  function mockProperties(objName, obj) {
    var result = {};
    Object.keys(obj).foreach(function(element, index, array) {
      result[element] = mock(objName + "." + element);
    });
    
    return result;
  }  
  
  init();
  
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
  
  if ( typeof define === "function" && define.amd ) {
  	define("js-mock", [], function() {
  		return API;
  	});
  }

  window.JsMock = API;
})();