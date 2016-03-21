var fmi = require("../fmi.js");

describe("FMI", () => {
    it("return something", (done) => {
	fmi.fmiRead(false, function(err,arr) {
	    expect(arr.len).toBeGreaterThan(1);
	    done();
	});
    });
});
