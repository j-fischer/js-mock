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
  describe('mock', function(){

    it("should if first arg is not a string", function () {
      expect(function () {
        JsMock.mock();
      }).toThrowError(TypeError, "The first argument must be a string");

      expect(function () {
        JsMock.mock(null);
      }).toThrowError(TypeError, "The first argument must be a string");

      expect(function () {
        JsMock.mock({});
      }).toThrowError(TypeError, "The first argument must be a string");

      expect(function () {
        JsMock.mock(1);
      }).toThrowError(TypeError, "The first argument must be a string");
    });

    it("should succeed verification if no expectation is set", function () {
      var myFunc = JsMock.mock("myFunc");

      myFunc.verify();
    });

    it("each mock instance is unique", function () {
      var myFunc1 = JsMock.mock("myFunc");
      var myFunc2 = JsMock.mock("myFunc");

      myFunc1.once();
      myFunc2.once();

      expectExpectationError(myFunc1.verify, 'ExpectationError: Missing invocations for myFunc: ["Expectation for call 1 with args undefined, will return undefined."].');
      expectExpectationError(myFunc2.verify, 'ExpectationError: Missing invocations for myFunc: ["Expectation for call 1 with args undefined, will return undefined."].');

      myFunc1();

      myFunc1.verify();
      expectExpectationError(myFunc2.verify, 'ExpectationError: Missing invocations for myFunc: ["Expectation for call 1 with args undefined, will return undefined."].');
    });

    it("mock properties does not modify the original object", function () {
      var obj = {
        func1: function () {
          return "foo";
        },

        func2: function () {
          return "bar";
        }
      };

      var mock = JsMock.mock("MyObject", obj);

      expect(obj.func1()).toBe("foo");
      expect(obj.func2()).toBe("bar");
    });

    it("mock properties should copy any non-function properties", function () {
      var obj = {
        myFunc: function () {
          return "foo";
        },

        anObject: {},
        aString: "bar"
      };

      var mock = JsMock.mock("MyObject", obj);

      expect(obj.myFunc()).toBe("foo");
      expect(obj.aString).toBe("bar");

      expect(obj.anObject).toEqual({});
    });

    it("should throw if some property expectations are not fulfilled", function () {
      var obj = {
        func1: function () {
          return "foo";
        },

        func2: function () {
          return "bar";
        }
      };

      var mock = JsMock.mock("MyObject", obj);

      mock.func1.once();

      expectExpectationError(mock.func1.verify, 'ExpectationError: Missing invocations for MyObject.func1: ["Expectation for call 1 with args undefined, will return undefined."].');

      mock.func1();
      mock.func2.verify();
    });

    it("should mock function with properties, such as jQuery", function () {
      var targetObj = { a: 1};
      var srcObj = { foo: "bar"};

      var jqueryMock;
      JsMock.watch(function () {
        jqueryMock = JsMock.mock("$", $);
      });

      expect(jqueryMock.extend).not.toBe($.extend);

      jqueryMock.once().with("div").returns("foo");
      jqueryMock.extend.once().with(targetObj, srcObj).returns(targetObj);

      expectExpectationError(jqueryMock.verify, 'ExpectationError: Missing invocations for $: ["Expectation for call 1 with args [\\"div\\"], will return \\"foo\\"."].');
      expectExpectationError(jqueryMock.extend.verify, 'ExpectationError: Missing invocations for $.extend: ["Expectation for call 1 with args [{\\"a\\":1},{\\"foo\\":\\"bar\\"}], will return {\\"a\\":1}."].');

      expect(jqueryMock("div")).toBe("foo");
      expect(jqueryMock.extend(targetObj, srcObj)).toBe(targetObj);

      JsMock.assertIfSatisfied();
    });

    it("should throw if object is an array", function () {
      expect(function () {
        JsMock.mock("someArray", []);
      }).toThrowError(TypeError, "Mocking of arrays is not supported");
    });

    it("should throw if object to be mocked contains conflicting functions", function () {
      var objectWithConflictingApiFunctions = function () {
        return "foo";
      };

      objectWithConflictingApiFunctions.with = function() {
        return "bar";
      };

      expect(function () {
        JsMock.mock("conflictingApiFunctions", objectWithConflictingApiFunctions);
      }).toThrowError(Error, 'Failed to create mock object for the following reasons: ["\'with\' has already been assigned to the mock object."]');
    });
  });
});