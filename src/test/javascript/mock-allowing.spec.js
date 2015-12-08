describe('Mock', function(){

  var _myFunc;

  beforeEach(function () {
    JsMock.watch(function () {
      _myFunc = JsMock.mock("Allowing.myFunc");
    });
  });

  afterEach(function () {
    JsMock.assertIfSatisfied();
  });

  /*
   * HELPER FUNCTIONS
   */
  function expectUnexpectedInvocationError() {
    var args = Array.prototype.slice.call(arguments);

    expect(function () {
      _myFunc.apply(null, args);
    }).toThrowError(JsMock.ExpectationError, "ExpectationError: Unexpected invocation of 'Allowing.myFunc'. Actual arguments: " + JSON.stringify(args) + ".");
  }

  /*
   * TESTS
   */
  describe('allowing', function() {

    it("should allow any call if no other expectatons are set up", function () {
      _myFunc.allowing();

      _myFunc("foo");
      _myFunc(1);
      _myFunc(true);
    });

    it("should always return the same result", function () {
      _myFunc.allowing().returns("foo");

      expect(_myFunc()).toBe("foo");
      expect(_myFunc(1)).toBe("foo");
      expect(_myFunc("bar")).toBe("foo");
    });

    it("should throw if invoked different from what was expected", function () {
      _myFunc.allowing().withExactArgs("foo").returns("bar");

      expect(_myFunc("foo")).toBe("bar");

      expectUnexpectedInvocationError("bar");
      expectUnexpectedInvocationError("foo", "bar");

      expect(_myFunc("foo")).toBe("bar");
    });
  });
});