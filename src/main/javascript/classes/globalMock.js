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
        throw new ExpectationError(__format("Missing invocations detected for global mock {0}:\n{1}", _propertyName, verificationErrors.join("\n")));
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