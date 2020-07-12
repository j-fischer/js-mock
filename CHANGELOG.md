### 2.0.0

- Removed built-in dependency on JsHamcrest, it can still be used to pass a Matcher as an argument
- Removed Mock.withEquivalentArray()  
- Removed Mock.withEquivalentObject()
- HamJest matchers are now supported
- Improved error messages for unexpected invocations of a Mock

### 1.0.0

- Removed deprecated functions

### 0.13.0

- Added Mock.withEquivalentArray() as a wrapper for the common JsHamcrest based verification Mock.with(JsHamcrest.Matchers.equivalentArray(anArray))
- Added Mock.withEquivalentObject() as a wrapper for the common JsHamcrest based verification Mock.with(JsHamcrest.Matchers.equivalentMap(anObject))

### 0.12.0

- Improved error messages of ExpectationErrors

### 0.11.0

- Added Mock.willThrow() that invokes a given function and expects this function to throw an error
- Added Mock.throws() to allow mock objects to throw an exception when invoked

For older versions, please read the CHANGELOG.md file.

### 0.10.0

- Improved error messages for some expectation errors
- Added more unit tests as examples on how to mock common functions such as Date.now() or setTimeout()

### 0.9.0

- Added JsMock.mockGlobal() which allows for replacing global variables or a child property of a global variable
- Added Mock.expect() in order to match the API of GlobalMock object. This allows to switch from a global mock to non-global version without having to change the expectations
- Added JsMock.watch() as the better alternative for JsMock.monitorMocks(). JsMock.monitorMocks() is now an alias for JsMock.watch() and has been deprecated
- Added JsMock.assertWatched() as the better alternative for JsMock.assertIfSatiesfied(). JsMock.assertIfSatisfied() is now an alias for JsMock.assertWatched() and has been deprecated

### 0.8.0

- Modified mock() to support a function as the object to be mocked. If the function contains more functions as properties, those will be mocked as well

### 0.7.0

- Modified verify() to return a `true` if all expectations are fulfilled

### 0.6.0

- Added alias function with() for withExactArgs()

### 0.5.0

- Modified assertIfSatisfied() to return a `true` if all mocks passed the verification

### 0.4.0

- Added support for JsHamcrest style matchers for withExactArgs()
- Minor refactoring: Made will() a alias function for the now called callsAndReturns() function
- Added validation that only one return function, callsAndReturns() or returns(), can be expected

### 0.3.0

- Initial release