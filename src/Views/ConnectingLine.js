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
    var Vector = require('ProperVector');

	function ConnectingLine(options) 
	{
	    PositionableView.call(this, options);

	    // Create drawing canvas
	    this.canvas = new CanvasSurface(this.options.canvasSurface);
	    this.add(this.canvas);
	    this.position = [0,0];
	    this.needsRender = false;
        this._lineColor = Colors.get(this.options.color,1);
	}

	ConnectingLine.prototype = Object.create(PositionableView.prototype);
	ConnectingLine.prototype.constructor = ConnectingLine;

	ConnectingLine.DEFAULT_OPTIONS = 
	{
        lineWidth: 1,
        isAnimated: false,
        backgroundColor: Colors.get(6000,1),
        color:4600,
        viewAlign: [0.5,0.5],
        canvasSurface: {
            properties: {
                'pointer-events': 'none'
            }
        },
        opacityRange: [0,1],
        padding: new Vector(10,10,0)
    };

    ConnectingLine.prototype.setLineObjects = function(fromObject,toObject)
    {
    	this.fromObject = fromObject;
    	this.toObject = toObject;

        fromObject.on('positionChange',function(){
             this.update();
        }.bind(this));

        toObject.on('positionChange',function(){
            this.update();
        }.bind(this));

    	this.update();
    };

    function _setLinePoints(linePoints)
    {
        var topLeft = new Vector(10000,10000,0);
        var bottomRight = new Vector(0,0,0);

        for (var i=0;i<linePoints.length;i++)
        {
            topLeft.x = Math.min(topLeft.x,linePoints[i].x);
            topLeft.y = Math.min(topLeft.y,linePoints[i].y);

            bottomRight.x = Math.max(bottomRight.x, linePoints[i].x);
            bottomRight.y = Math.max(bottomRight.y, linePoints[i].y);
        }

    	//topLeft = topLeft.sub(this.options.padding);
        //bottomRight = bottomRight.add(this.options.padding);

        this._linePoints = [];


        for (i=0;i<linePoints.length;i++)
        {
            var point = linePoints[i].sub(topLeft);
            this._linePoints.push(point);
        }

    	this.setPosition(topLeft.toArray());
    	this.setSize(bottomRight.sub(topLeft).toArray(2));

        this.needsRender = true;
    }

    ConnectingLine.prototype.update = function()
    {
        var p0 = Vector.fromArray(this.fromObject.calculatePosition(this.parent));
        var pF = Vector.fromArray(this.toObject.calculatePosition(this.parent));

        //if (this.fromObject instanceof ConnectingLineAnchor)
        //{
        //
        //}

    	_setLinePoints.call(this,[p0,pF]);
    };

    ConnectingLine.prototype.layout = function(layoutSize)
    {
        PositionableView.layout.call(this,layoutSize);
        this.update();
    };

    ConnectingLine.prototype.render = function render()
    {
        if (!this.needsRender || !this._linePoints || this._linePoints.length < 2)
            return this._node.render();

        this.needsRender = false;

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

        context.beginPath();

        var point = this._linePoints[0];
        context.moveTo(point.x * scale, point.y * scale);

        for (var i=1;i<this._linePoints.length;i++)
        {
            point = this._linePoints[i];
            context.lineTo(point.x * scale, point.y * scale);
        }
        context.strokeStyle = this._lineColor;
        context.lineWidth = this.options.lineWidth * scale;


        context.stroke();

        return this._node.render();
    };

	module.exports = ConnectingLine;
});
