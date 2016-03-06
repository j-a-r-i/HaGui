describe("protocol module", () => {
    var WebSocket = require('ws');
    var ws = new WebSocket('ws://localhost:8080/');

    
    describe("ping command", function() {
	    it("returns status code 200", function() {
            expect(true).toBe(false);
	    });
    });
});
