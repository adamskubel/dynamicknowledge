define(function(require, exports, module) {

	var Engine     = require("famous/core/Engine");
	var Surface    = require("famous/core/Surface");
	var Transform  = require("famous/core/Transform");
	var Modifier   = require("famous/core/Modifier");
	var MouseSync  = require("famous/inputs/MouseSync");
	var View = require('famous/core/View');
	var Modifier   = require("famous/core/Modifier");
	var PositioningFlexibleLayout = require('./PositioningLayouts/PositioningFlexibleLayout');
	var Transitionable = require('famous/transitions/Transitionable');
	var Easing = require('famous/transitions/Easing');
	var MemoryBlockView = require('./MemoryBlockView');
	var ObjectFactory = require('./ObjectFactory');


	function mem_map_t(options, dataObjects) 
	{
	    View.apply(this, arguments);

	    this.position = options.position;
	    this.size = options.size;

	    this.pageSize = 4;
				
	    this.calculateSize = function() {
	    	return this.size;
	    };	    
	    this.calculatePosition = function(){
	    	return this.position;
	    };

	    _initView.call(this);
	}

	mem_map_t.prototype = Object.create(View.prototype);
	mem_map_t.prototype.constructor = mem_map_t;

	mem_map_t.prototype.getModifier = function getModifier()
    {
    	var view = this;
    	return new Modifier({
    		size : function () {
    			return view.size;
    		},
		    transform : function(){
		        return Transform.translate(view.position[0], view.position[1], 0);
		    }
		});
    };	


    mem_map_t.prototype.setAge = function(age,callstack){
    	this.ageView.setValue(age);
    };

    mem_map_t.prototype.getAge = function(callstack){
    	return this.ageView.getValue();
    };


    mem_map_t.prototype.setCount = function(count,callstack){
    	this.countView.setValue(count);
    };

    mem_map_t.prototype.getCount = function(callstack){
    	return this.countView.getValue();
    };

    mem_map_t.prototype.setPageFrameNumber = function(num,callstack){
    	return this.pageFrameNumberView.setValue(num,callstack);
    };


    mem_map_t.prototype.getPageFrameNumber = function(callstack){
    	return this.pageFrameNumberView.getValue();
    };

    

    function _initView()
	{		
		var ratios = [1,1,1,2];
		var layout = new PositioningFlexibleLayout({
		    ratios: ratios,
		    direction: 1
		});


		var views = [];
		layout.sequenceFrom(views);

		factory = new ObjectFactory();

		this.ageView = factory.createNumberView(3);
		this.countView = factory.createNumberView(0);
		this.pageFrameNumberView = factory.createNumberView(this.pageFrameNumber);

		views.push(this.pageFrameNumberView);
		views.push(this.countView);
		views.push(this.ageView);
		views.push(factory.makeSurface('','blank'));

		for (var i=0;i<views.length;i++)
		{
			views[i].owner = layout;
		}

		this.add(layout);
	}


	module.exports = mem_map_t;
});




