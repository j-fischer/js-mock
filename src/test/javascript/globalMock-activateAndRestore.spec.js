describe('GlobalMock', function(){

  var _jQueryMock;

  beforeEach(function () {
    JsMock.watch(function () {
      _jQueryMock = JsMock.mockGlobal("$");
    });
  });

  afterEach(JsMock.assertWatched);

  /*
   * HELPER FUNCTIONS
   */
  function expectExpectationError(func, expectedErrorMsg) {
    expect(func).toThrowError(JsMock.ExpectationError, expectedErrorMsg);
  }

  /*
   * TESTS
   */
  describe('restore', function() {

    it("should restore original object", function() {
      expect($).not.toBe(jQuery);
      expect($).toBe(_jQueryMock.expect());

      _jQueryMock.restore();

      expect($).toBe(jQuery);
    });

    it("should return true", function() {
      expect($).not.toBe(jQuery);

      expect(_jQueryMock.restore()).toBe(true);
    });

    it("should also verify mock", function() {
      _jQueryMock.expect().once().with("div");

      expectExpectationError(function () {
        _jQueryMock.restore();
      }, 'ExpectationError: Missing invocations for $: ["ExpectationError: Missing invocations for $: [\\"Expectation for call 1 with args [\\\\\\"div\\\\\\"], will return undefined.\\"]."].');

      expect($).toBe(jQuery);

      _jQueryMock.activate();

      $("div");
    });
  });

  describe('restoreWithoutVerifying', function() {
    it("should not verify mock", function() {
      _jQueryMock.expect().once().with("div");

      _jQueryMock.restoreWithoutVerifying();

      expect($).toBe(jQuery);

      _jQueryMock.activate();

      $("div");
    });
  });
});