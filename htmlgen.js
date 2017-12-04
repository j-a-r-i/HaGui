function begin_tag(name, attr)
{
    let ret = "<" + name;

    Object.keys(attr).forEach((k) => {
        ret += (" " + k +"=\"" + attr[k] + "\"");
    });
    ret += ">";
    return ret;
}

function end_tag(name)
{
    return "</" + name + ">\n";
}

function tag(name, attr, ...data)
{
    let body = data.join("\n");

    return begin_tag(name, attr) + body + "</" + name + ">\n";
}

function head(name, attr, ...data)
{
    let ret = begin_tag(name, {});
    attr['scripts'].forEach((s) => {
        ret += tag("script", {src: s});
    })
    ret += end_tag(name);
    return ret;
}

console.log(tag('html', {}, 
                head('head', {title: "test page",
                              scripts: ["foo.js", "bar.js"]}),
                tag('body', {})));