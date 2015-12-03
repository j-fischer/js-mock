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
  describe('mock function', function(){

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
      JsMock.monitorMocks(function () {
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
  });

  describe('monitorMocks function', function(){

    afterEach(function() {
      JsMock.monitorMocks(function () {
        // clean monitor
      });
    });

    it("should throw if argument is not a function", function () {
      expect(function () {
        JsMock.monitorMocks();
      }).toThrowError(TypeError, "The first argument must be a function");

      expect(function () {
        JsMock.monitorMocks(null);
      }).toThrowError(TypeError, "The first argument must be a function");

      expect(function () {
        JsMock.monitorMocks({});
      }).toThrowError(TypeError, "The first argument must be a function");

      expect(function () {
        JsMock.monitorMocks([]);
      }).toThrowError(TypeError, "The first argument must be a function");
    });

    it("should succeed verification if no expectation is set", function () {
      var myFunc1, myFunc2;
      JsMock.monitorMocks(function () {
        myFunc1 = JsMock.mock("myFunc1");
        myFunc2 = JsMock.mock("myFunc2");
      });

      myFunc1.once();
      myFunc2.once();

      expectExpectationError(JsMock.assertIfSatisfied, 'ExpectationError: Missing invocations for myFunc1: ["Expectation for call 1 with args undefined, will return undefined."].');

      myFunc1();

      expectExpectationError(JsMock.assertIfSatisfied, 'ExpectationError: Missing invocations for myFunc2: ["Expectation for call 1 with args undefined, will return undefined."].');

      myFunc2();

      JsMock.assertIfSatisfied();
    });

    it("should override all previously monitored mocks", function () {
      var myFunc1, myFunc2;

      // Monitor func1
      JsMock.monitorMocks(function () {
        myFunc1 = JsMock.mock("myFunc1");

        myFunc1.once();
      });

      // assert should fail for func1
      expectExpectationError(JsMock.assertIfSatisfied, 'ExpectationError: Missing invocations for myFunc1: ["Expectation for call 1 with args undefined, will return undefined."].');

      // Now, monitor func2 instead of func1
      JsMock.monitorMocks(function () {
        myFunc2 = JsMock.mock("myFunc2");

        myFunc2.once();
      });

      // assert should fail for func2
      expectExpectationError(JsMock.assertIfSatisfied, 'ExpectationError: Missing invocations for myFunc2: ["Expectation for call 1 with args undefined, will return undefined."].');

      myFunc2();

      JsMock.assertIfSatisfied();

      // verify for func1 should still fail
      expectExpectationError(myFunc1.verify, 'ExpectationError: Missing invocations for myFunc1: ["Expectation for call 1 with args undefined, will return undefined."].');
    });

    it("should bubble exception", function () {
      expect(function () {
        JsMock.monitorMocks(function () {
          throw new Error("Some error in monitorMocks!!!");
        });
      }).toThrowError("Some error in monitorMocks!!!");
    });
  });

  describe('assertIfSatisfied function', function(){
    it("passes if no expectations are monitored", function () {
      var myFunc = JsMock.mock("myFunc");

      myFunc.once();

      expectExpectationError(myFunc.verify, 'ExpectationError: Missing invocations for myFunc: ["Expectation for call 1 with args undefined, will return undefined."].');

      expect(JsMock.assertIfSatisfied()).toBe(true);
    });

    it("returns true if all mocks are satisfied", function () {
      var myFunc;
      JsMock.monitorMocks(function () {
        myFunc = JsMock.mock("myFunc");
      });

      expect(JsMock.assertIfSatisfied()).toBe(true);
    });
  });

  describe('mockGlobal function', function(){
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

    it("should not activate the global mock by default", function () {
      expect(jQuery).toBe($);

      var jqueryMock = JsMock.mockGlobal("$");

      expect(jQuery).toBe($);
    });
  });
});