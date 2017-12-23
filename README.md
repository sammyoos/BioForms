# BioForms
Experiment on genetic mutations -- Idea from the book The Blind Watchmaker

# What is this???
Update: SVG took too long to load... this repo has been moved to operate 
in pure javascript

This app is a proof of concept of the program suggested in Richard Dawkins
"The Blind Watchmaker".  The idea was so compelling I had to write the program
and being that I've never coded in GO before, I wanted to try that too.  So
here it is in all it's glory, my first program in go about genetic mutations
from someone that knows nothing about biology.

The program starts by creating a very simple "BioMorph".  Immediately a series
of children are generated.  Each child has a random mutation that has a single
attribute difference from the parent.  Nine of these children are displayed for
the viewer to evaluate and pick the successful progeny.  At that stage the
parent is killed and the child becomes a parent by having children and the 
process starts over again.  It is amazing how after just a few mutations
the process can produce pretty amazing effects.

# What attributes can be changed?

The process involves changing things like the rate of change of length of the
branches - this can be positive or negative.  The same is true of the angle
of the branches.  The offset of the branches changed to create denser or more spread
out entities.  The last change that has been added was the addition of color,
this can also change quickly or slowly.

# Notes

I still have some ideas on how to improve this, but I'd love to hear comments from
others as well - especially ideas on how to make it more like a true biological
process.

## To run...

1. install the go language
1. download the source code from github
1. `go run evolution.go webserver.go`

## ...and finally
aside from many BioForms that look like deer (too many to count), this is the next best animal I've seen:

