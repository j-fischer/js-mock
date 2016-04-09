describe('Mock', function(){

  var _myFunc;

  beforeEach(function () {
    JsMock.watch(function () {
      _myFunc = JsMock.mock("WithExactArgs.myFunc");
    });
  });

  afterEach(function () {
    JsMock.assertWatched();
  });

  /*
   * HELPER FUNCTIONS
   */
  function expectUnexpectedInvocationError() {
    var args = Array.prototype.slice.call(arguments);

    expect(function () {
      _myFunc.apply(null, args);
    }).toThrowError(JsMock.ExpectationError, "ExpectationError: Unexpected invocation of 'WithExactArgs.myFunc' for call 1: actual arguments: " + JSON.stringify(args) + ".");
  }


  /*
   * TESTS
   */
  describe('withExactArgs', function(){

    it("should throw if no calls have been expected", function () {
      expect(function () {
        _myFunc.withExactArgs("foo");
      }).toThrowError(Error, "You must call allowing, exactly, never, once, twice or thrice before setting any other expectations for this mock.");
    });

    it("should ignore arguments if no expecation was set", function () {
      _myFunc.once();

      _myFunc("foo");
    });

    it("should match arguments if provided - no args", function () {
      _myFunc.once().withExactArgs();

      _myFunc();
    });

    it("should fail if an argument was provided but none expected", function () {
      _myFunc.once().withExactArgs();

      expectUnexpectedInvocationError("foo");

      _myFunc();
    });

    it("should match arguments if provided - string", function () {
      _myFunc.once().withExactArgs("foo");

      _myFunc("foo");
    });

    it("should match arguments if provided - object", function () {
      var obj = {};
      _myFunc.once().withExactArgs(obj);

      _myFunc(obj);
    });

    it("should match arguments if provided - boolean", function () {
      _myFunc.once().withExactArgs(false);

      _myFunc(false);
      _myFunc.verify();

      _myFunc.once().withExactArgs(true);

      _myFunc(true);
      _myFunc.verify();
    });

    it("should match arguments if provided - numbers", function () {
      _myFunc.once().withExactArgs(-1);

      _myFunc(-1);
      _myFunc.verify();

      _myFunc.once().withExactArgs(0);

      _myFunc(0);
      _myFunc.verify();

      _myFunc.once().withExactArgs(1);

      _myFunc(1);
      _myFunc.verify();
    });

    it("should match arguments if provided - array", function () {
      var arr = ["foo", "bar"];
      _myFunc.once().withExactArgs(arr);

      expectUnexpectedInvocationError(["foo", "bar"]);

      _myFunc(arr);
    });

    it("should support JsHamcrest.Matchers", function () {
      _myFunc.once().withExactArgs(JsHamcrest.Matchers.equivalentArray(["foo", "bar"]));

      _myFunc(["foo", "bar"]);
      _myFunc.verify();

      _myFunc.thrice().withExactArgs(JsHamcrest.Matchers.between(4).and(7));

      _myFunc(4);
      _myFunc(6);
      _myFunc(7);
    });

    it("should throw JsHamcrest.Matchers if JsHamcrest Matcher fails", function () {
      _myFunc.once().withExactArgs(JsHamcrest.Matchers.between(4).and(7));

      expectUnexpectedInvocationError(1);

      _myFunc(4);
    });

    it("should support custom matchers", function () {
      _myFunc.thrice().withExactArgs({
        matches: function () {
          return true;
        },
        describeTo: function () {
          return "Matches everything";
        }
      });

      _myFunc(["foo", "bar"]);
      _myFunc(7);
      _myFunc("foo");
    });

    it("should throw unexpected invocation if wrong argument was provided", function () {
      _myFunc.once().withExactArgs("foo");

      expectUnexpectedInvocationError("bar");

      _myFunc("foo");
    });

    it("should throw unexpected invocation if wrong object reference was provided", function () {
      var obj = {};
      _myFunc.once().withExactArgs(obj);

      expectUnexpectedInvocationError({});

      _myFunc(obj);
    });

    it("should throw unexpected invocation if too many arguments wer provided", function () {
      _myFunc.once().withExactArgs("foo");

      expectUnexpectedInvocationError("foo", "bar");
      _myFunc("foo");
    });

    it("should throw unexpected invocation if string is compared to String object", function () {
      _myFunc.once().withExactArgs("foo");

      // NOTE: new String() creates and object which will not be identical with the expected string argument. This is some expected JS behaviour.
      expectUnexpectedInvocationError(new String("foo")); // jshint ignore:line

      _myFunc("foo");
    });

    it("should throw unexpected invocation if types are not identical", function () {
      _myFunc.once().withExactArgs(true);

      expectUnexpectedInvocationError(1);

      _myFunc(true);
    });
  });

  describe('with', function(){

    it("should throw if no calls have been expected", function () {
      expect(function () {
        _myFunc.with("foo");
      }).toThrowError(Error, "You must call allowing, exactly, never, once, twice or thrice before setting any other expectations for this mock.");
    });

    it("should match arguments if provided - no args", function () {
      _myFunc.once().with();

      _myFunc();
    });

    it("should fail if an argument was provided but none expected", function () {
      _myFunc.once().with();

      expectUnexpectedInvocationError("foo");

      _myFunc();
    });

    it("should throw unexpected invocation if too many arguments wer provided", function () {
      _myFunc.once().with("foo");

      expectUnexpectedInvocationError("foo", "bar");
      _myFunc("foo");
    });

    it("should match multiple arguments provided", function () {
      _myFunc.once().with("foo", "bar");

      _myFunc("foo", "bar");
    });
  });

  describe('withEquivalentArray', function() {

    it("should throw if JsHamcrest is not available", function () {
      var backup = window.JsHamcrest;

      window.JsHamcrest = undefined;
      expect(function () {
        _myFunc.once().withEquivalentArray(["foo", "bar"]);
      }).toThrowError(Error, "withEquivalentArray() requires JsHamcrest to be available in order to be used.");

      _myFunc.never();
      window.JsHamcrest = backup;
    });

    it("should set proper expectation", function () {
      _myFunc.once().withEquivalentArray(["foo", "bar"]);

      _myFunc(["foo", "bar"]);
    });
  });

  describe('withEquivalentObject', function() {

    it("should throw if JsHamcrest is not available", function () {
      var backup = window.JsHamcrest;

      window.JsHamcrest = undefined;
      expect(function () {
        _myFunc.once().withEquivalentObject({"foo": "bar"});
      }).toThrowError(Error, "withEquivalentObject() requires JsHamcrest to be available in order to be used.");

      _myFunc.never();
      window.JsHamcrest = backup;
    });

    it("should set proper expectation", function () {
      _myFunc.once().withEquivalentObject({"foo": "bar"});

      _myFunc({"foo": "bar"});
    });
  });
});