describe('Mock', function(){

  var _myFunc;

  beforeEach(function () {
    JsMock.monitorMocks(function () {
      _myFunc = JsMock.mock("Allowing.myFunc");
    });
  });

  afterEach(JsMock.assertIfSatisfied);

  /*
   * TESTS
   */
  describe('expect', function() {

    it("returns the identical mock object", function () {
      expect(_myFunc.expect()).toBe(_myFunc);
    });
  });
});