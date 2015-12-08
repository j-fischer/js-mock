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
  describe('watch', function(){

    beforeEach(function() {
      JsMock.watch(function () {
        // clean monitor
      });
    });

    it("should throw if argument is not a function", function () {
      expect(function () {
        JsMock.watch();
      }).toThrowError(TypeError, "The first argument must be a function");

      expect(function () {
        JsMock.watch(null);
      }).toThrowError(TypeError, "The first argument must be a function");

      expect(function () {
        JsMock.watch({});
      }).toThrowError(TypeError, "The first argument must be a function");

      expect(function () {
        JsMock.watch([]);
      }).toThrowError(TypeError, "The first argument must be a function");
    });

    it("should succeed verification if no expectation is set", function () {
      var myFunc1, myFunc2;
      JsMock.watch(function () {
        myFunc1 = JsMock.mock("myFunc1");
        myFunc2 = JsMock.mock("myFunc2");
      });

      myFunc1.once();
      myFunc2.once();

      expectExpectationError(JsMock.assertWatched, 'ExpectationError: Missing invocations for myFunc1: ["Expectation for call 1 with args undefined, will return undefined."].');

      myFunc1();

      expectExpectationError(JsMock.assertWatched, 'ExpectationError: Missing invocations for myFunc2: ["Expectation for call 1 with args undefined, will return undefined."].');

      myFunc2();

      JsMock.assertWatched();
    });

    it("should override all previously monitored mocks", function () {
      var myFunc1, myFunc2;

      // Monitor func1
      JsMock.watch(function () {
        myFunc1 = JsMock.mock("myFunc1");

        myFunc1.once();
      });

      // assert should fail for func1
      expectExpectationError(JsMock.assertWatched, 'ExpectationError: Missing invocations for myFunc1: ["Expectation for call 1 with args undefined, will return undefined."].');

      // Now, monitor func2 instead of func1
      JsMock.watch(function () {
        myFunc2 = JsMock.mock("myFunc2");

        myFunc2.once();
      });

      // assert should fail for func2
      expectExpectationError(JsMock.assertWatched, 'ExpectationError: Missing invocations for myFunc2: ["Expectation for call 1 with args undefined, will return undefined."].');

      myFunc2();

      JsMock.assertWatched();

      // verify for func1 should still fail
      expectExpectationError(myFunc1.verify, 'ExpectationError: Missing invocations for myFunc1: ["Expectation for call 1 with args undefined, will return undefined."].');
    });

    it("should bubble exception", function () {
      expect(function () {
        JsMock.watch(function () {
          throw new Error("Some error in watch!!!");
        });
      }).toThrowError("Some error in watch!!!");
    });
  });

  describe('monitorMocks', function(){

    it ("should be exactly the same function as watch()", function () {
      expect(JsMock.monitorMocks).toBe(JsMock.watch);
    });
  });
});