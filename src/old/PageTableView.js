define(function(require, exports, module) {

	var Engine     = require("famous/core/Engine");
	var Surface    = require("famous/core/Surface");
	var Transform  = require("famous/core/Transform");
	var Modifier   = require("famous/core/Modifier");
	var View = require('famous/core/View');

	var PositioningGridLayout = require('PositioningLayouts/PositioningGridLayout');
	var Transitionable = require('famous/transitions/Transitionable');
	var Easing = require('famous/transitions/Easing');
	var MemoryBlockView = require('./../MemoryBlockView');
	var PageTableEntry = require('./PageTableEntry');
	var ObjectFactory = require('./../ObjectFactory');
	var PositioningFlexibleLayout = require('PositioningLayouts/PositioningFlexibleLayout');

    var PositionableView = require('PositioningLayouts/PositionableView');

	function PageTableView(options) 
	{
        PositionableView.call(this, options);

	    this.position = this.options.position;
	    this.size = this.options.size;

	    this.pageTableEntries = {};
	    this.indexViews = {};

	    this.pageSize = 16;
	    this.pageOffsetBits = 4;
	    this.addressMask = 0xF;

	    this.pageCount = this.options.pageCount;

	    _initView.call(this);
	}

	PageTableView.prototype = Object.create(PositionableView.prototype);
	PageTableView.prototype.constructor = PageTableView;

	PageTableView.DEFAULT_OPTIONS = {
		position: [0,0,0],
		size: [undefined,undefined],
		pageCount: 4
	}

    PageTableView.prototype.getPageByPFN = function(physicalPageNum, callstack)
    {
    	for (var pageIndex in this.pageTableEntries)
    	{
    		var pte = this.pageTableEntries[pageIndex];
    		if (pte.getPageFrameNumber(callstack) == physicalPageNum)
    			return pte;
    	}
    	return undefined;
    };

	function _makeGridLayout()
	{
		var grid = new PositioningGridLayout({dimensions: [1,this.pageCount]});
		var views = [];
		grid.sequenceFrom(views);

		for (var i=0;i<this.pageCount;i++)
		{
			var wrapperView = new PositioningFlexibleLayout({ratios: [2,8]});
			var innerViews = [];
			wrapperView.sequenceFrom(innerViews);

			var indexNum = (new ObjectFactory()).createNumberView(0,i);
			var entryView = new PageTableEntry({},this.pageCount-(i+1));
			indexNum.owner = wrapperView;
			entryView.owner = wrapperView;

			innerViews.push(indexNum);
			innerViews.push(entryView);

			entryView.on('page_fault',function(data){
				this._eventOutput.emit('page_fault',data);
			}).bindThis(this);

			entryView.on('mem_access',function(data){
				this._eventOutput.emit('mem_access',data);
			}).bindThis(this);


			wrapperView.owner = grid;

			this.pageTableEntries[i] = entryView;
			this.indexViews[i] = indexNum;

			views.push(wrapperView);		
		}
		return grid;
	}

	function _initView()
	{		
		this.grid = _makeGridLayout.call(this);	
		this.grid.owner = this;
		this.add(this.grid);

		this._eventInput.on('mem_access', function(data) {

			var pageNumber = data.address >> this.pageOffsetBits;
			var pageOffset = data.address & this.addressMask;

			var viewIndex = pageNumber;
  			this.indexViews[viewIndex].access();

  			var pte = this.pageTableEntries[pageNumber];

  			if (pte == undefined)
  			{
  				this._eventOutput.emit('page_fault',{
  					virtualAddress:data.address, 
  					pageTableEntry:undefined
  				});
  			}
  			else
  			{
  				pte.access(data);
  			}
		}).bindThis(this);		
	}

	module.exports = PageTableView;
});






































