describe('Mock', function(){

  var _myFunc;

  beforeEach(function () {
    JsMock.watch(function () {
      _myFunc = JsMock.mock("Allowing.myFunc");
    });
  });

  afterEach(JsMock.assertWatched);

  /*
   * TESTS
   */
  describe('expect', function() {

    it("returns the identical mock object", function () {
      expect(_myFunc.expect()).toBe(_myFunc);
    });
  });
});