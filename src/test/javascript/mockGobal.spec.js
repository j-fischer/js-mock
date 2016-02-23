describe('JsMock', function(){

  /*
   * HELPER FUNCTIONS
   */
  function expectExpectationError(func, expectedErrorMsg) {
    expect(func).toThrowError(JsMock.ExpectationError, expectedErrorMsg);
  }

  /*
   * TESTS
   */
  describe('mockGlobal', function(){
    it("throws if globalObjectName is not of type string", function () {
      expect(JsMock.mockGlobal).toThrowError(TypeError, "The first argument must be a string");
      expect(function () {
        JsMock.mockGlobal(123);
      }).toThrowError(TypeError, "The first argument must be a string");
      expect(function () {
        JsMock.mockGlobal([]);
      }).toThrowError(TypeError, "The first argument must be a string");
    });

    it("throws if the global object is undefined", function () {
      expect(function () {
        JsMock.mockGlobal("doesNotExist");
      }).toThrowError(TypeError, "Global variable 'doesNotExist' must be an object or a function, but was 'undefined'");
    });

    it("throws if the global object is not null", function () {
      window.cannotMock = null;
      expect(function () {
        JsMock.mockGlobal("cannotMock");
      }).toThrowError(TypeError, "Global variable 'cannotMock' cannot be null");
    });

    it("throws if the global object is not supported", function () {
      window.cannotMock = [];
      expect(function () {
        JsMock.mockGlobal("cannotMock");
      }).toThrowError(TypeError, "Mocking of arrays is not supported");
    });

    it("should activate the global mock by default", function () {
      expect(jQuery).toBe($);

      var jqueryMock = JsMock.mockGlobal("$");

      expect(jQuery).not.toBe($);

      jqueryMock.restore();
    });

    it("should mock partial objects if path is provided", function () {
      expect(jQuery).toBe($);

      var jqueryMock = JsMock.mockGlobal("$.ajax");

      expect(jQuery).toBe($);

      expect($.extend({1: 2}, {foo: "bar"})).toEqual({1:2, foo: "bar"});

      expect($.ajax.verify).toBeTruthy();
      expectExpectationError($.ajax, "ExpectationError: '$.ajax' was not expected to be called.");

      jqueryMock.restore();
    });
  });
});