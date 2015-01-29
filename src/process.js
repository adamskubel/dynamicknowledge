define(function(require, exports, module) {

	var Engine     = require("famous/core/Engine");
	var Surface    = require("famous/core/Surface");
	var Transform  = require("famous/core/Transform");
	var Modifier   = require("famous/core/Modifier");
	var MouseSync  = require("famous/inputs/MouseSync");
	var View = require('famous/core/View');
	var Modifier   = require("famous/core/Modifier");
	var GridLayout = require('famous/views/GridLayout');
	var Transitionable = require('famous/transitions/Transitionable');
	var Easing = require('famous/transitions/Easing');
	var MemoryBlockView = require('./MemoryBlockView');
	var ObjectFactory = require('./ObjectFactory');
    var CanvasSurface = require('famous/surfaces/CanvasSurface');
    var StateModifier   = require("famous/modifiers/StateModifier");
	var PositionableView = require('./PositioningLayouts/PositionableView');

	var Timer          = require('famous/utilities/Timer');

	function process(options) 
	{
	    PositionableView.apply(this, arguments);

	    // this.position = [options.position[0],options.position[1],0];
	    this.setSize([options.radius,options.radius]);
	    this.radius = options.radius;

	    // this.viewAlign = [0.5,0.5];
	    this.viewOrigin = [0.5,0.5];
				
	    // this.calculateSize = function() {
	    // 	return this.size;
	    // };	    
	    // this.calculatePosition = function(){
	    // 	return this.position;
	    // };

	    this.setPosition(options.position);

	    _initView.call(this);
	}

	process.prototype = Object.create(PositionableView.prototype);
	process.prototype.constructor = process;


	process.prototype.setRadius = function(radius) {
		var newSize = [radius,radius];
		this.setSize(newSize);
	};

    process.prototype.allocateMem = function(start,end)
    {
    	this.memStart = start;
    	this.memEnd = end;
    	this.memRange = [start,end];    	
    };

    process.prototype.start = function()
    {
    	var addrCount = 0;
    	var processView = this;
        var dir = 1;
    	this.timerCallback = Timer.setInterval(function() 
    	{    			
  			var viewPosition = processView.calculatePosition();
  			var fromPos = [viewPosition[0], viewPosition[1]];

            var memSpace = (processView.memEnd-processView.memStart);
  			//var addr = processView.memStart + Math.round(Math.random() * memSpace);

            if (dir == 1 && addrCount == memSpace-1)
                dir = -1;
            else if (dir == -1 && addrCount == 0)
                dir = 1;

            addrCount += dir;

  			var addr = processView.memStart + (addrCount);
  			// addrCount = 

            console.log("newstack");
  			var data = {address:addr, callstack:processView.createCallstack()};
  			data.callstack.push(fromPos);
            data.sender = this;
  			processView._eventOutput.emit('mem_access',data);
    	}, 10);


		this.outerCircle.modifier.angularVelocity = 0.02;
		this.innerCircle.modifier.angularVelocity = 0;
    };

    process.prototype.stop = function()
    {
        Engine.removeListener('prerender',this.timerCallback);
		this.outerCircle.modifier.angularVelocity = -0.005;
		this.innerCircle.modifier.angularVelocity = 0;
    }

   	_makeProcessCanvas = function(radius,scale,component)
	{

		var factory = new ObjectFactory();
		var canvasSurface = new CanvasSurface({
		    size : [(radius*scale*2)+5, (radius*scale*2)+5]
		});

		var innerRadius = radius * 0.6;

	 	var context = canvasSurface.getContext('2d');

	 	if (component == "core")
	 	{
		   	context.beginPath();
		    context.arc(radius*scale,radius*scale, (innerRadius-4)*scale, 0, 2 * Math.PI, false);
		    context.fillStyle = factory.getTungstenColor(0.3);
		    context.fill();
		    context.lineWidth = 1.5*scale;
		    context.strokeStyle = factory.getTungstenColor(0.8);
		    context.stroke();
		}


		if (component == "outer")
		{
		    var outerRadius = radius;

		    context.beginPath();
		    context.arc(radius*scale,radius*scale, (outerRadius-4)*scale, 0, 0.5* Math.PI, false);
		    context.lineWidth = 2.5*scale;
		    context.strokeStyle = factory.getTungstenColor(0.8);
		    context.stroke();
		}

	    canvasSurface.setSize([radius*2,radius*2],[radius*2*scale,radius*2*scale]);

		return canvasSurface;
	}




	function _initView()
	{		
		// this._node._child = [];

		var circle = _makeProcessCanvas(this.radius,1.2,"core");

		var spinModifier = new Modifier({
			align: [0.5,0.5],
			origin: [0.5,0.5]
		});

		this.add(spinModifier).add(circle);

		spinModifier.angle = 0;
		spinModifier.transformFrom(function() {
			this.angle += this.angularVelocity;
		    return Transform.rotateZ(this.angle);
		});


		var outer = _makeProcessCanvas(this.radius,1.2,"outer");

		var spinModifier2 = new Modifier({
			align: [0.5,0.5],
			origin: [0.5,0.5],
			transform: Transform.translate(0,0,5)
		});

		this.add(spinModifier2).add(outer);

		spinModifier2.angle = 0;
		spinModifier2.transformFrom(function() {
			this.angle += this.angularVelocity;
		    return Transform.rotateZ(this.angle);
		});

		this.add(spinModifier2).add(outer);

		outer.modifier = spinModifier2;
		circle.modifier = spinModifier;

		this.innerCircle = circle;
		this.outerCircle = outer;

		this.outerCircle.modifier.angularVelocity = -0.005;
		this.innerCircle.modifier.angularVelocity = 0;

	
	}


	module.exports = process;
});

























