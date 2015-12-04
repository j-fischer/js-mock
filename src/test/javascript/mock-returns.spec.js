describe('Mock', function(){

  var _myFunc;

  beforeEach(function () {
    JsMock.monitorMocks(function () {
      _myFunc = JsMock.mock("Returns.myFunc");
    });
  });

  afterEach(function () {
    JsMock.assertIfSatisfied();
  });

  /*
   * HELPER FUNCTIONS
   */

  /*
   * TESTS
   */
  describe('returns', function(){

    it("should throw if no calls have been expected", function () {
      expect(function () {
        _myFunc.returns("foo");
      }).toThrowError(Error, "You must call allowing, exactly, never, once, twice or thrice before setting any other expectations for this mock.");
    });

    it("should throw if callsAndReturns is already defined", function () {
      expect(function () {
        _myFunc.once().callsAndReturns(function () {}).returns("foo");
      }).toThrowError(Error, "callsAndReturns() is already set for this expectation. You can only define one of those two functions for you mock");

      _myFunc();
    });

    it("should return undefined if nothing else was specified", function () {
      _myFunc.once().returns();

      expect(_myFunc()).toBe(undefined);
    });

    it("should return value that was specified", function () {
      _myFunc.once().returns("bar");

      expect(_myFunc()).toBe("bar");
    });

    it("should return value object referece", function () {
      var obj = {};
      _myFunc.twice().returns(obj);

      expect(_myFunc()).not.toBe({});
      expect(_myFunc()).toBe(obj);
    });

    it("should return different values for different calls", function () {
      var obj = {};
      _myFunc.twice();

      _myFunc.onFirstCall().returns("foo");
      _myFunc.onSecondCall().returns("bar");

      expect(_myFunc()).toBe("foo");
      expect(_myFunc()).toBe("bar");
    });
  });
});