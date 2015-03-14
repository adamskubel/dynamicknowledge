define(function(require, exports, module) {

	var Engine     = require("famous/core/Engine");
	var Surface    = require("famous/core/Surface");
	var Transform  = require("famous/core/Transform");
	var Modifier   = require("famous/core/Modifier");
	var PositionableView = require('PositioningLayouts/PositionableView');
    var CanvasSurface = require('famous/surfaces/CanvasSurface');
	var Transitionable = require('famous/transitions/Transitionable');
	var Easing = require('famous/transitions/Easing');
    var Colors = require('./../Colors');

	function LineCanvas(options) 
	{
	    PositionableView.call(this, options);

	    // Create drawing canvas
	    this.canvas = new CanvasSurface(this.options.canvasSurface);
	    this.add(this.canvas);
	    this.position = [0,0];
	    this.needsRender = false;
	    this.opacityRange = this.options.opacityRange;
	    this.opacityState = new Transitionable(0.4);

        this._lineColor = Colors.get(this.options.color,1);
	}


	LineCanvas.prototype = Object.create(PositionableView.prototype);
	LineCanvas.prototype.constructor = LineCanvas;

	LineCanvas.DEFAULT_OPTIONS = 
	{
        isAnimated: false,
        backgroundColor: Colors.get(6000,1),
        color:4600,
        viewAlign: [0.5,0.5],
        canvasSurface: {
            properties: {
                'pointer-events': 'none'
            }
        },
        opacityRange: [0,1]
    };

    LineCanvas.prototype.setLineObjects = function(fromObject,toObject)
    {
    	this.fromObject = fromObject;
    	this.toObject = toObject;

        fromObject.on('positionChange',function(){
             this.update();
        }.bind(this));

        toObject.on('positionChange',function(){
            this.update();
        }.bind(this));

    	this.setLinePoints(fromObject.calculatePosition(this.parent),toObject.calculatePosition(this.parent));
    };

    LineCanvas.prototype.setLinePoints = function setPosition(p,p2)
    {
        //console.debug("LineCanvas: " + p + "--> " + p2);

        if (p == undefined || p2 == undefined)
            return;

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

    	this.setPosition(topLeft);
    	this.setSize([bottomRight[0]-topLeft[0],bottomRight[1]-topLeft[1]]);

    	this.lineStart = lineStart;
    	this.lineEnd = lineEnd;

    };

    LineCanvas.prototype.update = function(){

    	this.setLinePoints(this.fromObject.calculatePosition(this.parent),this.toObject.calculatePosition(this.parent));
    };

    LineCanvas.prototype.pulse = function(riseTime,fallTime)
    {
        if (this.opacityState.isActive())
            this.opacityState.halt();

        this.opacityState.set(this.opacityRange[1],{duration: riseTime, curve: Easing.outQuad}, function()
        {
            this.opacityState.set(this.opacityRange[0],{duration: fallTime, curve: Easing.outQuad});
        }.bind(this));
    };

	LineCanvas.prototype.render = function render() 
	{
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

		context.clearRect(0, 0, canvasSize[0], canvasSize[1]);

		//context.fillStyle = this.options.backgroundColor;
		//context.fillRect(0, 0, canvasSize[0], canvasSize[1]);

		if (this.lineStart != undefined)
		{
			context.beginPath();
			context.moveTo(this.lineStart[0]*scale, this.lineStart[1]*scale);
			context.lineTo(this.lineEnd[0]*scale, this.lineEnd[1]*scale);
	      	context.strokeStyle = this._lineColor;
	      	context.lineWidth = 1*scale;
			context.stroke();
		}
		this.needsRender = false;

        return this._node.render();
	};

	module.exports = LineCanvas;
});
