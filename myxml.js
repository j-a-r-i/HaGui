var sax = require('sax');

//-----------------------------------------------------------------------------
/** 
 * @param {String} buf
 * @param {String[]} searches
 * @returns {Promise.<String[]>}
 */
function parseXml(buf, searches)
{
    return new Promise((resolve,reject) => {
        var parser = sax.parser(true);
        var tags = [];
        var lengths = searches.map((i) => {
            return i.split('/').length;
        });
        var result = searches.map((i) => {
            return [];
        });
        
        parser.onerror = (e) => {
            log.error(e);
            return reject(e);
        };
        parser.ontext = (t) => {
            searches.forEach((s,i) => {
                if (tags.length === lengths[i]) {
                    var curTag = tags.join("/");

                    if (curTag === s) {
                        result[i] = t.trim();
                    }
                }
            });
        };
        parser.onopentag = (node) => {
            tags.push(node.name);
        };
        parser.onclosetag = (node) => {
            tags.pop();
        };
        parser.onend = () => {
            resolve(result);
        };
        parser.write(buf).close();
    });
}

//-----------------------------------------------------------------------------
/** 
 * @param {String} buf - xml contents
 * @param {String[]} path - XPath to where the tags are fetched
 * @returns {Promise.<Object>}
 */
function parseXmlTags(buf, path)
{
    return new Promise((resolve,reject) => {
        var parser = sax.parser(true);
        var tags = [];
        var length = path.split('/').length;
        var result = [];
        
        parser.onerror = (e) => {
            log.error(e);
            return reject(e);
        };
        parser.ontext = (t) => {
        };
        parser.onopentag = (node) => {
            tags.push(node.name);
            if (tags.length === length) {
                var curTag = tags.join("/");

                if (curTag === path) {
                    result.push(node.attributes);
                }
            };
        };
        parser.onclosetag = (node) => {
            tags.pop();
        };
        parser.onend = () => {
            resolve(result);
        };
        parser.write(buf).close();
    });
}

//-----------------------------------------------------------------------------
module.exports = {
    parseXml: parseXml,
    parseXmlTags: parseXmlTags
};
