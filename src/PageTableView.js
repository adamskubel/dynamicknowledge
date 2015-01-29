define(function(require, exports, module) {

	var Engine     = require("famous/core/Engine");
	var Surface    = require("famous/core/Surface");
	var Transform  = require("famous/core/Transform");
	var Modifier   = require("famous/core/Modifier");
	var MouseSync  = require("famous/inputs/MouseSync");
	var View = require('famous/core/View');
	var Modifier   = require("famous/core/Modifier");
	var PositioningGridLayout = require('./PositioningLayouts/PositioningGridLayout');
	var Transitionable = require('famous/transitions/Transitionable');
	var Easing = require('famous/transitions/Easing');
	var MemoryBlockView = require('./MemoryBlockView');
	var PageTableEntry = require('./PageTableEntry');
	var ObjectFactory = require('./ObjectFactory');
	var PositioningFlexibleLayout = require('./PositioningLayouts/PositioningFlexibleLayout');

	function PageTableView(options) 
	{
	    View.apply(this, arguments);

	    this.position = options.position;
	    this.size = options.size;

	    this.pageTableEntries = {};
	    this.indexViews = {};

	    this.pageSize = 4;
	    this.pageOffsetBits = 2;
	    this.addressMask = 0x3;

	    // this.minPageNumber = options.startAddress >> this.pageOffsetBits;
	    this.pageCount = options.memSize / this.pageSize;

	    _initView.call(this);

	    this.calculateSize = function() {
	    	return this.size;
	    };	    
	    this.calculatePosition = function(){
	    	return this.position;
	    };
	    this.calculateChildPosition = function(){
	    	return this.calculatePosition();
	    };
	    this.calculateChildSize = function(){
	    	return this.calculateSize();
	    };
	}

	PageTableView.prototype = Object.create(View.prototype);
	PageTableView.prototype.constructor = PageTableView;

	PageTableView.prototype.getModifier = function getModifier()
    {
    	var blockView = this;
    	return new Modifier({
    		size : function () {
    			return blockView.size;
    		},
		    transform : function(){
		        return Transform.translate(blockView.position[0], blockView.position[1], 0);
		    }
		});
    };

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

/*
  			var newAddress = pte.pageFrameNumber << this.pageOffsetBits;
  			newAddress += pageOffset;

  			if (pte.valid)
  			{
  				pte.setAccessed(true);
  			}
  			else
  			{
  				this._eventOutput.emit('page_fault',{
  					virtualAddress:data.address, 
  					pageTableEntry:pte
  				});
  			}	
  			
  			data.address = newAddress;
  			this._eventOutput.emit('mem_access',data);
  			*/
  			  			
		}).bindThis(this);		
	}

	module.exports = PageTableView;
});






































