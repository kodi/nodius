require.paths.unshift(__dirname+'/../lib/');
var sys = require('sys');
var echo = sys.puts;
var CircularBuffer = require('CircularBuffer').CircularBuffer;
var b = new CircularBuffer(4);

b.push("a");
b.push("b");
b.push("c");
b.push("d");
b.push("e");

b.getEach(function(element){
    echo(element);    
});

/* OUTPUT:

$>  node circularBufferExample.js
e
d
c
b
$>   */


// STORING OBJECTS

var b1 = new CircularBuffer(4);

b1.push({a:1,b:"a"});
b1.push({a:2,b:"b"});
b1.push({a:3,b:"c"});
b1.push({a:4,b:"d"});

b1.getEach(function(element){
    echo(sys.inspect(element));
});


/* OUTPUT:

{ a: 4, b: 'd' }
{ a: 3, b: 'c' }
{ a: 2, b: 'b' }
{ a: 1, b: 'a' }

*/
