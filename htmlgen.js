
function begin_tag(name, attr)
{
    let ret = "<"+name;
    let keys = Object.keys(attr);

    keys.forEach((key) => {
	ret += (" "+key+"=\""+attr[key]+"\"");
    });

    ret += ">\n";
    return ret;
}
function end_tag(name)
{
    return "</" + name + ">\n";
}

function tag(name, attr, ...childs)
{
    let ret = begin_tag(name, attr);
    ret += childs.join("\n");
    ret += end_tag(name);
    return ret;
}


function head(name, attr, ...childs)
{
    let ret = begin_tag(name, {});

    attr.scripts.forEach((s) => {
	ret += tag('script', {src: s});
    });
    
    ret += end_tag(name);

    return ret;
}



console.log(tag("html", {},
		head("head", { scripts: ["foo", "bar"]
		}),
		tag("body", {})));
