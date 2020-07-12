import JsMock from 'js-mock';

describe('JsMock', function(){

  /*
   * TESTS
   */
  describe('debug mode', function() {

    afterEach(function () {
      JsMock.assertWatched();
    });

    it("uses console for logging", function () {
      var consoleMock, collectedLogMessages = [];
      JsMock.watch(function () {
        consoleMock = JsMock.mockGlobal("console.log");
      });

      // There is a chance that tests are executed in some random order and
      // that other test cases may cause log statements to be written.
      // The following stub ensures that no other tests are impacted while it
      // is still validated that enabling the logging will write to the console.
      consoleMock.expect().allowing().will(function (msg) {
        collectedLogMessages.push(msg);
      });

      expect(collectedLogMessages.length).toBe(0);
      JsMock.__enableLogs();
      JsMock.mock("mockFunc");
      JsMock.__disableLogs();

      expect(collectedLogMessages.length).toBeGreaterThan(0);
    });
  });
});