import JsMock from 'js-mock';

describe('Mock', function(){

  var _myFunc;

  beforeEach(function () {
    JsMock.watch(function () {
      _myFunc = JsMock.mock("Throws.myFunc");
    });
  });

  afterEach(function () {
    JsMock.assertWatched();
  });

  /*
   * HELPER FUNCTIONS
   */
  function expectExpectationError(func, expectedErrorMsg) {
    expect(func).toThrowError(expectedErrorMsg);
  }

  /*
   * TESTS
   */
  describe('throws', function(){

    it("should throw a TypeError if argument is not a string or object", function () {
      expect(function () {
        _myFunc.throws(true);
      }).toThrowError(Error, "Argument must either be a string or an object");

      expect(function () {
        _myFunc.throws(1);
      }).toThrowError(Error, "Argument must either be a string or an object");

      expect(function () {
        _myFunc.throws(1.2);
      }).toThrowError(Error, "Argument must either be a string or an object");

      expect(function () {
        _myFunc.throws();
      }).toThrowError(Error, "Argument must either be a string or an object");
    });

    it("should throw a TypeError if argument is not a string or object", function () {
      expect(function () {
        _myFunc.throws(null);
      }).toThrowError(Error, "Argument cannot be null");
    });

    it("should throw if no calls have been expected", function () {
      expect(function () {
        _myFunc.throws("error");
      }).toThrowError(Error, "You must call allowing, exactly, never, once, twice or thrice before setting any other expectations for this mock.");
    });

    it("should throw if callsAndReturns is already defined", function () {
      expect(function () {
        _myFunc.once().callsAndReturns(function () {}).throws("foo");
      }).toThrowError(Error, "callsAndReturns() is already set for this expectation. You can only define one of those two functions for you mock");

      _myFunc();
    });

    it("should throw if returns is already defined", function () {
      expect(function () {
        _myFunc.once().returns("foo").throws("bar");
      }).toThrowError(Error, "returns() is already set for this expectation. You can only define one of those two functions for you mock");

      _myFunc();
    });

    it("should throw the error object specified", function () {
      _myFunc.once().throws(new Error("someError"));

      expectExpectationError(_myFunc, "someError");
    });

    it("should return value object referece", function () {
      _myFunc.once().throws("someError");

      try {
        _myFunc();
      } catch (ex) {
        expect(ex).toBe("someError");
      }
    });

    it("should return different values for different calls", function () {
      var obj = {};
      _myFunc.twice();

      _myFunc.onFirstCall().throws(new Error("fooError"));
      _myFunc.onSecondCall().throws(new Error("barError"));

      expectExpectationError(_myFunc, "fooError");
      expectExpectationError(_myFunc, "barError");
    });
  });
});