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

	var Vector = require('./ProperVector');

	function BracketView(options) 
	{
	    View.apply(this, arguments);

	    // Create drawing canvas
	    this.canvas = new CanvasSurface();
	    this.add(this.canvas);
	    this.position = [0,0];
	    this.needsRender = false;
	    this.opacityState = new Transitionable(0.8);
	}


	function tungsten(alpha) {
		return 'rgba(255,197,143,'+ alpha + ')';
	};


	BracketView.prototype = Object.create(View.prototype);
	BracketView.prototype.constructor = BracketView;

	BracketView.DEFAULT_OPTIONS = 
	{
        size: [100, 100],
        backgroundColor: 'rgba(200, 200, 200, 0.4)',
        lineColor: tungsten(0.8),
        canvasSurface: {
            properties: {
                'pointer-events': 'none'
            }
        }
    };



    BracketView.prototype.setBracketObjects = function(start,end)
    {
    	this.startObject = start;
    	this.endObject = end;    
    	_calculateLines.call(this);
    };


    BracketView.prototype.setRootObject = function(root)
    {
    	this.rootObject = root;
    	_calculateLines.call(this);
    };

    function toVector(values){
    	
    	if (values.length == 2)
    		values[2] = 0;
    	
    	return new Vector(values[0],values[1],values[2]);
    }

    function _calculateLines()
    {
    	if (this.startObject == undefined || this.endObject == undefined || this.rootObject == undefined)
    	{
    		this.needsRender = false;
    		return;
    	}

    	var lineStart = toVector(this.startObject.calculatePosition());
    	var lineEnd = toVector(this.endObject.calculatePosition());
    	var rootPosition = toVector(this.rootObject.calculatePosition());


    	var topLeft = toVector([Math.min(lineStart.x,lineEnd.x),Math.min(lineStart.y,lineEnd.y)]);
    	var bottomRight = toVector([Math.max(lineStart.x,lineEnd.x),Math.max(lineStart.y,lineEnd.y)]);

    	topLeft.x = Math.min(topLeft.x,rootPosition.x);
    	topLeft.y = Math.min(topLeft.y,rootPosition.y);
    	bottomRight.x = Math.max(bottomRight.x,rootPosition.x);
    	bottomRight.y = Math.max(bottomRight.y,rootPosition.y);


    	var padding = 10;
    	topLeft.x -= padding;
    	topLeft.y-= padding;
    	bottomRight.x += padding;
    	bottomRight.y += padding;

    	this.position = [topLeft.x,topLeft.y];

    	lineStart = lineStart.sub(topLeft);
    	lineEnd = lineEnd.sub(topLeft);

    	var sizeVector = bottomRight.clone().sub(topLeft);
    	this.size = [sizeVector.x,sizeVector.y];

    	this.lineStart = lineStart.clone();
    	this.lineEnd = lineEnd.clone();

    	this.lineMid = lineStart.add((lineEnd.sub(lineStart)).multiply(0.5));
    	this.lineMid2 = rootPosition.sub(topLeft);

    	this.needsRender = true;

    	if (this.opacityState.isActive())
    		this.opacityState.halt();

    	var x = this;
    	x.opacityState.set(0.9,{duration: 50, curve: Easing.outQuad}, function()
		{
    		x.opacityState.set(0.7,{duration: 500, curve: Easing.outQuad});
    	});
    };


    BracketView.prototype.clear = function clear()
    {
    	this.lineStart = undefined;
    	this.lineEnd = undefined;
    	this.size = [10,10];
    	this.needsRender = true;
    };

    BracketView.prototype.getModifier = function getModifier()
    {
    	var c = this;
    	return new Modifier({
    		opacity : function () {
    			return c.opacityState.get();
    		},
    		size : function () {
    			return c.size;
    		},
		    transform : function(){
		        return Transform.translate(c.position[0], c.position[1], 0);
		    }
		});
    };

	BracketView.prototype.render = function render() 
	{
		if (this.canvas._currentTarget == null)
	  		return this._node.render();

	 	if (!this.needsRender)
	  		return this._node.render();

	 	var context = this.canvas.getContext('2d');
        var size = this.size;
        
        var scale = 1;
        var canvasSize = [size[0] * scale, size[1] * scale];
		this.canvas.setSize(size, canvasSize);


		context.clearRect(0, 0, canvasSize[0], canvasSize[1]);
		// context.fillStyle = this.options.backgroundColor;
		// context.fillRect(0, 0, canvasSize[0], canvasSize[1]);

		if (this.lineStart != undefined)
		{
			context.beginPath();
			context.moveTo(this.lineStart.x*scale, this.lineStart.y*scale);
			context.lineTo(this.lineMid2.x*scale, this.lineMid2.y*scale);	
			context.lineTo(this.lineEnd.x*scale, this.lineEnd.y*scale);

			// context.moveTo(this.lineMid.x*scale, this.lineMid.y*scale);		

	      	context.strokeStyle = this.options.lineColor;
	      	context.lineWidth = 3*scale;
			context.stroke();
		}
		this.needsRender = false;


        return this._node.render();
	};

	module.exports = BracketView;
});
