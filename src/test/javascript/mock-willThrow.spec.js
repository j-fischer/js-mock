
describe('Mock', function(){

  var _myFunc;

  beforeEach(function () {
    JsMock.watch(function () {
      _myFunc = JsMock.mock("WillThrow.myFunc");
    });
  });

  afterEach(function () {
    JsMock.assertWatched();
  });

  /*
   * HELPER FUNCTIONS
   */
  function expectExpectationError(func, expectedErrorMsg) {
    expect(func).toThrowError(JsMock.ExpectationError, expectedErrorMsg);
  }

  /*
   * TESTS
   */
  describe('willThrow', function(){

    it("should throw if throws is already defined", function () {
      expect(function () {
        _myFunc.once().throws(new Error("someError")).willThrow(function () {});
      }).toThrowError(Error, "throws() is already set for this expectation. You can only define one of those two functions for you mock");

      expect(_myFunc).toThrowError("someError");
    });

    it("should throw if argument is not a function", function () {
      expect(function () {
        _myFunc.willThrow({});
      }).toThrowError(TypeError, "Argument must be a function");
    });

    it("should throw if invocation result is already defined", function () {
      expect(function () {
        _myFunc.once().callsAndReturns(function () {}).willThrow(function () {});
      }).toThrowError(Error, "callsAndReturns() is already set for this expectation. You can only define one of those two functions for you mock");

      expect(function () {
        _myFunc.once().returns("bar").willThrow(function () {});
      }).toThrowError(Error, "returns() is already set for this expectation. You can only define one of those two functions for you mock");

      expect(function () {
        _myFunc.once().throws("bar").willThrow(function () {});
      }).toThrowError(Error, "throws() is already set for this expectation. You can only define one of those two functions for you mock");

      _myFunc.never();
    });

    it("should throw if no calls have been expected", function () {
      expect(function () {
        _myFunc.willThrow(function () {
          throw "Should not be registered.";
        });
      }).toThrowError(Error, "You must call allowing, exactly, never, once, twice or thrice before setting any other expectations for this mock.");
    });

    it("should throw ExpectationError if function does not throw an exception", function () {
      _myFunc.once().willThrow(function () {
        return "noException";
      });

      expectExpectationError(_myFunc, "ExpectationError: Registered action for 'WillThrow.myFunc' was expected to throw an exception.");
    });

    it("should pass the arguments to the function", function () {
      var arg1 = "abc";
      var arg2 = { a: "propertyVBalue" };

      _myFunc.once().willThrow(function (actualArg1, actualArg2) {
        expect(actualArg1).toBe(arg1);
        expect(actualArg2).toBe(arg2);

        throw new Error("someError");
      });

      expect(function () {
        _myFunc(arg1, arg2);
      }).toThrowError("someError");
    });
  });
});