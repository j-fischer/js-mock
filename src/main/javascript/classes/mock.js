  /* Mock constants */
  var _STUB = "STUB"; // Makes a mock behave like a stub
  var _ALL_CALLS = "ALL_INVOCATIONS"; // The scope of the invocations, i.e. exactly(3).returns('foo'); means return 'foo' for all invocations

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
      var atomicProperties = {
        "returnValue": "returns",
        "throws": "throws",
        "calls": "callsAndReturns",
        "callsAndThrows": "willThrow"
      };

      if (atomicProperties[propertyName]) {
        var propNameFilter = function (val) {
          return val !== propertyName;
        };

        Object.keys(atomicProperties).filter(propNameFilter).forEach(function (atomicPropName) {
          if (atomicPropName in obj) {
            throw Error(atomicProperties[atomicPropName] + "() is already set for this expectation. You can only define one of those two functions for you mock");
          }
        });
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
        var msg = _expectTotalCalls === 0 ?
          "'{0}' was not expected to be called." :
          "'{0}' was expected to be called {1} time(s). It was just invoked for the {2} time.";

        throw new ExpectationError(__format(msg, _name, _expectTotalCalls, (_expectTotalCalls + 1)));
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

      if (expectation.callsAndThrows) {
        var exception = null;
        try {
          expectation.callsAndThrows.apply(null, actualArguments);
        } catch (ex) {
          exception = ex;
        }

        throw exception ?
          exception :
          new ExpectationError(__format("Registered action for '{0}' was expected to throw an exception.", _name));
      }

      if (expectation.throws !== undefined) {
        throw expectation.throws;
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
     * Allows the mock to be called any number if times, assuming that the invocation still fulfills
     * the expectations defined with the {@link Mock#with} function.
     *
     * @returns {Mock} This {@link Mock} instance.
     *
     * @function Mock#allowing
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
     * @throws {Error} An error if {@link Mock#returns} has already been defined for this expectation.
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
     * @throws {Error} An error if another outcome has already been defined for this expectation.
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
     * Executes a function if the mock was successfully matched. All arguments passed in to the mock function
     * will be passed on to the function defined in here. The function will be executed immediately and is
     * expected to throw an exception. If it does not throw and expection, an {ExpectationError} will be thrown.
     *
     * @param {!function} func The function to be executed when the expectation is fulfilled.
     *
     * @returns {Mock} This {@link Mock} instance.
     *
     * @throws {TypeError} An error if the given argument is not a function.
     * @throws {Error} An error if another outcome has already been defined for this expectation.
     *
     * @function Mock#willThrow
     */
    _thisMock.willThrow = function (func) {
      if (typeof (func) !== "function") {
        throw new TypeError("Argument must be a function");
      }

      setInScope("callsAndThrows", func);
      return _thisMock;
    };

    /**
     * Expects the function to be called to throw the given error.
     *
     * @param {(string|object)} error The error to be thrown.
     *
     * @returns {Mock} This {@link Mock} instance.
     *
     * @throws {TypeError} An error if the given argument is null or undefined.
     * @throws {Error} An error if another outcome has already been defined for this expectation.
     *
     * @function Mock#throws
     */
    _thisMock.throws = function (error) {
      if (typeof (error) !== 'string' && typeof (error) !== 'object') {
        throw new TypeError("Argument must either be a string or an object");
      }

      if (error === null) {
        throw new TypeError("Argument cannot be null");
      }

      setInScope("throws", error);
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

        if (!expectation.fulfilled) {
          unfulfilledExpectations.push(__format("Expectation for call {0} with args {1}, will return {2}", index, (JSON.stringify(expectation.args) || "undefined").replace('\\"', '"'), JSON.stringify(expectation.returnValue)));
        }
      });

      if (unfulfilledExpectations.length > 0) {
        throw new ExpectationError(__format("Missing invocations for {0}():\n>>> {1}", _name, unfulfilledExpectations.join("\n>>> ")));
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
    * Alias for withExactArgs(JsHamcrest.Matchers.equivalentMap(arg).
    *
    * @see {@link Mock#withExactArgs}
    *
    * @param {object} arg The object to be evaluated for equivalancy.
    *
    * @returns {Mock} This {@link Mock} instance.
    *
    * @function Mock#withEquivalentObject
    */
    _thisMock.withEquivalentObject = function (arg) {
      if (typeof(JsHamcrest) === "undefined") {
        throw new Error("withEquivalentObject() requires JsHamcrest to be available in order to be used.");
      }

      if (typeof(arg) !== "object") {
        throw new Error("'arg' must be of type object.");
      }

      return _thisMock.withExactArgs(JsHamcrest.Matchers.equivalentMap(arg));
    };

   /**
    * Alias for withExactArgs(JsHamcrest.Matchers.equivalentArray(arg).
    *
    * @see {@link Mock#withExactArgs}
    *
    * @param {array} arg The array to be evaluated for equivalancy.
    *
    * @returns {Mock} This {@link Mock} instance.
    *
    * @function Mock#withEquivalentArray
    */
    _thisMock.withEquivalentArray = function (arg) {
      if (typeof(JsHamcrest) === "undefined") {
        throw new Error("withEquivalentArray() requires JsHamcrest to be available in order to be used.");
      }

      if (!Array.isArray(arg)) {
        throw new Error("'arg' must be of type array.");
      }

      return _thisMock.withExactArgs(JsHamcrest.Matchers.equivalentArray(arg));
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