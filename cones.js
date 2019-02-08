"use strict";

var canvas;
var gl;

// Vertices and vertex colors contain each vertex (vec4)
// and color (vec4) exactly once.  Every time you draw
// a triangle, you copy three vertices out of the vertices
// array into the points array. When you draw a quad it
// draws two triangles into the points array, using four
// of the vertices.
//
// Global variable v0 is the first vertex number of the
// current object
var vertices = [];
var vertexColors = [];
var v0 = 0;   

// points and colors contains the vertices (vec4 objects)
// in the order they are to be drawn as triangles.
// There are three  points for each triangle.  
// A particular vertex can be in the points array
// several times, because one vertex's location can be
// a corner of many triangles. 
// The colors array contains one color (also a vec4) 
// for each point.
var points = [];
var colors = [];
var numPoints  = 0;

// These are used for manipulating the rotating display. 
//
// The theta variable contains an array of three rotation
// angles, for x, y, z. The display is tilted with respect
// to these three angles.
//
// The axis variable says which axis the display is
// spinning around.  
//
// Thetaloc contains the pointer to the shader variable
// where we copy our theta variable. 
var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var axis = 0;
var theta = [ 0, 0, 0 ];

var thetaLoc; 

// Function runs on initialization.
window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    // *********************************************
    // HERE YOU PUT CALLS TO YOUR OWN CYLINDERS
    // AFTER THE CALLS TO colorCube
    colorCube(0.1, [-0.5, 0.0, 0.5]);
    colorCube(0.1, [+0.5, 0.0, -0.5]);

    truncCone(0.5, [-.1, 0.0, .5]);
    truncCone(0.7, [+.3, 0,0, -.3]);
    

    //
    //***********************************************

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );


    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    thetaLoc = gl.getUniformLocation(program, "theta");

    //event listeners for buttons

    document.getElementById( "xButton" ).onclick = function () {
        axis = xAxis;
    };
    document.getElementById( "yButton" ).onclick = function () {
        axis = yAxis;
    };
    document.getElementById( "zButton" ).onclick = function () {
        axis = zAxis;
    };

    render();
}


// This draws the cube from the example.
//  r is the scaling for the cube (0.0 to 1.0),
//  loc is a 3-element array for translating
//  the cube in space.
function colorCube(r, loc) {

    // First capture the index number of the first
    // vertex of our object
    v0 = vertices.length;
    console.log("Cube starting at vertex", v0);

    // These are the vertices and colors of the cube.
    var cubevertices = [
        vec4( -0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5,  0.5,  0.5, 1.0 ),
        vec4(  0.5,  0.5,  0.5, 1.0 ),
        vec4(  0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5, -0.5, -0.5, 1.0 ),
        vec4( -0.5,  0.5, -0.5, 1.0 ),
        vec4(  0.5,  0.5, -0.5, 1.0 ),
        vec4(  0.5, -0.5, -0.5, 1.0 )
    ];

    var cubecolors = [
        vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
        vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
        vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
        vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
        vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
        vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
        vec4( 0.5, 0.5, 0.5, 1.0 ),  // gray
        vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
    ];


    // Next push all the vertices and colors 
    // into the global arrays.  Scale and translate
    // 
    var v;
    for (var idx = 0; idx < cubevertices.length; idx++) { 
        v = []
        for (var i = 0; i<3; i++) {
            v.push(r*cubevertices[idx][i] + loc[i]);
        }
        v.push(1.0);
        vertices.push(v);
        vertexColors.push(cubecolors[idx]);
    }

    // Now draw quads for all 6 surfaces
    // These index numbers will be relative to v0,
    //   the first virtex number for this object.
    //
    quad( 1, 0, 3, 2 ); // front
    quad( 2, 3, 7, 6 ); // right
    quad( 3, 0, 4, 7 ); // bottom
    quad( 6, 5, 1, 2 ); // top
    quad( 4, 5, 6, 7 ); // back
    quad( 5, 4, 0, 1 ); // left 
}

// YOU DRAW A TRUNCATED CONE.  Two circles, with
// different radii, and the surface of the cone
// between them is quads.
// Draw the cone along the y axis (straight up/down),
// with the bottom circle (in the x,z plane) at 
// at y=0, radius 0.5 and the top circle with
// radius 0.2 at y=0.4. 
//
// Then scale and translate the cone according to
// the same idea as the cube.

function truncCone(size, loc) {
    var x, y, z;
    var r, g, b;
    var degrees;
    var thetar;

    v0 = vertices.length;  // Capture the first vertex index.

    for (degrees = 0; degrees < 360; degrees += 2) {
        thetar = toradians(degrees);
        //x'=size*x + loc[0]
        // bottom circle of cone
        x =  0.5*Math.cos(thetar);
        y =  0.0;
        z =  0.5*Math.sin(thetar);

        x = size*x + loc[0];
        y = size*y + loc[1];
        z = size*z + loc[2];

        vertices.push(vec4(x, y, z, 1.0));

        r =  3.2404542*x - 1.5371385*y - 0.4985314*z;
        g = -0.9692660*x + 1.8760108*y + 0.0415560*z;
        b =  0.0556434*x - 0.2040259*y + 1.0572252*z;
        vertexColors.push(vec4(r, g, b, 1.0));

        // top circle of cone
        x =  0.2*Math.cos(thetar);
        y =  0.4;
        z =  0.2*Math.sin(thetar);

        x = size*x + loc[0];
        y = size*y + loc[1];
        z = size*z + loc[2];

        vertices.push(vec4(x, y, z, 1.0));

        r =  3.2404542*x - 1.5371385*y - 0.4985314*z;
        g = -0.9692660*x + 1.8760108*y + 0.0415560*z;
        b =  0.0556434*x - 0.2040259*y + 1.0572252*z;
        vertexColors.push(vec4(r, g, b, 1.0));
    }

    for( var i=0 ; i<357; i++ ) {
        quad(i, i+2, i+3, i+1);
    }
    quad(358, 0, 1, 359);
}

// HANDY FUNCTION COVERTING DEGREES TO RADIANS
function toradians(deg)
{
   return deg * Math.PI / 180.0;
}


// Draw a quad based on 4 indices into the vertices array.
// Global variable v0 contains the first index for the
// current object being drawn.
//
// We need to parition the quad into two triangles in
// order for
// WebGL to be able to render it.  In this case, we create two
// triangles from the quad indices
//vertex color assigned by the index of the vertex

function quad(a, b, c, d)   
{


    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i] + v0] );
        // for solid colored faces use
        colors.push(vertexColors[a + v0]);     //** CORRECTED
    }

    numPoints += indices.length;
    //console.log(" ");
    //console.log(numPoints);
    //console.log(points.length);
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    theta[axis] += 2.0;
    //theta[axis] = -30;
    gl.uniform3fv(thetaLoc, theta);

    gl.drawArrays( gl.TRIANGLES, 0, numPoints );

    requestAnimFrame( render );
}

