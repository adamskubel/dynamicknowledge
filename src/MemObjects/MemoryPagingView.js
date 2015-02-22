define(function(require, exports, module) {

	var Engine     = require("famous/core/Engine");
	var Surface    = require("famous/core/Surface");
	var Transform  = require("famous/core/Transform");
	var Modifier   = require("famous/core/Modifier");

	var PositioningGridLayout = require('./../PositioningLayouts/PositioningGridLayout');
	var Transitionable = require('famous/transitions/Transitionable');
	var Easing = require('famous/transitions/Easing');
	var MemoryBlockView = require('./MemoryBlockView');
	var ObjectFactory = require('./../ObjectFactory');

	var DynamicDetailView = require('./../DynamicDetailView');
	var StretchyLayout = require('./../PositioningLayouts/StretchyLayout');
    var SurfaceWrappingView = require('./../PositioningLayouts/SurfaceWrappingView');
    var Utils = require('./../Utils');

	function MemoryPagingView(options) 
	{
        this.memConfig = {
            pageSize:0x1000,
            pageOffsetBits: 2,
            addressMask:3
        };

        options.boxLabel = Utils.hexString(options.startAddress,8) + "  " +
        Utils.hexString(options.startAddress+options.pageCount*0x1000);

        DynamicDetailView.call(this, options);
	}

	MemoryPagingView.prototype = Object.create(DynamicDetailView.prototype);
	MemoryPagingView.prototype.constructor = MemoryPagingView;

	MemoryPagingView.DEFAULT_OPTIONS = {
		position: [0,0],
		pageCount: 4
	};


	MemoryPagingView.prototype.access = function access(data) {

		var pageNumber = data.address >> this.memConfig.pageOffsetBits;
		var pageOffset = data.address & this.memConfig.addressMask;

		var viewIndex = pageNumber-this.minPageNumber;
		this.grid.views[viewIndex].access(pageOffset,data);
    };

	MemoryPagingView.prototype.makeComplexView = function()
	{
		var rootLayout = new StretchyLayout({
			direction:1,
			viewSpacing:[0,10]
		});

		this.currentView = rootLayout;

		for (var i=0;i<this.options.pageCount;i++)
		{
			var block = new MemoryBlockView({
				startAddress:i*this.memConfig.pageSize,
				memSize:4
			});
			rootLayout.addChild(block,{weight:1});
		}

        return rootLayout;
	};

	module.exports = MemoryPagingView;
});






































