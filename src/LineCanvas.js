define(function(require, exports, module) {

	var Engine     = require("famous/core/Engine");
	var Surface    = require("famous/core/Surface");
	var Transform  = require("famous/core/Transform");
	var Modifier   = require("famous/core/Modifier");
	var MouseSync  = require("famous/inputs/MouseSync");
	var View = require('famous/core/View');
    var CanvasSurface = require('famous/surfaces/CanvasSurface');
	var PhysicsEngine   = require('famous/physics/PhysicsEngine');
	var Body            = require('famous/physics/bodies/Body');
	var Circle          = require('famous/physics/bodies/Circle');
	var Wall            = require('famous/physics/constraints/Wall');
	var Modifier   = require("famous/core/Modifier");
	var Transitionable = require('famous/transitions/Transitionable');
	var Easing = require('famous/transitions/Easing');

	function LineCanvas(options) 
	{
	    View.apply(this, arguments);

	    // Create drawing canvas
	    this.canvas = new CanvasSurface(this.options.canvasSurface);
	    this.add(this.canvas);
	    this.position = [0,0];
	    this.needsRender = false;
	    this.opacityRange = this.options.opacityRange;
	    this.opacityState = new Transitionable(0.4);
	}


	function tungsten(alpha) {
		return 'rgba(255,197,143,'+ alpha + ')';
	};


	LineCanvas.prototype = Object.create(View.prototype);
	LineCanvas.prototype.constructor = LineCanvas;

	LineCanvas.DEFAULT_OPTIONS = 
	{
        size: [100, 100],
        backgroundColor: 'rgba(200, 200, 200, 0.5)',
        lineColor: tungsten(0.9),
        canvasSurface: {
            properties: {
                'pointer-events': 'none'
            }
        },
        opacityRange: [0,1],
        drawFrequence: 2 // 2 = twice per second, 1000 = as fast as possible
    };

    LineCanvas.prototype.setLineObjects = function(fromObject,toObject)
    {
    	this.fromObject = fromObject;
    	this.toObject = toObject;
    	this.setLinePoints(fromObject.calculatePosition(),toObject.calculatePosition());
    };

    LineCanvas.prototype.setLinePoints = function setPosition(p,p2)
    {
        console.log(p + "--> " + p2);
    	this.needsRender = true;

    	var topLeft = [Math.min(p[0],p2[0]),Math.min(p[1],p2[1])];
    	var bottomRight = [Math.max(p[0],p2[0]),Math.max(p[1],p2[1])];

    	var padding = 10;
    	topLeft[0] -= padding;
    	topLeft[1] -= padding;
    	bottomRight[0] += padding;
    	bottomRight[1] += padding;

    	var lineStart = [p[0]-topLeft[0],p[1]-topLeft[1]];
    	var lineEnd = [p2[0]-topLeft[0],p2[1]-topLeft[1]];    	

    	this.position = topLeft;
    	this.size = [bottomRight[0]-topLeft[0],bottomRight[1]-topLeft[1]];

    	this.lineStart = lineStart;
    	this.lineEnd = lineEnd;

    	if (this.opacityState.isActive())
    		this.opacityState.halt();

    	var x = this;
    	x.opacityState.set(this.opacityRange[1],{duration: 100, curve: Easing.outQuad}, function()
		{
    		x.opacityState.set(x.opacityRange[0],{duration: 1000, curve: Easing.outQuad});
    	});
    };

    LineCanvas.prototype.update = function(){

    	this.setLinePoints(this.fromObject.calculatePosition(),this.toObject.calculatePosition());
    };


    LineCanvas.prototype.clear = function clear()
    {
    	this.lineStart = undefined;
    	this.lineEnd = undefined;
    	this.size = [10,10];
    	this.needsRender = true;
    };

    LineCanvas.prototype.getModifier = function getModifier()
    {
    	var line = this;
    	return new Modifier({
    		opacity : function () {
    			return line.opacityState.get();
    		},
    		size : function () {
    			return line.size;
    		},
		    transform : function(){
		        return Transform.translate(line.position[0], line.position[1], 0);
		    },
            origin: function(){
                return [0,0];
            }
		});
    };

	LineCanvas.prototype.render = function render() 
	{
		// var timestamp = Date.now();
  //       if (this._renderTimestamp &&
  //           ((timestamp - this._renderTimestamp) < (1000 / this.options.drawFrequence))) {
  //           return this._node.render();
  //       }
  //       this._renderTimestamp = timestamp;

	  if (!this.needsRender)
	  	return this._node.render();

	 	var context = this.canvas.getContext('2d');
        var size = this.size;
        var scale = 1;
        var canvasSize = [size[0] * scale, size[1] * scale];

		// Update canvas size
		if (!this._cachedSize ||
			(this._cachedSize[0] !== size[0]) ||
			(this._cachedSize[1] !== size[1]) ||
			(this._cachedCanvasSize[0] !== canvasSize[0]) ||
			(this._cachedCanvasSize[1] !== canvasSize[1])) 
		{
			this._cachedSize = size;
			this._cachedCanvasSize = canvasSize;
			this.canvas.setSize(size, canvasSize);
		}

	        // Clear background
		context.clearRect(0, 0, canvasSize[0], canvasSize[1]);
		// context.fillStyle = this.options.backgroundColor;
		// context.fillRect(0, 0, canvasSize[0], canvasSize[1]);

		if (this.lineStart != undefined)
		{
			context.beginPath();
			context.moveTo(this.lineStart[0]*scale, this.lineStart[1]*scale);
			context.lineTo(this.lineEnd[0]*scale, this.lineEnd[1]*scale);
	      	context.strokeStyle = this.options.lineColor;
	      	context.lineWidth = 1*scale;
			context.stroke();
		}
		this.needsRender = false;

        return this._node.render();
	};

	module.exports = LineCanvas;
});
