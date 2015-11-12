import os

fout = open("report.comp.html", "wt")

def addFile(fname):
    print(fname)
    fout.write('<script type="text/ng-template" id="' + fname + '">\n')
    for line in open(fname).readlines():
        fout.write(line)
    fout.write('</script>\n')
        

for line in open("report.html").readlines():
    if "<!-- GENERATE_VIEWS -->" in line:
        for fname in os.listdir("partials"):
            addFile("partials/"+fname)
    
    else:
        fout.write(line)
    
