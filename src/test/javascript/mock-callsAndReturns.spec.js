describe('Mock', function(){

  var _myFunc;

  beforeEach(function () {
    JsMock.monitorMocks(function () {
      _myFunc = JsMock.mock("CallsAndReturns.myFunc");
    });
  });

  afterEach(function () {
    JsMock.assertIfSatisfied();
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
  describe('callsAndReturns', function(){

    it("should throw if argument is not a function", function () {
      expect(function () {
        _myFunc.callsAndReturns({});
      }).toThrowError(TypeError, "Argument must be a function");
    });

    it("should throw if no calls have been expected", function () {
      expect(function () {
        _myFunc.callsAndReturns(function () {
          throw "Should not be registered.";
        });
      }).toThrowError(Error, "You must call allowing, exactly, never, once, twice or thrice before setting any other expectations for this mock.");
    });

    it("should throw ExpectationError if function throws an exception", function () {
      _myFunc.once().callsAndReturns(function () {
        throw "some error";
      });

      expectExpectationError(_myFunc, "ExpectationError: Registered action for 'CallsAndReturns.myFunc' threw an error: \"some error\".");
    });

    it("should pass the arguments to the function", function () {
      var arg1 = "abc";
      var arg2 = { a: "propertyVBalue" };

      _myFunc.once().callsAndReturns(function (actualArg1, actualArg2) {
        expect(actualArg1).toBe(arg1);
        expect(actualArg2).toBe(arg2);
      });

      _myFunc(arg1, arg2);
    });

    it("should do nothing with the return value", function () {
      _myFunc.once().callsAndReturns(function () {
        return "foo";
      });

      expect(_myFunc.returns).toThrowError(Error, "callsAndReturns() is already set for this expectation. You can only define one of those two functions for you mock");

      _myFunc();
    });
  });

  describe('will', function(){
    it("should throw if argument is not a function", function () {
      expect(function () {
        _myFunc.will("do something");
      }).toThrowError(TypeError, "Argument must be a function");
    });

    it("should pass the arguments to the function", function () {
      var arg1 = "abc";
      var arg2 = { a: "propertyVBalue" };

      _myFunc.once().will(function (actualArg1, actualArg2) {
        expect(actualArg1).toBe(arg1);
        expect(actualArg2).toBe(arg2);
      });

      _myFunc(arg1, arg2);
    });
  });
});