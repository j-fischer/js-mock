describe('GlobalMock', function(){

  var _jQueryMock;

  beforeEach(function () {
    JsMock.monitorMocks(function () {
      _jQueryMock = JsMock.mockGlobal("$");
    });
  });

  afterEach(JsMock.assertIfSatisfied);

  /*
   * HELPER FUNCTIONS
   */
  function expectExpectationError(func, expectedErrorMsg) {
    expect(func).toThrowError(JsMock.ExpectationError, expectedErrorMsg);
  }

  /*
   * TESTS
   */
  describe('expect', function(){

    it("should throw if not activated", function() {
      _jQueryMock.restore();

      expect(function () {
        _jQueryMock.expect().once();
      }).toThrowError(Error, "Mock object has not been activated");
    });

    it("should allow to mock the function if the global object is one", function () {
      _jQueryMock.expect().once().with("div");

      expectExpectationError(function () {
        $("span");
      }, "ExpectationError: Unexpected invocation of '$' for call 1: actual arguments: [\"span\"].");

      $("div");
    });

     it("should allow to mock any property", function () {
      var target = {};
      var source = {};

      _jQueryMock.expect().extend.once().with(target, source).returns(target);

      expect($.extend(target, source)).toBe(target);
    });
  });
});