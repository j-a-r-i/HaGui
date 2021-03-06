import os
#
# Copyright (C) 2015 Jari Ojanen
#

fout = open("report.comp.html", "wt")

def addFile(fname):
    print(fname)
    fout.write('<script type="text/ng-template" id="' + fname + '">\n')
    for line in open(fname).readlines():
        line = line.replace("\r\n", "\n")
        fout.write(line)
    fout.write('</script>\n')
        

for line in open("report.html").readlines():
    if "<!-- GENERATE_VIEWS -->" in line:
        for fname in os.listdir("partials"):
            addFile("partials/"+fname)
    else:
        fout.write(line)
    
