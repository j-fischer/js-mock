describe('Mock', function(){

  var _myFunc;

  beforeEach(function () {
    JsMock.watch(function () {
      _myFunc = JsMock.mock("Verify.myFunc");
    });
  });

  afterEach(function () {
    JsMock.assertWatched();
  });

  /*
   * HELPER FUNCTIONS
   */
  function expectMissingInvocationError(expectedErrorMsg) {
    expect(_myFunc.verify).toThrowError(JsMock.ExpectationError, expectedErrorMsg);
  }

  /*
   * TESTS
   */
  describe('verify', function() {
    it("should return 'true' if all expectations pass", function () {

      _myFunc.once();

      _myFunc();

      expect(_myFunc.verify()).toBe(true);
    });

    it("should fail a single expectation", function () {
      _myFunc.once();

      expectMissingInvocationError('ExpectationError: Missing invocations for Verify.myFunc: ["Expectation for call 1 with args undefined, will return undefined."].');

      _myFunc();
    });

    it("should list all failing expectations", function () {
      _myFunc.twice();
      _myFunc.onFirstCall().withExactArgs("foo").returns("bar");
      _myFunc.onSecondCall().withExactArgs(1).returns(2);

      expectMissingInvocationError('ExpectationError: Missing invocations for Verify.myFunc: ["Expectation for call 1 with args [\\"foo\\"], will return \\"bar\\".","Expectation for call 2 with args [1], will return 2."].');

      _myFunc("foo");
      _myFunc(1);
    });
  });
});