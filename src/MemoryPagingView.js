define(function(require, exports, module) {

	var Engine     = require("famous/core/Engine");
	var Surface    = require("famous/core/Surface");
	var Transform  = require("famous/core/Transform");
	var Modifier   = require("famous/core/Modifier");

	var PositioningGridLayout = require('./PositioningLayouts/PositioningGridLayout');
	var Transitionable = require('famous/transitions/Transitionable');
	var Easing = require('famous/transitions/Easing');
	var MemoryBlockView = require('./MemoryBlockView');
	var ObjectFactory = require('./ObjectFactory');

	var PositionableView = require('./PositioningLayouts/PositionableView');
	var StretchyLayout = require('./PositioningLayouts/StretchyLayout');

	function MemoryPagingView(options) 
	{
	    PositionableView.call(this, options);

	    this.memConfig = {
			pageSize:4,
			pageOffsetBits: 2,
			addressMask:3
		};

	    _initView.call(this);
	}

	MemoryPagingView.prototype = Object.create(PositionableView.prototype);
	MemoryPagingView.prototype.constructor = MemoryPagingView;

	MemoryPagingView.DEFAULT_OPTIONS = {
		position: [0,0],
		pageCount: 4
	};

	MemoryPagingView.prototype.measure = function(requestedSize){
		return this.currentView.measure(requestedSize);
	};

	MemoryPagingView.prototype.layout = function(layoutSize){
		if (this.currentView)
			this.currentView.layout(layoutSize);

		this._layoutDirty = false;
		PositionableView.prototype.layout.call(this,layoutSize);
	};

	MemoryPagingView.prototype.needsLayout = function(){
		return this._layoutDirty || ((this.currentView) ? this.currentView.needsLayout() : false);
	};


	MemoryPagingView.prototype.access = function access(data) {

		var pageNumber = data.address >> this.memConfig.pageOffsetBits;
		var pageOffset = data.address & this.memConfig.addressMask;

		var viewIndex = pageNumber-this.minPageNumber;
		this.grid.views[viewIndex].access(pageOffset,data);
    };

	function _initView()
	{
		var rootLayout = new StretchyLayout({
			direction:1,
			viewSpacing:[0,4]
		});

		this.currentView = rootLayout;

		for (var i=0;i<this.options.pageCount;i++)
		{
			var block = new MemoryBlockView({
				startAddress:i*this.memConfig.pageSize,
				memSize:this.memConfig.pageSize
			});
			rootLayout.addChild(block,{weight:1});
		}

		this.add(rootLayout.getModifier()).add(rootLayout);
	}

	module.exports = MemoryPagingView;
});






































