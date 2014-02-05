function parseTranslate(actual) {
    var parts = /translate\((-?[\d\.]*)(?:[, ](.*))?\)/.exec(actual);
    if(!parts)
        return null;
    if(parts[2]===undefined)
        parts[2] = 0;
    expect(parts.length).toEqual(3);
    return parts;
}

function parseTranslateRotate(actual) {
    var parts = /translate\((-?[\d\.]*)(?:[, ](.*))?\)[, ]rotate\((-?[\d\.]*)\)/.exec(actual);
    if(!parts)
        return null;
    if(parts[2]===undefined)
        parts[2] = 0;
    expect(parts.length).toEqual(4);
    return parts;
}

function parsePath(path) {
    // an svg path is a string of any number of letters
    // each followed by zero or more numbers separated by spaces or commas
    var instrexp = /([a-z])[^a-z]*/gi,
        argexp = /(-?\d+(?:\.\d*)?)[, ]*/gi;
    var match, result = [], die = 99;
    while((match = instrexp.exec(path))) {
        var instr = match[0];
        var cmd = {op: match[1], args: []};
        argexp.lastIndex = 0;
        while((match = argexp.exec(instr)))
              cmd.args.push(match[1]);
        result.push(cmd);
        if(!--die) throw "give up";
    }
    return result;
}

beforeEach(function(){
    jasmine.addMatchers({
        toBeWithinDelta: function(_) {
            return {
                compare: function(actual, expected, delta){
                    if (delta === undefined) {
                        delta = 1e-6;
                    }

                    var result = {};

                    result.pass = actual >= (+expected-delta) && actual <= (+expected+delta);

                    if(result.pass){
                        result.message = "Expected " + actual + " to not be within [" + (+expected-delta) + "/" + (+expected+delta) + "]";
                    }
                    else{
                        result.message = "Expected " + actual + " to be within [" + (+expected-delta) + "/" + (+expected+delta) + "]";
                    }

                    return result;
                }
            };
        },
        // note: all of these custom matchers ignore the possibility of .not.toMatch
        // (can't imagine how that would be useful here)
        toMatchTranslate: function() {
            return {
                compare: function(actual, x, y, prec) {
                    var parts = parseTranslate(actual);
                    if(!parts)
                        return {pass: false, message: "'" + actual + "' did not match translate(x[,y]) regexp"};
                    expect(+parts[1]).toBeCloseTo(x, prec);
                    expect(+parts[2]).toBeCloseTo(y, prec);
                    return {pass: true};
                }
            };
        },
        toMatchTransRot: function() {
            return {
                compare: function(actual, x, y, r, prec) {
                    var parts = parseTranslateRotate(actual);
                    if(!parts)
                        return {pass: false, message: "'" + actual + "' did not match translate(x[,y]),rotate(r) regexp"};
                    expect(+parts[1]).toBeCloseTo(x, prec);
                    expect(+parts[2]).toBeCloseTo(y, prec);
                    expect(+parts[3]).toBeCloseTo(r, prec);
                    return {pass: true};
                }
            };
        },
        toMatchUrl: function() {
            return {
                compare: function(actual, url) {
                    var regexp = new RegExp("url\\(\"?" + url + "\"?\\)");
                    expect(actual).toMatch(regexp);
                    return {pass:true};
                }
            };
        },
        toMatchPath: function() {
            return {
                compare: function(actual, expected, delta) {
                    delta = delta || 1; // default delta of 1px
                    var got = parsePath(actual),
                        wanted = parsePath(expected);
                    if(got.length != wanted.length)
                        return {pass: false, message: "actual number of path cmds " + actual.length +
                                " did not match expected number " + expected.length};
                    for(var i = 0; i!=got.length; ++i) {
                        if(got[i].op.toUpperCase() != wanted[i].op.toUpperCase())
                            return {pass: false, message: "path command #" + i + " actual '" + got[i].op.toUpperCase() +
                                    "' != expected '" + wanted[i].op.toUpperCase() + "'"};
                        if(got[i].args.length != wanted[i].args.length)
                            return {pass: false, message: "path command #" + i + " number of arguments " +
                                    got[i].args.length + " != expected " + wanted[i].args.length};
                        for(var j = 0; j<got[i].args.length; ++j)
                            expect(got[i].args[j]).toBeWithinDelta(wanted[i].args[j], delta);
                    }
                    return {pass: true};
                }
            };
        }
    });
});
