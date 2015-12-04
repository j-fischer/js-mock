describe('Mock', function(){

  var _myFunc;

  beforeEach(function () {
    JsMock.monitorMocks(function () {
      _myFunc = JsMock.mock("OnCall.myFunc");
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

  function expectUnexpectedInvocationError(func, numOfCall) {
    expectExpectationError(func, "ExpectationError: Unexpected invocation of 'OnCall.myFunc' for call " + numOfCall + ": actual arguments: [].");
  }


  /*
   * TESTS
   */
  describe('onFirstCall', function(){
    it("should replace expectations of first call", function () {
      _myFunc.twice().returns(123);

      _myFunc.onFirstCall().withExactArgs("foo").returns("bar");

      expect(_myFunc("foo")).toBe("bar");
      expect(_myFunc("foo")).toBe(123);
    });
  });

  describe('onSecondCall', function(){
    it("should replace expectations of second call", function () {
      _myFunc.twice().returns(123);

      _myFunc.onSecondCall().withExactArgs(1).returns(2);

      expect(_myFunc("foo")).toBe(123);

      expectUnexpectedInvocationError(_myFunc, 2);

      expect(_myFunc(1)).toBe(2);
    });
  });

  describe('onThirdCall', function(){
    it("should replace expectations of third call", function () {
      _myFunc.thrice().returns(123);

      _myFunc.onThirdCall().returns("bar");

      expect(_myFunc("foo")).toBe(123);
      expect(_myFunc()).toBe(123);
      expect(_myFunc(1)).toBe("bar");
    });
  });

  describe('onCall', function(){
    beforeEach(function () {
      _myFunc.never();
    });

    it("should replace expectations of third call", function () {
      _myFunc.exactly(5).returns(123);

      _myFunc.onCall(4).returns("bar");

      expect(_myFunc()).toBe(123);
      expect(_myFunc()).toBe(123);
      expect(_myFunc()).toBe(123);
      expect(_myFunc()).toBe("bar");
      expect(_myFunc()).toBe(123);
    });

    it("should throw if index is less than 1", function () {
      expect(function () {
        _myFunc.onCall(0);
      }).toThrowError(Error, "Call index must be larger than 0");
    });

    it("should throw if call does not exist", function () {
      _myFunc.once();

      expect(function () {
        _myFunc.onCall(2);
      }).toThrowError(Error, "Attempting to set the behaviour for a call that is not expected. Calls expected: 1, call attempted to change: 2");

      _myFunc();
    });

    it("should throw if no calls have been expected", function () {
      expect(function () {
        _myFunc.onCall(3);
      }).toThrowError(Error, "Attempting to set the behaviour for a call that is not expected. Calls expected: 0, call attempted to change: 3");
    });

    it("should throw if mock is set up as a stub", function () {
      _myFunc.allowing();

      expect(function () {
        _myFunc.onCall(2);
      }).toThrowError(Error, "Mock is set up as a stub. Cannot set expectations for a specific call.");
    });
  });
});